import type { Metadata } from "next";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
    const [user, profile] = await Promise.all([
        fetchAuthQuery(api.auth.getCurrentUser),
        fetchAuthQuery(api.user.getProfile),
    ]);

    return (
        <div className="mx-auto w-full max-w-4xl px-5 py-6 lg:px-8 lg:py-10">
            <PageHeader
                title="Profile"
                description="Your account and the birth details the astrologers read from."
                className="mb-8"
                action={<ThemeToggle />}
            />
            <ProfileForm
                email={user?.email ?? ""}
                initial={{
                    displayName: profile?.displayName ?? user?.name ?? "",
                    gender: profile?.gender ?? null,
                    birthDate: profile?.birthDate ?? null,
                    birthTime: profile?.birthTime ?? null,
                    birthTimeUnknown: profile?.birthTimeUnknown ?? false,
                    birthPlace: profile?.birthPlace ?? null,
                    profileImageUrl: profile?.profileImageUrl ?? null,
                }}
            />
        </div>
    );
}
