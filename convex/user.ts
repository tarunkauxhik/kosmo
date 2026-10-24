import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { gender } from "./schema";
import { rateLimiter } from "./lib/rateLimits";
import { getUserByAuthId, requireIdentity, requireUser } from "./lib/users";

// Matches the client-side limit in hooks/usePhotoUpload.ts.
const MAX_PROFILE_IMAGE_BYTES = 8 * 1024 * 1024;

// A real calendar date (YYYY-MM-DD) from 1900 to today. A day of slack lets "today" in a timezone
// ahead of UTC through.
function isBirthDate(value: string) {
    const ms = Date.parse(value);
    return (
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(ms) &&
        new Date(ms).toISOString().slice(0, 10) === value &&
        value >= "1900-01-01" &&
        ms <= Date.now() + 86_400_000
    );
}

export const ensureUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const existing = await getUserByAuthId(ctx, identity.subject);
        if (existing) return existing;

        const user = await ctx.runQuery(api.auth.getCurrentUser);
        if (!user) return null;

        await ctx.db.insert("users", {
            authId: identity.subject,
            email: user.email,
            image: user.image ?? undefined,
            name: user.name,
            createdAt: Date.now(),
        });
        return null;
    },
});

export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const user = await getUserByAuthId(ctx, identity.subject);
        if (!user) return null;
        const onboarded = Boolean(user.onboardedAt && user.gender && user.birthDate && user.birthPlace);
        const profileImageUrl = user.profileImageStorageId
            ? await ctx.storage.getUrl(user.profileImageStorageId)
            : (user.image ?? null);
        return {
            displayName: user.displayName ?? user.name,
            gender: user.gender ?? null,
            birthDate: user.birthDate ?? null,
            birthTime: user.birthTime ?? null,
            birthTimeUnknown: user.birthTimeUnknown ?? false,
            birthPlace: user.birthPlace ?? null,
            profileImageUrl,
            onboarded,
        };
    },
});

export const generateProfileUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await requireIdentity(ctx);
        await rateLimiter.limit(ctx, "photoUpload", { key: identity.subject, throws: true });
        return await ctx.storage.generateUploadUrl();
    },
});

export const saveProfile = mutation({
    args: {
        displayName: v.string(),
        gender,
        birthDate: v.string(),
        birthTime: v.optional(v.string()),
        birthTimeUnknown: v.boolean(),
        birthPlace: v.string(),
        profileImageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // The forms check these too, but the mutation can be called directly.
        const displayName = args.displayName.trim().slice(0, 80);
        const birthPlace = args.birthPlace.trim().slice(0, 140);
        if (!displayName) throw new ConvexError("Enter a name.");
        if (!birthPlace) throw new ConvexError("Enter the city you were born in.");
        if (!isBirthDate(args.birthDate)) throw new ConvexError("Enter a real date of birth.");
        const birthTime = args.birthTimeUnknown ? undefined : args.birthTime;
        if (!args.birthTimeUnknown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime ?? "")) {
            throw new ConvexError("Enter a time of birth, or tick that you don't know it.");
        }

        const newImage = args.profileImageStorageId;
        if (newImage && newImage !== user.profileImageStorageId) {
            // The id comes from the browser: accept only an image upload that no other user has claimed.
            const file = await ctx.db.system.get("_storage", newImage);
            const claimed = await ctx.db
                .query("users")
                .withIndex("by_profileImageStorageId", (q) => q.eq("profileImageStorageId", newImage))
                .first();
            if (!file || !file.contentType?.startsWith("image/") || file.size > MAX_PROFILE_IMAGE_BYTES || claimed) {
                throw new ConvexError("That photo couldn't be used. Upload it again.");
            }

            // Replacing the profile picture: delete the old blob so it isn't orphaned.
            if (user.profileImageStorageId) {
                try {
                    await ctx.storage.delete(user.profileImageStorageId);
                } catch (e) {
                    console.warn("failed to delete old profile image", e);
                }
            }
        }

        await ctx.db.patch(user._id, {
            displayName,
            gender: args.gender,
            birthDate: args.birthDate,
            birthTime,
            birthTimeUnknown: args.birthTimeUnknown,
            birthPlace,
            profileImageStorageId: args.profileImageStorageId ?? user.profileImageStorageId,
            onboardedAt: Date.now(),
        });
        return null;
    },
});
