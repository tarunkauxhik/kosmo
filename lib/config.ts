// Public origin, used for canonical URLs, Open Graph, the sitemap and JSON-LD.
// Set NEXT_PUBLIC_SITE_URL in production; on Vercel the production domain is used as a fallback.
function siteUrl() {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL;
    if (explicit) return explicit.replace(/\/$/, "");
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (vercel) return `https://${vercel}`;
    return "http://localhost:3000";
}

export const appConfig = {
    name: "Kosmo",
    url: siteUrl(),
    locale: "en_IN",
    themeColor: "#0e0e10",
    description:
        "Call or chat with AI astrologer personas about marriage, health, money and career, in English or Hinglish.",
};
