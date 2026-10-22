import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { UserAvatar } from "./UserAvatar";

export function MobileTopBar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md lg:hidden">
            <Link href="/dashboard" aria-label="Kosmo home" className="rounded-md">
                <Wordmark />
            </Link>
            <Link href="/dashboard/profile" aria-label="Your profile" className="rounded-full">
                <UserAvatar name={name} imageUrl={imageUrl} className="size-8" />
            </Link>
        </header>
    );
}
