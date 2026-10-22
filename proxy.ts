import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { safeNext } from "@/lib/utils";

// Optimistic cookie check only; app/(dashboard)/layout.tsx verifies the session.
export async function proxy(request: NextRequest) {
    const signedIn = Boolean(getSessionCookie(request));
    const { pathname, search } = request.nextUrl;
    const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

    if (isAuthPage && signedIn) {
        return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url));
    }

    if (!isAuthPage && !signedIn) {
        const url = new URL("/sign-in", request.url);
        url.searchParams.set("next", pathname + search);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
