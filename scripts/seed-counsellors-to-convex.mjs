// Upserts the AI personas from lib/constants.ts into the Convex `counsellors` table.
// Usage: pnpm seed:counsellors            (dev deployment)
//        pnpm seed:counsellors --prod     (production deployment)
import { spawnSync } from "node:child_process";
import { SEED_COUNSELLORS } from "../lib/constants.ts";

const payload = JSON.stringify({ records: SEED_COUNSELLORS });
const extra = process.argv.slice(2);

const result = spawnSync("npx", ["convex", "run", ...extra, "counsellors:seed", payload], {
    stdio: "inherit",
});

process.exit(result.status ?? 1);
