// Image-based emoji so every platform shows the same artwork.
// Change EMOJI_SET to switch the look everywhere, then run `pnpm emoji:fetch`
// to download that set's files into public/emoji/<set>/ (they are served from our own origin).
//
// Only sets licensed for use on a public site (Apple's and Meta's artwork are not):
//   fluent    Microsoft Fluent Emoji 3D, MIT. The default: glossy, closest to iOS.
//   google    Noto Color Emoji, Apache 2.0.
//   twitter   Twemoji, CC BY 4.0 (needs an attribution line if used).
export type EmojiSet = "fluent" | "google" | "twitter";

export const EMOJI_SET: EmojiSet = "fluent";

// Every emoji the UI renders. Add here, then run `pnpm emoji:fetch`.
export const USED_EMOJI = ["💍", "💼", "🩺", "💰", "📈", "⚖️", "🙏", "🪔"] as const;
export type UsedEmoji = (typeof USED_EMOJI)[number];

// emoji-datasource-<set> npm packages (google, twitter) on jsDelivr.
// They ship 64px PNGs only, which stay sharp up to ~32px at 2x.
const DATASOURCE_VERSION = "16.0.0";
// @lobehub/fluent-emoji-3d npm package on jsDelivr: codepoint-named WebP files.
const FLUENT_VERSION = "1.1.0";

function emojiCodepoints(emoji: string): string {
    const points: string[] = [];
    for (const char of emoji) {
        const cp = char.codePointAt(0);
        if (cp !== undefined) points.push(cp.toString(16));
    }
    return points.join("-");
}

const ext = (set: EmojiSet) => (set === "fluent" ? "webp" : "png");

// Where `pnpm emoji:fetch` downloads from.
export function emojiCdnUrl(emoji: string, set: EmojiSet): string {
    const code = emojiCodepoints(emoji);
    if (set === "fluent")
        return `https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@${FLUENT_VERSION}/assets/${code}.webp`;
    return `https://cdn.jsdelivr.net/npm/emoji-datasource-${set}@${DATASOURCE_VERSION}/img/${set}/64/${code}.png`;
}

// Path of the self-hosted copy, relative to public/.
export function emojiPath(emoji: string, set: EmojiSet = EMOJI_SET): string {
    return `/emoji/${set}/${emojiCodepoints(emoji)}.${ext(set)}`;
}
