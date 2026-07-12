# Architecture

> Progress tracking lives in [`STATUS.md`](STATUS.md) — what has shipped, what
> is verified, and what remains.

## Overview

A Next.js (App Router) + TypeScript app. The browser handles voice I/O; server
API routes handle model inference, retrieval, and (optional) high-quality TTS.
State is intentionally minimal — React hooks plus `localStorage` for
preferences. There are no accounts and no server-side conversation persistence.

The whole design is organized around one constraint: **a voice conversation
cannot tolerate dead air.** Every stage of the pipeline is streamed, cached, or
prefetched so that speech starts within a couple of seconds of the user
finishing their sentence.

```
Browser (client)                              Server (API routes)
────────────────                              ───────────────────
Web Speech API ──interim transcripts──▶  /api/retrieve  (debounced prefetch
     │                                        │           while user talks)
     │                                        └─▶ warms retrieval LRU cache
     │ final transcript
     ▼
conversation UI ──POST─────────────────▶  /api/chat
     │                                        ├─ retrieveSources()   hybrid: local embeddings
     │                                        │    (usually a cache hit)  (cosine) + keywords
     │                                        ├─ buildSystemPrompt() stable persona (prompt-
     │                                        │                      cached) + per-turn suffix
     │                                        └─ provider.stream()   Claude | OpenAI | Ollama
     ▼
NDJSON event stream  ◀── sources first, then text deltas, then done ──┘
     │
     ├─ text deltas grow the chat bubble (typing effect)
     └─ startSpeechStream(): sentence chunker cuts complete sentences
          │ per sentence, as soon as it completes
          ▼
        /api/tts (ElevenLabs) ──clip──▶ Web Audio queue: each clip scheduled
          │                             at the previous clip's exact end time
          └─ 501/502 ──▶ per-sentence Web Speech synthesis fallback
```

## The latency pipeline, stage by stage

### 1. Retrieval prefetch (`/api/retrieve` + `lib/retrieval-cache.ts`)

While the user is still speaking, the client debounces interim speech
transcripts (350ms) and POSTs them to `/api/retrieve`. The endpoint's real job
is its side effect: `retrieveSources()` scores and caches results in an
in-memory LRU cache (64 entries, 5-minute TTL, per philosopher). When the
final transcript reaches `/api/chat`, lookup order is:

1. **Exact** (normalized text) — free; catches final transcripts that differ
   from the last interim only by casing/punctuation (the common case).
2. **Semantic** (query-vector cosine ≥ 0.95) — catches interim transcripts a
   few words short of the final sentence.
3. Miss — score fresh and populate the cache.

### 2. Grounding retrieval (`lib/retrieval.ts` + `lib/embeddings.ts`)

Hybrid scoring over each philosopher's curated source excerpts:

- **Semantic**: excerpts are embedded at build time (`npm run
  build:embeddings` → `src/data/source-embeddings.json`) with a local ONNX
  model (all-MiniLM-L6-v2 via `@xenova/transformers` — no API key, no vector
  DB). At request time only the query is embedded (~10–30ms warm) and compared
  by cosine similarity, so "Is life worth living?" finds the excerpt about the
  absurd with zero shared words.
- **Keyword**: an overlap term (25% weight) rescues exact names and technical
  terms that small embedding models can fumble.
- The relevance threshold (`RETRIEVAL_MIN_SCORE = 0.15`) was set from measured
  scores (`scripts/retrieval-check.ts`): unrelated queries land ~0.03, true
  matches 0.17+.

Degradation is graceful by design: if the model is still warming (it loads at
server boot via `src/instrumentation.ts`), if the prebuilt vectors are stale
(each carries a content hash checked against `philosophers.ts`), or if
embedding exceeds a 150ms budget, retrieval silently falls back to keyword
scoring. Retrieval never stalls the pipeline.

Note: the embedder's state lives on `globalThis` because Next.js compiles
instrumentation and routes into separate bundles, each with its own copy of
module-level variables.

### 3. LLM streaming + prompt caching (`lib/providers/llm.ts`)

`LLMProvider` exposes `complete()` (one-shot, now used only by scripts) and
`stream()` (an `AsyncIterable<string>` of text fragments) — both `/api/chat`
and `/api/duel` stream. Three implementations:
Anthropic (default, official SDK), OpenAI-compatible, and Ollama; selected by
`LLM_PROVIDER`, keys via env vars only.

The system prompt is split in two (`buildSystemPrompt` returns both parts):

- `system` — shared preamble + persona + answer level. Stable across a
  conversation, so the Anthropic provider marks it with `cache_control`:
  after the first turn it is read from Anthropic's prompt cache (~10× cheaper,
  faster time-to-first-token). Verified live: 1232 tokens written on call 1,
  all 1232 read from cache on call 2 (`scripts/cache-check.ts`).
- `systemSuffix` — grounding excerpts / duel phase instructions. Changes every
  turn, so it rides *after* the cache marker and never invalidates it.

Extended thinking is deliberately off: the app is voice-first and wants
low-latency natural replies; accuracy comes from the curated prompt plus
retrieval, not per-turn reasoning.

### 4. NDJSON response stream (`/api/chat`, `/api/duel`)

Both routes return a `ReadableStream` of newline-delimited JSON events:
`{type:"sources"}` immediately (before generation starts; `/api/chat` only),
then `{type:"text"}` deltas, then `{type:"done"}`. Once streaming starts the
200 status is already committed, so mid-stream failures arrive in-band as
`{type:"error"}`; pre-stream failures still return ordinary JSON error
statuses.

### 5. Sentence-chunked TTS + gapless playback (`lib/sentences.ts` + `lib/useSpeech.ts`)

The client feeds text deltas into an incremental sentence chunker. A sentence
boundary only counts once the following whitespace has arrived (a trailing
"." might be an abbreviation or the middle of "1844.5"); abbreviations,
initials, decimals, and trailing quotes are handled, and fragments under 8
characters merge forward (so "1." in a list never becomes its own clip).

Each completed sentence is synthesized immediately — requests overlap in
flight — and played strictly in order through a Web Audio queue: each clip is
scheduled at the previous clip's exact end time on the audio clock
(`nextStartTime = at + buffer.duration`), which is what makes playback
gapless. Speech therefore starts after the *first sentence* is ready
(~1–2s) instead of after the full reply (~9s+).

`speak()` (whole-string) remains available but has no callers in the app —
conversations and duels both use the streaming path. When the server TTS
provider is unconfigured or fails, both paths fall back to the browser's Web
Speech synthesis, per sentence in the streaming case.
`startSpeechStream()` accepts an optional `onFirstAudio` callback, fired the
moment sound actually starts, which the pages use for dev-mode
time-to-first-audio logging.

## Accuracy strategy — source-informed prompts + hybrid retrieval

1. **Curated system prompts** (`lib/philosophers.ts`). Each philosopher's
   `systemPrompt` encodes accurate positions, key texts, and reasoning
   patterns. A shared preamble adds the in-character + accuracy rules and the
   selected answer level.
2. **Hybrid retrieval** (stage 2 above) injects only clearly relevant excerpts
   as a short grounding note; the common case is none, and the model answers
   from the persona prompt alone.
3. Sources are **never read aloud**. In text mode, an optional "Show sources"
   setting reveals the grounding used for a reply.

See [`rag_architecture.md`](rag_architecture.md) for the deeper RAG layer this
is designed to grow into, and [`source_strategy.md`](source_strategy.md) for
how excerpts are curated.

## Voice provider (`lib/providers/tts.ts`)

`getTTSProvider()` returns an ElevenLabs provider when configured, else
`null`. `/api/tts` returns `501` when null and the client falls back to Web
Speech synthesis, so voice always works with zero configuration. Each
philosopher maps to a distinct voice id (overridable via `elevenLabsVoiceId`).

## Duel orchestration (`app/duel/page.tsx` + `api/duel/route.ts`)

- The client builds a fixed step list for the chosen pair: opening ×2,
  critique ×2, rebuttal ×2, cross-examination ×4, then a neutral recap.
- Each step POSTs to `/api/duel` with the speaker, opponent, phase, topic, and
  the full transcript. The route passes the opponent's **verbatim** last
  statement into the speaker's prompt — no summarizing middle-man.
- **Interjections**: the user's input is stored as `pendingInterjection`; the
  next speaker addresses it first, then the debate resumes.
- The **recap** comes from a neutral, out-of-character moderator prompt and
  does not declare a winner.
- Every step — in-character turns *and* the recap — streams over the same
  NDJSON protocol as `/api/chat` and gets the same sentence-chunked speech
  treatment (the recap streams too so the client needs only one reader). On a
  mid-stream error the partial turn is removed from the transcript, because
  the transcript is also the API's debate context and the step will be
  retried.

## Client state & settings

`lib/settings.ts` persists answer level, voice on/off, hands-free auto-listen,
and the sources panel toggle to `localStorage`. No other state is persisted.

## Notable design choices / tradeoffs

- **Accuracy over theatrics** — tone matches each philosopher; content is not
  distorted for drama.
- **Streaming everywhere** (reversal of an earlier decision): replies were
  short enough for non-streaming to be *correct*, but voice mode showed
  10–25s of silence. Streaming + sentence-chunked TTS removed the dead air at
  the cost of NDJSON plumbing and in-band error handling.
- **RAG-in-the-loop, kept lightweight** (reversal of an earlier decision):
  retrieval now runs on every turn — but locally (no network), hybrid-scored,
  time-boxed to 150ms, and prefetched while the user is still talking, so it
  adds grounding without adding latency.
- **No vector DB** — 20 curated excerpts fit in a JSON file scored in
  microseconds; infrastructure would be pure overhead at this scale.
- **Local-first voice** — browser Web Speech works with zero setup; ElevenLabs
  is a drop-in upgrade via one env var.
