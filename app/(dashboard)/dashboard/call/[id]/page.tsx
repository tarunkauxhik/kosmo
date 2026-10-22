import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { CallGate } from "@/components/call/CallGate";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    return { title: c ? `Call with ${c.name}` : "Call" };
}

export default async function CallPage({ params }: Params) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();

    return (
        <div className="-mb-20 h-dvh lg:mb-0">
            <CallGate counsellor={{ slug: c.slug, name: c.name, portrait: c.portrait, hometown: c.hometown ?? null }} />
        </div>
    );
}
