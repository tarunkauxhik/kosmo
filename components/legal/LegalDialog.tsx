"use client";

import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LEGAL_TITLES, LEGAL_UPDATED, LegalContent, type LegalKind } from "./LegalContent";

// Opens legal copy in place (auth screens) with a link to the full page.
export function LegalDialog({ kind, children }: { kind: LegalKind; children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[85dvh] gap-0 p-0 sm:max-w-lg">
                <DialogHeader className="border-b px-6 pt-6 pb-4">
                    <DialogTitle>{LEGAL_TITLES[kind]}</DialogTitle>
                    <DialogDescription>Last updated {LEGAL_UPDATED}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60dvh] overscroll-contain">
                    <div className="px-6 py-5">
                        <LegalContent kind={kind} />
                        <Link
                            href={`/${kind}`}
                            className="mt-6 inline-block text-sm text-brand underline-offset-4 hover:underline"
                        >
                            Open as a page
                        </Link>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
