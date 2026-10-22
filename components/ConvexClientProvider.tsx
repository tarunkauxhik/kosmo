"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { convexAuthClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
    children,
    initialToken,
}: {
    children: React.ReactNode;
    initialToken?: string | null;
}) {
    return (
        <ConvexBetterAuthProvider client={convex} authClient={convexAuthClient} initialToken={initialToken}>
            {children}
        </ConvexBetterAuthProvider>
    );
}
