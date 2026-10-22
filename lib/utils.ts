import { clsx, type ClassValue } from "clsx";
import { ConvexError } from "convex/values";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const isAuthError = (error: unknown) => {
    const message = (error instanceof ConvexError && error.data) || (error instanceof Error && error.message) || "";
    return /auth/i.test(message);
};
// Where to go after signing in: a same-site relative path from ?next=, never an absolute or protocol-relative URL.
export function safeNext(next: string | null | undefined) {
    return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}
