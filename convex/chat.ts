import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, query } from "./_generated/server";
import { geminiReply, type LlmMessage } from "./lib/llm";
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
        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_userKey_and_counsellorSlug_and_createdAt", (q) =>
                q.eq("userKey", tokenIdentifier).eq("counsellorSlug", counsellorSlug),
            )
            .order("asc")
            .take(80);
        return { messages };
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
            .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

        const user = await getUserByAuthId(ctx, authId);
        return { userMessageId, counsellor, profile: promptProfile(user), history };
    },
});

export const saveReply = internalMutation({
    args: { userKey: v.string(), counsellorSlug: v.string(), content: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.insert("chatMessages", {
            ...args,
            role: "assistant",
            content: args.content.slice(0, 4000),
            createdAt: Date.now(),
        });
    },
});

// Only this action writes assistant messages, so the browser can't forge them.
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

        const reply = await geminiReply(chatSystemPrompt(turn.counsellor, turn.profile), turn.history);

        const messageId = await ctx.runMutation(internal.chat.saveReply, {
            userKey: identity.tokenIdentifier,
            counsellorSlug,
            content: reply,
        });
        return { userMessageId: turn.userMessageId, messageId, text: reply };
    },
});
