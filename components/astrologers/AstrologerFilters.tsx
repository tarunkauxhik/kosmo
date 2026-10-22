"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Emoji } from "@/components/Emoji";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function chipClass(active: boolean) {
    return cn(
        "pressable inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium has-[img]:pl-2.5",
        active
            ? "bg-primary text-primary-foreground"
            : "bg-card text-muted-foreground shadow-surface hover:text-foreground hover:shadow-surface-hover",
    );
}

export function AstrologerFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [query, setQuery] = useState(params.get("q") ?? "");
    const [isPending, startTransition] = useTransition();
    const first = useRef(true);

    const category = params.get("category");
    const isNew = params.get("mode") === "new";

    // Keep the URL in sync with the search box so results can be shared and restored.
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            const next = new URLSearchParams(params.toString());
            const v = query.trim();
            if (v) next.set("q", v);
            else next.delete("q");
            const qs = next.toString();
            startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed query should trigger navigation
    }, [query]);

    const hrefWith = (key: string, value: string | null) => {
        const next = new URLSearchParams(params.toString());
        if (value) next.set(key, value);
        else next.delete(key);
        const qs = next.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    };

    return (
        <div className="space-y-4">
            <div className="relative max-w-md">
                <label htmlFor="astrologer-search" className="sr-only">
                    Search astrologers
                </label>
                <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                />
                <Input
                    id="astrologer-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, tradition or language…"
                    className="pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden"
                    autoComplete="off"
                />
                <span className="absolute inset-y-0 right-0 grid w-10 place-items-center">
                    {isPending ? (
                        <Spinner className="text-muted-foreground" />
                    ) : query ? (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    ) : null}
                </span>
            </div>
            <nav aria-label="Filter by topic" className="-mx-5 overflow-x-auto px-5 no-scrollbar sm:mx-0 sm:px-0">
                <ul className="flex gap-2 pb-1 sm:flex-wrap [&>li]:shrink-0">
                    <li>
                        <Link
                            href={hrefWith("category", null)}
                            scroll={false}
                            className={chipClass(!category)}
                            aria-current={!category ? "true" : undefined}
                        >
                            All topics
                        </Link>
                    </li>
                    {CATEGORIES.map((c) => {
                        const active = category === c.slug;
                        return (
                            <li key={c.slug}>
                                <Link
                                    href={hrefWith("category", active ? null : c.slug)}
                                    scroll={false}
                                    className={chipClass(active)}
                                    aria-current={active ? "true" : undefined}
                                >
                                    <Emoji emoji={c.emoji} size={18} />
                                    {c.label}
                                </Link>
                            </li>
                        );
                    })}
                    <li aria-hidden className="mx-1 w-px self-stretch bg-border" />
                    <li>
                        <Link
                            href={hrefWith("mode", isNew ? null : "new")}
                            scroll={false}
                            className={chipClass(isNew)}
                            aria-current={isNew ? "true" : undefined}
                        >
                            Newly added
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
