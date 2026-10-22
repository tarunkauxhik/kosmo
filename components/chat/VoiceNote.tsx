import { Pause, Play } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Fixed pseudo-waveform: 28 bars whose heights come from the message id so they stay stable.
function bars(seed: string) {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return Array.from({ length: 28 }, (_, i) => 6 + ((h >>> (i % 24)) % 14) + (i % 3) * 2);
}

export function VoiceNote({
    id,
    transcript,
    playing,
    loading,
    playable,
    onToggle,
}: {
    id: string;
    transcript: string;
    playing: boolean;
    loading: boolean;
    playable: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="min-w-[15rem]">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    disabled={!playable || loading}
                    aria-label={playing ? "Pause voice note" : "Play voice note"}
                    className="pressable grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                >
                    {loading ? (
                        <Spinner />
                    ) : playing ? (
                        <Pause className="size-4" />
                    ) : (
                        <Play className="ml-0.5 size-4" />
                    )}
                </button>
                <div
                    className={cn("flex h-8 flex-1 items-center gap-[3px]", playing && "motion-safe:animate-pulse")}
                    aria-hidden
                >
                    {bars(id).map((h, i) => (
                        <span
                            key={i}
                            className="w-[3px] shrink-0 rounded-full bg-muted-foreground/55"
                            style={{ height: h }}
                        />
                    ))}
                </div>
            </div>
            <details className="group mt-2">
                <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-2 hover:underline">
                    <span className="group-open:hidden">Show transcript</span>
                    <span className="hidden group-open:inline">Hide transcript</span>
                </summary>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed">{transcript}</p>
            </details>
        </div>
    );
}
