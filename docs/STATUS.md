# Project Status — streaming, corpus audit, and RAG decision experiment

Last updated: 2026-07-19.

## Read this first

This file is the canonical answer to **what is done and what happens next**.
Detailed evidence lives elsewhere so it is not copied into multiple documents:

| Question | Canonical artifact |
| --- | --- |
| What did the baseline stress test find? | [`stress_test_baseline_results.md`](stress_test_baseline_results.md) |
| Where are the complete replies and check-level results? | `data/rag/stress/dashboard.html` and `data/rag/stress/*/results.json` |
| Which cards were corrected, why, and from which sources? | [`data/rag/review/corrections_2026-07-19.md`](../data/rag/review/corrections_2026-07-19.md) |
| What is the binding before/after evaluation design? | [`run_stress_test_prompt.md`](run_stress_test_prompt.md) |
| How should research subagents be configured and routed? | [`stress_test_agents.md`](stress_test_agents.md#subagent-model-routing-for-future-runs) |
| What deeper corpus architecture is proposed? | [`rag_architecture.md`](rag_architecture.md) |
| Why did retrieval stop using position cards, and what changed? | [`rag_scope_refactor_checkpoint.md`](rag_scope_refactor_checkpoint.md) |
| What has to be recalibrated before the next pilot? | [`rag_narrowed_scope_recalibration.md`](rag_narrowed_scope_recalibration.md) |

> **Scope change, 2026-07-23 — parts of this file below are now historical.**
> Retrieval no longer scores or injects `position_card` units in any condition
> (`RETRIEVABLE_CORPUS_TYPES` in `src/lib/retrieval.ts`). Statements below about
> Condition B searching 259 eligible units describe the superseded scope. The
> index now holds **267 eligible units** (257 cards + 3 verified quotes + 7
> misattribution warnings); of these only the 10 quotes/warnings are
> retrievable, and Sartre has none. The 257 cards remain on disk, unused by
> retrieval. `npm run check:rag-gate2` and `check:rag-gate3` fail by design
> until recalibrated. Verify frozen inputs in one command with
> `npm run check:integrity`.
>
> **The 95.3% / "1 critical failure" headline below is disputed.** That failure
> is `nz-19-c1`, and the exam's answer key for it is wrong: "They muddy the
> water, to make it seem deep" *is* Nietzsche (*Zarathustra* II, "On the
> Poets"). The baseline's attribution was correct and only its section was
> wrong. See [`rag_narrowed_scope_recalibration.md`](rag_narrowed_scope_recalibration.md) §5.2.
> Do not treat the baseline numbers as settled until the answer keys are audited.

The agreed plan attacks one problem — **10–25 seconds of dead air in voice
mode** — in four phases. Architecture details for everything marked done are
in [`ARCHITECTURE.md`](ARCHITECTURE.md).

| Phase | Scope | Status |
| --- | --- | --- |
| 2 | Streaming pipeline (LLM → NDJSON → sentence TTS → gapless audio) + prompt caching | ✅ Done, verified live |
| 1 | Lightweight retrieval foundation over 20 hard-coded excerpts | ✅ Done, verified live |
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

### Phase 1 — lightweight retrieval foundation

- The generated `src/data/source-embeddings.json` contains the four hard-coded
  excerpts for each of five philosophers (20 total) plus 259 eligible
  experimental corpus units: 257 draft/source-backed position cards and two
  verified Nietzsche BGE quotations. All vectors use the local ONNX model
  (all-MiniLM-L6-v2, ~25MB, no API key).
- `retrieveSources()` is hybrid: 0.75 × cosine + 0.25 × keyword overlap;
  threshold 0.15 set from measured score distributions
  (`scripts/retrieval-check.ts`). Experimental Condition B adds a conservative
  0.67 injection guard calibrated between the highest frozen empty-support
  score (0.6387) and lowest corrected-card probe score (0.7136); A/C keep 0.15.
- Model warmed at server boot (`src/instrumentation.ts`); embedder state on
  `globalThis` (Next bundles instrumentation/routes separately). Stale-vector
  detection via content hashes → keyword fallback + console warning.
- Verified live: "Is life worth living?" (zero keyword overlap) retrieves
  Camus's philosophical-suicide excerpt on the first request after cold start.
- **Boundary:** Gate 2 proves the local index, retrieval, and condition
  isolation—not that RAG improves generated answers. A remains the production
  default; the deeper corpus is visible only to explicit experimental
  Condition B. No A/B/C pilot or live answer evaluation has run.

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

### Gate 3 pilot preparation — frozen, not executed

- Frozen-exam integrity remains green: `data/rag/eval/questions.json` SHA-256
  is still `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`.
  The embedding artifact is unchanged at
  `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE` and
  still contains exactly 20 curated excerpts plus 259 eligible corpus units
  (257 position cards and two verified quotes). Gate 2 and the corpus/index
  integrity test remain green; embeddings were not rebuilt.
- The deterministic pilot is frozen at
  `data/rag/eval/pilot-manifest.json`: 27 exact frozen questions and 68 checks
  (13 critical, 45 major, 10 minor), including all 15 questions containing the
  baseline's one critical plus 15 major failed checks. Category coverage is
  known-answer 9, locate 2, trap-attribution 4, trap-confusion 1, depth 8,
  and misreading 3. It contains the explicit PASS-plus cases `kg-15`, `kg-30`,
  and `cam-35`; all requested representative categories; all five philosophers;
  17 inspired-card and 10 held-out questions; 25 corpus-blind and two
  corpus-aware questions; and exactly 10 empty-support sentinels. The selected
  question digest is
  `3007CF3170FDED452B0857462B5B7B8B688800D1D9B0DBAFCBC7C2214BD65F52`.
- Projected usage is exact and unconsumed. With `N=27`, three conditions, and
  one repetition: answers = `N × 3 = 81`; blind judges = `N × 3 = 81`;
  first-audio measurements (one first-sentence TTS request each) =
  `N × 3 = 81`; total external calls = `N × 9 = 243`. The fixed 15% human
  audit is 13 judge records, including all three `nz-19` condition records;
  its deterministic record IDs are frozen in the manifest.
- `scripts/pilot-harness.ts` emits condition/run-labeled, dashboard-compatible
  `results-pilot-<run>-<condition>.json` files while refusing immutable
  `results.json` paths. Cache paths and keys include run label, condition,
  philosopher, question ID, and repetition. The schema records retrieved
  IDs/types/text/scores/citations; retrieval, first-token, first-audio, and
  full-response latency; reply size; provider errors, retries, and outage
  exclusions; blind verdicts with exact evidence spans; and human-audit status.
  Exclusive creation prevents reruns from overwriting pilot output.
- First-audio capture now waits until a running Web Audio clock reaches the
  scheduled onset, or until Web Speech emits `onstart`; it no longer counts a
  scheduling call as audible onset. Deterministic fixtures verify one-shot
  capture, suspended-context behavior, and cancellation without browser/TTS
  calls.
- Verification: `npx.cmd tsc --noEmit` passes; `npm.cmd test` passes 83 tests
  in 11 files, including manifest constraints, frozen-question preservation,
  condition labeling, dashboard fields, output/cache isolation, protected
  baseline paths, metric schema, verbatim judge evidence, and mocked first
  audio. No pilot, live chat, judge, TTS, browser generation, or external API
  call occurred; no dashboard was regenerated.

## Remaining

> Gate 2 and Gate 3 preparation are complete. Item 1 now means a separately
> authorized pilot-execution session, not more preparation. That session must
> first recheck the frozen hashes, use run label `rag-gate3-pilot-v1-r1`, stay
> within the 243-call manifest budget, complete the 13-record audit, and stop
> for a pilot go/no-go decision before any full 184-question evaluation.

> **RAG experiment handoff (Gate 2 complete, 2026-07-19):** the local rebuild
> produced exactly 279 vectors: 20 curated excerpts plus 259 eligible units
> (257 cards, two verified quotes). Per-philosopher corpus counts are Aquinas
> 52, Nietzsche 59, Kierkegaard 48, Sartre 52, and Camus 48. The generated
> artifact preserves every eligible unit's stable ID, philosopher, type,
> citations, provenance, status, and source path; all 52 pending quote
> candidates and 12 pending warnings remain excluded. The 74 tests prove
> eligibility, metadata, stale-vector fallback, A/B/C routing, philosopher and
> cache isolation, A default behavior, and C's corpus exclusion. The local
> Gate 2 check retrieves five known corrected cards at rank 1 or 2, rejects two
> unrelated plus all 23 frozen empty-support questions, and measures 30 fresh
> retrievals at p50 7.090 ms, p95 10.685 ms, max 16.437 ms (150 ms budget).
> `npx.cmd tsc --noEmit` and `npm.cmd test` pass. No live API call or pilot was
> run. Resume from `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md`; this proves
> readiness for pilot preparation, not that Condition B is beneficial.

1. **Execute the separately authorized Gate 3 pilot** — run one frozen
   repetition in A/B/C and compare held-out accuracy with first-token,
   first-audio, retrieval, and full-response latency. The decision rules are in
   [`run_stress_test_prompt.md`](run_stress_test_prompt.md#rag-gono-go-decision-rules).
   Use the frozen manifest, harness, run label, call budget, and audit sample
   above. Stop after the pilot for a go/no-go decision; do not begin the full
   184-question evaluation without separate approval.
2. **Harden contaminated persona prompts as Condition C** — correct known
   trap material without retrieval, especially pseudonym attribution,
   misattributed quotations, fake works, and “leap of faith.” Keep this as a
   separate condition so its cheap benefit is not credited to RAG.
3. **Resolve the remaining human-verification items** — the works-index label
   for *Works of Love*, the pending Sartre 1953 quote-bank entry, the suspected
   Camus “Paty” claim, and the suspected Nietzsche expulsion claim. The exact
   locations remain listed in the baseline handoff.
4. **Review the 42 stress-test card proposals** — proposals remain outside the
   live draft corpus until source-checked. Do not bulk-accept them merely
   because an agent proposed them.
5. **ElevenLabs key** — `.env.local` currently has no `ELEVENLABS_API_KEY`,
   so TTS runs on the browser Web Speech fallback. Add a key to exercise the
   ElevenLabs + Web Audio path end-to-end by ear.
6. **Browser listen-through** — the streaming voice path (now including
   duels) is verified by tests and API probes; a human end-to-end pass in the
   browser (gapless audio, barge-in via the stop button, hands-free
   auto-listen, and the `[latency]` console numbers) is still pending.

## Corpus progress (stage 1–2 of `rag_architecture.md`)

The full corpus remains **outside default runtime retrieval** and is available
only behind experimental Condition B. A conservative source-backed correction
pass is complete, but all cards remain `Status: draft` pending human editorial
verification:

- `data/rag/cards/drafts/*.md` — exactly 257 position cards across all five
  philosophers. All were structurally checked; 19 cards received substantive
  factual/fairness corrections and one additional card received a terminology
  cleanup. Do not duplicate that change list here; use the linked
  [`correction ledger`](../data/rag/review/corrections_2026-07-19.md).
- `data/rag/indexes/*.md` — works indexes, all five philosophers (draft).
- `data/rag/quotes/drafts/*.json` — verified-quote candidates with
  misattribution warnings, all five philosophers (all `pending` except two
  BGE quotes machine-verified against the ingested text).
- `data/rag/texts/nietzsche-beyond-good-and-evil-zimmern/` — **first ingested
  primary text**: 297 chunks (preface + aphorisms §1–296), Zimmern
  translation via `scripts/ingest-bge-zimmern.ts` (rerunnable; downloads from
  Gutenberg or takes a local path).

## Planned features

- **Photo reading companion** — upload a photo/screenshot of a book page; the
  passage is fuzzy-matched against the ingested canonical texts and glossed in
  persona with verified citations. Design and sequencing in
  [`photo_reading_companion.md`](photo_reading_companion.md). Gated on
  primary-text ingestion from [`source_strategy.md`](source_strategy.md)
  (minimum: one ingested work).

- **Per-philosopher stress-test agents** — ✅ **baseline run complete
  (2026-07-18/19).** One agent per philosopher studied SEP/IEP corpus-blind,
  froze a question bank, interrogated the live app (184 probes), and graded
  with pre-registered checks. Results, artifact map, and recommendations:
  [`stress_test_baseline_results.md`](stress_test_baseline_results.md).
  Headline: 95.3% severity-weighted (410/444 checks); 1 critical failure
  (a swallowed misattributed Nietzsche quote with a fabricated citation);
  the drafted corpus never surfaced in retrieval — it is not wired in.
  Frozen Wave-1 exam: `data/rag/eval/questions.json`; dashboard:
  `data/rag/stress/dashboard.html`; 42 draft card proposals await human
  review in `data/rag/stress/*/card-proposals.md` (none entered
  `cards/drafts/`). Spec: [`stress_test_agents.md`](stress_test_agents.md).
  The post-baseline factual card audit is recorded separately in the
  [`correction ledger`](../data/rag/review/corrections_2026-07-19.md). Next:
  conditions B (corpus-wired) and C (hardened prompts) per the eval contract
  in [`run_stress_test_prompt.md`](run_stress_test_prompt.md).

- **Gate 3 A/B pilot — complete through B, stopped before C (2026-07-20).**
  The repaired Condition B retrieved mapped support on 10/10 eligible pilot
  questions and injected nothing on all 23 deterministic empty-support probes.
  On the 27 hard questions, weighted accuracy was 76.97% for A and 84.24% for
  B, but a no-deep-corpus slice improved almost as much, so one-repetition
  variance prevents attributing the raw gain to RAG. B also failed the
  preregistered full-response p95 latency rule (1.181x A, limit 1.10x), so C
  was not run and no default-wiring decision was made. Operational detail and
  exact artifacts: `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md`; complete A/B
  caches: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r8/`.

## Verification tools

| Command | Proves |
| --- | --- |
| `npm test` | 87 tests pass: streaming helpers, retrieval/scoring and calibrated Condition B gating, generated-index integrity, A/B/C source and cache isolation, corpus eligibility/metadata, stale/cold fallbacks, and API behavior |
| `npx tsc --noEmit` | TypeScript validation; passes after Gate 2 completion |
| `npx tsx scripts/stream-demo.ts` | provider-level token streaming + timings |
| `npx tsx scripts/cache-check.ts` | prompt cache write/read token counts |
| `npx tsx scripts/retrieval-check.ts` | hybrid retrieval scores for probe queries vs. threshold |
| `npm run build:embeddings` | rebuilt 20 curated excerpts plus 259 eligible corpus units locally; current artifact SHA-256 is `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE` |
| `npm run check:rag-gate2` | local corrected-card top-three hits, unrelated/empty-support non-injection, philosopher/condition/cache isolation, and fresh-retrieval p50/p95/max against 150 ms |
| `npm run check:rag-gate3` | exact hard-pilot mapped recall (10/10) plus zero injection across all 23 frozen empty-support questions |
