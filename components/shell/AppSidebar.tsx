"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "./UserAvatar";
import { NAV, isActive } from "./nav";
import { cn } from "@/lib/utils";

export function AppSidebar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
    const pathname = usePathname();
    return (
        <aside className="sticky top-0 flex h-dvh flex-col px-3 py-4">
            <Link href="/dashboard" aria-label="Kosmo home" className="mx-2.5 flex h-9 w-fit items-center rounded-md">
                <Wordmark />
            </Link>
            <nav aria-label="Main" className="mt-6 flex flex-col gap-0.5">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = isActive(pathname, href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-[color,background-color] duration-150 hover:bg-sidebar-accent hover:text-foreground",
                                active && "bg-sidebar-accent text-foreground",
                            )}
                        >
                            <Icon className="size-4" strokeWidth={active ? 2 : 1.75} aria-hidden />
                            {label}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto space-y-3">
                <p className="mx-2.5 text-xs leading-relaxed text-muted-foreground">
                    Astrologers on Kosmo are AI personas. Treat replies as reflection, not advice.
                </p>
                <ThemeToggle className="mx-2.5" />
                <Link
                    href="/dashboard/profile"
                    aria-current={pathname.startsWith("/dashboard/profile") ? "page" : undefined}
                    className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors duration-150 hover:bg-sidebar-accent"
                >
                    <UserAvatar name={name} imageUrl={imageUrl} />
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{name}</span>
                        <span className="block text-xs text-muted-foreground">Profile and birth details</span>
                    </span>
                </Link>
            </div>
        </aside>
    );
}
