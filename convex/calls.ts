import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { openRouterReply, type LlmMessage } from "./lib/llm";
import { voiceKickoff, voiceSystemPrompt } from "./lib/prompts";
import { rateLimiter } from "./lib/rateLimits";
import { getUserByAuthId, promptProfile, requireUser } from "./lib/users";

const HISTORY_LIMIT = 30;
// The voiceTurn limit allows about 60 turns a minute, so this covers calls of well over 15 minutes.
const MAX_TRANSCRIPT_TURNS = 1000;

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
        return await ctx.db
            .query("calls")
            .withIndex("by_userId_startedAt", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(100);
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
        return { call, turns };
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
            .map((t) => ({ role: t.role === "bot" ? "assistant" : "user", content: t.text }));

        return { counsellor, profile: promptProfile(user), turns };
    },
});

export const saveBotTurn = internalMutation({
    args: { callId: v.id("calls"), text: v.string() },
    handler: async (ctx, { callId, text }) => {
        await ctx.db.insert("callTurns", { callId, role: "bot", text: text.slice(0, 4000), ts: Date.now() });
        return null;
    },
});

// One conversational turn of a voice call. `kickoff` asks the persona to greet
// the caller first; the instruction itself is never stored in the transcript.
export const respond = action({
    args: { callId: v.id("calls"), text: v.optional(v.string()), kickoff: v.optional(v.boolean()) },
    handler: async (ctx, { callId, text, kickoff }): Promise<{ reply: string }> => {
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
        const reply = await openRouterReply(voiceSystemPrompt(turn.counsellor, turn.profile), history);

        await ctx.runMutation(internal.calls.saveBotTurn, { callId, text: reply });
        return { reply };
    },
});
