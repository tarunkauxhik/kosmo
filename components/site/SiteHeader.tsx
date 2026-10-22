import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

// Static header. Signed-in visitors who press "Sign in" are sent straight to the app by proxy.ts.
export function SiteHeader() {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-5">
                <Link href="/" aria-label="Kosmo home" className="rounded-md">
                    <Wordmark />
                </Link>
                <nav className="ml-auto flex items-center gap-1" aria-label="Main">
                    <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                        <Link href="/astrologers">Astrologers</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                        <Link href="/about">About</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/sign-in">Sign in</Link>
                    </Button>
                    <Button asChild size="sm" className="ml-1">
                        <Link href="/sign-up">Create account</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
