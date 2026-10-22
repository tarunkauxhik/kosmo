import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getUserByAuthId(ctx: QueryCtx | MutationCtx, authId: string) {
    return await ctx.db
        .query("users")
        .withIndex("by_authId", (q) => q.eq("authId", authId))
        .first();
}

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    return identity;
}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
    const identity = await requireIdentity(ctx);
    const user = await getUserByAuthId(ctx, identity.subject);
    if (!user) throw new ConvexError("User row missing. Call user.ensureUser first.");
    return user;
}

export function promptProfile(user: Doc<"users"> | null) {
    if (!user) return null;
    return {
        displayName: user.displayName ?? user.name,
        gender: user.gender ?? null,
        birthDate: user.birthDate ?? null,
        birthTime: user.birthTime ?? null,
        birthTimeUnknown: user.birthTimeUnknown ?? false,
        birthPlace: user.birthPlace ?? null,
    };
}

export type PromptProfile = NonNullable<ReturnType<typeof promptProfile>>;
