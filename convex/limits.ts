import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { rateLimiter } from "./lib/rateLimits";
import { requireIdentity } from "./lib/users";

// Called by the Next.js API routes (with the user's auth token) before they
// spend money on Deepgram or Rumik.
export const consume = mutation({
    args: { name: v.union(v.literal("tts"), v.literal("stt"), v.literal("callStart")) },
    handler: async (ctx, { name }) => {
        const identity = await requireIdentity(ctx);
        const { ok, retryAfter } = await rateLimiter.limit(ctx, name, { key: identity.subject });
        return { ok, retryAfter: retryAfter ?? 0 };
    },
});
