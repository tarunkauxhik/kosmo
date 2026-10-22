import { SEED_COUNSELLORS } from "@/lib/constants";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const alt = "AI astrologer persona on Kosmo";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
    return SEED_COUNSELLORS.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const c = SEED_COUNSELLORS.find((p) => p.slug === slug);
    if (!c) return ogImage({ title: "AI astrologer persona", subtitle: "Kosmo" });
    return ogImage({ title: c.name, subtitle: `${c.specialties.join(", ")}. ${c.hometown}`, portrait: c.portrait });
}
