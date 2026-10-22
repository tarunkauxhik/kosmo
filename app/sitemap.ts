import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";
import { SEED_COUNSELLORS } from "@/lib/constants";
import { LEGAL_UPDATED_ISO } from "@/components/legal/LegalContent";

// Bump when the landing page or persona copy changes in a meaningful way.
const CONTENT_UPDATED = "2026-10-22";

export default function sitemap(): MetadataRoute.Sitemap {
    const url = (path: string) => `${appConfig.url}${path}`;
    return [
        { url: url("/"), lastModified: CONTENT_UPDATED },
        { url: url("/astrologers"), lastModified: CONTENT_UPDATED },
        ...SEED_COUNSELLORS.map((c) => ({
            url: url(`/astrologers/${c.slug}`),
            lastModified: CONTENT_UPDATED,
            images: [url(c.portrait)],
        })),
        ...["/about", "/terms", "/privacy"].map((path) => ({ url: url(path), lastModified: LEGAL_UPDATED_ISO })),
    ];
}
