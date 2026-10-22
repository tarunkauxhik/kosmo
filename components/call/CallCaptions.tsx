"use client";

import { useEffect, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { CallActivity } from "@/hooks/useVoiceCall";
import { cn } from "@/lib/utils";

// Live transcript of the current exchange. It fills the space it is given and scrolls, so a long
// reply is shown in full instead of being clipped while the audio keeps playing.
export function CallCaptions({
    user,
    assistant,
    activity,
    counsellorFirstName,
    className,
}: {
    user: string | null;
    assistant: string | null;
    activity: CallActivity;
    counsellorFirstName: string;
    className?: string;
}) {
    const boxRef = useRef<HTMLDivElement>(null);
    const replyRef = useRef<HTMLParagraphElement>(null);
    const thinking = activity === "thinking";

    // Follow the caller's words as they come in, and the thinking line when it appears.
    useEffect(() => {
        const box = boxRef.current;
        if (box) box.scrollTo({ top: box.scrollHeight });
    }, [user, thinking]);

    // A new reply scrolls into view from its first line; scrollTo clamps, so a short one sits at the bottom.
    useEffect(() => {
        const box = boxRef.current;
        const reply = replyRef.current;
        if (!box || !reply || thinking) return;
        box.scrollTo({ top: reply.offsetTop - 8, behavior: "smooth" });
    }, [assistant, thinking]);

    return (
        <div
            ref={boxRef}
            className={cn("relative w-full overflow-y-auto overscroll-contain text-left", className)}
            aria-live="polite"
        >
            <div className="flex min-h-full flex-col justify-end space-y-3 py-2">
                {user && (
                    <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-[0.9375rem] leading-relaxed">
                        <span className="sr-only">You: </span>
                        {user}
                    </p>
                )}
                {thinking ? (
                    <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <ThinkingOrb state="working" size={20} aria-hidden />
                        {counsellorFirstName} is thinking…
                    </p>
                ) : (
                    assistant && (
                        <p ref={replyRef} className="max-w-[92%] py-1 text-[0.9375rem] leading-relaxed">
                            <span className="sr-only">{counsellorFirstName}: </span>
                            {assistant}
                        </p>
                    )
                )}
            </div>
        </div>
    );
}
