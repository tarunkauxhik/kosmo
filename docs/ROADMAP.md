# Roadmap

## Done

1. **Rebrand.** New name, logo, copy and persona set (24 personas with their own tradition, region, voice and signature line in `lib/constants.ts`).
2. **Cleanup.** Removed unused code and dependencies, grouped components by flow, one hook per client concern, consistent naming. Final pass before handoff: knip audit, unused exports removed, Prettier added, `.gitignore` and `.env.example` brought up to date.
3. **Security.** Every Convex function checks identity and ownership. Assistant messages and bot turns are written only by internal mutations. Prompts are built on the server. Per-user rate limits on everything that costs money. Speech keys stay in route handlers; the browser gets short-lived tokens. `safeNext` for redirects. Security headers and a CSP.
4. **Honesty.** Every persona is labelled as an AI persona, portraits are described as AI-generated, the prompts tell personas to admit they are AI, and "reflection, not advice" notes appear across the app. No ratings, reviews or credential claims.
5. **UI revamp.** Responsive shell (sidebar on desktop, top and bottom bars on phones), inbox plus conversation layout for chat, a three-step onboarding, call screen with live captions, call history with transcripts, skeleton, empty and error states.
6. **SEO and performance.** Public pages prerendered, metadata and canonical URLs, generated OG images, robots, sitemap, manifest, JSON-LD. Self-hosted fonts and emoji. Auth redirects in `proxy.ts`. Lighthouse mobile 97 to 98 on public pages.
7. **Visual refresh.** Neutral palette with one iris accent, light and dark themes with a toggle, Geist, new ring-and-moon mark and favicon, detail and motion rules from jakub.kr and Emil Kowalski, `thinking-orbs` for thinking states.
8. **Launch.** Web app live on Vercel at https://kosmo-ai.vercel.app (auto-deploys from `main`). Convex production deployed with `npx convex deploy` and seeded with the 24 personas. `NEXT_PUBLIC_SITE_URL` and `SITE_URL` set.
9. **Repo cleanup.** One instruction file (`AGENTS.md`), Convex skills cut to the eight this app uses, stale docs fixed, profile photo ownership check, bounded transcript reads, Convex counsellor queries require sign-in.
10. **Licensed emoji.** Switched from Apple's artwork to Microsoft Fluent Emoji 3D (MIT).

## Next (in priority order)

1. **Add `LICENSE`** (GPL-3.0) at the repo root (maintainer).
2. **Verify the CSP for Rumik.** `connect-src` allows `wss://*.rumik.ai` and the host of `SILK_BASE_URL`. Confirm the `ws_url` returned by `/api/voice/silk-mint` is on one of those hosts in production and that no CSP errors appear during a call.
3. **Live-test chat and voice in production**: Gemini replies, voice notes (transcribe and TTS), a full call with barge-in, call history, rate-limit messages. Test on iOS Safari and Android Chrome.
4. **Legal review** of `components/legal/LegalContent.tsx` (terms, privacy).
5. **Unique portraits.** There are 12 portrait files (about 17 MB of PNG) for 24 personas, so half of them reuse another persona's photo (see `portrait` in `lib/constants.ts`). Add entries to `scripts/generate-portraits.mjs`, generate the missing ones with `pnpm generate:portraits`, point each persona at its own file, compress them, run `pnpm seed --prod`, and keep the alt text saying they are AI-generated.
6. **Search Console.** Verify the domain and submit `/sitemap.xml`.
7. **Pipecat upgrade** in `voice-agent/` (currently pipecat-ai 1.2.1), or delete the folder if a server-side pipeline is not planned.
8. **ESLint 10 and TypeScript 7** once `eslint-config-next` and the rest of the toolchain support them.

## Ideas, not scheduled

- Remedies page (currently a placeholder) that collects suggestions from conversations.
- Account deletion and data export from the profile page.
- Basic product analytics that respect the CSP and privacy policy.
