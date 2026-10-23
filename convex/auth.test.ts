import { expect, test } from "vitest";
import { api } from "./_generated/api";
import { seedCounsellor, setup, signIn } from "./test.helpers";

test("signed-in-only queries refuse callers without a session", async () => {
    const t = setup();
    await seedCounsellor(t);

    await expect(t.query(api.counsellors.list, {})).rejects.toThrow(/Unauthorized/);
    await expect(t.query(api.counsellors.getBySlug, { slug: "devrajit" })).rejects.toThrow(/Unauthorized/);
    await expect(t.query(api.chat.getSession, { counsellorSlug: "devrajit" })).rejects.toThrow(/Unauthorized/);
    await expect(t.mutation(api.user.generateProfileUploadUrl, {})).rejects.toThrow(/Unauthorized/);
    // Lists answer an anonymous caller with nothing rather than an error.
    expect(await t.query(api.calls.listMine, {})).toEqual([]);
    expect(await t.query(api.user.getProfile, {})).toBeNull();
});

const profile = {
    displayName: "Asha",
    gender: "female" as const,
    birthDate: "1994-03-12",
    birthTime: "06:30",
    birthTimeUnknown: false,
    birthPlace: "Jaipur, India",
};

test("saveProfile only accepts a photo that is an image nobody else has claimed", async () => {
    const t = setup();
    const asha = await signIn(t, "asha");
    const ravi = await signIn(t, "ravi");
    const [photo, notAnImage] = await t.run(async (ctx) => [
        await ctx.storage.store(new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })),
        await ctx.storage.store(new Blob(["hello"], { type: "text/plain" })),
    ]);

    await asha.mutation(api.user.saveProfile, { ...profile, profileImageStorageId: photo });
    expect((await asha.query(api.user.getProfile, {}))?.onboarded).toBe(true);

    // Ravi can't attach (and later delete) Asha's photo, or pass off a non-image as one.
    await expect(
        ravi.mutation(api.user.saveProfile, { ...profile, displayName: "Ravi", profileImageStorageId: photo }),
    ).rejects.toThrow(/couldn't be used/);
    await expect(
        ravi.mutation(api.user.saveProfile, { ...profile, displayName: "Ravi", profileImageStorageId: notAnImage }),
    ).rejects.toThrow(/couldn't be used/);
});
