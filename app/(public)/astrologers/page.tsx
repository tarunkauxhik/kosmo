import { AstrologerCard } from "@/components/astrologers/AstrologerCard";
import { appConfig } from "@/lib/config";
import { SEED_COUNSELLORS } from "@/lib/constants";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
    title: "AI astrologer personas",
    description: `Meet all ${SEED_COUNSELLORS.length} Kosmo astrologers: AI personas trained on Vedic jyotish, KP, tarot, numerology and more. Call or chat in English or Hinglish.`,
    path: "/astrologers",
});

const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Kosmo AI astrologer personas",
    url: `${appConfig.url}/astrologers`,
    isPartOf: { "@id": `${appConfig.url}/#website` },
    mainEntity: {
        "@type": "ItemList",
        numberOfItems: SEED_COUNSELLORS.length,
        itemListElement: SEED_COUNSELLORS.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${c.name} (AI persona)`,
            url: `${appConfig.url}/astrologers/${c.slug}`,
        })),
    },
};

export default function PublicAstrologersPage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The astrologers</h1>
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-muted-foreground">
                {SEED_COUNSELLORS.length} personas, each with its own tradition, region and way of speaking. Every one
                of them is an AI, not a real astrologer.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {SEED_COUNSELLORS.map((c, i) => (
                    <li key={c.slug} className="flex [&>article]:flex-1">
                        <AstrologerCard c={c} href={`/astrologers/${c.slug}`} eager={i < 2} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
