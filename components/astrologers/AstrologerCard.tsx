import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { AiBadge } from "@/components/AiBadge";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import type { Persona } from "@/components/astrologers/PersonaProfile";
import { Button } from "@/components/ui/button";
import { firstName } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

// `href` is the profile link: the public page on marketing pages, the in-app page in the dashboard.
export function AstrologerCard({
    c,
    href,
    eager = false,
}: {
    c: Persona & { isNew?: boolean };
    href: string;
    eager?: boolean;
}) {
    const first = firstName(c.name);
    return (
        <article className="group relative flex flex-col rounded-2xl bg-card p-5 shadow-surface transition-shadow duration-150 hover:shadow-surface-hover focus-within:shadow-surface-hover">
            <div className="flex items-start gap-4">
                <PersonaAvatar src={c.portrait} name={c.name} size={56} eager={eager} />
                <div className="min-w-0 flex-1">
                    <h2 className="leading-snug font-medium">
                        <Link
                            href={href}
                            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        >
                            {c.name}
                        </Link>
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.hometown ?? c.region ?? "India"}</p>
                    <div className="relative z-10 mt-2 flex flex-wrap items-center gap-1.5">
                        <AiBadge />
                        {c.isNew && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-surface">
                                New
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {c.tagline && (
                <p className="mt-4 line-clamp-2 text-[0.9375rem] leading-relaxed text-foreground/85">{c.tagline}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
                {c.specialties.join(", ")}
                <span className="sr-only">. Speaks {c.languages.join(", ")}.</span>
            </p>
            <div className="relative z-10 mt-auto flex gap-2 pt-5">
                <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/chat?counsellor=${c.slug}`} aria-label={`Chat with ${c.name}`}>
                        <MessageCircle aria-hidden /> Chat
                    </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                    <Link href={`/dashboard/call/${c.slug}`}>
                        <Phone aria-hidden /> Call {first}
                    </Link>
                </Button>
            </div>
        </article>
    );
}

function AstrologerCardSkeleton() {
    return (
        <div className="flex flex-col rounded-2xl bg-card p-5 shadow-surface" aria-hidden>
            <div className="flex items-start gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </div>
            <div className="mt-5 space-y-2">
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
            </div>
            <div className="mt-6 flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
        </div>
    );
}

export function AstrologerGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div role="status" aria-label="Loading astrologers">
            <Skeleton className="mb-4 h-4 w-32 rounded-md" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: count }, (_, i) => (
                    <AstrologerCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
