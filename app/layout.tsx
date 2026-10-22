import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

// Self-hosted so builds never fetch Google Fonts. License: app/fonts/OFL-geist.txt.
// Geist, variable, instanced to weights 400-600 and subset to Latin (17 KB).
const geist = localFont({
    src: "./fonts/Geist-Variable.woff2",
    weight: "400 600",
    variable: "--font-geist",
    display: "swap",
    adjustFontFallback: "Arial",
});

// Runs before first paint: applies the saved theme, or the system one, so there is no flash.
// Kept tiny and inline (allowed by the CSP's script-src 'unsafe-inline'). See lib/theme.ts.
const themeScript = `try{var t=localStorage.getItem("theme"),d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches),r=document.documentElement;r.classList.toggle("dark",d)}catch(e){}`;

export const metadata: Metadata = {
    metadataBase: new URL(appConfig.url),
    title: { default: `${appConfig.name}: talk to an AI astrologer`, template: `%s | ${appConfig.name}` },
    description: appConfig.description,
    applicationName: appConfig.name,
    // Defaults only. Canonical URLs are set per page (lib/seo.ts) so no page inherits the home page's.
    openGraph: { type: "website", siteName: appConfig.name, locale: appConfig.locale },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: appConfig.themeColor },
    ],
    colorScheme: "light dark",
};

// Kept free of request-time APIs so public pages can be prerendered.
// Signed-in providers (Convex, auth, toasts) live in app/(dashboard)/layout.tsx.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en-IN" className={cn("h-full", geist.variable)} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="min-h-full">
                <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
                >
                    Skip to content
                </a>
                {children}
                {/* Cookieless; scripts and beacons use /_vercel/* on this origin, so the CSP's 'self' covers them. */}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
