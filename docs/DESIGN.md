# Kosmo design notes

## Direction: a calm AI product

Kosmo is used in the evening, often on a phone, by people with something on their mind. The interface should feel like a well-made AI product (think ChatGPT, Claude, Linear, Vercel): near-neutral surfaces, one restrained iris accent, plenty of room and nothing flashing. The personas and the conversation carry the personality; the chrome stays out of the way. The only cosmic touch is a faint dot star field with a soft iris glow behind the landing hero and the auth screens, and the moon in the logo.

What we avoid on purpose: purple-to-blue gradients, glass cards, starfield wallpaper, emoji used as decoration, all-caps eyebrow labels, a single coloured word in a headline, and "AI" sparkle iconography.

## Colour

Light and dark themes. The theme follows the system preference until the user picks one with the three-way toggle (system, light, dark) in the sidebar, the site footer and on the profile page. The choice is stored in `localStorage.theme`; a tiny inline script in `app/layout.tsx` applies the `.dark` class before first paint, so there is no flash. `lib/theme.ts` holds the store (`useThemePref`, `useResolvedTheme`) and `components/ThemeToggle.tsx` is the control. Transitions are switched off for one frame while the theme changes.

Tokens are the standard shadcn variables in `app/globals.css`, so every shadcn component picks them up.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#ffffff` | `#0e0e10` | Page |
| `--card` | `#ffffff` | `#151518` | Cards, panels, composer |
| `--foreground` | `#131316` | `#ededef` | Body text |
| `--primary` | `#131316` | `#ededef` | Primary buttons (inverted ink, not a colour) |
| `--secondary` / `--muted` | `#f4f4f5` | `#1c1c20` | User bubbles, chips, quiet fills |
| `--muted-foreground` | `#5f5f69` | `#9b9ba5` | Secondary text (AA on both backgrounds) |
| `--accent` | `#f0f0f2` | `#222227` | Hover fills |
| `--brand` / `--ring` | `#5b5bd6` | `#9d9dfa` / `#8484f2` | The one accent: links, focus rings, the "AI persona" badge, the logo moon |
| `--success` | `#137a3a` | `#3fb950` | Live-call dot and timer |
| `--destructive` | `#d93036` | `#ff6166` | Errors. The End call button is always `#d93036` so white text passes in both themes |
| `--border` / `--input` | `#e6e6e9` / `#dcdce0` | `#2a2a2f` / `#33333a` | Hairlines and field borders |

Rules: primary actions are ink (black in light, near-white in dark), never the accent. Iris appears in small doses: links, focus, the AI badge, the brand moon. Elevation is a soft shadow (`shadow-surface`, `shadow-surface-hover`, `shadow-raised`) that includes a 1px hairline ring; borders are only for structure (dividers, inputs).

## Type

- **Geist** (variable, weights 400–600, `font-sans`) for everything. Self-hosted from `app/fonts/Geist-Variable.woff2`, subset to Latin plus the punctuation and symbols we use (₹, arrows, curly quotes), about 17KB. Size-adjusted Arial fallback, so swapping causes no layout shift.
- Headings are semibold with tight tracking (-0.02em to -0.035em on the hero). Labels and card titles are medium. No second display face and no mono.
- `Geist-SemiBold.ttf` and `Geist-Regular.ttf` (Latin-only, about 16KB each) are only for the generated Open Graph images, because Satori can't read woff2.
- Licence: SIL Open Font License 1.1 (`app/fonts/OFL-geist.txt`).
- To add glyphs, rebuild the woff2 from the `geist` npm package's variable font with fonttools, for example:
  `uvx --from fonttools[woff] fonttools varLib.instancer Geist-Variable.ttf wght=400:600 -o /tmp/g.ttf` then
  `uvx --from fonttools[woff] pyftsubset /tmp/g.ttf --flavor=woff2 --layout-features=kern,liga,calt,tnum,case,ccmp,locl --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2032-2033,U+20B9,U+2192,U+2212,<new ranges>" --output-file=app/fonts/Geist-Variable.woff2`

Scale (rem): 0.75 meta, 0.875 secondary, 0.9375 chat text, 1 body and inputs (16px, so iOS never zooms), 1.5–1.75 page titles, 2.5–3.75 hero. Headings use `text-wrap: balance`, paragraphs `pretty`. Times, durations and counts use `tabular-nums`.

## Space, shape, layout

- 4px grid. Page gutters 20px on phones, 32px on desktop. Content max width 72rem; reading pages (calls, transcript, profile, remedies) 48rem.
- Radius scale in px: 6, 8, 10, 14, 18, 24, 32. Radii are concentric: an outer radius equals the inner radius plus the padding (the landing preview frame is 24px around an 18px card with 8px padding; dialogs are 18px with 24px padding and their footers follow the same curve).
- Hit targets at least 40px, 44px on primary mobile controls; small icon buttons get an invisible enlarged hit area.
- Optical alignment: buttons with a trailing arrow get less right padding; back links are pulled left so the arrow, not the box, lines up with the content.
- App shell: a 15rem sidebar from `lg`; below that a 56px top bar and a 64px bottom tab bar, both with a blurred translucent background. Both bars hide inside an open chat or a live call.
- Images (portraits) carry a 1px outline at 10% black or white so they sit cleanly on any surface.

## Motion

- Fast and quiet. UI transitions are 150–250ms on `--ease-out-strong` (`cubic-bezier(0.23, 1, 0.32, 1)`); only transform, opacity, colour and shadow are transitioned, never `all`.
- Buttons and chips scale to 0.96 while pressed (`.pressable` and the button primitive).
- Landing and auth content enters once with a short rise, blur and fade (`.animate-enter`, 240ms, no delay or stagger, so nothing waits to appear). The hero headline is not animated because it is the LCP element.
- No visible scrollbars anywhere (global rule in `app/globals.css`); scroll areas still work with wheel, touch and keyboard.
- The password visibility icon cross-fades (opacity, scale 0.25 to 1, 4px blur). Dialogs fade and scale from 0.95, never from 0. New chat replies rise in.
- "Thinking" states in chat and call captions use a small canvas orb from thinking-orbs. The call orb glows with live microphone level via a `--level` CSS variable written outside React renders.
- `prefers-reduced-motion`: animations collapse to near-instant fades, press scaling is off, and the orbs render a still frame.

## Components

shadcn/ui (radix-nova style, restyled to the tokens above) in `components/ui`: button, input, label, dialog, alert-dialog, alert, avatar, badge, checkbox, radio-group, progress, skeleton, spinner, empty, sonner, tooltip. Feature components are grouped by flow: `astrologers/`, `chat/`, `call/`, `profile/`, `onboarding/`, `legal/`, `shell/`, `site/`, `brand/`. `components/ThemeToggle.tsx` is shared by the shell, the site footer and the profile page.

States every data screen must have: a skeleton shaped like the real content, an empty state that says what to do next, an inline error with a retry, and a disabled-with-spinner state for buttons that keeps the label.

## AI disclosure

Every persona is labelled "AI persona" (iris badge; its `title` explains that replies are generated) on cards, the profile, chat and call screens. Portrait alt text says "AI-generated portrait". The landing page, footer, sidebar, chat composer and persona page each say plainly that replies are generated and are not medical, legal or financial advice.

## Emoji

Used sparingly: topic chips (💍 💼 🩺 💰 📈 ⚖️), the onboarding welcome (🙏) and the remedies placeholder (🪔). `components/Emoji.tsx` renders them as self-hosted images (`public/emoji/<set>/`) from one artwork set chosen by `EMOJI_SET` in `lib/emoji.ts` (`apple`, `twitter`, `google`, `fluent`, `facebook`); the list of emoji in use is `USED_EMOJI` there, and `pnpm emoji:fetch` downloads them. Decorative emoji are `aria-hidden`; pass `label` when the emoji carries meaning.

Licensing: the default `apple` set is Apple's artwork and is not licensed for use outside Apple platforms. Switch to `twitter` (CC BY 4.0, credit Twitter), `google` (Apache 2.0) or `fluent` (MIT) before a public launch.

## Brand

The mark is a ring with a small moon at its upper right (`components/brand/Logo.tsx`): the ring uses `currentColor`, the moon the brand iris. `app/icon.svg` is the favicon; it switches ink colour with `prefers-color-scheme` so it reads at 16px on light and dark browser chrome. `app/icon.png` (512) and `app/apple-icon.png` (180) are the same mark on a dark tile. Open Graph cards (`lib/og.tsx`) use the dark palette, Geist and the same mark.

## Borrowed code, rules and sources

Only code published for reuse was taken, and only one package was added.

| What | Where it is used | Source | Licence |
| --- | --- | --- | --- |
| `thinking-orbs` 0.3.2 (npm, by Jakub Antalik) | `ThinkingBubble` in chat and the thinking state of call captions | https://libraries.dev/orbs, https://github.com/Jakubantalik/Libraries.dev | MIT |
| Interface detail rules: concentric radii, optical alignment, shadows over borders, 0.96 press scale, icon cross-fade values, tabular numbers, image outlines, 40px+ hit areas | Throughout (`globals.css`, button, PasswordInput, landing preview) | https://jakub.kr/writing/details-that-make-interfaces-feel-better and the `make-interfaces-feel-better` skill at https://jakub.kr/skills | MIT (skill) |
| Motion rules: strong ease-out curve, sub-300ms UI motion, never animate from scale 0, hover gated to hover-capable devices, reduced motion keeps fades | `--ease-out-strong`, dialogs, `.animate-enter` | `emil-design-eng` skill via https://skills.sh | MIT |
| Anti-patterns to avoid (generic AI landing tells) and "spend boldness in one place" | Landing and auth composition | Anthropic `frontend-design` skill via https://skills.sh | Guidance only, no code copied |
| Web interface checklist (focus states, `color-scheme`, `theme-color`, no layout shift) | Layout and forms | https://github.com/vercel-labs/web-interface-guidelines | Guidance only, no code copied |
| Transition patterns (blur-and-rise enter) | `.animate-enter` (written from scratch) | https://transitions.dev | Ideas only; no licence published, so no code copied |
| Block layout ideas (voice-note card, toast stack) | Voice note card, toasts (written from scratch) | https://bencho.dev | Ideas only; free blocks are MIT but none were copied |
| Geist typeface | `app/fonts/` | https://vercel.com/font (npm `geist` 1.8.2) | SIL OFL 1.1 |

Considered and left out: `border-beam` from libraries.dev (MIT, but about 99KB for a decorative effect) and a motion library (CSS covers every transition here).
