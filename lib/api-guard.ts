import { api } from "@/convex/_generated/api";
import { fetchAuthMutation, isAuthenticated } from "@/lib/auth-server";

type LimitName = "tts" | "stt" | "callStart";

/**
 * Shared gate for API routes that call paid third-party services.
 * Returns a Response to send back when the request must stop, or null to continue.
 */
export async function guardRequest(limit: LimitName): Promise<Response | null> {
    if (!(await isAuthenticated())) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { ok, retryAfter } = await fetchAuthMutation(api.limits.consume, { name: limit });
        if (!ok) {
            const seconds = Math.max(1, Math.ceil(retryAfter / 1000));
            return Response.json(
                { error: "You're going a bit fast. Please wait a moment and try again." },
                { status: 429, headers: { "Retry-After": String(seconds) } },
            );
        }
    } catch (error) {
        console.error("rate limit check failed", error);
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
}

export function envOrNull(name: string) {
    const value = process.env[name];
    return value && value.trim() ? value.trim() : null;
}
