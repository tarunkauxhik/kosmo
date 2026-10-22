import type { CallActivity, CallPhase } from "@/hooks/useVoiceCall";
import { cn } from "@/lib/utils";
import { PersonaAvatar } from "@/components/PersonaAvatar";

// Portrait inside concentric rings. A soft accent glow swells with the caller's mic level (--level);
// the outer ring takes the accent while the persona speaks. Only transform and opacity animate.
export function CallOrb({
    portrait,
    name,
    phase,
    activity,
    levelRef,
}: {
    portrait: string;
    name: string;
    phase: CallPhase;
    activity: CallActivity;
    levelRef: React.RefObject<HTMLElement | null>;
}) {
    const live = phase === "live";
    const speaking = live && activity === "speaking";
    return (
        <div
            ref={levelRef as React.RefObject<HTMLDivElement>}
            className="relative grid size-44 shrink-0 place-items-center sm:size-72"
            style={{ "--level": 0 } as React.CSSProperties}
        >
            <span
                aria-hidden
                className={cn(
                    "absolute inset-[14%] rounded-full bg-brand/15 blur-2xl transition-[opacity,scale] duration-300 ease-out dark:bg-brand/20",
                    !live && "opacity-0",
                )}
                style={{ scale: "calc(1 + var(--level) * 0.35)" }}
            />
            <span
                aria-hidden
                className={cn(
                    "absolute inset-0 rounded-full border transition-colors duration-300",
                    speaking ? "border-brand/50" : "border-border",
                    phase === "connecting" && "motion-safe:animate-pulse",
                )}
            />
            <span aria-hidden className="absolute inset-[12%] rounded-full border" />
            <span aria-hidden className="absolute inset-[24%] rounded-full bg-card shadow-surface" />
            {/* Smaller on phones so the live transcript below gets most of the height. */}
            <PersonaAvatar
                src={portrait}
                name={name}
                sizes="(min-width: 640px) 132px, 88px"
                eager
                className="size-22 sm:size-33"
            />
        </div>
    );
}
