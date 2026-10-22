import type { Metadata } from "next";
import { appConfig } from "./config";

// Metadata for an indexable public page: title, description, canonical URL, Open Graph and X card.
// Relative paths resolve against metadataBase (appConfig.url) set in the root layout.
// The image is the site card (app/opengraph-image.tsx). Pass `ownImage` for a route with its own
// opengraph-image file: an explicit image here would override that file.
const SITE_CARD = [
    {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${appConfig.name}: talk through your chart with an AI astrologer`,
    },
];

export function pageMetadata({
    title,
    description = appConfig.description,
    path,
    ownImage = false,
}: {
    title?: string;
    description?: string;
    path: string;
    ownImage?: boolean;
}): Metadata {
    // Leave the key out entirely for ownImage: even `images: undefined` hides the route's file.
    const image = ownImage ? {} : { images: SITE_CARD };
    const ogTitle = title ? `${title} | ${appConfig.name}` : `${appConfig.name}: talk to an AI astrologer`;
    return {
        ...(title && { title }),
        description,
        alternates: { canonical: path },
        openGraph: {
            title: ogTitle,
            description,
            url: path,
            type: "website",
            siteName: appConfig.name,
            locale: appConfig.locale,
            ...image,
        },
        twitter: { card: "summary_large_image", title: ogTitle, description, ...image },
    };
}

// For signed-in and form-only screens: keep them out of search results.
export const noIndex: Metadata = { robots: { index: false, follow: false } };

// Serialises JSON-LD for a <script> tag; escapes "<" so content can't close the tag.
export function jsonLd(data: object) {
    return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
