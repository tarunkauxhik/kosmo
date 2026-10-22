import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { PersonaProfile } from "@/components/astrologers/PersonaProfile";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    // noindex comes from the dashboard layout; the indexable copy is /astrologers/[slug].
    return { title: c ? `${c.name} (AI persona)` : "Astrologer" };
}

export default async function PersonaPage({ params }: Props) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();
    return <PersonaProfile c={c} back={{ href: "/dashboard", label: "All astrologers" }} />;
}
