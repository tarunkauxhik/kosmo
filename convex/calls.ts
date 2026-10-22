import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, internalMutation, mutation, query, type QueryCtx } from "./_generated/server";
import { openRouterReply, throttledWriter, type LlmMessage } from "./lib/llm";
import { voiceKickoff, voiceSystemPrompt } from "./lib/prompts";
import { rateLimiter } from "./lib/rateLimits";
import { getUserByAuthId, promptProfile, requireUser } from "./lib/users";

const HISTORY_LIMIT = 30;
// The voiceTurn limit allows about 60 turns a minute, so this covers calls of well over 15 minutes.
const MAX_TRANSCRIPT_TURNS = 1000;

// Calls keep the portrait path they started with; show the persona's current one instead,
// so renamed or newly added portrait files reach old calls too.
async function withCurrentPortraits(ctx: QueryCtx, calls: Doc<"calls">[]) {
    const portraits = new Map<string, string>();
    for (const slug of new Set(calls.map((c) => c.counsellorSlug))) {
        const counsellor = await ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
        if (counsellor) portraits.set(slug, counsellor.portrait);
    }
    return calls.map((c) => ({ ...c, counsellorPortrait: portraits.get(c.counsellorSlug) ?? c.counsellorPortrait }));
}

export const start = mutation({
    args: { counsellorSlug: v.string() },
    handler: async (ctx, { counsellorSlug }) => {
        const user = await requireUser(ctx);
        const counsellor = await ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", counsellorSlug))
            .first();
        if (!counsellor) throw new ConvexError("Counsellor not found");
        return await ctx.db.insert("calls", {
            userId: user._id,
            counsellorSlug: counsellor.slug,
            counsellorName: counsellor.name,
            counsellorPortrait: counsellor.portrait,
            startedAt: Date.now(),
        });
    },
});

export const end = mutation({
    args: { callId: v.id("calls") },
    handler: async (ctx, { callId }) => {
        const user = await requireUser(ctx);
        const call = await ctx.db.get(callId);
        if (!call || call.userId !== user._id) return null;
        if (call.endedAt) return null;
        const endedAt = Date.now();
        await ctx.db.patch(callId, {
            endedAt,
            durationSec: Math.max(0, Math.round((endedAt - call.startedAt) / 1000)),
        });
        return null;
    },
});

export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const user = await getUserByAuthId(ctx, identity.subject);
        if (!user) return [];
        const calls = await ctx.db
            .query("calls")
            .withIndex("by_userId_startedAt", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(100);
        return await withCurrentPortraits(ctx, calls);
    },
});

export const getMine = query({
    args: { callId: v.id("calls") },
    handler: async (ctx, { callId }) => {
        const user = await requireUser(ctx);
        const call = await ctx.db.get(callId);
        if (!call || call.userId !== user._id) return null;
        const turns = await ctx.db
            .query("callTurns")
            .withIndex("by_callId_ts", (q) => q.eq("callId", callId))
            .order("asc")
            .take(MAX_TRANSCRIPT_TURNS);
        const [current] = await withCurrentPortraits(ctx, [call]);
        return { call: current, turns };
    },
});

// Checks ownership, rate-limits, stores the user's words and loads context.
export const beginTurn = internalMutation({
    args: { authId: v.string(), callId: v.id("calls"), text: v.optional(v.string()) },
    handler: async (ctx, { authId, callId, text }) => {
        const user = await getUserByAuthId(ctx, authId);
        const call = await ctx.db.get(callId);
        if (!user || !call || call.userId !== user._id) throw new ConvexError("Call not found");
        if (call.endedAt) throw new ConvexError("Call has ended");

        await rateLimiter.limit(ctx, "voiceTurn", { key: authId, throws: true });

        const counsellor = await ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", call.counsellorSlug))
            .first();
        if (!counsellor) throw new ConvexError("Counsellor not found");

        if (text) {
            await ctx.db.insert("callTurns", { callId, role: "user", text, ts: Date.now() });
        }

        const recent = await ctx.db
            .query("callTurns")
            .withIndex("by_callId_ts", (q) => q.eq("callId", callId))
            .order("desc")
            .take(HISTORY_LIMIT);
        const turns: LlmMessage[] = recent
            .reverse()
            .filter((t) => t.text)
            .map((t) => ({ role: t.role === "bot" ? "assistant" : "user", content: t.text }));

        return { counsellor, profile: promptProfile(user), turns };
    },
});

// The bot turn is created empty and filled in as the model streams; the call screen follows it
// through `liveReply` and starts speaking at the first complete sentence.
export const startBotTurn = internalMutation({
    args: { callId: v.id("calls"), turnKey: v.optional(v.string()) },
    handler: async (ctx, { callId, turnKey }) => {
        return await ctx.db.insert("callTurns", {
            callId,
            role: "bot",
            text: "",
            ts: Date.now(),
            streaming: true,
            turnKey,
        });
    },
});

export const updateBotTurn = internalMutation({
    args: { turnId: v.id("callTurns"), text: v.string(), done: v.boolean() },
    handler: async (ctx, { turnId, text, done }) => {
        await ctx.db.patch(turnId, { text: text.slice(0, 4000), streaming: done ? undefined : true });
        return null;
    },
});

export const discardBotTurn = internalMutation({
    args: { turnId: v.id("callTurns") },
    handler: async (ctx, { turnId }) => {
        await ctx.db.delete(turnId);
        return null;
    },
});

// The reply for one turn of the caller's own call, while it streams and after.
export const liveReply = query({
    args: { callId: v.id("calls"), turnKey: v.string() },
    handler: async (ctx, { callId, turnKey }) => {
        const user = await requireUser(ctx);
        const call = await ctx.db.get(callId);
        if (!call || call.userId !== user._id) return null;
        const recent = await ctx.db
            .query("callTurns")
            .withIndex("by_callId_ts", (q) => q.eq("callId", callId))
            .order("desc")
            .take(10);
        const turn = recent.find((t) => t.role === "bot" && t.turnKey === turnKey);
        return turn ? { text: turn.text, streaming: turn.streaming === true } : null;
    },
});

// One conversational turn of a voice call. `kickoff` asks the persona to greet
// the caller first; the instruction itself is never stored in the transcript.
export const respond = action({
    args: {
        callId: v.id("calls"),
        text: v.optional(v.string()),
        kickoff: v.optional(v.boolean()),
        turnKey: v.optional(v.string()),
    },
    handler: async (ctx, { callId, text, kickoff, turnKey }): Promise<{ reply: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized");

        const userText = text?.replace(/\s+/g, " ").trim().slice(0, 1000);
        if (!userText && !kickoff) throw new ConvexError("Nothing to respond to.");

        const turn = await ctx.runMutation(internal.calls.beginTurn, {
            authId: identity.subject,
            callId,
            text: userText || undefined,
        });

        const history: LlmMessage[] = [{ role: "user", content: voiceKickoff(turn.profile) }, ...turn.turns];
        const turnId = await ctx.runMutation(internal.calls.startBotTurn, { callId, turnKey: turnKey?.slice(0, 64) });
        // Short interval: the call screen waits for the first full sentence before it can speak.
        const onText = throttledWriter(60, (partial) =>
            ctx.runMutation(internal.calls.updateBotTurn, { turnId, text: partial, done: false }),
        );
        let reply: string;
        try {
            reply = await openRouterReply(voiceSystemPrompt(turn.counsellor, turn.profile), history, onText);
        } catch (error) {
            await ctx.runMutation(internal.calls.discardBotTurn, { turnId });
            throw error;
        }
        await ctx.runMutation(internal.calls.updateBotTurn, { turnId, text: reply, done: true });
        return { reply };
    },
});
