import { EMOJI_SET, emojiPath, type EmojiSet, type UsedEmoji } from "@/lib/emoji";
import { cn } from "@/lib/utils";

type EmojiProps = {
    emoji: UsedEmoji;
    // Accessible name. Omit for decorative emoji next to text that says the same thing.
    label?: string;
    size?: number;
    set?: EmojiSet;
    className?: string;
};

// Renders an emoji as a self-hosted image from one artwork set so it looks the same on
// iOS, Android, Windows and Linux. Files live in public/emoji/<set>/ (see lib/emoji.ts).
export function Emoji({ emoji, label, size = 20, set = EMOJI_SET, className }: EmojiProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element -- tiny static sprites; next/image adds no value here
        <img
            src={emojiPath(emoji, set)}
            alt={label ?? ""}
            {...(label ? {} : { "aria-hidden": true })}
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={cn("inline-block shrink-0 select-none align-[-0.15em]", className)}
        />
    );
}
