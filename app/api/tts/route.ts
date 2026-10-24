// Rumik SILK REST TTS for chat voice notes. Returns audio bytes.

import { api } from "@/convex/_generated/api";
import { envOrNull, guardRequest } from "@/lib/api-guard";
import { fetchAuthQuery } from "@/lib/auth-server";
import { chatVoiceDescription } from "@/lib/voices";

export const runtime = "nodejs";

function compactRumikError(status: number, detail: string) {
    try {
        const parsed = JSON.parse(detail) as { error?: string; code?: string };
        const message = parsed.error || detail;
        const code = parsed.code ? ` ${parsed.code}` : "";
        return `${status}${code}: ${message}`;
    } catch {
        return `${status}: ${detail}`;
    }
}

function cleanText(text: string) {
    return text
        .replace(/^\[(happy|excited|sad|angry|neutral|whisper)\]\s*/i, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);
}

export async function POST(request: Request) {
    const body = (await request.json().catch(() => ({}))) as { text?: unknown; counsellorSlug?: unknown };
    const text = typeof body.text === "string" ? cleanText(body.text) : "";
    const counsellorSlug = typeof body.counsellorSlug === "string" ? body.counsellorSlug : "";

    // Session check, rate limit and persona lookup together. A signed-out caller gets a 401 before
    // any other answer, and the paid Rumik call waits for the guard.
    const [blocked, counsellor] = await Promise.all([
        guardRequest("tts"),
        counsellorSlug ? fetchAuthQuery(api.counsellors.getBySlug, { slug: counsellorSlug }).catch(() => null) : null,
    ]);
    if (blocked) return blocked;
    if (!text) {
        return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = envOrNull("SILK_API_KEY");
    if (!apiKey) {
        return Response.json({ error: "SILK_API_KEY not configured" }, { status: 500 });
    }

    // Chat voice notes always use the description-steered `mulberry` model.
    const payload = {
        model: "mulberry",
        text,
        temperature: 0.7,
        description: chatVoiceDescription(counsellor?.gender ?? "female"),
    };

    try {
        const baseUrl = envOrNull("SILK_BASE_URL") ?? "https://silk-api.rumik.ai";
        const upstream = await fetch(`${baseUrl}/v1/tts`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!upstream.ok) {
            const detail = compactRumikError(upstream.status, (await upstream.text()).slice(0, 300));
            console.error("Rumik TTS upstream failed", detail);
            return Response.json({ error: "Couldn't play this voice note right now." }, { status: 502 });
        }

        const audio = await upstream.arrayBuffer();
        return new Response(audio, {
            headers: {
                "Content-Type": upstream.headers.get("Content-Type") || "audio/wav",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Rumik TTS failed", error);
        return Response.json({ error: "Unable to synthesize speech right now" }, { status: 502 });
    }
}
