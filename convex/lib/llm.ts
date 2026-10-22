import { ConvexError } from "convex/values";

export type LlmMessage = { role: "user" | "assistant"; content: string };

function env(name: string) {
    const value = process.env[name];
    return value && value.trim() ? value.trim() : undefined;
}

// Text chat: Google Gemini over REST (no SDK needed in the Convex runtime).
export async function geminiReply(system: string, history: LlmMessage[]): Promise<string> {
    const apiKey = env("GEMINI_API_KEY") ?? env("GOOGLE_API_KEY");
    if (!apiKey) throw new ConvexError("GEMINI_API_KEY is not set on the Convex deployment.");
    const model = env("GOOGLE_CHAT_MODEL") ?? "gemini-2.5-flash";

    // Gemini expects the conversation to open with a user turn.
    const firstUser = history.findIndex((m) => m.role === "user");
    const contents = history.slice(Math.max(0, firstUser)).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents,
                generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 360 },
            }),
        },
    );
    if (!res.ok) {
        console.error("Gemini request failed", res.status, (await res.text()).slice(0, 300));
        throw new ConvexError("Unable to generate a reply right now.");
    }
    const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();
    if (!text) throw new ConvexError("The model returned an empty response.");
    return text;
}

// Voice calls: OpenRouter chat completions (OpenAI-compatible).
export async function openRouterReply(system: string, history: LlmMessage[]): Promise<string> {
    const apiKey = env("OPENROUTER_API_KEY");
    if (!apiKey) throw new ConvexError("OPENROUTER_API_KEY is not set on the Convex deployment.");
    const model = env("OPENROUTER_MODEL") ?? "google/gemini-3.1-flash-lite-preview";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, ...history],
            temperature: 0.7,
            max_tokens: 256,
        }),
    });
    if (!res.ok) {
        console.error("OpenRouter request failed", res.status, (await res.text()).slice(0, 300));
        throw new ConvexError("Unable to generate a reply right now.");
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) throw new ConvexError("The model returned an empty response.");
    return reply;
}
