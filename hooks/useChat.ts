"use client";

import { useCallback, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { firstName } from "@/lib/format";

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
    kind: "text" | "voice";
    status?: "sending" | "failed";
    // Assistant replies that arrived while this screen was open animate in.
    fresh?: boolean;
};

function isRateLimited(err: unknown) {
    const data = (err as { data?: unknown })?.data;
    return !!data && typeof data === "object" && (data as { kind?: string }).kind === "RateLimited";
}

function chatErrorMessage(err: unknown) {
    if (isRateLimited(err)) return "You're sending messages quickly. Wait a few seconds, then retry.";
    console.error("[chat] send failed", err);
    // ConvexError messages are written for users; Convex redacts any other server error in production.
    if (err instanceof ConvexError && typeof err.data === "string") return err.data;
    return "No reply came back. Check your connection and try again.";
}

type SendOptions = { kind?: "text" | "voice"; onStored?: (userMessageId: string) => void };

export function useChat({
    slug,
    counsellorName,
    displayName,
}: {
    slug: string;
    counsellorName: string;
    displayName: string;
}) {
    const session = useQuery(api.chat.getSession, { counsellorSlug: slug });
    const sendAction = useAction(api.chat.send);
    const [openedAt] = useState(() => Date.now());
    const [pending, setPending] = useState<ChatMessage[]>([]);
    const [voiceIds, setVoiceIds] = useState<Set<string>>(() => new Set());
    const [thinking, setThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messages = useMemo<ChatMessage[]>(() => {
        const saved: ChatMessage[] = (session?.messages ?? []).map((m) => ({
            id: m._id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            // Replies are always text (with an optional read-aloud button); only your own recordings are voice notes.
            kind: voiceIds.has(m._id) ? "voice" : "text",
            fresh: m.role === "assistant" && m.createdAt > openedAt,
        }));
        // The greeting is never stored; it always opens the thread.
        const greeting: ChatMessage = {
            id: `intro-${slug}`,
            role: "assistant",
            kind: "text",
            createdAt: saved[0]?.createdAt ?? openedAt,
            content: `Namaste ${firstName(displayName)}. I'm ${counsellorName}, an AI astrology guide. I have your birth details, so tell me what's on your mind.`,
        };
        // Drop an optimistic bubble once the server copy has arrived.
        const unsent = pending.filter(
            (p) =>
                !saved.some(
                    (m) => m.role === "user" && m.content === p.content && Math.abs(m.createdAt - p.createdAt) < 60_000,
                ),
        );
        return [greeting, ...saved, ...unsent];
    }, [session, voiceIds, pending, slug, counsellorName, displayName, openedAt]);

    const send = useCallback(
        async (raw: string, opts: SendOptions = {}): Promise<{ id: string; text: string } | null> => {
            const text = raw.trim();
            if (!text) return null;
            setError(null);
            const optimistic: ChatMessage = {
                id: `pending-${crypto.randomUUID()}`,
                role: "user",
                content: text,
                createdAt: Date.now(),
                kind: opts.kind ?? "text",
                status: "sending",
            };
            setPending((p) => [...p, optimistic]);
            setThinking(true);
            try {
                const {
                    userMessageId,
                    messageId,
                    text: reply,
                } = await sendAction({ counsellorSlug: slug, content: text });
                if (opts.kind === "voice") setVoiceIds((s) => new Set(s).add(userMessageId));
                opts.onStored?.(userMessageId);
                setPending((p) => p.filter((m) => m.id !== optimistic.id));
                return { id: messageId, text: reply };
            } catch (err) {
                // A rate-limited message was never stored: keep it on screen with a retry.
                if (isRateLimited(err)) {
                    setPending((p) => p.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m)));
                } else {
                    setPending((p) => p.filter((m) => m.id !== optimistic.id));
                }
                setError(chatErrorMessage(err));
                return null;
            } finally {
                setThinking(false);
            }
        },
        [sendAction, slug],
    );

    const discard = useCallback((id: string) => setPending((p) => p.filter((m) => m.id !== id)), []);

    const hasUserMessages = messages.some((m) => m.role === "user");

    return {
        loading: session === undefined,
        messages,
        thinking,
        error,
        clearError: () => setError(null),
        send,
        discard,
        hasUserMessages,
    };
}
