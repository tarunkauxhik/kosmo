import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { SEED_COUNSELLORS } from "../lib/constants";
import { requireIdentity } from "./lib/users";

// Signed-in reads only. Public pages render the same personas from lib/constants.ts at build time.
export const list = query({
    args: {
        category: v.optional(v.string()),
        mode: v.optional(v.union(v.literal("all"), v.literal("new"))),
        q: v.optional(v.string()),
    },
    handler: async (ctx, { category, mode, q }) => {
        await requireIdentity(ctx);
        // Bounded by the seeded persona set (24 rows).
        const all = await ctx.db.query("counsellors").take(200);
        const needle = q?.trim().toLowerCase() ?? "";
        return all.filter((c) => {
            if (category && !c.categories.includes(category)) return false;
            if (mode === "new" && !c.isNew) return false;
            if (needle) {
                const haystack = [c.name, ...c.specialties, ...c.languages, ...c.categories].join(" ").toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, { slug }) => {
        await requireIdentity(ctx);
        return ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
    },
});

// Internal: upserts the personas from lib/constants.ts. Run with `pnpm seed` (`pnpm seed --prod` for production).
export const seed = internalMutation({
    args: {},
    handler: async (ctx) => {
        for (const r of SEED_COUNSELLORS) {
            const existing = await ctx.db
                .query("counsellors")
                .withIndex("by_slug", (q) => q.eq("slug", r.slug))
                .first();
            if (existing) await ctx.db.replace(existing._id, r);
            else await ctx.db.insert("counsellors", r);
        }
        return SEED_COUNSELLORS.length;
    },
});
