"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioNote = { status: "loading" | "ready" | "error"; url?: string };

async function readError(response: Response) {
    try {
        const body = await response.json();
        return typeof body.error === "string" ? body.error : "Couldn't play this voice note.";
    } catch {
        return "Couldn't play this voice note.";
    }
}

// Plays chat voice notes. Assistant notes are synthesised on first play via /api/tts
// and cached as object URLs; the user's own recordings are registered directly.
export function useTtsPlayback(counsellorSlug: string) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, AudioNote>>({});
    const notesRef = useRef(notes);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const urlsRef = useRef<Set<string>>(new Set());
    const genRef = useRef(0);

    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    const stop = useCallback(() => {
        genRef.current += 1;
        audioRef.current?.pause();
        audioRef.current = null;
        setPlayingId(null);
    }, []);

    useEffect(() => {
        const urls = urlsRef.current;
        return () => {
            audioRef.current?.pause();
            for (const url of urls) URL.revokeObjectURL(url);
            urls.clear();
        };
    }, []);

    const register = useCallback((id: string, url: string) => {
        urlsRef.current.add(url);
        setNotes((n) => ({ ...n, [id]: { status: "ready", url } }));
    }, []);

    const synthesize = useCallback(
        async (id: string, text: string) => {
            const cached = notesRef.current[id]?.url;
            if (cached) return cached;
            setNotes((n) => ({ ...n, [id]: { status: "loading" } }));
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, counsellorSlug }),
            });
            if (!res.ok) {
                setNotes((n) => ({ ...n, [id]: { status: "error" } }));
                throw new Error(await readError(res));
            }
            const url = URL.createObjectURL(await res.blob());
            urlsRef.current.add(url);
            setNotes((n) => ({ ...n, [id]: { status: "ready", url } }));
            return url;
        },
        [counsellorSlug],
    );

    // Toggle playback for a message. Resolves when playback starts; rejects with a readable error.
    const toggle = useCallback(
        async (id: string, text: string) => {
            if (playingId === id) return stop();
            stop();
            const gen = genRef.current;
            const url = await synthesize(id, text);
            if (gen !== genRef.current) return;
            const audio = new Audio(url);
            audioRef.current = audio;
            setPlayingId(id);
            audio.onended = audio.onerror = () => {
                if (gen === genRef.current) stop();
            };
            await audio.play();
        },
        [playingId, stop, synthesize],
    );

    return { playingId, notes, toggle, stop, register };
}
