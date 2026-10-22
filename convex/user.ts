import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { gender } from "./schema";
import { getUserByAuthId, requireIdentity, requireUser } from "./lib/users";

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
        await requireIdentity(ctx);
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

        // Replacing the profile picture: delete the old blob so it isn't orphaned.
        if (
            args.profileImageStorageId &&
            user.profileImageStorageId &&
            user.profileImageStorageId !== args.profileImageStorageId
        ) {
            try {
                await ctx.storage.delete(user.profileImageStorageId);
            } catch (e) {
                console.warn("failed to delete old profile image", e);
            }
        }

        await ctx.db.patch(user._id, {
            displayName: args.displayName.trim().slice(0, 80),
            gender: args.gender,
            birthDate: args.birthDate.slice(0, 10),
            birthTime: args.birthTimeUnknown ? undefined : args.birthTime?.slice(0, 5),
            birthTimeUnknown: args.birthTimeUnknown,
            birthPlace: args.birthPlace.trim().slice(0, 140),
            profileImageStorageId: args.profileImageStorageId ?? user.profileImageStorageId,
            onboardedAt: Date.now(),
        });
        return null;
    },
});
