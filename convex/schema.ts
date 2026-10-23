import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const gender = v.union(v.literal("male"), v.literal("female"));

const counsellorFields = {
    slug: v.string(),
    name: v.string(),
    gender,
    portrait: v.string(),
    specialties: v.array(v.string()),
    languages: v.array(v.string()),
    isNew: v.boolean(),
    categories: v.array(v.string()),
    tagline: v.optional(v.string()),
    bio: v.optional(v.string()),
    signature: v.optional(v.string()),
    hometown: v.optional(v.string()),
    region: v.optional(v.string()),
    personaPrompt: v.optional(v.string()),
};

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        authId: v.string(),
        image: v.optional(v.string()),
        createdAt: v.number(),
        displayName: v.optional(v.string()),
        gender: v.optional(gender),
        birthDate: v.optional(v.string()), // YYYY-MM-DD
        birthTime: v.optional(v.string()), // HH:MM (24h), unset when unknown
        birthTimeUnknown: v.optional(v.boolean()),
        birthPlace: v.optional(v.string()),
        profileImageStorageId: v.optional(v.id("_storage")),
        onboardedAt: v.optional(v.number()),
    })
        .index("by_authId", ["authId"])
        .index("by_profileImageStorageId", ["profileImageStorageId"]),

    counsellors: defineTable(counsellorFields).index("by_slug", ["slug"]),

    calls: defineTable({
        userId: v.id("users"),
        counsellorSlug: v.string(),
        counsellorName: v.string(),
        counsellorPortrait: v.string(),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        durationSec: v.optional(v.number()),
    })
        .index("by_userId_startedAt", ["userId", "startedAt"])
        // Open calls have no endedAt; calls.endStale scans them.
        .index("by_endedAt", ["endedAt"]),

    callTurns: defineTable({
        callId: v.id("calls"),
        role: v.union(v.literal("user"), v.literal("bot")),
        text: v.string(),
        ts: v.number(),
        // Set while a bot reply is still being generated; the call screen speaks it sentence by sentence.
        streaming: v.optional(v.boolean()),
        // Chosen by the client for each turn so it can follow exactly the reply it asked for.
        turnKey: v.optional(v.string()),
    }).index("by_callId_ts", ["callId", "ts"]),

    chatMessages: defineTable({
        userKey: v.string(),
        counsellorSlug: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        createdAt: v.number(),
        // Set while an assistant reply is still being generated; content grows until it is cleared.
        streaming: v.optional(v.boolean()),
    }).index("by_userKey_and_counsellorSlug_and_createdAt", ["userKey", "counsellorSlug", "createdAt"]),
});
