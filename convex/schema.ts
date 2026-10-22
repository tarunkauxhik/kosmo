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
    }).index("by_userId_startedAt", ["userId", "startedAt"]),

    callTurns: defineTable({
        callId: v.id("calls"),
        role: v.union(v.literal("user"), v.literal("bot")),
        text: v.string(),
        ts: v.number(),
    }).index("by_callId_ts", ["callId", "ts"]),

    chatMessages: defineTable({
        userKey: v.string(),
        counsellorSlug: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        createdAt: v.number(),
    }).index("by_userKey_and_counsellorSlug_and_createdAt", ["userKey", "counsellorSlug", "createdAt"]),
});
