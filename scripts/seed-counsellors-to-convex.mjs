// Upserts the AI personas from lib/constants.ts into the Convex `counsellors` table.
// Usage: pnpm seed          (dev deployment)
//        pnpm seed --prod   (production deployment)
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["convex", "run", ...process.argv.slice(2), "counsellors:seed"], {
    stdio: "inherit",
    shell: process.platform === "win32",
});

if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
