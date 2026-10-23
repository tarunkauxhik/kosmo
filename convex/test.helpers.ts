/// <reference types="vite/client" />
// Shared setup for the Convex tests. The extra dot in the file name keeps Convex from deploying it.
import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { SEED_COUNSELLORS } from "../lib/constants";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

export function setup() {
    const t = convexTest(schema, modules);
    rateLimiter.register(t);
    return t;
}

export type TestConvex = ReturnType<typeof setup>;

// A signed-in user with an app `users` row, as after sign-up and `user.ensureUser`.
export async function signIn(t: TestConvex, name: string) {
    const subject = `auth-${name}`;
    await t.run((ctx) =>
        ctx.db.insert("users", { name, email: `${name}@example.com`, authId: subject, createdAt: Date.now() }),
    );
    return t.withIdentity({ subject, tokenIdentifier: `test|${subject}`, name });
}

export async function seedCounsellor(t: TestConvex, slug = "devrajit") {
    const persona = SEED_COUNSELLORS.find((c) => c.slug === slug);
    if (!persona) throw new Error(`No persona ${slug}`);
    await t.run((ctx) => ctx.db.insert("counsellors", persona));
    return persona;
}

// A server-sent events response, the shape both Gemini and OpenRouter stream replies in.
export function sse(events: unknown[]) {
    const body = events.map((e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\n\n`).join("");
    return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}
