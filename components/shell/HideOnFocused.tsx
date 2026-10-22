"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { isFocusedScreen } from "./nav";

// Hides app chrome on phones while a conversation or call is open.
export function HideOnFocused({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const params = useSearchParams();
    if (isFocusedScreen(pathname, params.has("counsellor")))
        return <div className="hidden lg:contents">{children}</div>;
    return children;
}
