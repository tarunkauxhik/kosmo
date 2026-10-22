"use client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { AuthBoundary, type AuthClient } from "@convex-dev/better-auth/react";
import { PropsWithChildren } from "react";
import { api } from "@/convex/_generated/api";
import { isAuthError } from "./utils";

export const authClient = createAuthClient({
    plugins: [convexClient()],
});

// better-auth >= 1.6.18 names its client return types, and the AuthClient prop
// type in @convex-dev/better-auth 0.12.5 no longer matches them (types only,
// runtime is unchanged). Cast once here so we can stay on the patched
// better-auth. Remove when get-convex/better-auth#420 ships.
export const convexAuthClient = authClient as unknown as AuthClient;

export const ClientAuthBoundary = ({ children }: PropsWithChildren) => {
    const router = useRouter();
    return (
        <AuthBoundary
            authClient={convexAuthClient}
            onUnauth={() => router.push("/sign-in")}
            getAuthUserFn={api.auth.getCurrentUser}
            isAuthError={isAuthError}
        >
            {children}
        </AuthBoundary>
    );
};

export const { signOut } = authClient;
