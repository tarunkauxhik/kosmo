import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { STALE_CALL_MS } from "./calls";
import { seedCounsellor, setup, signIn, sse } from "./test.helpers";

beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    // OpenRouter streams OpenAI-style deltas and ends with [DONE].
    vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
            sse([
                { choices: [{ delta: { content: "Namaste Asha behen. " } }] },
                { choices: [{ delta: { content: "Kya guidance chahiye?" } }] },
                "[DONE]",
            ]),
        ),
    );
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("calls", () => {
    test("start needs a session and a known counsellor", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");

        await expect(t.mutation(api.calls.start, { counsellorSlug: "devrajit" })).rejects.toThrow(/Unauthorized/);
        await expect(asha.mutation(api.calls.start, { counsellorSlug: "nobody" })).rejects.toThrow(/not found/);
        await expect(asha.mutation(api.calls.start, { counsellorSlug: "devrajit" })).resolves.toBeTruthy();
    });

    test("users can't read, follow or end someone else's call", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");
        const ravi = await signIn(t, "ravi");
        const callId = await asha.mutation(api.calls.start, { counsellorSlug: "devrajit" });

        expect(await ravi.query(api.calls.getMine, { callId })).toBeNull();
        expect(await ravi.query(api.calls.liveReply, { callId, turnKey: "k" })).toBeNull();
        await ravi.mutation(api.calls.end, { callId });
        expect((await asha.query(api.calls.getMine, { callId }))?.call.endedAt).toBeUndefined();

        await asha.mutation(api.calls.end, { callId });
        expect((await asha.query(api.calls.getMine, { callId }))?.call.endedAt).toEqual(expect.any(Number));
    });

    test("respond streams the reply into a bot turn the caller can follow", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");
        const callId = await asha.mutation(api.calls.start, { counsellorSlug: "devrajit" });

        const { reply } = await asha.action(api.calls.respond, { callId, kickoff: true, turnKey: "turn-1" });
        expect(reply).toBe("Namaste Asha behen. Kya guidance chahiye?");
        expect(await asha.query(api.calls.liveReply, { callId, turnKey: "turn-1" })).toEqual({
            text: reply,
            streaming: false,
        });
        // The kickoff instruction is never stored as something the caller said.
        const turns = (await asha.query(api.calls.getMine, { callId }))?.turns ?? [];
        expect(turns.map((turn) => turn.role)).toEqual(["bot"]);
    });

    test("respond refuses a call that has ended", async () => {
        const t = setup();
        await seedCounsellor(t);
        const asha = await signIn(t, "asha");
        const callId = await asha.mutation(api.calls.start, { counsellorSlug: "devrajit" });
        await asha.mutation(api.calls.end, { callId });

        await expect(asha.action(api.calls.respond, { callId, text: "Hello?" })).rejects.toThrow(/Call has ended/);
    });
});

test("endStale ends abandoned calls as of their last turn and leaves live ones alone", async () => {
    const t = setup();
    await seedCounsellor(t);
    const asha = await signIn(t, "asha");
    const now = Date.now();
    const minute = 60_000;

    const ids = await t.run(async (ctx) => {
        const user = (await ctx.db.query("users").first())!;
        const call = (startedAt: number, endedAt?: number) =>
            ctx.db.insert("calls", {
                userId: user._id,
                counsellorSlug: "devrajit",
                counsellorName: "Pt. Devrajit Sharma",
                counsellorPortrait: "/portraits/devrajit.webp",
                startedAt,
                endedAt,
            });
        const abandoned = await call(now - 30 * minute);
        await ctx.db.insert("callTurns", { callId: abandoned, role: "user", text: "Hi", ts: now - 20 * minute });
        const live = await call(now - 30 * minute);
        await ctx.db.insert("callTurns", { callId: live, role: "bot", text: "Haan ji", ts: now - minute });
        const justStarted = await call(now - 2 * minute);
        const neverSpoke = await call(now - STALE_CALL_MS - minute);
        const alreadyEnded = await call(now - 60 * minute, now - 50 * minute);
        return { abandoned, live, justStarted, neverSpoke, alreadyEnded };
    });

    expect(await t.mutation(internal.calls.endStale, {})).toBe(2);

    const get = (callId: (typeof ids)[keyof typeof ids]) =>
        asha.query(api.calls.getMine, { callId }).then((r) => r!.call);
    const abandoned = await get(ids.abandoned);
    expect(abandoned.endedAt).toBe(now - 20 * minute); // last activity, not the time of the sweep
    expect(abandoned.durationSec).toBe(10 * 60);
    expect((await get(ids.neverSpoke)).durationSec).toBe(0);
    expect((await get(ids.live)).endedAt).toBeUndefined();
    expect((await get(ids.justStarted)).endedAt).toBeUndefined();
    expect((await get(ids.alreadyEnded)).endedAt).toBe(now - 50 * minute);
});
