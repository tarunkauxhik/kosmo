import type { NextConfig } from "next";

const origin = (url: string | undefined) => {
    try {
        return url ? new URL(url) : null;
    } catch {
        return null;
    }
};

// Third-party hosts the browser talks to directly. Everything else goes through our own /api routes.
const convex = origin(process.env.NEXT_PUBLIC_CONVEX_URL); // queries, mutations, file storage
const silk = origin(process.env.SILK_BASE_URL ?? "https://silk-api.rumik.ai"); // live TTS websocket (ws_url from /api/voice/silk-mint)

const connectSrc = [
    "'self'",
    convex && `${convex.origin} ${convex.protocol === "http:" ? "ws" : "wss"}://${convex.host}`,
    "wss://api.deepgram.com", // live speech-to-text during calls
    silk && `wss://${silk.host}`,
    "wss://*.rumik.ai",
].filter(Boolean);

// No nonce: a nonce would force every page to render per request and lose static prerendering.
// Inline scripts are Next's own bootstrap; there is no user-generated HTML anywhere in the app.
const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${convex ? ` ${convex.origin}` : ""}`,
    "font-src 'self'",
    "media-src 'self' blob:",
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
    // Dev needs eval for React Refresh, so the CSP only applies to production builds.
    ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
    poweredByHeader: false,
    // `next dev` would otherwise append its own "not the Next.js you know" block to AGENTS.md,
    // which already says the same in its Stack section.
    agentRules: false,
    images: {
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30, // portraits rarely change
    },
    async headers() {
        return [
            { source: "/:path*", headers: securityHeaders },
            {
                // Self-hosted emoji: file names are codepoints inside a per-set folder, so content is stable.
                source: "/emoji/:path*",
                headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
            },
        ];
    },
};

export default nextConfig;
