import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { ClientAuthBoundary } from "@/lib/auth-client";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { MobileTopBar } from "@/components/shell/MobileTopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { HideOnFocused } from "@/components/shell/HideOnFocused";
import { AppProviders } from "@/components/AppProviders";
import { noIndex } from "@/lib/seo";

// The signed-in app is private: never indexed.
export const metadata: Metadata = { title: "Astrologers", ...noIndex };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    if (!(await isAuthenticated())) redirect("/sign-in");
    const [profile, authUser] = await Promise.all([
        fetchAuthQuery(api.user.getProfile, {}),
        fetchAuthQuery(api.auth.getCurrentUser),
    ]);
    const name = profile?.displayName ?? authUser?.name ?? "You";
    const imageUrl = profile?.profileImageUrl ?? null;

    return (
        <AppProviders>
            <ClientAuthBoundary>
                <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <div className="hidden border-r border-sidebar-border bg-sidebar lg:block">
                        <AppSidebar name={name} imageUrl={imageUrl} />
                    </div>
                    <div className="min-w-0">
                        <Suspense fallback={<MobileTopBar name={name} imageUrl={imageUrl} />}>
                            <HideOnFocused>
                                <MobileTopBar name={name} imageUrl={imageUrl} />
                            </HideOnFocused>
                        </Suspense>
                        <main id="main" className="min-h-[calc(100dvh-3.5rem)] pb-20 lg:min-h-dvh lg:pb-0">
                            {children}
                        </main>
                    </div>
                </div>
                <Suspense>
                    <BottomNav />
                </Suspense>
            </ClientAuthBoundary>
        </AppProviders>
    );
}
