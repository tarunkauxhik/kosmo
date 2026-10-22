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
    const blocked = await guardRequest("tts");
    if (blocked) return blocked;

    const apiKey = envOrNull("SILK_API_KEY");
    if (!apiKey) {
        return Response.json({ error: "SILK_API_KEY not configured" }, { status: 500 });
    }

    let body: { text?: string; counsellorSlug?: string };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const text = cleanText(body.text ?? "");
    if (!text) {
        return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const counsellor = body.counsellorSlug
        ? await fetchAuthQuery(api.counsellors.getBySlug, { slug: body.counsellorSlug })
        : null;

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
            return Response.json({ error: "Voice note failed", detail }, { status: 502 });
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
