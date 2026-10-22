import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getToken } from "@/lib/auth-server";

type LimitName = "tts" | "stt" | "callStart";

/**
 * Shared gate for API routes that call paid third-party services.
 * Returns a Response to send back when the request must stop, or null to continue.
 */
export async function guardRequest(limit: LimitName): Promise<Response | null> {
    // One token fetch for both checks: the auth helpers fetch a fresh token on every call.
    const token = await getToken();
    if (!token) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { ok, retryAfter } = await fetchMutation(api.limits.consume, { name: limit }, { token });
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
