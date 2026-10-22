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
        <div
            className="flex h-full flex-col items-center justify-center gap-6 px-5"
            role="status"
            aria-label="Preparing call"
        >
            <div className="grid size-60 place-items-center rounded-full border sm:size-72">
                <PersonaAvatar src={counsellor.portrait} name={counsellor.name} size={132} eager />
            </div>
            <Skeleton className="h-7 w-48 rounded-md" />
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
