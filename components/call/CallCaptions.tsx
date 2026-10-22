import { ThinkingOrb } from "thinking-orbs";
import type { CallActivity } from "@/hooks/useVoiceCall";

export function CallCaptions({
    user,
    assistant,
    activity,
    counsellorFirstName,
}: {
    user: string | null;
    assistant: string | null;
    activity: CallActivity;
    counsellorFirstName: string;
}) {
    return (
        <div className="w-full max-w-lg space-y-3 text-left" aria-live="polite">
            {user && (
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-[0.9375rem] leading-relaxed">
                    <span className="sr-only">You: </span>
                    {user}
                </p>
            )}
            {activity === "thinking" ? (
                <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <ThinkingOrb state="working" size={20} aria-hidden />
                    {counsellorFirstName} is thinking…
                </p>
            ) : (
                assistant && (
                    <p className="line-clamp-5 w-fit max-w-[85%] py-1 text-[0.9375rem] leading-relaxed">
                        <span className="sr-only">{counsellorFirstName}: </span>
                        {assistant}
                    </p>
                )
            )}
        </div>
    );
}
