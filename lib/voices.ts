// Rumik SILK voice selection. Female personas use `muga` (tone-tag steered),
// male personas use `mulberry` (steered by a natural-language description).
// Gender comes from the persona record in Convex, so there is one source of truth.

type VoiceGender = "male" | "female";

export const FEMALE_TONES = ["neutral", "happy", "excited"] as const;

export const MALE_DESCRIPTIONS = [
    "Warm, mature Indian male astrologer voice. Calm, measured pace. Slightly deep and grounded, like an experienced practitioner on a phone call.",
    "Friendly young Indian male astrologer voice. Bright and energetic, enthusiastic but professional. Clear pronunciation.",
    "Wise elder Indian male astrologer voice. Slow and deliberate. Soft warm timbre.",
    "Confident middle-aged Indian male astrologer voice. Clear and direct, friendly but authoritative. Medium pace.",
    "Soft-spoken avuncular Indian male astrologer voice. Comforting, like a trusted family priest. Gentle warm tone.",
];

// Stable hash so a persona keeps the same voice across calls and turns.
export function stablePick<T>(items: readonly T[], seed: string): T {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return items[h % items.length];
}

export function chatVoiceDescription(gender: VoiceGender) {
    const who =
        gender === "male"
            ? "warm, mature male Indian astrology counsellor"
            : "warm, reassuring female Indian astrology counsellor";
    return `${who}, natural Hinglish, calm phone-call voice, clear and empathetic`;
}
