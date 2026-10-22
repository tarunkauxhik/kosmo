import { ThinkingOrb } from "thinking-orbs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Check, Pause, RotateCcw, Volume2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ChatMessage } from "@/hooks/useChat";
import type { AudioNote } from "@/hooks/useTtsPlayback";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VoiceNote } from "./VoiceNote";

export function MessageBubble({
    message,
    note,
    playing,
    onTogglePlay,
    onRetry,
}: {
    message: ChatMessage;
    note?: AudioNote;
    playing: boolean;
    onTogglePlay: () => void;
    onRetry: () => void;
}) {
    const mine = message.role === "user";
    const failed = message.status === "failed";
    return (
        <li className={cn("flex", mine ? "justify-end" : "justify-start", message.fresh && "animate-rise")}>
            <div className={cn("flex max-w-[88%] flex-col sm:max-w-[75%]", mine ? "items-end" : "items-start")}>
                {/* Your messages sit in a soft bubble; replies read as plain text. */}
                <div
                    className={cn(
                        "text-[0.9375rem] leading-relaxed break-words",
                        mine ? "rounded-2xl rounded-br-md bg-muted px-4 py-2.5" : "py-1",
                        message.status === "sending" && "opacity-80",
                        failed && "ring-1 ring-destructive/60",
                    )}
                >
                    {message.kind === "voice" ? (
                        <VoiceNote
                            id={message.id}
                            transcript={message.content}
                            playing={playing}
                            playable={Boolean(note?.url)}
                            onToggle={onTogglePlay}
                        />
                    ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>
                <div
                    className={cn(
                        "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums",
                        mine && "px-1",
                    )}
                >
                    {failed ? (
                        <>
                            <AlertCircle className="size-3.5 text-destructive" aria-hidden />
                            <span className="text-destructive">Not sent.</span>
                            <button
                                type="button"
                                onClick={onRetry}
                                className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                            >
                                <RotateCcw className="size-3" aria-hidden /> Retry
                            </button>
                        </>
                    ) : message.status === "sending" ? (
                        <span>Sending…</span>
                    ) : (
                        <>
                            <time dateTime={new Date(message.createdAt).toISOString()}>
                                {formatClock(message.createdAt)}
                            </time>
                            {mine && <Check className="size-3.5" aria-label="Sent" />}
                            {/* Audio is opt-in: synthesised only when this button (or the header toggle) asks for it. */}
                            {!mine && message.kind === "text" && !message.streaming && (
                                <button
                                    type="button"
                                    onClick={onTogglePlay}
                                    disabled={note?.status === "loading"}
                                    aria-pressed={playing}
                                    aria-label={playing ? "Stop reading aloud" : "Read aloud"}
                                    title={playing ? "Stop" : "Read aloud"}
                                    className="relative grid size-6 place-items-center rounded-full transition-colors duration-150 outline-none after:absolute after:-inset-2 after:content-[''] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                                >
                                    {note?.status === "loading" ? (
                                        <Spinner className="size-3.5" />
                                    ) : playing ? (
                                        <Pause className="size-3.5" aria-hidden />
                                    ) : (
                                        <Volume2 className="size-3.5" aria-hidden />
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}

export function ThinkingBubble({ name }: { name: string }) {
    return (
        <li className="flex justify-start" aria-live="polite">
            <div className="flex items-center gap-2.5 py-1 text-sm text-muted-foreground">
                {/* thinking-orbs (MIT, libraries.dev): monochrome canvas orb, static under reduced motion. */}
                <ThinkingOrb state="composing" size={20} aria-hidden />
                {name} is writing a reply…
            </div>
        </li>
    );
}

export function MessageListSkeleton() {
    return (
        <ul className="space-y-4 p-5" role="status" aria-label="Loading conversation">
            {[60, 40, 75, 50].map((w, i) => (
                <li key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
                    <Skeleton className="h-14 rounded-2xl" style={{ width: `${w}%` }} />
                </li>
            ))}
        </ul>
    );
}
