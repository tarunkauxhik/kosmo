import { NextResponse } from "next/server";
import { envOrNull, guardRequest } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

function deepgramError(status: number) {
    if (status === 401 || status === 403) return "Deepgram key is invalid or missing access.";
    if (status === 429) return "Speech transcription is rate limited. Please try again shortly.";
    return "Speech transcription failed.";
}

export async function POST(request: Request) {
    const blocked = await guardRequest("stt");
    if (blocked) return blocked;

    const key = envOrNull("DEEPGRAM_API_KEY");
    if (!key) {
        return NextResponse.json({ error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
    }

    const declaredSize = Number(request.headers.get("content-length") ?? 0);
    if (declaredSize > 11 * 1024 * 1024) {
        return NextResponse.json({ error: "Voice note is too large." }, { status: 413 });
    }

    const form = await request.formData().catch(() => null);
    if (!form) {
        return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
    }
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
        return NextResponse.json({ error: "No voice note audio received." }, { status: 400 });
    }
    if (audio.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Voice note is too large." }, { status: 413 });
    }

    const audioType = audio.type || "audio/webm";
    const params = new URLSearchParams({
        model: "nova-3",
        smart_format: "true",
        punctuate: "true",
        detect_language: "true",
    });

    const response = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
        method: "POST",
        headers: {
            Authorization: `Token ${key}`,
            "Content-Type": audioType,
        },
        body: await audio.arrayBuffer(),
    });

    if (!response.ok) {
        let detail = "";
        try {
            const body = await response.json();
            detail = typeof body.err_msg === "string" ? body.err_msg : "";
        } catch {}
        return NextResponse.json({ error: deepgramError(response.status), detail }, { status: response.status });
    }

    const body = await response.json();
    const text = body?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();
    if (!text) {
        return NextResponse.json(
            { error: "I recorded audio but could not hear clear words. Please try again closer to the mic." },
            { status: 422 },
        );
    }

    return NextResponse.json({ text });
}
