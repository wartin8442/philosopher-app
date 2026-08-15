# Checkpoint — RAG scope narrowing + eval harness refactor

Date: 2026-07-23. Executes `docs/refactor_rag_scope_and_eval_harness_prompt.md`.

**Zero external spend.** No Anthropic call, no ElevenLabs call, no pilot
execution, no judge call, no TTS call, no embedding rebuild. No frozen exam,
manifest, baseline `results.json`, original dashboard, or `rag-gate3-pilot-v1-r*`
run directory was modified — verified by `npm run check:integrity` (all 9
protected hashes match the checkpoint's trusted references) and by mtime
inspection of `data/rag/stress/pilot-runs/` (newest write remains
2026-07-22T15:11:18, r10's death).

## Verification

- `npx tsc --noEmit` — pass.
- `npm test` — pass, 14 files / 115 tests (was 11 files / 87).
- `npm run check:integrity` — pass, 9/9 protected inputs unchanged.
- `npm run check:rag-gate2` / `check:rag-gate3` — **fail by design**, see below.

## Discrepancies found against the brief

1. **There are zero `misattribution_warning` units, not "some".** The type is
   declared in three files but no parser emits it; `scripts/rag-corpus.ts` has
   only `parsePositionCards` and `parseVerifiedQuotes`, and
   `scripts/rag-corpus.test.ts` already asserts the count is zero. The live
   narrowed corpus is therefore **2 units total** — both Nietzsche BGE
   quotations. Four of five philosophers now have an empty retrievable corpus.
   The raw material (12 `misattributions` + 4 `disputed` entries in
   `data/rag/quotes/drafts/*.json`) exists but is unparsed.
2. **The bounded misreading list already exists**, as `conditionCHardening()` in
   `src/lib/experiment-conditions.ts` — `COMMON_HARDENING` plus per-philosopher
   corrections covering the Ptolemy/sewer misattribution, "they muddy the
   waters", "leap of faith", Camus-is-not-an-existentialist, and pseudonym
   attribution. It is wired only into Condition C.
   **Decision (confirmed with the user): left C-only, not promoted to the
   always-on persona prompt.** Promoting it would make Condition C identical to
   A/B and silently retire an experimental arm that `STATUS.md` still lists as
   unrun — i.e. it would make an unmeasured default-wiring decision, which the
   brief's out-of-scope list forbids for B and which is no more authorized here.
   Phase 1 item 4's content requirement is satisfied by what already exists; the
   promotion is a separate, explicit decision.

## Phase 1 — retrieval scope (`src/lib/retrieval.ts`)

- Added `RETRIEVABLE_CORPUS_TYPES` = `{verified_quote, misattribution_warning}`.
  `position_card` is excluded from every condition.
- Added `retrievableCorpus()`. `sourcesForCondition` and `vectorsFor` both
  derive from it, so the source list and the index-aligned vector list cannot
  drift apart — that alignment is load-bearing (`vectors[i]` in the scoring
  loop) and would have been a silent mis-scoring bug otherwise.
- Filtering happens at read time, not index-build time, so
  `src/data/source-embeddings.json` stays byte-identical and the 257 cards
  remain on disk and inspectable, per the brief's item 4.
- `vectorsFor` no longer treats an empty corpus as staleness. It previously
  required `corpus.length > 0`; an empty retrievable corpus is now the normal
  case for four philosophers, and the old check would have silently dropped
  every one of them to keyword fallback with a spurious "stale embeddings"
  warning. A missing philosopher key is still a staleness signal.
- Thresholds **not changed**, and now carry an explicit uncalibrated warning
  naming why each element of the old calibration fails to transfer. Flagged, not
  silently reused, per the brief.
- Tests inverted rather than deleted: position cards are asserted *unretrievable*
  in every condition, the keyword-fallback test that expected
  `card:kierkegaard:kierkegaard-did-not-write-the-phrase-leap-of-faith` now
  asserts its absence, and new tests cover verified-quote retrieval and the
  empty-corpus case.

## Phase 2 — eval harness

**Resumability.** `RUN_LABEL` now reads `PILOT_RUN_LABEL` (committed default
unchanged). New `status` command reports, per condition, how many records are
cached and which record a resume would start at. Verified against the real r10
state, read-only: `A 27/27 · B 6, next sartre-q35:B:r1 · C 0` — exactly the
state that previously required abandoning the run and redoing 27 clean A records.

**Stop rules split into two classes** (`scripts/pilot-stop-rules.ts`, pure and
unit-tested):

- *Content anomaly* — any failed judge verdict, including a new critical failure
  vs. the immutable baseline. **Logged to `anomalies.json`, run continues.** This
  is the r9 behavior change: `sartre-q35/q35-c2` halted an entire run, and the
  same check later passed on a fresh sample of an identical zero-retrieval
  prompt. `assertConditionBSafety`'s halting critical check is gone.
- *Mechanism violation* — cross-philosopher leak, ineligible/unknown source,
  empty-support injection, mapped-support miss, ceiling exhaustion. **Pauses
  spend, preserves everything.** Writes `run-state.json`; `execute` refuses to
  start while paused; `resume "<what you fixed>"` clears it and requires a note.
- *Judgment call flagged:* mapped-support miss is not in the brief's mechanism
  list but is classified as one, because r5's instance was a live gating defect
  that would have misfired on every remaining record. Documented in the module.
- *Behavior change flagged:* the violating record is now **cached before**
  pausing. Previously the throw preceded `writeCached`, so r9's `sartre-q35`
  reply was charged and then lost unrecoverably. It is marked
  `b_safety.mechanism_violation` so analysis can exclude it.
- *Behavior change flagged:* the aggregate latency guardrail no longer throws.
  It runs only after all 27 B records are cached, so throwing never protected
  anything; it now writes `latency-guardrail.json` and sets a non-zero exit code.

**Killed-process recovery.** New `reconcile "<explanation>"` closes attempts a
dead process left `started` — r3 and r10 both died this way and both runs were
abandoned. Attempts are marked failed with the operator's explanation and still
count against the ceiling. `preflight` now reports stranded attempts instead of
treating them as a permanent bar.

**Lighter integrity verification.** `npm run check:integrity` replaces the
manual per-run-label ceremony with one command
(`scripts/protected-integrity.ts` + `check-protected-integrity.ts`,
baseline at `data/rag/eval/protected-hashes.json`). It covers all 9 protected
inputs and **its recorded hashes were cross-checked to match, exactly, the nine
trusted references written in `RAG_EXPERIMENT_CHECKPOINT.md`** — asserted in
`scripts/protected-integrity.test.ts` so the automated check stays anchored to
the same references the manual ritual used. `--record` is explicit and requires
`--force` to overwrite, so it cannot become a rubber stamp. Wired into
`preflight`.

**Human-review dashboard.** `npm run review [run-label]` — a loopback-only
`node:http` server (no new dependency), one record at a time, keyboard
navigable. Shows the real question, the full reply with evidence spans
highlighted, and per check: the frozen `pass_if`, severity, the judge's verdict
and `why`, and the span. Records **two independent decisions** per check:

1. is the verdict correct? (agree / disagree)
2. is the evidence actually probative? (probative / real-but-not-probative / no span)

kept separate precisely because `normalizeJudgeChecks` only proves a span is a
real substring, never that it supports the `pass_if` — a single approve/deny
click would not catch that, as the brief's appendix warns. Any denial requires a
reason; the server rejects a reasonless denial (verified). Decisions persist
immediately to `data/rag/review/decisions/<label>.json`. Nothing feeds back
automatically. Smoke-tested against r10's 33 cached records / 82 checks; the
test decision file was deleted afterwards.

## Phase 3 — recalibration scoping

Written to `docs/rag_narrowed_scope_recalibration.md`. Headline: **mapped
support drops from 10 questions to 1** (`nz-36` only). Three of the questions
that lose support (`aq-14`, `nz-19`, `kg-15`) map to *misattributions* — the
exact category this narrowing exists to serve — and are unretrievable only
because the parser doesn't exist. The frozen 27-question manifest is argued
unfit for the narrowed design and a smaller trap-focused, repeated question set
is recommended.

## Known consequence: Gate 2 and Gate 3 now fail

Both encode the old card-heavy scope (Gate 2's five positive probes all expect
specific cards; Gate 3 asserts vector alignment against the full indexed corpus,
4 vs 56 for Aquinas). They were **not repaired, because repairing them is the
recalibration Phase 3 explicitly defers.** Instead
`scripts/superseded-calibration-guard.ts` makes each fail immediately with a
paragraph explaining why and pointing at the recalibration doc, rather than with
a bare `AssertionError` that reads like a broken retriever. Delete the guard as
part of that future work.

## Second pass, same day — the misattribution gap closed

Authorized follow-on work. Still zero external API spend; the only protected
artifact touched is the generated embedding index, deliberately and re-recorded.

- **`parseMisattributionWarnings` added** to `scripts/rag-corpus.ts`. Eligibility
  gates on the same `verification` field verified quotes use, not on which array
  an entry sits in — so `disputed` is not categorically excluded and
  `misattributions` is not automatically admitted.
- **Seven warnings verified and admitted, eight left pending.** Verification was
  live search plus primary text, per the `stress_test_agents.md` contract, not
  parametric recall. Corpus is now **267 eligible units** (257 cards + 3 quotes
  + 7 warnings); retrievable is 10, up from 2. Sartre still has zero.
- **Embeddings rebuilt** — `93BC6915…` → `BF467BE6…`. Integrity baseline
  re-recorded. `protected-integrity.test.ts` no longer pins this generated file
  to a historical hash (that assertion claimed it must never be regenerated);
  the eight genuinely immutable references are still asserted exactly.
- **Thresholds re-measured:** true positives 0.7013 / 0.7721 / 0.7769 against a
  highest empty-support score of 0.3054 — a ~0.40 gap where the old corpus had
  ~0.075. Values unchanged at 0.67; the comment in `retrieval.ts` now carries
  the measurement instead of an "uncalibrated" warning.
- `npm test` 116 tests pass; tsc clean; integrity pass.

## The finding that matters most

**"They muddy the waters" is a genuine Nietzsche line, and the corpus, the
Condition C hardening text, and the frozen exam all said it wasn't.**

Verified against primary text: "sie trüben alle ihr Gewässer, daß es tief
scheine", *Also sprach Zarathustra* II, "Von den Dichtern". The quote draft and
the hardening string were corrected. The frozen exam was **not** — it is
immutable — but `nz-19-c1` is the project's *single baseline critical failure*,
the one behind the 95.3% headline and the concrete justification for the whole
RAG effort. The baseline reply's attribution ("that line is mine") was correct;
only its location ("Part One, On the Rabble" vs. Part Two, "On the Poets") was
wrong. The exam grades the correct half as a critical failure.

This turns the headline from a fabricated-quotation story into a wrong-section
story — a materially less alarming failure, and one the persona prompt already
guards against. Full detail in `docs/rag_narrowed_scope_recalibration.md` §5.2.

## Recommended next step

**Audit the 27 answer keys before any further pilot spend.** The exam's ground
truth has never been independently checked, and auditing exactly one quote
overturned the most load-bearing question in it. Everything downstream —
threshold tuning, A/B accuracy deltas, the go/no-go decision — inherits whatever
else is wrong in there. `nz-19` should be excluded or rewritten in any
replacement question set.
