import Link from "next/link";
import { ArrowLeft, Phone, Volume2, VolumeX } from "lucide-react";
import { AiBadge } from "@/components/AiBadge";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ChatCounsellor } from "./types";

export function ChatHeader({
    counsellor,
    spokenReplies,
    onToggleSpoken,
}: {
    counsellor: ChatCounsellor;
    spokenReplies: boolean;
    onToggleSpoken: () => void;
}) {
    return (
        <header className="flex shrink-0 items-center gap-3 border-b bg-background/85 px-3 py-2.5 backdrop-blur-md sm:px-5">
            <Button asChild variant="ghost" size="icon-sm" className="lg:hidden">
                <Link href="/dashboard/chat" aria-label="Back to chats">
                    <ArrowLeft />
                </Link>
            </Button>
            <Link
                href={`/dashboard/counsellor/${counsellor.slug}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg"
            >
                <PersonaAvatar src={counsellor.portrait} name={counsellor.name} size={40} />
                <span className="min-w-0">
                    <span className="block truncate font-medium">{counsellor.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                        {counsellor.specialties.join(", ")}
                    </span>
                </span>
            </Link>
            <AiBadge className="hidden sm:inline-flex" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSpoken}
                        aria-pressed={spokenReplies}
                        aria-label={spokenReplies ? "Spoken replies on" : "Spoken replies off"}
                        className={spokenReplies ? "text-foreground" : "text-muted-foreground"}
                    >
                        {spokenReplies ? <Volume2 /> : <VolumeX />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{spokenReplies ? "Replies are read aloud" : "Replies are silent"}</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button asChild variant="outline" size="icon">
                        <Link href={`/dashboard/call/${counsellor.slug}`} aria-label={`Call ${counsellor.name}`}>
                            <Phone />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Switch to a voice call</TooltipContent>
            </Tooltip>
        </header>
    );
}
