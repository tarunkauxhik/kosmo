"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import type { CallCounsellor } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

function CallSkeleton({ counsellor }: { counsellor: CallCounsellor }) {
    return (
        // Same geometry as CallScreen (header height, orb size, spacing) so nothing jumps when it loads.
        <div className="flex h-full flex-col px-5" role="status" aria-label="Preparing call">
            <div className="h-15 shrink-0" />
            <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-5 py-2 sm:my-auto sm:max-h-176 sm:gap-6 sm:py-4">
                <div className="grid size-44 shrink-0 place-items-center rounded-full border sm:size-72">
                    <PersonaAvatar
                        src={counsellor.portrait}
                        name={counsellor.name}
                        sizes="(min-width: 640px) 132px, 88px"
                        eager
                        className="size-22 sm:size-33"
                    />
                </div>
                <Skeleton className="h-7 w-48 rounded-md" />
            </div>
        </div>
    );
}

// Heavy, browser-only pieces load on demand.
const CallScreen = dynamic(() => import("./CallScreen"), { ssr: false });
const OnboardingFlow = dynamic(() => import("@/components/onboarding/OnboardingFlow"), { ssr: false });

export function CallGate({ counsellor }: { counsellor: CallCounsellor }) {
    const profile = useQuery(api.user.getProfile);
    const [attempt, setAttempt] = useState(0);

    if (profile === undefined) return <CallSkeleton counsellor={counsellor} />;

    if (!profile?.onboarded) {
        return (
            <div className="h-full overflow-y-auto">
                <OnboardingFlow
                    counsellorName={counsellor.name}
                    initialName={profile?.displayName ?? undefined}
                    action="call"
                />
            </div>
        );
    }

    return <CallScreen key={attempt} counsellor={counsellor} onRetry={() => setAttempt((n) => n + 1)} />;
}
