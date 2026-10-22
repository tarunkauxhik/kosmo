import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AiBadge } from "@/components/AiBadge";
import { LocalTime } from "@/components/LocalTime";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { firstName, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Call transcript" };

async function load(id: string) {
    try {
        return await fetchAuthQuery(api.calls.getMine, { callId: id as Id<"calls"> });
    } catch {
        return null; // malformed id
    }
}

export default async function CallTranscriptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await load(id);
    if (!data) notFound();
    const { call, turns } = data;
    const duration = formatDuration(call.durationSec);
    const first = firstName(call.counsellorName);

    return (
        <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-10">
            <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2.5 pr-3 pl-2 text-muted-foreground">
                <Link href="/dashboard/call">
                    <ArrowLeft /> All calls
                </Link>
            </Button>

            <header className="flex flex-wrap items-center gap-4 border-b pb-6">
                <PersonaAvatar src={call.counsellorPortrait} name={call.counsellorName} size={56} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{call.counsellorName}</h1>
                        <AiBadge />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                        <LocalTime ts={call.startedAt} format="full" />
                        {duration && (
                            <>
                                , <span className="whitespace-nowrap">{duration}</span>
                            </>
                        )}
                    </p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                    <Button asChild variant="outline" className="flex-1 sm:flex-none">
                        <Link href={`/dashboard/chat?counsellor=${call.counsellorSlug}`}>
                            <MessageCircle /> Chat
                        </Link>
                    </Button>
                    <Button asChild className="flex-1 sm:flex-none">
                        <Link href={`/dashboard/call/${call.counsellorSlug}`}>
                            <Phone /> Call again
                        </Link>
                    </Button>
                </div>
            </header>

            <section aria-labelledby="transcript" className="pt-6">
                <h2 id="transcript" className="mb-4 text-sm font-medium text-muted-foreground">
                    Transcript
                </h2>
                {turns.length === 0 ? (
                    <Empty className="rounded-2xl bg-muted/50 py-10">
                        <EmptyHeader>
                            <EmptyTitle>Nothing was said on this call</EmptyTitle>
                            <EmptyDescription>The call ended before either side spoke.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <ol className="space-y-4">
                        {turns.map((t) => {
                            const mine = t.role === "user";
                            return (
                                <li key={t._id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                                    <span className={cn("mb-1 text-xs text-muted-foreground", mine && "px-1")}>
                                        {mine ? "You" : first}
                                    </span>
                                    <p
                                        className={cn(
                                            "max-w-[88%] text-[0.9375rem] leading-relaxed sm:max-w-[75%]",
                                            mine ? "rounded-2xl rounded-br-md bg-muted px-4 py-2.5" : "py-0.5",
                                        )}
                                    >
                                        {t.text}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </section>
        </div>
    );
}
