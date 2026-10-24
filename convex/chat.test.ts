import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { seedCounsellor, setup, signIn, sse } from "./test.helpers";

// Gemini streams a reply in pieces; each event carries the next bit of text.
const geminiReply = (...pieces: string[]) =>
    sse(pieces.map((text) => ({ candidates: [{ content: { parts: [{ text }] } }] })));

beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => geminiReply("Namaste ", "Asha. ", "Saturn is slow but steady.")),
    );
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("chat.send", () => {
    test("streams the reply into one assistant message", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");

        const result = await asha.action(api.chat.send, { counsellorSlug: "devrajit", content: "  Am I stuck?  " });
        expect(result.text).toBe("Namaste Asha. Saturn is slow but steady.");

        const { messages } = await asha.query(api.chat.getSession, { counsellorSlug: "devrajit" });
        expect(messages.map((m) => [m.role, m.content])).toEqual([
            ["user", "Am I stuck?"],
            ["assistant", "Namaste Asha. Saturn is slow but steady."],
        ]);
        expect(messages[1].streaming).toBeUndefined();
    });

    test("falls back to OpenRouter when Gemini is out of quota", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");
        vi.stubGlobal(
            "fetch",
            vi.fn(async (url: string) =>
                url.includes("generativelanguage")
                    ? new Response("quota", { status: 429 })
                    : sse([{ choices: [{ delta: { content: "Haan ji, bataiye." } }] }, "[DONE]"]),
            ),
        );

        const result = await asha.action(api.chat.send, { counsellorSlug: "devrajit", content: "Hello" });
        expect(result.text).toBe("Haan ji, bataiye.");
        const { messages } = await asha.query(api.chat.getSession, { counsellorSlug: "devrajit" });
        expect(messages.map((m) => m.content)).toEqual(["Hello", "Haan ji, bataiye."]);
    });

    test("a failed reply leaves no empty assistant message behind", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response("quota", { status: 429 })),
        );

        // Both providers refuse.
        await expect(asha.action(api.chat.send, { counsellorSlug: "devrajit", content: "Hello" })).rejects.toThrow(
            /Unable to generate a reply/,
        );
        const { messages } = await asha.query(api.chat.getSession, { counsellorSlug: "devrajit" });
        expect(messages.map((m) => m.role)).toEqual(["user"]);
    });

    test("needs a session", async () => {
        const t = setup();
        await seedCounsellor(t);
        await expect(t.action(api.chat.send, { counsellorSlug: "devrajit", content: "Hi" })).rejects.toThrow(
            /Unauthorized/,
        );
    });

    test("is rate limited per user: the 7th quick message is refused", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");
        const ravi = await signIn(t, "ravi");

        for (let i = 0; i < 6; i++) {
            await asha.action(api.chat.send, { counsellorSlug: "devrajit", content: `Question ${i}` });
        }
        await expect(asha.action(api.chat.send, { counsellorSlug: "devrajit", content: "One more" })).rejects.toThrow(
            /RateLimited/,
        );
        // Another user's bucket is separate.
        await expect(ravi.action(api.chat.send, { counsellorSlug: "devrajit", content: "Hi" })).resolves.toBeTruthy();
    });
});

test("users only ever see their own conversations", async () => {
    const t = setup();
    await seedCounsellor(t);
    const asha = await signIn(t, "asha");
    const ravi = await signIn(t, "ravi");
    await asha.action(api.chat.send, { counsellorSlug: "devrajit", content: "Private question" });

    expect((await ravi.query(api.chat.getSession, { counsellorSlug: "devrajit" })).messages).toEqual([]);
    expect(await ravi.query(api.chat.listSessions, {})).toEqual([]);
    expect(await asha.query(api.chat.listSessions, {})).toHaveLength(1);
});
