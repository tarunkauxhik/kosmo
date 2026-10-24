import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, query } from "./_generated/server";
import { geminiReply, ModelUnavailableError, openRouterReply, throttledWriter, type LlmMessage } from "./lib/llm";
import { chatSystemPrompt } from "./lib/prompts";
import { rateLimiter } from "./lib/rateLimits";
import { getUserByAuthId, promptProfile, requireIdentity } from "./lib/users";

const HISTORY_LIMIT = 12;

function cleanText(value: string, maxLength: number) {
    return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export const getSession = query({
    args: { counsellorSlug: v.string() },
    handler: async (ctx, { counsellorSlug }) => {
        const { tokenIdentifier } = await requireIdentity(ctx);
        // The latest 80, returned oldest first for display.
        const latest = await ctx.db
            .query("chatMessages")
            .withIndex("by_userKey_and_counsellorSlug_and_createdAt", (q) =>
                q.eq("userKey", tokenIdentifier).eq("counsellorSlug", counsellorSlug),
            )
            .order("desc")
            .take(80);
        return { messages: latest.reverse() };
    },
});

export const listSessions = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Fold the user's recent messages into one summary per counsellor.
        const recent = await ctx.db
            .query("chatMessages")
            .withIndex("by_userKey_and_counsellorSlug_and_createdAt", (q) => q.eq("userKey", identity.tokenIdentifier))
            .order("desc")
            .take(500);

        const seen = new Map<
            string,
            {
                counsellorSlug: string;
                lastMessage: string;
                lastRole: "user" | "assistant";
                lastAt: number;
                messageCount: number;
            }
        >();

        for (const m of recent) {
            if (!m.content) continue; // a reply that has only just started streaming
            const existing = seen.get(m.counsellorSlug);
            if (existing) {
                existing.messageCount += 1;
            } else {
                seen.set(m.counsellorSlug, {
                    counsellorSlug: m.counsellorSlug,
                    lastMessage: m.content,
                    lastRole: m.role,
                    lastAt: m.createdAt,
                    messageCount: 1,
                });
            }
        }

        return Array.from(seen.values()).sort((a, b) => b.lastAt - a.lastAt);
    },
});

// Rate-limits, stores the user's message and returns everything the model needs.
// Persona and profile come from the database, never from the browser.
export const beginTurn = internalMutation({
    args: { authId: v.string(), userKey: v.string(), counsellorSlug: v.string(), content: v.string() },
    handler: async (ctx, { authId, userKey, counsellorSlug, content }) => {
        await rateLimiter.limit(ctx, "chatMessage", { key: authId, throws: true });

        const counsellor = await ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", counsellorSlug))
            .first();
        if (!counsellor) throw new ConvexError("Counsellor not found");

        const userMessageId = await ctx.db.insert("chatMessages", {
            userKey,
            counsellorSlug,
            role: "user",
            content,
            createdAt: Date.now(),
        });

        const recent = await ctx.db
            .query("chatMessages")
            .withIndex("by_userKey_and_counsellorSlug_and_createdAt", (q) =>
                q.eq("userKey", userKey).eq("counsellorSlug", counsellorSlug),
            )
            .order("desc")
            .take(HISTORY_LIMIT);

        const history: LlmMessage[] = recent
            .reverse()
            .filter((m) => m.content)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

        const user = await getUserByAuthId(ctx, authId);
        return { userMessageId, counsellor, profile: promptProfile(user), history };
    },
});

// The assistant message is created empty and filled in as the model streams.
export const startReply = internalMutation({
    args: { userKey: v.string(), counsellorSlug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.insert("chatMessages", {
            ...args,
            role: "assistant",
            content: "",
            createdAt: Date.now(),
            streaming: true,
        });
    },
});

export const updateReply = internalMutation({
    args: { messageId: v.id("chatMessages"), content: v.string(), done: v.boolean() },
    handler: async (ctx, { messageId, content, done }) => {
        await ctx.db.patch(messageId, { content: content.slice(0, 4000), streaming: done ? undefined : true });
        return null;
    },
});

export const discardReply = internalMutation({
    args: { messageId: v.id("chatMessages") },
    handler: async (ctx, { messageId }) => {
        await ctx.db.delete(messageId);
        return null;
    },
});

// Only this action (through internal mutations) writes assistant messages, so the browser can't forge them.
export const send = action({
    args: { counsellorSlug: v.string(), content: v.string() },
    handler: async (
        ctx,
        { counsellorSlug, content },
    ): Promise<{ userMessageId: Id<"chatMessages">; messageId: Id<"chatMessages">; text: string }> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized");

        const text = cleanText(content, 2000);
        if (!text) throw new ConvexError("Message cannot be empty.");

        const turn = await ctx.runMutation(internal.chat.beginTurn, {
            authId: identity.subject,
            userKey: identity.tokenIdentifier,
            counsellorSlug,
            content: text,
        });

        // Stream the reply into the message so the chat shows it as it is written.
        const messageId = await ctx.runMutation(internal.chat.startReply, {
            userKey: identity.tokenIdentifier,
            counsellorSlug,
        });
        const onText = throttledWriter(100, (content) =>
            ctx.runMutation(internal.chat.updateReply, { messageId, content, done: false }),
        );
        let reply: string;
        try {
            const system = chatSystemPrompt(turn.counsellor, turn.profile);
            reply = await geminiReply(system, turn.history, onText).catch((error) => {
                // Gemini quota or outage before any text arrived: answer through OpenRouter instead.
                if (error instanceof ModelUnavailableError) return openRouterReply(system, turn.history, onText);
                throw error;
            });
        } catch (error) {
            await ctx.runMutation(internal.chat.discardReply, { messageId });
            throw error;
        }
        await ctx.runMutation(internal.chat.updateReply, { messageId, content: reply, done: true });
        return { userMessageId: turn.userMessageId, messageId, text: reply };
    },
});
