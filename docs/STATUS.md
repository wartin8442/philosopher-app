# Project Status — streaming + grounded RAG plan

Last updated: 2026-07-05.

The agreed plan attacks one problem — **10–25 seconds of dead air in voice
mode** — in four phases. Architecture details for everything marked done are
in [`ARCHITECTURE.md`](ARCHITECTURE.md).

| Phase | Scope | Status |
| --- | --- | --- |
| 2 | Streaming pipeline (LLM → NDJSON → sentence TTS → gapless audio) + prompt caching | ✅ Done, verified live |
| 1 | Real grounding: build-time embeddings + hybrid retrieval | ✅ Done, verified live |
| 3 | Prefetch on interim speech + retrieval cache + latency budget | ✅ Done, verified live |
| 4 | Polish: duel streaming, docs, latency logging | 🔶 Code done; ears-on browser pass pending |

(Phase 2 was built before Phase 1 because removing the streaming dead air had
the largest user-facing impact.)

## Done

### Phase 2 — streaming pipeline

- `stream()` added to all three LLM providers (Anthropic SSE, OpenAI SSE,
  Ollama NDJSON); `complete()` unchanged for duel mode.
- `/api/chat` returns NDJSON events: `sources` immediately, `text` deltas,
  `done`; mid-stream failures in-band as `error`.
- Client renders deltas as a typing effect; voice mode speaks per sentence:
  incremental sentence chunker (`src/lib/sentences.ts`, 10 unit tests) →
  per-sentence TTS → gapless Web Audio queue (`startSpeechStream` in
  `src/lib/useSpeech.ts`), with per-sentence Web Speech fallback.
- Anthropic prompt caching: stable persona prefix (1232 tokens) cached;
  per-turn grounding/duel instructions ride after the cache marker.
  Measured: call 2 read all 1232 tokens from cache (`scripts/cache-check.ts`).
- Measured stream timings: stream opens ~120ms, sources ~121ms, first text
  ~1.1s (vs ~8.7s for the full reply).

### Phase 1 — real grounding

- `npm run build:embeddings` embeds all curated excerpts with a local ONNX
  model (all-MiniLM-L6-v2, ~25MB, no API key) into
  `src/data/source-embeddings.json`; runs automatically before `npm run build`.
- `retrieveSources()` is hybrid: 0.75 × cosine + 0.25 × keyword overlap;
  threshold 0.15 set from measured score distributions
  (`scripts/retrieval-check.ts`).
- Model warmed at server boot (`src/instrumentation.ts`); embedder state on
  `globalThis` (Next bundles instrumentation/routes separately). Stale-vector
  detection via content hashes → keyword fallback + console warning.
- Verified live: "Is life worth living?" (zero keyword overlap) retrieves
  Camus's philosophical-suicide excerpt on the first request after cold start.

### Phase 3 — prefetch + cache

- Client debounces interim speech transcripts (350ms) into POST
  `/api/retrieve`, warming a per-philosopher LRU cache (64 entries, 5-min
  TTL) while the user is still talking.
- Cache lookup: exact normalized text (free) → query-vector cosine ≥ 0.95 →
  fresh scoring. Entries store all scored sources, so callers with different
  thresholds share them.
- 150ms latency budget on the embedding step; on timeout, keyword results
  ship instead.
- Verified live: prefetch with the unpunctuated interim transcript, then
  `/api/chat` with the punctuated final — sources served from cache; warm
  prefetch round trip ~29ms.

### Phase 4 — done so far

- `docs/ARCHITECTURE.md` rewritten (it previously documented the
  "no RAG-in-the-loop / non-streaming" decisions that phases 1–3 deliberately
  reversed); this status doc added.
- `npm run check:latency` added as a repeatable dead-air smoke check. It
  measures provider streaming time-to-first-token and retrieval latency.
  `npm run check:latency:local` also probes `/api/chat`, `/api/duel`, and
  `/api/tts` NDJSON/fallback behavior against a running app on port 3000; for
  another port, run `npx tsx scripts/dead-air-check.ts
  --base-url=http://127.0.0.1:<port>`.
- **Duel streaming**: `/api/duel` streams every phase — in-character turns
  *and* the neutral recap — as the same NDJSON events as `/api/chat` (no
  `sources` event), via one `streamReply()` helper. The duel page reads the
  stream, grows the turn bubble live, feeds fragments to `startSpeechStream`
  for sentence-by-sentence speech, and removes a partial turn on mid-stream
  error (the transcript is also the API's debate context, and the step
  retries). Prompt split (`system`/`systemSuffix`) unchanged, so duel prompt
  caching still applies. Verified live: warm recap first token at ~0.96s vs
  ~9.4s for the full reply; opening turn streamed 17 events over ~7s.
- **Dev-mode latency logging** (dev builds only, `NODE_ENV` gated):
  - Server: every `retrieveSources()` call logs its path + duration, e.g.
    `[retrieval] camus · cache hit (exact text) · 0.1ms`. Paths: exact-text
    hit, semantic hit, fresh hybrid (miss), keyword fallback (embedder cold /
    embed timeout). Verified live: miss 44.2ms → exact hit 0.1ms.
  - Client (browser console): `[latency] chat|duel <phase>: first token Nms`
    and `first audio Nms` per turn, measured from send/Continue.
    Time-to-first-audio comes from a new optional `onFirstAudio` callback on
    `startSpeechStream()`, fired when sound actually starts on either path.

## Remaining

1. **ElevenLabs key** — `.env.local` currently has no `ELEVENLABS_API_KEY`,
   so TTS runs on the browser Web Speech fallback. Add a key to exercise the
   ElevenLabs + Web Audio path end-to-end by ear.
2. **Browser listen-through** — the streaming voice path (now including
   duels) is verified by tests and API probes; a human end-to-end pass in the
   browser (gapless audio, barge-in via the stop button, hands-free
   auto-listen, and the `[latency]` console numbers) is still pending.

## Verification tools

| Command | Proves |
| --- | --- |
| `npm test` | 20 unit tests: sentence chunker, hybrid scoring, cache behavior, fallbacks |
| `npx tsx scripts/stream-demo.ts` | provider-level token streaming + timings |
| `npx tsx scripts/cache-check.ts` | prompt cache write/read token counts |
| `npx tsx scripts/retrieval-check.ts` | hybrid retrieval scores for probe queries vs. threshold |
| `npm run build:embeddings` | regenerates source vectors (required after editing `philosophers.ts` sources) |
