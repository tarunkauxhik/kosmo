// Downloads the emoji the UI uses (USED_EMOJI) for one artwork set into public/emoji/<set>/.
// Usage: pnpm emoji:fetch [fluent|google|twitter]   (defaults to EMOJI_SET)
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { EMOJI_SET, USED_EMOJI, emojiCdnUrl, emojiPath } from "../lib/emoji.ts";

const set = process.argv[2] ?? EMOJI_SET;

for (const emoji of USED_EMOJI) {
    const res = await fetch(emojiCdnUrl(emoji, set));
    if (!res.ok) throw new Error(`${emoji}: HTTP ${res.status} from ${res.url}`);
    const file = join("public", emojiPath(emoji, set));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    console.log(`${emoji}  ${file}`);
}
