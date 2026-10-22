import type { Doc } from "../_generated/dataModel";
import type { PromptProfile } from "./users";

type Counsellor = Doc<"counsellors">;

const AI_HONESTY =
    "You are an AI astrology guide in the Kosmo app, playing the persona described here. " +
    "If the client asks whether you are a real person, say plainly that you are an AI persona. " +
    "Never claim real-world credentials, licences or a physical location you can visit.";

const SAFETY =
    "For health, legal, finance or safety topics, be supportive but do not present yourself as a doctor, lawyer or financial adviser, " +
    "and encourage professional help for serious or urgent decisions. " +
    "If the client mentions self-harm or being in danger, gently urge them to contact local emergency services or a crisis helpline right away.";

const HINGLISH_RULES =
    "LANGUAGE (strict): Reply in Hinglish, meaning Hindi written in Roman/Latin script and naturally mixed " +
    "with English words. Do NOT use Devanagari script; write Hindi words phonetically. " +
    "Examples of the right style: 'Namaste beta, kaisi hain aap aaj?', " +
    "'Aap ki marriage ke baare mein guidance chahiye? Pehle apna janma tithi bataiye.', " +
    "'Dekhiye, aapki kundali mein Saturn strong position mein hai, isliye thoda patience rakhna padega.'. " +
    "Keep it warm, casual and conversational, like an elder counsellor on a phone call.";

export function computeAge(birthDate?: string | null): number | null {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
    return age >= 0 ? age : null;
}

function pickSalutation(age: number | null, gender?: "male" | "female" | null): string {
    if (age === null || age < 25) return "beta";
    if (age < 40) return gender === "female" ? "behen" : "bhai";
    if (age < 60) return "ji";
    return gender === "female" ? "auntyji" : "uncleji";
}

export function firstName(profile: PromptProfile | null) {
    return (profile?.displayName ?? "").trim().split(/\s+/)[0] ?? "";
}

function clientBlock(profile: PromptProfile | null): string {
    if (!profile) {
        return "If birth details are missing, ask for name, date of birth and birth place before giving a detailed reading.";
    }
    const age = computeAge(profile.birthDate);
    const lines: string[] = ["CLIENT DETAILS (use these naturally, do not list them back):"];
    if (profile.displayName) lines.push(`- Name: ${profile.displayName}`);
    if (profile.gender) lines.push(`- Gender: ${profile.gender}`);
    if (profile.birthDate) lines.push(`- Date of birth: ${profile.birthDate}${age !== null ? ` (age ${age})` : ""}`);
    if (profile.birthTimeUnknown) {
        lines.push("- Time of birth: unknown (the client doesn't remember; work without it)");
    } else if (profile.birthTime) {
        lines.push(`- Time of birth: ${profile.birthTime}`);
    }
    if (profile.birthPlace) lines.push(`- Place of birth: ${profile.birthPlace}`);
    lines.push(
        `SALUTATION: Address the client as "${pickSalutation(age, profile.gender)}" (age-appropriate). ` +
            "Do NOT ask for their name or date, time or place of birth again unless they want a more precise reading. " +
            "Use their first name when you greet them.",
    );
    return lines.join("\n");
}

function personaBlock(c: Counsellor): string {
    const specialties = c.specialties.join(", ") || "astrology";
    const parts = [
        `You are ${c.name}, an AI persona of an Indian astrology counsellor. You specialise in ${specialties}.`,
    ];
    if (c.hometown || c.region) {
        parts.push(
            `Your persona's background: ${[c.hometown, c.region && `(${c.region})`].filter(Boolean).join(" ")}.`,
        );
    }
    if (c.tagline) parts.push(`Your public tagline: "${c.tagline}".`);
    if (c.signature) {
        parts.push(
            `SIGNATURE PHRASE: slip this in once per conversation when it fits naturally: "${c.signature}". Do not force it.`,
        );
    }
    let block = parts.join(" ");
    if (c.personaPrompt) block += `\n\nPERSONA (this is the voice you must speak in):\n${c.personaPrompt}`;
    return block;
}

export function chatSystemPrompt(c: Counsellor, profile: PromptProfile | null): string {
    return [
        personaBlock(c),
        AI_HONESTY,
        `You speak ${c.languages.join(", ") || "English and Hinglish"}. You are chatting with a client who wants personal guidance.`,
        "Keep replies warm, grounded and conversational, like a short WhatsApp voice note: 1-2 short spoken sentences by default.",
        "Ask one focused clarifying question when you need context or the exact worry.",
        "Do not use markdown, bullet lists, emojis or stage directions. Do not include TTS tags like [happy] or <laugh>.",
        SAFETY,
        clientBlock(profile),
    ].join("\n\n");
}

export function voiceSystemPrompt(c: Counsellor, profile: PromptProfile | null): string {
    return [
        personaBlock(c),
        AI_HONESTY,
        "You are on a live voice call with a client who has come for guidance on a personal matter. " +
            "Speak warmly and unhurriedly. Keep replies short (1-3 sentences); this is a voice conversation, not an essay. " +
            "Avoid emojis, lists or any formatting that doesn't speak naturally. " +
            "If the client asks for a reading, ask about the specific worry first. Greet the client by introducing yourself by name.",
        SAFETY,
        clientBlock(profile),
        HINGLISH_RULES,
    ].join("\n\n");
}

export function voiceKickoff(profile: PromptProfile | null): string {
    const name = firstName(profile);
    return name
        ? `Greet ${name} warmly using the salutation rule, introduce yourself, and ask kya guidance chahiye aaj.`
        : "Greet the client warmly, introduce yourself, and ask kya guidance chahiye aaj.";
}
