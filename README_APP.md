# The Philosophers

A voice-first, historically grounded AI philosopher simulation. Pick a
philosopher and talk with them (by voice or text), or stage a structured debate
between two of them. Dark-academic aesthetic, serious and immersive.

Built for **entertainment + learning**. Accuracy is prioritized over theatrical
voice; each philosopher speaks in their own manner without distorting the
content.

Initial philosophers: **Thomas Aquinas**, **Friedrich Nietzsche**, **Søren
Kierkegaard**, **Jean-Paul Sartre**, **Albert Camus**.

---

## Status

All four build phases (streaming replies, retrieval-grounded accuracy,
prefetch/caching, and duel-mode streaming + latency logging) are code-complete
and verified. What's left is two manual items: adding an `ELEVENLABS_API_KEY`
for premium voice, and a human end-to-end listening pass in the browser. See
[`docs/STATUS.md`](docs/STATUS.md) for the phase-by-phase detail.

---

## Features

- **Conversation mode** — talk one-on-one with a philosopher. Voice→voice,
  text→voice, voice→text, or text→text.
- **Duel mode** — two philosophers debate a topic you choose, in structured
  phases (opening → critique → rebuttal → cross-examination → neutral recap).
  You can interject at any time.
- **Answer levels** — Beginner, Intermediate, Advanced, or "Reading a Primary
  Text." Affects depth, never accuracy.
- **Swappable providers** — model (Claude / OpenAI / Ollama) and voice
  (ElevenLabs / browser) are chosen entirely by environment variables. No keys
  in code.
- **Zero-config voice fallback** — if no TTS key is set, speech uses the
  browser's built-in Web Speech API. Voice input always uses Web Speech.

---

## Quick start

Requires **Node.js 18.18+** (Node 20+ recommended).

```bash
cd philosopher-app
npm install

# configure providers
cp .env.example .env.local
#   -> add ANTHROPIC_API_KEY (default model provider)
#   -> optionally add ELEVENLABS_API_KEY for high-quality voices

npm run dev
# open http://localhost:3000
```

With **no keys at all** the UI still runs, and voice input/output work via the
browser — but the philosophers can't respond until an LLM provider is
configured (Claude by default). Add `ANTHROPIC_API_KEY` to `.env.local`.

> **Browser note:** voice input uses the Web Speech API, best supported in
> Chrome/Edge. In other browsers the mic button is hidden and you type instead.

---

## Configuration (`.env.local`)

All configuration is server-side. See `.env.example` for the full list.

### Model provider

| Variable        | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `LLM_PROVIDER`  | `anthropic` (default) \| `openai` \| `ollama`      |
| `LLM_MODEL`     | Model id. Default per provider (Claude: `claude-opus-4-8`). |
| `ANTHROPIC_API_KEY` | Required for the default Claude provider.      |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | For `LLM_PROVIDER=openai`.    |
| `OLLAMA_BASE_URL` | For `LLM_PROVIDER=ollama` (local).               |

### Voice provider

| Variable            | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `TTS_PROVIDER`      | `elevenlabs` (default) \| `none`                         |
| `ELEVENLABS_API_KEY`| Required for ElevenLabs. If absent, browser speech used. |
| `ELEVENLABS_MODEL`  | Optional (default `eleven_flash_v2_5` for low latency).  |
| `ELEVENLABS_OUTPUT_FORMAT` | Optional (default `mp3_22050_32`).               |

Swapping providers never requires code changes — only these variables.

---

## How it works

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the streaming/retrieval
pipeline, accuracy strategy, duel orchestration, and provider abstractions;
[`docs/STATUS.md`](docs/STATUS.md) for what has shipped and what remains; and
[`docs/ADDING_A_PHILOSOPHER.md`](docs/ADDING_A_PHILOSOPHER.md) for the source
curation process and how to add a new philosopher.

### Accuracy strategy (hybrid)

- Each philosopher has a **carefully written system prompt** encoding accurate
  positions and reasoning patterns from reliable sources (e.g. the Stanford
  Encyclopedia of Philosophy) and their primary works.
- A **hybrid retrieval** step surfaces curated source excerpts when relevant
  (local embeddings + keyword overlap over a small hand-curated corpus — no
  external vector DB or embedding API required). Retrieval is prefetched while
  the user is still speaking and time-boxed, so it grounds the answer without
  slowing conversation.
- Shared **character + accuracy rules** apply to every philosopher (stay in
  first person, never claim to be an AI, don't fabricate citations, flag
  interpretations and extensions).

### Duel orchestration

There is no separate "debate manager" character. Each philosopher receives the
opponent's **actual previous statement** (verbatim, not a summary) and responds
to what was literally said. A simple turn coordinator advances the phases; a
neutral, out-of-character moderator produces the optional recap. User
interjections are injected into the next speaker's prompt, answered, and then
the debate resumes.

---

## Project layout

```
src/
  app/
    page.tsx                     landing / profile selection
    conversation/[id]/page.tsx   conversation mode
    duel/page.tsx                duel mode
    api/chat/route.ts            single-philosopher endpoint
    api/duel/route.ts            duel turn endpoint
    api/tts/route.ts             text-to-speech endpoint
  components/                    Portrait, MicButton, SettingsPanel
  lib/
    philosophers.ts              profiles + curated system prompts + sources
    retrieval.ts                 lightweight grounding retrieval
    providers/llm.ts             model provider abstraction + prompt composition
    providers/tts.ts             voice provider abstraction
    useSpeechRecognition.ts      Web Speech API input hook
    useSpeech.ts                 voice output (server TTS -> browser fallback)
    settings.ts                  localStorage-backed preferences
    types.ts
```

---

## Deploy

It's a standard Next.js app: `npm run build` then `npm start`, or deploy to any
Node host / Vercel. Set the same environment variables in your host.

---

## Disclaimer

These profiles are AI simulations inspired by historical philosophers — not the
philosophers themselves, and not a substitute for their writings. They aim for
accuracy but can be wrong. For study, read the primary texts.
