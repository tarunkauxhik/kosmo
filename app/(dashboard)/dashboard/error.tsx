"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col justify-center gap-4 px-6 py-12">
            <h1 className="text-2xl font-semibold tracking-tight">Something went wrong on our side</h1>
            <p className="text-muted-foreground">
                This screen didn&rsquo;t load. Your chats and calls are safe. Try again, and if it keeps happening, come
                back in a few minutes.
            </p>
            <div className="flex flex-wrap gap-3">
                <Button onClick={reset}>Try again</Button>
                <Button asChild variant="outline">
                    <Link href="/dashboard">Back to astrologers</Link>
                </Button>
            </div>
        </div>
    );
}
