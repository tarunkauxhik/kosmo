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

            {/* The orb block keeps its size; the transcript below takes the rest of the height and scrolls.
                On tall screens the column is capped and centred so it doesn't stretch. */}
            <div className="flex min-h-0 flex-1 flex-col items-center px-5 text-center">
                <div className="flex min-h-0 w-full max-w-lg flex-1 flex-col items-center gap-5 py-2 sm:my-auto sm:max-h-176 sm:gap-6 sm:py-4">
                    <CallOrb
                        portrait={counsellor.portrait}
                        name={counsellor.name}
                        phase={call.phase}
                        activity={call.activity}
                        levelRef={call.levelRef}
                    />
                    <div className="shrink-0">
                        <h1 className="text-xl font-semibold tracking-tight sm:text-[1.75rem]">{counsellor.name}</h1>
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
                        <Alert variant="destructive" className="max-w-md shrink-0 text-left">
                            <AlertTitle>{call.startedAt ? "The call ended" : "Couldn’t start the call"}</AlertTitle>
                            <AlertDescription>{call.error}</AlertDescription>
                        </Alert>
                    ) : call.phase === "live" ? (
                        <CallCaptions
                            user={call.captions.user}
                            assistant={call.captions.assistant}
                            activity={call.activity}
                            counsellorFirstName={first}
                            className="min-h-0 flex-1"
                        />
                    ) : (
                        <p className="max-w-xs shrink-0 text-sm text-muted-foreground">
                            Allow microphone access if your browser asks. {first} will greet you first.
                        </p>
                    )}
                </div>
            </div>

            <footer className="shrink-0 px-5 pt-3 pb-safe sm:pt-4">
                <div className="mx-auto flex max-w-md items-center justify-center gap-4 pb-3 sm:pb-4">
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
