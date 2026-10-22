import { Compass, MessageCircle, Phone, Sparkles, type LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
    { href: "/dashboard", label: "Astrologers", icon: Compass },
    { href: "/dashboard/chat", label: "Chats", icon: MessageCircle },
    { href: "/dashboard/call", label: "Calls", icon: Phone },
    { href: "/dashboard/remedies", label: "Remedies", icon: Sparkles },
];

export function isActive(pathname: string, href: string) {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/counsellor");
    return pathname.startsWith(href);
}

// Focused screens hide the bottom bar on phones: an open conversation and a live call.
export function isFocusedScreen(pathname: string, hasCounsellorParam: boolean) {
    if (/^\/dashboard\/call\/(?!history)[^/]+$/.test(pathname)) return true;
    return pathname === "/dashboard/chat" && hasCounsellorParam;
}
