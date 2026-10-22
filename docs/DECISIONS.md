# Decisions

Short log of choices that are not obvious from the code. Newest last. Add an entry when you make a call someone might later question.

| Decision | Why |
| --- | --- |
| **Convex for data, functions and auth hosting** | One typed backend with live queries, file storage and components (Better Auth, rate limiter). No separate API server or database to run. |
| **Better Auth via `@convex-dev/better-auth`, email and password** | Sessions live next to the data. A `as unknown as AuthClient` cast in `lib/auth-client.tsx` bridges a type mismatch in 0.12.5; remove it when get-convex/better-auth#420 ships. |
| **Gemini for chat, OpenRouter for voice** | Chat can afford a second or two per reply, and Gemini over plain REST works in the Convex runtime with no SDK. Voice needs a fast first token; OpenRouter lets us pick a fast model (default `google/gemini-3.1-flash-lite-preview`) and change it with one env var. |
| **LLM calls only inside Convex actions** | Keys never reach the browser, prompts are built from stored persona and profile data, and the reply is stored by an internal mutation so it cannot be forged. |
| **Browser talks to Deepgram and Rumik directly during calls** | Lowest latency for live audio. The server mints short-lived tokens (`/api/voice/deepgram-token`, `/api/voice/silk-mint`) so the real keys stay server-side. The Pipecat server in `voice-agent/` was kept as an option, not the default. |
| **Convex rate limiter, per user, token buckets** | Every paid call (LLM, STT, TTS) is limited in one place. Next.js routes consume limits through `limits.consume`, so there is no second limiter to keep in sync. |
| **Public pages static, persona data from `lib/constants.ts`** | Prerendered pages are fast and cheap, and they do not depend on Convex being up. The dashboard reads the same data from Convex after `pnpm seed:counsellors`. |
| **CSP with `'unsafe-inline'` scripts, no nonce** | A nonce forces every page to render per request and would lose static prerendering. The app renders no user-generated HTML, and the only inline scripts are Next's bootstrap and the theme script. `object-src 'none'`, `frame-ancestors 'none'` and a tight `connect-src` limit the rest. |
| **Self-hosted fonts and emoji** | No third-party requests on page load, a tight CSP, and the same emoji artwork on every platform. Geist is subset to about 17 KB. |
| **One font (Geist), no display face** | Fewer bytes, one consistent voice, and Geist's OFL licence allows self-hosting and subsetting. |
| **No motion library** | CSS transitions and keyframes cover every animation in the app. A library would add tens of KB to public pages for no visible gain. |
| **`thinking-orbs` is the only UI dependency added in the visual refresh** | MIT, about 14 KB gzip, zero dependencies, canvas-based, handles reduced motion and dark mode. Loaded only in the signed-in app. `border-beam` was rejected at about 99 KB. |
| **Theme: system by default, stored choice in `localStorage`** | No server state or cookie needed, so public pages stay static. An inline script applies the class before paint to avoid a flash. |
| **Primary buttons are ink, not the accent colour** | Keeps the iris accent rare enough to mean something (links, focus, AI badge). |
| **Prettier with 4 spaces and 120 columns** | Matches the existing code style, so the first format pass changed layout only, not conventions. |
