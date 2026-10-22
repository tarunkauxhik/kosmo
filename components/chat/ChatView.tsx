"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { useTtsPlayback } from "@/hooks/useTtsPlayback";
import { transcribe, useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { Button } from "@/components/ui/button";
import { firstName } from "@/lib/format";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageBubble, MessageListSkeleton, ThinkingBubble } from "./MessageBubble";
import type { ChatCounsellor } from "./types";

const SUGGESTIONS = [
    "I feel stuck in my career.",
    "What does my chart say about marriage?",
    "Money has been tight this month.",
];

export function ChatView({ counsellor, displayName }: { counsellor: ChatCounsellor; displayName: string }) {
    const chat = useChat({ slug: counsellor.slug, counsellorName: counsellor.name, displayName });
    const tts = useTtsPlayback(counsellor.slug);
    const recorder = useVoiceRecorder();
    const [spokenReplies, setSpokenReplies] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const first = firstName(counsellor.name);

    // Keep the newest message in view, unless the reader has scrolled up.
    // A streaming reply grows in place, so its length counts as a change too.
    const count = chat.messages.length;
    const tailLength = chat.messages.at(-1)?.content.length ?? 0;
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
        if (nearBottom || chat.thinking) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [count, tailLength, chat.thinking, chat.loading]);

    async function play(id: string, text: string) {
        try {
            await tts.toggle(id, text);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't play this voice note.");
        }
    }

    async function send(text: string, opts?: Parameters<typeof chat.send>[1]) {
        tts.stop();
        const reply = await chat.send(text, opts);
        if (reply && spokenReplies) play(reply.id, reply.text);
        return reply !== null;
    }

    async function startRecording() {
        tts.stop();
        try {
            await recorder.start();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't start the microphone.");
        }
    }

    async function stopRecording() {
        const rec = await recorder.stop();
        if (!rec) return;
        setTranscribing(true);
        try {
            const text = await transcribe(rec.blob);
            setTranscribing(false);
            await send(text, { kind: "voice", onStored: (id) => tts.register(id, rec.url) });
        } catch (err) {
            URL.revokeObjectURL(rec.url);
            toast.error(err instanceof Error ? err.message : "Couldn't send the voice note.");
        } finally {
            setTranscribing(false);
        }
    }

    return (
        <section className="flex h-full min-h-0 flex-col" aria-label={`Chat with ${counsellor.name}`}>
            <ChatHeader
                counsellor={counsellor}
                spokenReplies={spokenReplies}
                onToggleSpoken={() => setSpokenReplies((v) => !v)}
            />

            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {chat.loading ? (
                    <MessageListSkeleton />
                ) : (
                    <ul
                        className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6"
                        role="log"
                        aria-live="polite"
                        aria-relevant="additions"
                    >
                        {chat.messages.map((m) => (
                            <MessageBubble
                                key={m.id}
                                message={m}
                                note={tts.notes[m.id]}
                                playing={tts.playingId === m.id}
                                onTogglePlay={() => play(m.id, m.content)}
                                onRetry={() => {
                                    chat.discard(m.id);
                                    send(m.content, { kind: m.kind });
                                }}
                            />
                        ))}
                        {chat.thinking && <ThinkingBubble name={first} />}
                    </ul>
                )}
            </div>

            <div className="shrink-0 border-t bg-background px-3 pt-3 pb-safe sm:px-6">
                <div className="mx-auto w-full max-w-3xl space-y-3 pb-3">
                    {!chat.loading && !chat.hasUserMessages && (
                        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
                            {SUGGESTIONS.map((s) => (
                                <Button
                                    key={s}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 rounded-full font-normal"
                                    onClick={() => send(s)}
                                    disabled={chat.busy}
                                >
                                    {s}
                                </Button>
                            ))}
                        </div>
                    )}
                    {chat.error && (
                        <div
                            role="alert"
                            className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-1.5 pr-1.5 pl-4 text-sm text-destructive"
                        >
                            <p className="flex-1">{chat.error}</p>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={chat.clearError}
                                aria-label="Dismiss"
                                className="text-destructive hover:text-destructive"
                            >
                                <X />
                            </Button>
                        </div>
                    )}
                    <Composer
                        counsellorFirstName={first}
                        busy={chat.busy}
                        recording={recorder.isRecording}
                        transcribing={transcribing}
                        elapsed={recorder.elapsed}
                        onSend={(t) => send(t)}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onCancelRecording={recorder.cancel}
                    />
                    <p className="text-center text-xs text-muted-foreground">
                        {first} is an AI persona and can be wrong. Not a substitute for medical, legal or financial
                        advice.
                    </p>
                </div>
            </div>
        </section>
    );
}
