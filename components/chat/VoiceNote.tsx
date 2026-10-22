import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Your own recorded voice note: playback plus the transcript it was sent as.
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
    playable,
    onToggle,
}: {
    id: string;
    transcript: string;
    playing: boolean;
    playable: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="min-w-[15rem]">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggle}
                    disabled={!playable}
                    aria-label={playing ? "Pause voice note" : "Play voice note"}
                    className="pressable grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                >
                    {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
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
            <p className="mt-2 text-[0.9375rem] leading-relaxed">{transcript}</p>
        </div>
    );
}
