# Architecture

## System overview

```mermaid
flowchart LR
  B[Browser] -->|queries, mutations, actions over websocket| C[Convex]
  B -->|static pages, RSC| N[Next.js on Vercel]
  B -->|live mic audio, short-lived token| D[Deepgram Flux STT]
  B -->|live TTS websocket, one-shot session| R[Rumik SILK]
  N -->|/api/voice/* and /api/tts| D
  N --> R
  N -->|session check + rate limit| C
  N -->|/api/auth/* proxy| C
  C -->|chat replies| G[Gemini REST]
  C -->|call replies| O[OpenRouter]
```

- **Next.js** serves the public pages (prerendered at build time), the auth pages and the signed-in app under `/dashboard`. Its API routes only deal with speech and with proxying Better Auth to Convex.
- **Convex** holds all data, runs every LLM call, enforces ownership and rate limits, and hosts Better Auth (as a component) and the rate limiter (as a component).
- **The browser** connects directly to Convex, to Deepgram (with a 30 second token minted by `/api/voice/deepgram-token`) and to Rumik (with a one-shot session from `/api/voice/silk-mint`). It never holds a long-lived third-party key and never calls an LLM.
- `voice-agent/` is an optional Pipecat server for a fully server-side voice pipeline. The web app does not use it.

## Rendering and auth

| Route group | Rendering | Auth |
| --- | --- | --- |
| `app/(public)` (landing, `/astrologers`, `/astrologers/[slug]`, about, terms, privacy) | Static / SSG. Persona data comes from `lib/constants.ts` | None. Must not read cookies or headers |
| `app/(auth)` (sign-in, sign-up) | Static, `noindex` | `proxy.ts` sends signed-in visitors to `?next=` (sanitised by `safeNext`) or `/dashboard` |
| `app/(dashboard)` | Dynamic, `noindex` | `proxy.ts` does an optimistic cookie check; `layout.tsx` verifies the session with `isAuthenticated()` and wraps the tree in `ClientAuthBoundary` |

Better Auth runs inside Convex (`convex/auth.ts`, routes registered in `convex/http.ts`). The Next.js route `app/api/auth/[...all]` proxies to it, so the session cookie is first-party. `lib/auth-server.ts` exposes `isAuthenticated`, `fetchAuthQuery` and `fetchAuthMutation` for server components and route handlers. On the client, `UserSync` calls `user.ensureUser` once per session to create the app's `users` row.

## Data model

```mermaid
erDiagram
  users ||--o{ calls : places
  calls ||--o{ callTurns : has
  users ||--o{ chatMessages : "owns (by userKey)"
  counsellors ||--o{ chatMessages : "by slug"
  counsellors ||--o{ calls : "by slug"

  users {
    string authId "Better Auth user id (index)"
    string name
    string email
    string displayName
    string gender "male | female"
    string birthDate "YYYY-MM-DD"
    string birthTime "HH:MM, unset if unknown"
    boolean birthTimeUnknown
    string birthPlace
    id profileImageStorageId
    number onboardedAt
  }
  counsellors {
    string slug "index"
    string name
    string portrait
    string gender
    array specialties
    array languages
    array categories
    boolean isNew
    string personaPrompt
  }
  calls {
    id userId "index with startedAt"
    string counsellorSlug
    string counsellorName
    number startedAt
    number endedAt
    number durationSec
  }
  callTurns {
    id callId "index with ts"
    string role "user | bot"
    string text
    number ts
  }
  chatMessages {
    string userKey "identity.tokenIdentifier"
    string counsellorSlug
    string role "user | assistant"
    string content
    number createdAt
  }
```

Source of truth: `convex/schema.ts`. Better Auth keeps its own user, session and account tables inside its component. Personas are defined in `lib/constants.ts` and copied into `counsellors` by `pnpm seed`; re-run it after editing a persona (`pnpm seed --prod` for production).

## Convex functions

| Module | Public | Internal |
| --- | --- | --- |
| `counsellors` | `list`, `getBySlug` (signed in only) | `seed` |
| `user` | `ensureUser`, `getProfile`, `saveProfile`, `generateProfileUploadUrl` | |
| `chat` | `getSession`, `listSessions`, `send` (action) | `beginTurn`, `startReply`, `updateReply`, `discardReply` |
| `calls` | `start`, `end`, `listMine`, `getMine`, `liveReply`, `respond` (action) | `beginTurn`, `startBotTurn`, `updateBotTurn`, `discardBotTurn`, `endStale` |
| `crons` | | every 5 min: `calls.endStale` |
| `limits` | `consume` (used by Next.js API routes) | |
| `auth` | `getCurrentUser` | |

Helpers: `lib/users.ts` (identity and ownership), `lib/prompts.ts` (system prompts, built from the persona and the stored profile), `lib/llm.ts` (Gemini and OpenRouter over `fetch`), `lib/rateLimits.ts`.

### Rate limits (per user, token bucket)

| Name | Refill | Burst | Used by |
| --- | --- | --- | --- |
| `chatMessage` | 20 / min | 6 | `chat.send` |
| `voiceTurn` | 30 / min | 10 | `calls.respond` |
| `callStart` | 20 / hour | 5 | `/api/voice/deepgram-token` (one token per call) |
| `tts` | 40 / min | 12 | `/api/tts`, `/api/voice/silk-mint` |
| `stt` | 20 / min | 6 | `/api/voice/transcribe` (voice notes) |
| `photoUpload` | 10 / hour | 5 | `user.generateProfileUploadUrl` (each URL lets the browser store a file) |

## Main flows

### Text chat

```mermaid
sequenceDiagram
  participant B as Browser (useChat)
  participant C as Convex chat.send
  participant G as Gemini
  B->>C: send(counsellorSlug, content)
  C->>C: beginTurn: rate limit, store user message, load persona + profile + last 12 messages
  C->>C: startReply: empty assistant message, streaming: true
  C->>G: system prompt + history (streamGenerateContent, SSE)
  loop as tokens arrive (at most every 100 ms)
    G-->>C: text delta
    C->>C: updateReply (internal)
    C-->>B: live getSession query shows the reply growing
  end
  C->>C: updateReply(done): streaming cleared
  C-->>B: ids + full text
```

If Gemini refuses before sending any text (429 quota or a 5xx outage), the same prompt goes to OpenRouter instead, so chat keeps working when one provider is down.

Replies stream: the action creates an empty assistant message and patches it as Gemini's server-sent events arrive, so the chat shows the reply as it is written. If generation fails the empty message is deleted. Only the action (through internal mutations) writes assistant messages.

Voice notes: the browser records with MediaRecorder, posts the audio to `/api/voice/transcribe` (Deepgram, pre-recorded) and sends the transcript through `chat.send`. Assistant replies are always shown as text; each has a small read-aloud button, and the header speaker toggle (off by default) plays new replies automatically. Audio is synthesised only on request, by `/api/tts`.

### Voice call

```mermaid
sequenceDiagram
  participant B as Browser (useVoiceCall)
  participant N as Next.js API
  participant D as Deepgram Flux
  participant C as Convex
  participant R as Rumik SILK
  B->>C: calls.start
  B->>N: POST /api/voice/deepgram-token (callStart limit)
  N-->>B: 30 s token
  B->>D: websocket, PCM16 mic audio
  D-->>B: EndOfTurn + transcript
  B->>C: calls.respond(callId, text, turnKey)
  C->>C: beginTurn, build prompt, startBotTurn (empty, streaming)
  C->>C: stream OpenRouter, updateBotTurn every 60 ms
  C-->>B: calls.liveReply(callId, turnKey) shows the reply growing
  loop each batch of complete sentences
    B->>N: POST /api/voice/silk-mint (starts at once, overlaps playback)
    N-->>B: one-shot ws_url
    B->>R: stream that piece's audio, queued after the previous piece
  end
  Note over B: captions add each piece when its audio starts; speaking over the reply stops it (barge-in)
  B->>C: calls.end
```

The persona greets first: `calls.respond` with `kickoff: true` asks for a greeting that is not stored as a user turn.

Only the browser calls `calls.end`, so a closed tab or dropped network would leave a call open. A cron (`convex/crons.ts`) runs `calls.endStale` every 5 minutes: any open call (index `by_endedAt`) with no new turn for 10 minutes is ended as of its last turn, so its duration stays honest. If the caller was only silent and speaks again, `respond` refuses with "Call has ended" and the call screen asks them to start again.

The call speaks as soon as the first sentence is complete instead of waiting for the whole reply. `useVoiceCall` cuts the streamed text at sentence ends (not after abbreviations like "Pt.", and not before 20 characters), mints a Rumik session per piece straight away, and plays the pieces strictly in order on one Web Audio timeline. The rest of the reply is sent when the bot turn is marked done.

## Security

- Headers and CSP live in `next.config.ts`. `connect-src` lists Convex, `wss://api.deepgram.com` and the Rumik hosts. The CSP is applied to production builds only (dev needs `eval`).
- `script-src` allows `'unsafe-inline'` because a nonce would make every page dynamic (see DECISIONS.md).
- API routes call `guardRequest()` (`lib/api-guard.ts`): session check, then a Convex rate-limit mutation, then the third-party call.
- `user.saveProfile` only accepts a profile photo storage id that points at an image of at most 8 MB and that no other user has claimed (index `by_profileImageStorageId`), so one user cannot take over or delete another user's file.

## Environment variables

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `CONVEX_DEPLOYMENT` | `.env.local` | dev | Written by `npx convex dev` |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local`, Vercel | yes | Convex client URL |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `.env.local`, Vercel | yes | Convex HTTP actions URL (auth proxy) |
| `NEXT_PUBLIC_SITE_URL` | `.env.local`, Vercel | production | Public origin for canonical URLs, OG, sitemap, robots. Falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then localhost |
| `DEEPGRAM_API_KEY` | `.env.local`, Vercel | for voice | Deepgram key with Member permissions (mints temporary tokens) |
| `SILK_API_KEY` | `.env.local`, Vercel | for voice | Rumik TTS |
| `SILK_BASE_URL` | `.env.local`, Vercel | no | Default `https://silk-api.rumik.ai`; also feeds the CSP |
| `SILK_MODEL` | `.env.local`, Vercel | no | `muga` (default) or `mulberry` for female personas |
| `SITE_URL` (or `BETTER_AUTH_URL`) | Convex | yes | App origin for Better Auth |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Convex | no | Extra comma-separated origins Better Auth accepts, for example both domains while moving to a custom domain |
| `BETTER_AUTH_SECRET` | Convex | yes | Session signing secret |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | Convex | for chat | Gemini |
| `GOOGLE_CHAT_MODEL` | Convex | no | Default `gemini-3.5-flash` (2.5 Flash returns 404 for newer API projects). Thinking is turned off so it cannot eat the 360-token reply budget |
| `OPENROUTER_API_KEY` | Convex | for calls | OpenRouter |
| `OPENROUTER_MODEL` | Convex | no | Default `google/gemini-3.1-flash-lite-preview` |
| `GEMINI_API_KEY` | `.env.local` | scripts | Only for `pnpm generate:portraits` |

`voice-agent/server/.env.example` lists the Pipecat server's own variables.

`CONVEX_SITE_URL` is not needed in Next.js: `lib/auth-server.ts` passes `NEXT_PUBLIC_CONVEX_SITE_URL` to Better Auth explicitly, and Convex sets `CONVEX_SITE_URL` itself inside its runtime.

## Deployment

| Part | Where | How it ships |
| --- | --- | --- |
| Web app | Vercel project `kosmo` (Hobby), https://kosmo-ai.vercel.app | Every push to `main` builds and deploys (`pnpm build`). Vercel does not touch Convex. |
| Backend | Convex production deployment `graceful-elephant-326` | Manually: `npx convex deploy` after any change under `convex/` (functions, schema, indexes). |
| Personas | Convex `counsellors` table | `pnpm seed --prod` after editing `lib/constants.ts` (runs the internal mutation `counsellors:seed`). |
| Dev backend | Convex dev deployment `wry-wolverine-89` | `pnpm dev` / `pnpm dev:convex` push on save; `pnpm seed` seeds it. |

Ship backend changes before or together with the web change that depends on them: deploy Convex first, then push to `main`.

### Moving to a custom domain

The steps below use `kosmo.example` for the new domain. Only two values change: the web origin on Vercel and the auth origin on Convex. The Convex URLs, the speech keys and the CSP stay as they are.

1. **Add the domain in Vercel.** Project `kosmo` → Settings → Domains → add `kosmo.example` (and `www.kosmo.example` if you want it redirected). Create the DNS records Vercel shows (an `A` record to Vercel's IP for the apex, or a `CNAME` to `cname.vercel-dns.com` for a subdomain) and wait until the domain shows a valid certificate.
2. **Trust both origins during the switch (Convex, production).** Better Auth only accepts requests whose origin is its base URL. To keep `https://kosmo-ai.vercel.app` working while DNS settles, add the new origin as an extra trusted origin first:
   `npx convex env set BETTER_AUTH_TRUSTED_ORIGINS "https://kosmo.example,https://kosmo-ai.vercel.app" --prod`
   Better Auth reads this comma-separated list itself; no code change is needed.
3. **Point auth at the new origin (Convex, production).**
   `npx convex env set SITE_URL https://kosmo.example --prod`
   `convex/auth.ts` uses `BETTER_AUTH_URL` before `SITE_URL`, so if `BETTER_AUTH_URL` is set on the deployment, change (or unset) it too. Convex env changes take effect immediately; no `npx convex deploy` is needed.
4. **Point the site at the new origin (Vercel, Production environment).** Set `NEXT_PUBLIC_SITE_URL=https://kosmo.example` (no trailing slash). It is inlined at build time into canonical URLs, Open Graph tags, JSON-LD, `robots.txt` and `sitemap.xml`, which are all prerendered, so **redeploy**: Deployments → latest production deployment → Redeploy (without the build cache), or push any commit to `main`.
5. **Make the new domain primary.** In Vercel → Domains, set `kosmo-ai.vercel.app` to redirect (308) to `kosmo.example`, so old links and search results land on the new origin.
6. **Clean up.** Once the old domain only redirects, drop it from `BETTER_AUTH_TRUSTED_ORIGINS` (or unset the variable). Session cookies belong to the old domain, so signed-in users sign in once more on the new one.
7. **Search.** Add the new domain in Google Search Console and submit `https://kosmo.example/sitemap.xml`.

What does not change:

- **CSP** (`next.config.ts`): the app's own origin is covered by `'self'`, and `connect-src` lists Convex, Deepgram and Rumik, none of which move. Only if Convex itself moves to a custom domain do `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` change on Vercel; the CSP is built from them, so the same redeploy picks that up.
- **Auth routes**: the browser talks to `/api/auth/*` on the site itself, which proxies to Convex, so the session cookie stays first-party on whatever domain serves the app.
- **Deepgram and Rumik**: keys stay on the server and neither service restricts by domain.

Check afterwards: sign up and sign in on the new domain, open `/robots.txt` and `/sitemap.xml` and confirm they list `https://kosmo.example`, view a page's source for the canonical URL, and confirm `https://kosmo-ai.vercel.app` redirects.
