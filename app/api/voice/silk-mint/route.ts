// Mints a one-shot Rumik SILK websocket session for streaming TTS during a call.
// The Rumik key stays on the server; the browser only gets the ephemeral ws_url + token.

import { api } from "@/convex/_generated/api";
import { envOrNull, guardRequest } from "@/lib/api-guard";
import { fetchAuthQuery } from "@/lib/auth-server";
import { FEMALE_TONES, MALE_DESCRIPTIONS, stablePick } from "@/lib/voices";

export const dynamic = "force-dynamic";

const MAX_TEXT = 1200;

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
    const counsellorSlug = typeof body.counsellorSlug === "string" ? body.counsellorSlug : "";
    if (!text || !counsellorSlug) {
        return Response.json({ error: "text and counsellorSlug are required" }, { status: 400 });
    }

    // This runs before every spoken piece of a call, so the session check, rate limit and persona
    // lookup happen together. The paid Rumik call still waits for the guard to pass.
    const [blocked, counsellor] = await Promise.all([
        guardRequest("tts"),
        fetchAuthQuery(api.counsellors.getBySlug, { slug: counsellorSlug }).catch(() => null),
    ]);
    if (blocked) return blocked;

    const apiKey = envOrNull("SILK_API_KEY");
    if (!apiKey) {
        return Response.json({ error: "SILK_API_KEY not configured" }, { status: 500 });
    }
    const baseUrl = envOrNull("SILK_BASE_URL") ?? "https://silk-api.rumik.ai";
    if (!counsellor) {
        return Response.json({ error: "Counsellor not found" }, { status: 404 });
    }

    const isMale = counsellor.gender === "male";
    const model = isMale ? "mulberry" : (envOrNull("SILK_MODEL") ?? "muga");
    const tone = isMale ? null : stablePick(FEMALE_TONES, counsellor.slug);
    const description = isMale ? stablePick(MALE_DESCRIPTIONS, counsellor.slug) : null;

    const mintBody: Record<string, unknown> = { model, text };
    if (description) mintBody.description = description;

    const r = await fetch(`${baseUrl}/v1/tts/ws-connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(mintBody),
    });
    if (!r.ok) {
        console.error("SILK mint failed", r.status, (await r.text()).slice(0, 300));
        return Response.json({ error: "Voice synthesis is unavailable right now." }, { status: 502 });
    }
    const data = await r.json();
    return Response.json(
        { ws_url: data.ws_url, token: data.token, model, tone, description },
        { headers: { "Cache-Control": "no-store" } },
    );
}
