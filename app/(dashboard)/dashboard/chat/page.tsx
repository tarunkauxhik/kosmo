import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { ChatGate } from "@/components/chat/ChatGate";
import { ChatInbox } from "@/components/chat/ChatInbox";
import type { ChatCounsellor } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Chats" };

type SP = { counsellor?: string };

export default async function ChatPage({ searchParams }: { searchParams: Promise<SP> }) {
    const { counsellor: slug } = await searchParams;
    const list = await fetchAuthQuery(api.counsellors.list, {});
    const counsellors: ChatCounsellor[] = list.map((c) => ({
        slug: c.slug,
        name: c.name,
        portrait: c.portrait,
        specialties: c.specialties,
        languages: c.languages,
    }));
    const selected = slug ? counsellors.find((c) => c.slug === slug) : undefined;
    const open = Boolean(slug);

    return (
        <div className={cn("lg:flex lg:h-dvh", open && "-mb-20 flex h-dvh lg:mb-0")}>
            <aside
                className={cn("lg:w-80 lg:shrink-0 lg:border-r", open && "hidden lg:block")}
                aria-label="Conversations"
            >
                <ChatInbox counsellors={counsellors} activeSlug={slug} />
            </aside>
            <div className={cn("min-w-0 flex-1", !open && "hidden lg:block")}>
                {selected ? (
                    <ChatGate counsellor={selected} />
                ) : (
                    <Empty className="h-full">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <MessageCircle />
                            </EmptyMedia>
                            <EmptyTitle>{open ? "That astrologer isn't available" : "Pick a conversation"}</EmptyTitle>
                            <EmptyDescription>
                                {open
                                    ? "The link may be out of date. Choose someone from the list instead."
                                    : "Choose someone from the list to continue, or start a new chat."}
                            </EmptyDescription>
                        </EmptyHeader>
                        {open && (
                            <EmptyContent>
                                <Button asChild variant="outline">
                                    <Link href="/dashboard/chat">Back to chats</Link>
                                </Button>
                            </EmptyContent>
                        )}
                    </Empty>
                )}
            </div>
        </div>
    );
}
