import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteFooter() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                    <Wordmark />
                    <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Every astrologer on Kosmo is an AI persona. Use it for reflection, not for medical, legal or
                        financial decisions.
                    </p>
                </div>
                <div className="flex flex-col gap-5 sm:items-end">
                    <nav aria-label="Footer" className="flex gap-5 text-sm text-muted-foreground">
                        <Link href="/astrologers" className="transition-colors hover:text-foreground">
                            Astrologers
                        </Link>
                        <Link href="/about" className="transition-colors hover:text-foreground">
                            About
                        </Link>
                        <Link href="/terms" className="transition-colors hover:text-foreground">
                            Terms
                        </Link>
                        <Link href="/privacy" className="transition-colors hover:text-foreground">
                            Privacy
                        </Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>
        </footer>
    );
}
