import { expect, test } from "vitest";
import { safeNext } from "./utils";

// ?next= comes from the URL, so it must never send someone off-site after they sign in.
test("safeNext keeps same-site paths and rejects everything else", () => {
    expect(safeNext("/dashboard/chat?counsellor=devrajit")).toBe("/dashboard/chat?counsellor=devrajit");
    for (const unsafe of [
        null,
        undefined,
        "",
        "https://evil.example",
        "//evil.example",
        "/\\evil.example",
        "dashboard",
    ]) {
        expect(safeNext(unsafe)).toBe("/dashboard");
    }
});
