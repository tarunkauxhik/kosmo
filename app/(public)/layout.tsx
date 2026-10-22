import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

// Public pages are prerendered: nothing here reads cookies or headers.
export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}
