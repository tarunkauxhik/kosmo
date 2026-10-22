"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Recording = { blob: Blob; url: string };

function preferredType() {
    if (typeof MediaRecorder === "undefined") return "";
    return (
        ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"].find((t) =>
            MediaRecorder.isTypeSupported(t),
        ) ?? ""
    );
}

// Records a voice note with MediaRecorder. `elapsed` ticks once a second for the UI.
export function useVoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const release = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    }, []);

    useEffect(() => release, [release]);

    const start = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            throw new Error("This browser can't record voice notes. Type your message instead.");
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
            streamRef.current = stream;
            const type = preferredType();
            const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
            recorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.start(250);
            setElapsed(0);
            timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
            setIsRecording(true);
        } catch (err) {
            release();
            const msg = err instanceof Error ? err.message : "";
            throw new Error(
                /permission|notallowed|denied/i.test(msg)
                    ? "Microphone access is blocked. Allow it in your browser's site settings, then try again."
                    : "Couldn't start the microphone. Check that no other app is using it.",
            );
        }
    }, [release]);

    const stop = useCallback(async (): Promise<Recording | null> => {
        const recorder = recorderRef.current;
        setIsRecording(false);
        if (!recorder || recorder.state === "inactive") {
            release();
            return null;
        }
        const result = await new Promise<Recording | null>((resolve) => {
            recorder.onstop = () => {
                const chunks = chunksRef.current;
                chunksRef.current = [];
                if (!chunks.length) return resolve(null);
                const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
                resolve({ blob, url: URL.createObjectURL(blob) });
            };
            try {
                recorder.requestData();
            } catch {}
            recorder.stop();
        });
        recorderRef.current = null;
        release();
        return result;
    }, [release]);

    const cancel = useCallback(async () => {
        const rec = await stop();
        if (rec) URL.revokeObjectURL(rec.url);
    }, [stop]);

    return { isRecording, elapsed, start, stop, cancel };
}

export async function transcribe(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append("audio", blob, `voice-note.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
    const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Couldn't transcribe the voice note.");
    }
    const body = await res.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) throw new Error("No clear words in that recording. Try again a little closer to the mic.");
    return text;
}
