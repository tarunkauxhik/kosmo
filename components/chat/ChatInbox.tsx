"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { MessageCircle, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { formatRelativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatCounsellor } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

function Row({ c, active, meta, preview }: { c: ChatCounsellor; active: boolean; meta?: string; preview: string }) {
    return (
        <li>
            <Link
                href={`/dashboard/chat?counsellor=${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                    "flex min-h-16 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60",
                    active && "bg-accent",
                )}
            >
                <PersonaAvatar src={c.portrait} name={c.name} size={40} />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{c.name}</span>
                        {meta && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{meta}</span>}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">{preview}</span>
                </span>
            </Link>
        </li>
    );
}

export function ChatInboxSkeleton() {
    return (
        <div className="space-y-1 p-3" role="status" aria-label="Loading chats">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                        <Skeleton className="h-3 w-4/5 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ChatInbox({ counsellors, activeSlug }: { counsellors: ChatCounsellor[]; activeSlug?: string }) {
    const sessions = useQuery(api.chat.listSessions);
    const [query, setQuery] = useState("");
    const bySlug = useMemo(() => new Map(counsellors.map((c) => [c.slug, c])), [counsellors]);

    const needle = query.trim().toLowerCase();
    const match = (c: ChatCounsellor) => !needle || c.name.toLowerCase().includes(needle);
    const rows = (sessions ?? []).flatMap((s) => {
        const c = bySlug.get(s.counsellorSlug);
        return c ? [{ c, ...s }] : [];
    });
    const started = new Set(rows.map((r) => r.c.slug));
    const visibleRows = rows.filter((r) => match(r.c));
    const others = counsellors.filter((c) => !started.has(c.slug) && match(c));

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 space-y-4 px-5 pt-6 pb-3 lg:px-4">
                <h1 className="text-2xl leading-tight font-semibold tracking-tight">Chats</h1>
                <div className="relative">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        name="astrologer"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Find an astrologer"
                        aria-label="Find an astrologer"
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
                {sessions === undefined ? (
                    <ChatInboxSkeleton />
                ) : (
                    <>
                        {rows.length === 0 && !needle && (
                            <Empty className="mx-2 my-2 w-auto rounded-2xl bg-muted/50 py-8">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <MessageCircle />
                                    </EmptyMedia>
                                    <EmptyTitle>No conversations yet</EmptyTitle>
                                    <EmptyDescription>
                                        Pick an astrologer below to start one. Your chats are saved here.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        )}
                        {visibleRows.length > 0 && (
                            <section aria-labelledby="inbox-recent">
                                <h2
                                    id="inbox-recent"
                                    className="px-3 pt-2 pb-1 text-sm font-medium text-muted-foreground"
                                >
                                    Recent
                                </h2>
                                <ul className="space-y-0.5">
                                    {visibleRows.map((r) => (
                                        <Row
                                            key={r.c.slug}
                                            c={r.c}
                                            active={r.c.slug === activeSlug}
                                            meta={formatRelativeDay(r.lastAt)}
                                            preview={`${r.lastRole === "user" ? "You: " : ""}${r.lastMessage}`}
                                        />
                                    ))}
                                </ul>
                            </section>
                        )}
                        {others.length > 0 && (
                            <section aria-labelledby="inbox-new" className="mt-4">
                                <h2 id="inbox-new" className="px-3 pt-2 pb-1 text-sm font-medium text-muted-foreground">
                                    Start a new chat
                                </h2>
                                <ul className="space-y-0.5">
                                    {others.map((c) => (
                                        <Row
                                            key={c.slug}
                                            c={c}
                                            active={c.slug === activeSlug}
                                            preview={c.specialties.join(", ")}
                                        />
                                    ))}
                                </ul>
                            </section>
                        )}
                        {needle && visibleRows.length === 0 && others.length === 0 && (
                            <Empty className="py-10">
                                <EmptyHeader>
                                    <EmptyTitle>No one called &ldquo;{query.trim()}&rdquo;</EmptyTitle>
                                    <EmptyDescription>Check the spelling, or browse everyone.</EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                                        Clear search
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
