import { getToken } from "@/lib/auth-server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserSync } from "@/components/UserSync";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Client providers for the signed-in app only, so public pages ship none of this JavaScript.
export async function AppProviders({ children }: { children: React.ReactNode }) {
    const token = await getToken();
    return (
        <ConvexClientProvider initialToken={token}>
            <TooltipProvider delayDuration={400}>
                <UserSync />
                {children}
                <Toaster position="top-center" />
            </TooltipProvider>
        </ConvexClientProvider>
    );
}
