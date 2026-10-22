import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

// Next adds noindex to 404 responses itself.
export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
    return (
        <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-6 py-16">
            <Link href="/" aria-label="Kosmo home" className="w-fit rounded-md">
                <Wordmark />
            </Link>
            <p className="mt-6 text-sm font-medium text-muted-foreground tabular-nums">404</p>
            <h1 className="-mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                This page isn&rsquo;t in our sky
            </h1>
            <p className="text-muted-foreground">
                The link may be old, or the address has a typo. The astrologers are still where you left them.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
                <Button asChild size="lg">
                    <Link href="/astrologers">See the astrologers</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/">Home</Link>
                </Button>
            </div>
        </main>
    );
}
