"use client";

import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageListSkeleton } from "./MessageBubble";
import { ChatView } from "./ChatView";
import type { ChatCounsellor } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

const OnboardingFlow = dynamic(() => import("@/components/onboarding/OnboardingFlow"), {
    ssr: false,
    loading: () => <MessageListSkeleton />,
});

// Chat needs birth details. Shows onboarding first, then the conversation;
// the live profile query flips to onboarded once the details are saved.
export function ChatGate({ counsellor }: { counsellor: ChatCounsellor }) {
    const profile = useQuery(api.user.getProfile);

    if (profile === undefined) {
        return (
            <div className="h-full">
                <div className="flex h-[65px] items-center gap-3 border-b px-5">
                    <Skeleton className="size-10 rounded-full" />
                    <Skeleton className="h-4 w-40 rounded-md" />
                </div>
                <MessageListSkeleton />
            </div>
        );
    }

    if (!profile?.onboarded) {
        return (
            <div className="h-full overflow-y-auto">
                <OnboardingFlow
                    counsellorName={counsellor.name}
                    initialName={profile?.displayName ?? undefined}
                    action="chat"
                />
            </div>
        );
    }

    return <ChatView key={counsellor.slug} counsellor={counsellor} displayName={profile.displayName} />;
}
