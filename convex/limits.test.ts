import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { setup, signIn } from "./test.helpers";

// The Next.js speech routes call limits.consume (through guardRequest) before spending money.
test("limits.consume allows the TTS burst of 12, then asks the caller to wait", async () => {
    const t = setup();
    const asha = await signIn(t, "asha");
    const ravi = await signIn(t, "ravi");

    for (let i = 0; i < 12; i++) {
        expect((await asha.mutation(api.limits.consume, { name: "tts" })).ok).toBe(true);
    }
    const refused = await asha.mutation(api.limits.consume, { name: "tts" });
    expect(refused.ok).toBe(false);
    expect(refused.retryAfter).toBeGreaterThan(0);

    // Limits are per user and per kind.
    expect((await ravi.mutation(api.limits.consume, { name: "tts" })).ok).toBe(true);
    expect((await asha.mutation(api.limits.consume, { name: "stt" })).ok).toBe(true);
});

test("limits.consume needs a session", async () => {
    const t = setup();
    await expect(t.mutation(api.limits.consume, { name: "callStart" })).rejects.toThrow(/Unauthorized/);
});
