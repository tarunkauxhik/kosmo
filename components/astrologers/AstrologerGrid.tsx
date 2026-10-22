import Link from "next/link";
import { SearchX } from "lucide-react";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { AstrologerCard } from "./AstrologerCard";

export async function AstrologerGrid({ category, mode, q }: { category?: string; mode?: "new"; q?: string }) {
    const counsellors = await fetchAuthQuery(api.counsellors.list, { category, mode, q });
    const filtered = Boolean(category || mode || q);

    if (counsellors.length === 0) {
        return (
            <Empty className="rounded-2xl bg-muted/50 py-16">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <SearchX />
                    </EmptyMedia>
                    <EmptyTitle>{filtered ? "No astrologers match" : "No astrologers yet"}</EmptyTitle>
                    <EmptyDescription>
                        {filtered
                            ? q
                                ? `Nothing matches “${q}”. Try a tradition like tarot or a language like Tamil.`
                                : "Try another topic or clear the filters."
                            : "Personas haven't been loaded. Run pnpm seed:counsellors."}
                    </EmptyDescription>
                </EmptyHeader>
                {filtered && (
                    <EmptyContent>
                        <Button asChild variant="outline">
                            <Link href="/dashboard">Clear filters</Link>
                        </Button>
                    </EmptyContent>
                )}
            </Empty>
        );
    }

    return (
        <section aria-label="Astrologers">
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
                {counsellors.length} {counsellors.length === 1 ? "astrologer" : "astrologers"}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {counsellors.map((c, i) => (
                    <li key={c._id} className="flex [&>article]:flex-1">
                        <AstrologerCard c={c} href={`/dashboard/counsellor/${c.slug}`} eager={i < 3} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
