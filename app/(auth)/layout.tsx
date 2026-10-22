import Link from "next/link";
import type { PropsWithChildren } from "react";
import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";
import { Wordmark } from "@/components/brand/Logo";

// Form-only pages: kept out of search results. Signed-in visitors are redirected by proxy.ts.
export const metadata: Metadata = noIndex;

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <div className="relative isolate flex min-h-dvh flex-col px-5 py-5 sm:px-8">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] [mask-image:radial-gradient(ellipse_50%_45%_at_50%_40%,black,transparent)]" />
            </div>
            <Link href="/" aria-label="Kosmo home" className="w-fit rounded-md">
                <Wordmark />
            </Link>
            <main id="main" className="flex flex-1 items-center justify-center py-10">
                <div className="w-full max-w-[22rem]">{children}</div>
            </main>
            <p className="text-center text-xs text-muted-foreground">
                Kosmo&rsquo;s astrologers are AI personas, not real people.
            </p>
        </div>
    );
}
