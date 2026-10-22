import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
    title: "Create an account",
    description: "Create a free Kosmo account to call or chat with AI astrologer personas.",
};

export default function SignUpPage() {
    return <SignUpForm />;
}
