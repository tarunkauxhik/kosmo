import type { Metadata } from "next";
import { Suspense } from "react";
import { CallHistoryList, CallHistorySkeleton } from "@/components/call/CallHistoryList";
import { PageHeader } from "@/components/shell/PageHeader";

export const metadata: Metadata = { title: "Calls" };

export default function CallHistoryPage() {
    return (
        <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-10">
            <PageHeader title="Calls" description="Past voice calls and their transcripts." className="mb-6" />
            <Suspense fallback={<CallHistorySkeleton />}>
                <CallHistoryList />
            </Suspense>
        </div>
    );
}
