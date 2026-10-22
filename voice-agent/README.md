# Kosmo voice agent

An optional Pipecat server that runs a full voice pipeline on the server side. The Kosmo web app does not use it: calls in the app go straight from the browser to Deepgram and Rumik, with replies generated in Convex. Keep this if you want a server-side pipeline later, or delete the folder.

## Pipeline

- Transport: SmallWebRTC
- Speech to text: Deepgram Flux (`flux-general-en`)
- LLM: OpenRouter, routed to Cerebras by default (`openrouter_cerebras_llm.py`)
- Text to speech: Rumik SILK (`rumik_tts.py`)

The client can pass a persona in the request body. `bot.py` uses it to build the system prompt.

## Run locally

You need Python 3.11+ and [uv](https://docs.astral.sh/uv/).

```bash
cd server
uv sync
cp .env.example .env     # add DEEPGRAM_API_KEY, SILK_API_KEY, OPENROUTER_API_KEY
uv run bot.py
```

From the repo root, `pnpm dev:voice` does the last step.

## Files

```
server/bot.py                      pipeline and SmallWebRTC entry point
server/openrouter_cerebras_llm.py  OpenRouter LLM service with provider routing
server/rumik_tts.py                Rumik SILK websocket TTS service
server/Dockerfile                  image for Pipecat Cloud
server/pcc-deploy.toml             Pipecat Cloud config (agent kosmo-voice-agent)
```

## Deploy to Pipecat Cloud

Create a secret set called `kosmo-voice-agent-secrets` with the keys from `.env`, add an `image` entry to `pcc-deploy.toml`, then follow the [Pipecat Cloud docs](https://docs.pipecat.ai/deployment/pipecat-cloud/introduction).

## Links

- [Pipecat documentation](https://docs.pipecat.ai/)
- [Pipecat on GitHub](https://github.com/pipecat-ai/pipecat)
