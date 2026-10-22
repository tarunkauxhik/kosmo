"use client";

import { useRef, useState } from "react";
import { ArrowUp, Mic, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function clock(sec: number) {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function Composer({
    counsellorFirstName,
    busy,
    recording,
    transcribing,
    elapsed,
    onSend,
    onStartRecording,
    onStopRecording,
    onCancelRecording,
}: {
    counsellorFirstName: string;
    busy: boolean;
    recording: boolean;
    transcribing: boolean;
    elapsed: number;
    onSend: (text: string) => Promise<unknown>;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onCancelRecording: () => void;
}) {
    const [text, setText] = useState("");
    const ref = useRef<HTMLTextAreaElement>(null);
    const canSend = text.trim().length > 0 && !busy;

    async function submit() {
        if (!canSend) return;
        const value = text;
        setText("");
        ref.current?.focus();
        // Failed sends stay in the thread with a retry, so the text isn't restored here.
        await onSend(value);
    }

    if (recording || transcribing) {
        return (
            <div className="flex items-center gap-2 rounded-2xl bg-card p-2 shadow-surface">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onCancelRecording}
                    disabled={transcribing}
                    aria-label="Discard recording"
                >
                    <Trash2 />
                </Button>
                <div className="flex flex-1 items-center gap-2.5 text-sm" aria-live="polite">
                    {transcribing ? (
                        <>
                            <Spinner className="text-muted-foreground" /> Turning your voice note into text…
                        </>
                    ) : (
                        <>
                            <span
                                className="size-2.5 rounded-full bg-destructive motion-safe:animate-pulse"
                                aria-hidden
                            />
                            <span>Recording</span>
                            <span className="text-muted-foreground tabular-nums">{clock(elapsed)}</span>
                        </>
                    )}
                </div>
                <Button
                    type="button"
                    size="icon"
                    onClick={onStopRecording}
                    disabled={transcribing}
                    aria-label="Stop and send voice note"
                >
                    <Square className="fill-current" />
                </Button>
            </div>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className="flex items-end gap-2 rounded-2xl bg-card p-2 shadow-surface transition-shadow duration-150 focus-within:shadow-surface-hover focus-within:ring-3 focus-within:ring-ring/15"
        >
            <label htmlFor="chat-input" className="sr-only">
                Message {counsellorFirstName}
            </label>
            <textarea
                id="chat-input"
                ref={ref}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        submit();
                    }
                }}
                rows={1}
                placeholder={`Message ${counsellorFirstName}…`}
                enterKeyHint="send"
                className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-muted-foreground"
            />
            {text.trim() ? (
                <Button type="submit" size="icon" disabled={!canSend} aria-label="Send message">
                    {busy ? <Spinner /> : <ArrowUp />}
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onStartRecording}
                    disabled={busy}
                    aria-label="Record a voice note"
                    className={cn("text-muted-foreground hover:text-foreground")}
                >
                    <Mic />
                </Button>
            )}
        </form>
    );
}
