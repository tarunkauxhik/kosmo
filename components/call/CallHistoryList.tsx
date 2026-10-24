import Link from "next/link";
import { Phone, PhoneOutgoing } from "lucide-react";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { LocalTime } from "@/components/LocalTime";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { formatDuration } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

// A call without an end time is only "in progress" for its first hour; older ones were abandoned.
function isOngoing(startedAt: number, endedAt?: number) {
    return !endedAt && Date.now() - startedAt < 3_600_000;
}

export async function CallHistoryList() {
    const calls = await fetchAuthQuery(api.calls.listMine, {});

    if (!calls.length) {
        return (
            <Empty className="rounded-2xl bg-muted/50 py-14">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Phone />
                    </EmptyMedia>
                    <EmptyTitle>No calls yet</EmptyTitle>
                    <EmptyDescription>
                        When you talk to an astrologer by voice, the call and its transcript are saved here.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button asChild>
                        <Link href="/dashboard">Find an astrologer</Link>
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-surface">
            {calls.map((c) => {
                const duration = formatDuration(c.durationSec);
                return (
                    <li
                        key={c._id}
                        className="relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 sm:gap-4"
                    >
                        <PersonaAvatar src={c.counsellorPortrait} name={c.counsellorName} size={44} />
                        <div className="min-w-0 flex-1">
                            <Link
                                href={`/dashboard/call/history/${c._id}`}
                                className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
                            >
                                {c.counsellorName}
                            </Link>
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <PhoneOutgoing className="size-3.5" aria-hidden />
                                <span>
                                    <LocalTime ts={c.startedAt} />
                                    {duration
                                        ? `, ${duration}`
                                        : isOngoing(c.startedAt, c.endedAt)
                                          ? ", in progress"
                                          : ", didn’t connect"}
                                </span>
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="relative z-10 text-muted-foreground hover:text-foreground"
                        >
                            <Link
                                href={`/dashboard/call/${c.counsellorSlug}`}
                                aria-label={`Call ${c.counsellorName} again`}
                            >
                                <Phone />
                            </Link>
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
}

export function CallHistorySkeleton() {
    return (
        <div className="divide-y rounded-2xl bg-card shadow-surface" role="status" aria-label="Loading calls">
            {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <Skeleton className="size-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40 rounded-md" />
                        <Skeleton className="h-3 w-28 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}
