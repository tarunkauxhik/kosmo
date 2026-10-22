import type { Metadata } from "next";
import Link from "next/link";
import { Emoji } from "@/components/Emoji";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export const metadata: Metadata = { title: "Remedies" };

export default function RemediesPage() {
    return (
        <div className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-10">
            <PageHeader
                title="Remedies"
                description="Simple practices suggested in your conversations."
                className="mb-6"
            />
            <Empty className="rounded-2xl bg-muted/50 py-14">
                <EmptyHeader>
                    <EmptyMedia>
                        <Emoji emoji="🪔" size={40} />
                    </EmptyMedia>
                    <EmptyTitle>Not available yet</EmptyTitle>
                    <EmptyDescription>
                        We&rsquo;re building a place to keep the remedies your astrologers suggest, like mantras,
                        fasting days and gemstones. Until then, ask for them in a chat.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button asChild>
                        <Link href="/dashboard/chat">Open chats</Link>
                    </Button>
                </EmptyContent>
            </Empty>
        </div>
    );
}
