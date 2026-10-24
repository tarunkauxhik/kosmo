import { ConvexError } from "convex/values";

export type LlmMessage = { role: "user" | "assistant"; content: string };

// Receives the reply generated so far (not just the newest piece) each time it grows.
export type OnText = (textSoFar: string) => Promise<void> | void;

// The provider refused before sending any text (rate limit, quota, outage), so another one can still answer.
export class ModelUnavailableError extends ConvexError<string> {
    constructor(status: number) {
        super(`Unable to generate a reply right now (model error ${status}).`);
    }
}

function env(name: string) {
    const value = process.env[name];
    return value && value.trim() ? value.trim() : undefined;
}

// Yields the payload of each `data:` line of a Server-Sent Events response.
async function* sseData(res: Response): AsyncGenerator<string> {
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (line.startsWith("data:")) yield line.slice(5).trim();
        }
    }
}

// Passes the growing text to `write` at most once per `ms`, so a streamed reply reaches the
// database in a handful of mutations rather than one per token. The caller writes the final text itself.
export function throttledWriter(ms: number, write: (text: string) => Promise<unknown>): OnText {
    let lastAt = 0;
    return async (text) => {
        if (Date.now() - lastAt < ms) return;
        lastAt = Date.now();
        await write(text);
    };
}

// Text chat: Google Gemini over REST (no SDK needed in the Convex runtime), streamed.
export async function geminiReply(system: string, history: LlmMessage[], onText: OnText): Promise<string> {
    const apiKey = env("GEMINI_API_KEY") ?? env("GOOGLE_API_KEY");
    if (!apiKey) throw new ConvexError("GEMINI_API_KEY is not set on the Convex deployment.");
    // gemini-2.5-flash returns 404 for newer API projects.
    const model = env("GOOGLE_CHAT_MODEL") ?? "gemini-3.5-flash";

    // Gemini expects the conversation to open with a user turn.
    const firstUser = history.findIndex((m) => m.role === "user");
    const contents = history.slice(Math.max(0, firstUser)).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents,
                // Thinking tokens count against maxOutputTokens and would cut short replies off.
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 360,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            }),
        },
    );
    if (!res.ok) {
        console.error("Gemini request failed", res.status, (await res.text()).slice(0, 300));
        if (res.status === 429 || res.status >= 500) throw new ModelUnavailableError(res.status);
        throw new ConvexError(`Unable to generate a reply right now (model error ${res.status}).`);
    }

    let text = "";
    for await (const data of sseData(res)) {
        const chunk = JSON.parse(data) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const piece = (chunk.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
        if (!piece) continue;
        text += piece;
        await onText(text.trimStart());
    }
    text = text.trim();
    if (!text) throw new ConvexError("The model returned an empty response.");
    return text;
}

// Voice calls: OpenRouter chat completions (OpenAI-compatible), streamed.
export async function openRouterReply(system: string, history: LlmMessage[], onText: OnText): Promise<string> {
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
            stream: true,
        }),
    });
    if (!res.ok) {
        console.error("OpenRouter request failed", res.status, (await res.text()).slice(0, 300));
        throw new ConvexError("Unable to generate a reply right now.");
    }

    let text = "";
    for await (const data of sseData(res)) {
        if (data === "[DONE]") break;
        const chunk = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const piece = chunk.choices?.[0]?.delta?.content ?? "";
        if (!piece) continue;
        text += piece;
        await onText(text.trimStart());
    }
    text = text.trim();
    if (!text) throw new ConvexError("The model returned an empty response.");
    return text;
}
