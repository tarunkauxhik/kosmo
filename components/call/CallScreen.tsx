"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Mic, MicOff, PhoneOff, RotateCcw } from "lucide-react";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { AiBadge } from "@/components/AiBadge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { firstName } from "@/lib/format";
import { CallCaptions } from "./CallCaptions";
import { CallOrb } from "./CallOrb";
import { CallTimer } from "./CallTimer";
import type { CallCounsellor } from "./types";

const ACTIVITY_LABEL = { listening: "Listening", thinking: "Thinking", speaking: "Speaking" } as const;

export default function CallScreen({ counsellor, onRetry }: { counsellor: CallCounsellor; onRetry: () => void }) {
    const router = useRouter();
    const call = useVoiceCall(counsellor.slug);
    const first = firstName(counsellor.name);

    function hangUp() {
        const id = call.end();
        router.push(id ? `/dashboard/call/history/${id}` : `/dashboard/counsellor/${counsellor.slug}`);
    }

    return (
        <section className="flex h-full flex-col" aria-label={`Voice call with ${counsellor.name}`}>
            <header className="flex shrink-0 items-center gap-3 px-3 py-3 sm:px-5">
                <Button asChild variant="ghost" size="icon-sm">
                    <Link href={`/dashboard/counsellor/${counsellor.slug}`} aria-label="Leave call">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div className="flex-1" />
                <AiBadge />
            </header>

            <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pb-6 text-center">
                <div className="my-auto flex w-full flex-col items-center gap-6 py-4">
                    <CallOrb
                        portrait={counsellor.portrait}
                        name={counsellor.name}
                        phase={call.phase}
                        activity={call.activity}
                        levelRef={call.levelRef}
                    />
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{counsellor.name}</h1>
                        <span className="sr-only" role="status">
                            {call.phase === "connecting"
                                ? "Connecting"
                                : call.phase === "error"
                                  ? "Call not connected"
                                  : call.muted
                                    ? "Muted"
                                    : ACTIVITY_LABEL[call.activity]}
                        </span>
                        <p
                            className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                            aria-hidden
                        >
                            {call.phase === "connecting" && "Connecting…"}
                            {call.phase === "live" && (
                                <>
                                    <span
                                        className="size-1.5 rounded-full bg-success motion-safe:animate-pulse"
                                        aria-hidden
                                    />
                                    <span className="text-foreground">
                                        {call.muted ? "Muted" : ACTIVITY_LABEL[call.activity]}
                                    </span>
                                    {call.startedAt && <CallTimer startedAt={call.startedAt} />}
                                </>
                            )}
                            {call.phase === "error" && "Call not connected"}
                        </p>
                    </div>

                    {call.phase === "error" ? (
                        <Alert variant="destructive" className="max-w-md text-left">
                            <AlertTitle>Couldn&rsquo;t start the call</AlertTitle>
                            <AlertDescription>{call.error}</AlertDescription>
                        </Alert>
                    ) : call.phase === "live" ? (
                        <CallCaptions
                            user={call.captions.user}
                            assistant={call.captions.assistant}
                            activity={call.activity}
                            counsellorFirstName={first}
                        />
                    ) : (
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Allow microphone access if your browser asks. {first} will greet you first.
                        </p>
                    )}
                </div>
            </div>

            <footer className="shrink-0 px-5 pt-4 pb-safe">
                <div className="mx-auto flex max-w-md items-center justify-center gap-4 pb-4">
                    {call.phase === "error" ? (
                        <>
                            <Button variant="outline" size="lg" asChild>
                                <Link href={`/dashboard/chat?counsellor=${counsellor.slug}`}>
                                    <MessageCircle /> Chat instead
                                </Link>
                            </Button>
                            <Button size="lg" onClick={onRetry}>
                                <RotateCcw /> Try again
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="secondary"
                                size="icon-lg"
                                className="rounded-full"
                                onClick={call.toggleMute}
                                disabled={call.phase !== "live"}
                                aria-pressed={call.muted}
                                aria-label={call.muted ? "Unmute microphone" : "Mute microphone"}
                            >
                                {call.muted ? <MicOff /> : <Mic />}
                            </Button>
                            <Button
                                size="lg"
                                className="rounded-full bg-[#d93036] pr-6 pl-5 text-white hover:bg-[#c22a30]"
                                onClick={hangUp}
                            >
                                <PhoneOff /> End call
                            </Button>
                        </>
                    )}
                </div>
                <p className="pb-3 text-center text-xs text-muted-foreground">
                    Calls are transcribed and saved to your history.
                </p>
            </footer>
        </section>
    );
}
