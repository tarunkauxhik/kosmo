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
import { LegalDialog } from "@/components/legal/LegalDialog";

type Errors = { name?: string; email?: string; password?: string };

export function SignUpForm() {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const refs = {
        name: nameRef,
        email: emailRef,
        password: passwordRef,
    };

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();
        const password = String(data.get("password") ?? "");

        const next: Errors = {};
        if (!name) next.name = "Tell us what to call you.";
        if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email, like you@example.com.";
        if (password.length < 8) next.password = "Use at least 8 characters.";
        setErrors(next);
        setFormError(null);
        const first = (["name", "email", "password"] as const).find((k) => next[k]);
        if (first) return refs[first].current?.focus();

        setPending(true);
        const destination = safeNext(new URLSearchParams(window.location.search).get("next"));
        const result = await authClient.signUp.email({ name, email, password, callbackURL: destination });
        if (result.error) {
            setPending(false);
            const msg = result.error.message ?? "";
            if (/exist/i.test(msg)) {
                setErrors({ email: "An account with this email already exists. Sign in instead." });
                refs.email.current?.focus();
            } else {
                setFormError(msg || "Couldn't create your account. Try again in a moment.");
            }
            return;
        }
        router.push(destination);
    }

    return (
        <div className="animate-rise">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">It takes a minute. Birth details come next.</p>

            <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
                {formError && (
                    <Alert variant="destructive" aria-live="polite">
                        <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                        ref={nameRef}
                        id="name"
                        name="name"
                        autoComplete="name"

                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    <FieldError id="name-error" message={errors.name} />
                </div>
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
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : "password-hint"}
                    />
                    {errors.password ? (
                        <FieldError id="password-error" message={errors.password} />
                    ) : (
                        <p id="password-hint" className="text-sm text-muted-foreground">
                            At least 8 characters.
                        </p>
                    )}
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={pending}>
                    {pending && <Spinner />}
                    Create account
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                    By creating an account you agree to the{" "}
                    <LegalDialog kind="terms">
                        <button type="button" className="underline underline-offset-2 hover:text-foreground">
                            terms
                        </button>
                    </LegalDialog>{" "}
                    and{" "}
                    <LegalDialog kind="privacy">
                        <button type="button" className="underline underline-offset-2 hover:text-foreground">
                            privacy policy
                        </button>
                    </LegalDialog>
                    .
                </p>
            </form>

            <p className="mt-8 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-brand underline-offset-4 hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
