<p align="center">
  <img src="app/icon.png" alt="Kosmo logo" width="88" height="88" />
</p>

<h1 align="center">Kosmo</h1>

<p align="center">Voice calls and chat with AI astrologer personas, in English or Hinglish.</p>

Live at **https://kosmo-ai.vercel.app**.

Kosmo lets you pick an astrologer persona, share your birth details once, and then talk to it by voice or text. Every persona is an AI and is labelled as one in the app. Replies come from a language model and are meant for reflection, not for medical, legal or financial decisions.

## Features

- 24 AI astrologer personas, each with its own voice, region and speaking style
- Short onboarding for name, birth date, time and place, used to personalise replies
- Text chat with voice notes and spoken replies
- Real-time voice calls with live captions and barge-in
- Call history with full transcripts
- Light and dark themes
- Email and password sign-in; every chat and call is visible only to its owner

## Stack

Next.js 16, React 19, Tailwind CSS 4 and shadcn/ui on the front end. Convex for data, server functions, auth (Better Auth) and rate limits. Gemini for chat, OpenRouter for voice replies, Deepgram for speech to text and Rumik SILK for text to speech.

## Getting started

You need Node 24 (`.nvmrc`), pnpm 10 through Corepack, and a Convex account (or run Convex locally with `CONVEX_AGENT_MODE=anonymous npx convex dev`).

```bash
corepack enable
pnpm install
cp .env.example .env.local
npx convex dev --once        # creates a deployment and writes the Convex URLs to .env.local
```

Then set the server secrets on the Convex deployment:

```bash
npx convex env set SITE_URL http://localhost:3000
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set GEMINI_API_KEY <key>        # chat
npx convex env set OPENROUTER_API_KEY <key>    # voice calls
```

Put `DEEPGRAM_API_KEY` and `SILK_API_KEY` in `.env.local` for voice, then seed the personas and start:

```bash
pnpm seed
pnpm dev                     # http://localhost:3000
```

The web app deploys to Vercel on every push to `main`. Convex is deployed separately with `npx convex deploy` (see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#deployment)).

## Documentation

- [AGENTS.md](./AGENTS.md): commands, conventions and rules for contributors and AI coding agents
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): system diagram, data model, flows, environment variables
- [docs/DESIGN.md](./docs/DESIGN.md): palette, type, motion and borrowed components
- [docs/DECISIONS.md](./docs/DECISIONS.md): why things are built the way they are
- [docs/ROADMAP.md](./docs/ROADMAP.md): what is done and what to do before launch, including deployment

## License

The Geist font files in `app/fonts/` are under the SIL Open Font License (`app/fonts/OFL-geist.txt`). `thinking-orbs` is MIT. Other borrowed rules and sources are listed in [docs/DESIGN.md](./docs/DESIGN.md#borrowed-code-rules-and-sources).
