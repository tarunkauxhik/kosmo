import { Suspense } from "react";
import { AstrologerFilters } from "@/components/astrologers/AstrologerFilters";
import { AstrologerGrid } from "@/components/astrologers/AstrologerGrid";
import { AstrologerGridSkeleton } from "@/components/astrologers/AstrologerCard";
import { PageHeader } from "@/components/shell/PageHeader";

type SP = { category?: string; mode?: string; q?: string };

export default async function AstrologersPage({ searchParams }: { searchParams: Promise<SP> }) {
    const sp = await searchParams;
    const mode = sp.mode === "new" ? "new" : undefined;
    return (
        <div className="mx-auto w-full max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
            <PageHeader
                title="Astrologers"
                description="Pick a persona to call or chat with. Every one of them is an AI."
            />
            <div className="mt-6">
                <Suspense fallback={<div className="h-[5.5rem]" />}>
                    <AstrologerFilters />
                </Suspense>
            </div>
            <div className="mt-8">
                <Suspense key={`${sp.category}-${mode}-${sp.q}`} fallback={<AstrologerGridSkeleton />}>
                    <AstrologerGrid category={sp.category} mode={mode} q={sp.q} />
                </Suspense>
            </div>
        </div>
    );
}
