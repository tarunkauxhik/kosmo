import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Convex functions run in a V8 isolate in production; edge-runtime is the closest match.
        environment: "edge-runtime",
        include: ["convex/**/*.test.ts", "lib/**/*.test.ts"],
        server: {
            // These ship TypeScript (and import.meta.glob) that Vitest has to transform itself.
            deps: { inline: ["convex-test", "@convex-dev/rate-limiter", "@convex-dev/batch-worker"] },
        },
    },
});
