import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

// Shared Open Graph card for opengraph-image.tsx routes. Rendered at build time, in the dark theme.
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const BG = "#0e0e10";
const FG = "#ededef";
const MUTED = "#9b9ba5";
const BRAND = "#9d9dfa";

export async function ogImage({ title, subtitle, portrait }: { title: string; subtitle: string; portrait?: string }) {
    // Satori cannot read woff2, so Geist also ships as two small Latin-only TTF instances.
    const [semibold, regular] = await Promise.all([
        readFile(join(process.cwd(), "app/fonts/Geist-SemiBold.ttf")),
        readFile(join(process.cwd(), "app/fonts/Geist-Regular.ttf")),
    ]);
    // Portraits are WebP, which Satori can't decode, so hand it a PNG at the size it draws.
    const photo = portrait
        ? `data:image/png;base64,${(
              await sharp(join(process.cwd(), "public", portrait))
                  .resize(340, 340)
                  .png()
                  .toBuffer()
          ).toString("base64")}`
        : null;

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: 64,
                padding: "72px 80px",
                fontFamily: "Geist",
                color: FG,
                backgroundImage: "radial-gradient(circle at 88% 12%, rgba(157,157,250,0.2), rgba(14,14,16,0) 60%)",
                backgroundColor: BG,
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <svg width="40" height="40" viewBox="0 0 32 32">
                        <circle cx="15" cy="17" r="9.5" fill="none" stroke={FG} strokeWidth="4" />
                        <circle cx="26.5" cy="5.5" r="3.5" fill={BRAND} />
                    </svg>
                    <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>kosmo</div>
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: "auto",
                        fontSize: title.length > 34 ? 60 : 72,
                        fontWeight: 600,
                        lineHeight: 1.05,
                        letterSpacing: "-0.025em",
                    }}
                >
                    {title}
                </div>
                <div style={{ display: "flex", marginTop: 24, fontSize: 30, lineHeight: 1.4, color: MUTED }}>
                    {subtitle}
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 36,
                        fontSize: 24,
                        color: BRAND,
                    }}
                >
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: BRAND }} />
                    Every astrologer is an AI persona
                </div>
            </div>
            {photo && (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Satori only understands <img>
                <img
                    src={photo}
                    width={340}
                    height={340}
                    style={{ borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)" }}
                />
            )}
        </div>,
        {
            ...ogSize,
            fonts: [
                { name: "Geist", data: semibold, weight: 600, style: "normal" },
                { name: "Geist", data: regular, weight: 400, style: "normal" },
            ],
        },
    );
}
