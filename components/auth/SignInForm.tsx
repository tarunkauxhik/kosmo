"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FieldError } from "@/components/auth/FieldError";

type Errors = { email?: string; password?: string };

export function SignInForm() {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const email = String(data.get("email") ?? "").trim();
        const password = String(data.get("password") ?? "");

        const next: Errors = {};
        if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter the email you signed up with.";
        if (!password) next.password = "Enter your password.";
        setErrors(next);
        setFormError(null);
        if (next.email) return emailRef.current?.focus();
        if (next.password) return passwordRef.current?.focus();

        setPending(true);
        const destination = safeNext(new URLSearchParams(window.location.search).get("next"));
        const result = await authClient.signIn.email({ email, password, callbackURL: destination });
        if (result.error) {
            setPending(false);
            setFormError(
                result.error.status === 401 || /invalid/i.test(result.error.message ?? "")
                    ? "That email and password don't match. Check them and try again."
                    : (result.error.message ?? "Sign-in failed. Try again in a moment."),
            );
            return;
        }
        router.push(destination);
    }

    return (
        <div className="animate-rise">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">Sign in to pick up your chats and calls.</p>

            <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
                {formError && (
                    <Alert variant="destructive" aria-live="polite">
                        <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        ref={emailRef}
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="you@example.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    <FieldError id="email-error" message={errors.email} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                        ref={passwordRef}
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <FieldError id="password-error" message={errors.password} />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={pending}>
                    {pending && <Spinner />}
                    Sign in
                </Button>
            </form>

            <p className="mt-8 text-sm text-muted-foreground">
                New to Kosmo?{" "}
                <Link href="/sign-up" className="font-medium text-brand underline-offset-4 hover:underline">
                    Create an account
                </Link>
            </p>
        </div>
    );
}
