"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV, isActive, isFocusedScreen } from "./nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();
    const params = useSearchParams();
    if (isFocusedScreen(pathname, params.has("counsellor"))) return null;
    return (
        <nav
            aria-label="Main"
            className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-md lg:hidden"
        >
            <ul className="mx-auto grid h-16 max-w-lg grid-cols-4">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = isActive(pathname, href);
                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-muted-foreground transition-colors duration-150",
                                    active && "text-foreground",
                                )}
                            >
                                <Icon className="size-5" strokeWidth={active ? 2 : 1.75} aria-hidden />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
