"use client";

import { useEffect, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { CallActivity } from "@/hooks/useVoiceCall";
import { cn } from "@/lib/utils";

// Live transcript of the current exchange. The reply grows sentence by sentence as it is spoken, and the
// area scrolls to keep the newest line in view, so a long reply is never clipped.
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
    const thinking = activity === "thinking";

    useEffect(() => {
        const box = boxRef.current;
        if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    }, [user, assistant, thinking]);

    return (
        <div
            ref={boxRef}
            className={cn("w-full overflow-y-auto overscroll-contain text-left", className)}
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
                        <p className="max-w-[92%] py-1 text-[0.9375rem] leading-relaxed">
                            <span className="sr-only">{counsellorFirstName}: </span>
                            {assistant}
                        </p>
                    )
                )}
            </div>
        </div>
    );
}
