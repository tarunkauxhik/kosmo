import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
    title: "Sign in",
    description: "Sign in to Kosmo to continue your chats and calls with AI astrologer personas.",
};

export default function SignInPage() {
    return <SignInForm />;
}
