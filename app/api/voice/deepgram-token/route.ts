// Mints a short-lived Deepgram access token for the browser's streaming STT
// websocket. The real API key never leaves the server.

import { envOrNull, guardRequest } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function POST() {
    const blocked = await guardRequest("callStart");
    if (blocked) return blocked;

    const key = envOrNull("DEEPGRAM_API_KEY");
    if (!key) {
        return Response.json({ error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
        method: "POST",
        headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
        // The token only has to be valid while the websocket handshakes.
        body: JSON.stringify({ ttl_seconds: 30 }),
    });
    if (!res.ok) {
        console.error("Deepgram grant failed", res.status, (await res.text()).slice(0, 300));
        return Response.json({ error: "Could not start speech recognition." }, { status: 502 });
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
        return Response.json({ error: "Could not start speech recognition." }, { status: 502 });
    }
    return Response.json(
        { accessToken: data.access_token, expiresIn: data.expires_in ?? 30 },
        { headers: { "Cache-Control": "no-store" } },
    );
}
