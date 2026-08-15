# RAG experiment operational checkpoint

Last updated: 2026-07-22T20:43:00-04:00

## Current objective and gate

- **2026-07-22 late update:** a new session resuming this plan found that `rag-gate3-pilot-v1-r10` Condition B had already been run to partial completion by an untracked prior process before this checkpoint was updated to reflect it (see "r10 mandatory stop" below, at the end of the r9/r10 log). r10 is not resumable; it stopped identically to r9 at the seventh B record (`sartre-q35`), though with an unknown rather than a known-failed outcome, since the process died before a verdict existed. No further spend has occurred pending user direction.

- Objective (2026-07-22 session): r8 completed one clean A/B repetition (see "r8 A/B analysis" below) showing a weighted-accuracy gain for B that a difference-in-differences check could not clearly separate from one-repetition model/judge variance, and B failed the p95 full-response latency guardrail. Before any Condition C run or 184-question evaluation, the user authorized two additional independent single-repetition Condition A/B cycles on the same frozen 27-question hard pilot, under fresh run labels `rag-gate3-pilot-v1-r9` and `rag-gate3-pilot-v1-r10`, to check whether the accuracy gain is a stable signal across repetitions. This reuses the exact r8 runner code unmodified apart from the run-label constant (same pattern as every prior r1->r8 replacement), rather than rewriting the harness to natively support multi-repetition manifests, to avoid introducing a new bug class into code that only just produced a clean, safety-passing A/B pair. C is explicitly out of scope for r9/r10.
- Scope note: originally discussed as three repetitions (r9/r10/r11); the user narrowed this to two (r9, r10) to bound cost (~$10-17 estimated versus ~$15-25 for three) before any go/no-go decision. A third repetition and/or Condition C remain a separate, later authorization if r9/r10 leave the signal still ambiguous.
- Current gate: pre-spend zero-budget verification for r9. `scripts/run-pilot.ts` `RUN_LABEL` changed from `rag-gate3-pilot-v1-r8` to `rag-gate3-pilot-v1-r9` (narrow one-line change, no other runner logic touched). `npx tsc --noEmit` passed clean with this change. Full `npm test` and the Gate 2/Gate 3 checks, runner preflight, and browser-check have not yet been (re)run in this session.
- Each of r9 and r10 independently repeats the same protocol r8 used: zero-spend preflight, `execute A` (27 records), checkpoint, `execute B` (27 records; the aggregate p95 full-response latency guardrail will very likely fail again as it did in r8 — that is an already-documented systematic finding, not something repetition is expected to change, and a guardrail failure after B still leaves all 27+27 cache records intact for accuracy analysis). No `finalize`/`validate`/dashboard regeneration is expected for r9 or r10 individually; accuracy analysis will reuse the r8 approach (`scripts/summarize-pilot-ab.ts`) pointed at each run's cache directory, then compare all three A/B accuracy deltas (r8, r9, r10) for stability before any go/no-go recommendation. A human audit of disagreements and critical-check results across all three reps remains required before a decision, per the user's original next-step request.
- R1-r8 remain immutable and were not touched by this session. The full 184-question evaluation and Condition C remain unauthorized.

### r9 zero-spend preflight — PASS

- `npx tsc --noEmit` PASS (clean, no output). `npm test` PASS: 11 files, 87 tests. `npm run check:rag-gate2` PASS: five mapped-card probes rank 1 or 2 (unjust-law, leap-of-faith, capital-punishment, eternal-recurrence, prereflective-awareness), two unrelated plus all 23 frozen empty-support probes below injection, fresh retrieval over 30 probes p50 6.813ms / p95 14.478ms / max 35.359ms (150ms budget), local warm-up 1349.555ms reported separately. `npm run check:rag-gate3` PASS: mapped pilot recall 10/10, field-aware empty-support maximum 0.638650 (aq-18, below the 0.67 B-only threshold), local warm-up 805.846ms.
- `npx tsx scripts/run-pilot.ts preflight` reports run label `rag-gate3-pilot-v1-r9`, unchanged manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, ceilings answer 108 / judge 108 / TTS 108 / total 324, and zero attempts.
- Collision check: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r9` does not exist.
- `npx tsx scripts/run-pilot.ts browser-check` PASS: `{"state":"running","audio_clock_advanced":true}` against the user-started dev server on port 3000 (HTTP 200). No answer, judge, or TTS call was made.
- R9 usage remains answer 0/108, judge 0/108, TTS 0/108, total 0/324; retries 0; failures 0.
- Exact next action: run `npx tsx scripts/run-pilot.ts execute A` in the background outside any sandbox restriction (real Anthropic answer + judge calls and ElevenLabs TTS calls). On completion, verify 27 A cache records and exact stage usage, checkpoint, then run `execute B` (the aggregate p95 full-response latency guardrail will likely fail again as in r8 — expected, not a stop-and-abandon signal, since all 27+27 records are cached before that check runs). Then repeat the same zero-spend-preflight -> A -> B sequence under label `rag-gate3-pilot-v1-r10`. Do not start Condition C or the 184-question evaluation under either label.

### r9 Condition A — complete, clean

- `npx tsx scripts/run-pilot.ts execute A` ran in the background (detached; the task wrapper reported "exit code unknown/-1" after the process finished, which is a background-tracking artifact, not a failure — confirmed by the cache/ledger evidence below).
- Exactly 27 A cache records exist under `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r9/cache/A/`.
- Usage ledger ends at exactly ordinal 81 (27 records x 3 stages: answer, TTS, judge), every attempt `"status": "succeeded"`, zero failures, zero retries. Last record `sartre-q07:A:r1` completed `2026-07-22T12:26:08.149Z`.
- Per-record latencies are consistent with r8's clean A run (full response ~7-12s per record; first_token ~1.3-3.2s; first_audio ~2.4-12.3s).
- No final result file, audit file, or dashboard was written. Dev server (user-started, port 3000) remains active throughout and was not restarted by this session.
- Exact next action: run `npx tsx scripts/run-pilot.ts execute B` in the background outside any sandbox restriction. On completion, verify 27 B cache records, all mapped/empty-support/cross-philosopher safety checks passing, and note whether the aggregate p95 full-response latency guardrail throws (expected, per r8 precedent — a throw there still leaves all 54 A+B records cached and does not need repair before accuracy analysis). Then checkpoint and begin r9 accuracy analysis before moving to r10.

### r9 mandatory stop — new critical failure on Condition B, record 7

- `npx tsx scripts/run-pilot.ts execute B` ran in the background. Six B records completed and were cached cleanly: `kg-10`, `aq-14`, `kg-35`, `aq-17`, `aq-18`, `cam-25`. All mapped-support, empty-support, and cross-philosopher safety checks passed for these six.
- The seventh attempted record, `sartre-q35:B:r1`, completed its answer, TTS, and blind-judge stages (all three succeeded and are charged), then `assertConditionBSafety` threw `B STOP: new critical failure sartre-q35/q35-c2` and the run stopped immediately. No retry was attempted. The stopped record was not cached (the throw happens before `writeCached`), so its exact reply/evidence-span text is not persisted anywhere and cannot be recovered without a fresh attempt under a new record identity — this mirrors the precedent of r5's lost `cam-29` and r6's lost `aq-18`.
- What "new critical failure" means here, confirmed against the immutable original baseline (`data/rag/stress/sartre/results.json`): question `sartre-q35` asks about a documented 1953 Sartre quote on fascism. In the ORIGINAL baseline (Condition A), check `q35-c2` PASSED — the baseline reply declined to fabricate a citation for the (misattributed-by-the-user-in-the-question) line while still discussing the underlying idea, evidence span `"let me not fabricate a source"`. `q35-c1` already FAILED in the baseline (denying a quote the project's own pending quote-bank entry treats as likely genuine — a known, separate finding). In r9 Condition B, `q35-c2` flipped to FAIL: with corpus retrieval available, the app apparently did fabricate/misattribute a citation it previously correctly declined to invent. The exact fabricated text is not recoverable from any artifact (see above); only the check-ID-level fact is known.
- Exact cumulative r9 usage at stop: answer 34/108, judge 34/108, TTS 34/108 (34 = 27 complete A + 6 complete B + 1 charged-but-uncached stopped B record), total 102/324. All 34 attempts per stage succeeded; failures 0; retries 0. Complete cached records: 27 A + 6 B = 33.
- Significance for the go/no-go question: this is the SECOND independent run in which Condition B introduced a new critical-severity regression on a DIFFERENT question than the first. R8 found a new critical failure at `kg-05-c1`; r9 found one at `sartre-q35-c2`. Two different questions failing newly-critically across two independent single-repetition runs suggests Condition B may be introducing critical-severity harm inconsistently rather than this being a one-off fluke tied to a single bug — that pattern itself is evidence relevant to the pre-registered accuracy guardrail ("introduces no new critical failure"), which Condition B has now failed twice in two different ways.
- Post-stop integrity: this session did not modify any card, quote, index, frozen exam, baseline result, manifest, embedding artifact, or original dashboard; only `scripts/run-pilot.ts` (RUN_LABEL r8->r9, a one-line change) and this checkpoint were changed. R1-r8 remain untouched.
- Files/artifacts from this session: `scripts/run-pilot.ts` label change; this checkpoint; isolated `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r9/usage.json`; 27 A cache records; 6 B cache records.
- Exact next action: DO NOT resume, retry, or continue `rag-gate3-pilot-v1-r9`. Preserve it exactly as stopped. Await explicit user direction on how to proceed given a second, different-question critical regression under Condition B — options include (a) treating this as sufficient evidence to reject Condition B without further repetitions, (b) investigating the specific `sartre-q35` mechanism before any further spend, (c) still running r10 as a third data point, or (d) something else the user specifies. The originally authorized two-repetition plan (r9, r10) is not complete; r10 has not been started under any of its own budget.

### No-spend root-cause investigation of both known B regressions — 2026-07-22

- User asked whether the r8 (`kg-05-c1`) and r9 (`sartre-q35-c2`) regressions could be caused by bad corpus card content. Investigated both with zero additional API spend (local retrieval diagnostics + reading persisted transcripts/cards only).
- `sartre-q35` (r9): confirmed the disputed 1953 Rosenberg/fascism quote remains correctly excluded from the searchable index (still `"verification": "pending"` in `data/rag/quotes/drafts/sartre.json`; only 52 `position_card` units are indexed for Sartre, zero `verified_quote`). A live `POST /api/retrieve` with condition B and the exact frozen question text returned `"sources":[]` — zero retrieval. Reading `buildSystemPrompt`/`formatGrounding` (`src/lib/providers/llm.ts`, `src/lib/retrieval.ts`) confirms an empty grounding string contributes nothing to the prompt, so A and B received a structurally identical prompt for this question. Conclusion: this regression is NOT mechanically attributable to RAG/corpus content; it is most likely ordinary LLM sampling variance (no temperature=0 override) that happened to land on the B-labeled attempt.
- `kg-05` (r8): the cached B transcript shows a real retrieved card, `card:kierkegaard:the-attack-on-the-danish-state-church` (score 0.7310), whose own text never names Bishop Mynster or Martensen — it says only "a recently deceased bishop" and "a public eulogy," passive voice. r8's B reply mirrors that vagueness almost verbatim ("a bishop eulogized as 'a witness to the truth'"), while r8's own same-day Condition A reply (not grounded in this card) happened to name both Mynster and Martensen and passed the check. Conclusion: this regression IS a genuine, fixable corpus-card defect — the card should name both figures explicitly — not model variance.
- No code, card, or corpus file was changed by this investigation; it was read-only plus one local `/api/retrieve` call (no LLM/TTS spend). The Kierkegaard card fix remains proposed, not yet applied.
- User decision after reviewing this: continue testing to gather more data. Proceeding to r10 (the second repetition of the originally authorized two-repetition A/B plan) using the exact same unmodified protocol as r8/r9 (no safety-stop logic changed), so the comparison stays methodologically clean. If r10 also stops early on a new critical regression, that itself is informative about how often this occurs — the decision of whether to weaken/refine the hard-stop rule (e.g., only stop when sources were actually non-empty) remains open and unimplemented pending explicit authorization, since changing a pre-registered safety rule after seeing pilot data is a methodological risk that was flagged but not yet acted on.

### r10 zero-spend preflight — PASS

- `scripts/run-pilot.ts` `RUN_LABEL` changed from `rag-gate3-pilot-v1-r9` to `rag-gate3-pilot-v1-r10` (one-line change only; no other runner logic touched, including the safety-stop rules).
- `npx tsc --noEmit` PASS. `npm test` PASS: 11 files, 87 tests. `npm run check:rag-gate2` PASS (fresh retrieval p50 7.076ms / p95 14.913ms / max 21.075ms, within 150ms budget; all mapped/unrelated/empty-support probes behave as expected). `npm run check:rag-gate3` PASS (mapped pilot recall 10/10; empty-support field-aware maximum 0.638650 on aq-18, below the 0.67 B threshold).
- `npx tsx scripts/run-pilot.ts preflight` reports run label `rag-gate3-pilot-v1-r10`, unchanged manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, ceilings 108/108/108/324, zero attempts. Collision check: no `rag-gate3-pilot-v1-r10` path exists.
- `npx tsx scripts/run-pilot.ts browser-check` PASS: `{"state":"running","audio_clock_advanced":true}` against the same user-started dev server (port 3000, HTTP 200), which has remained up since r9 without restart.
- Exact next action: run `npx tsx scripts/run-pilot.ts execute A` in the background (real Anthropic + ElevenLabs spend). On completion verify 27 A cache records and usage, checkpoint, then run `execute B`. Any new-critical-failure stop, mapped/empty-support safety stop, or ceiling exhaustion remains a mandatory whole-run stop per the unmodified protocol.

### r10 Condition A — complete, clean

- `npx tsx scripts/run-pilot.ts execute A` ran in the background and exited cleanly (exit code 0). Exactly 27 A cache records exist under `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r10/cache/A/`.
- Usage ledger: exactly 81 attempts (27 answer + 27 TTS + 27 judge), all `"status": "succeeded"`, zero failures, zero retries.
- Exact next action: run `npx tsx scripts/run-pilot.ts execute B` in the background. On completion (or on any safety stop), verify cache records/usage and checkpoint before deciding next steps. Unmodified protocol; any new-critical-failure, mapped/empty-support, or cross-philosopher safety stop remains a mandatory whole-run stop with no retry/resume.

### r10 mandatory stop — process died mid-attempt on Condition B record 7 (discovered cold by a new session, not caused by it)

- A new session (this one) was asked to continue the r9/r10 plan by running r10's `execute B`. Before spending, it re-verified state and found `execute B` had **already been run to partial completion by an untracked prior process** — the run label, ceilings, and cache paths were untouched, but this checkpoint had not been updated past "r10 Condition A — complete, clean" to reflect it. No `execute B` command was issued by this session before this was discovered.
- Exactly six B records are cleanly cached under `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r10/cache/B/`: `kg-10`, `aq-14`, `kg-35`, `aq-17`, `aq-18`, `cam-25` — the identical six (same IDs, same order) that r9 also completed cleanly before its own stop. All read as ordinary succeeded attempts in `usage.json` (ordinals 82-99, 18 attempts, zero failures/retries).
- The seventh record, `sartre-q35:B:r1` — the exact record whose `q35-c2` check newly critically failed in r9 — has ordinal 100 in the ledger: stage `answer`, `status: "started"`, `started_at: 2026-07-22T19:11:18.675Z`, `completed_at: null`, `error: null`. No cache file exists for this record. The last modification anywhere under the r10 run directory is this ordinal; nothing has advanced since. No `run-pilot.ts`/`tsx`/Playwright process was found running (only the project's own long-lived `npm run dev` Next.js server, unrelated). This matches r3's exact failure signature: the process was killed or crashed after reserving the answer attempt but before it could be marked `succeeded` or `failed`.
- Because this is a charged-but-unresolved attempt, it cannot be repaired, retried, or reused in place, per the standing rule this project has followed at every prior stop (r3-r9). **r10 is preserved exactly as found and must not be resumed.** It is not known whether `sartre-q35` would have passed or failed under this attempt — the process died before an answer, judge verdict, or cache entry existed, so this is an incomplete run, not a third data point on the `sartre-q35` question.
- Exact r10 usage at this discovery: answer 82/108 (81 succeeded + 1 unresolved-started), judge 81/108 (all succeeded), TTS 81/108 (all succeeded), total 100/324. Failures 0; retries 0. Complete cached records: 27 A + 6 B = 33.
- No card, quote, index, frozen exam, baseline result, manifest, embedding artifact, or original dashboard was touched by this discovery; only this checkpoint was edited. R1-r9 remain untouched.
- Exact next action: none under `rag-gate3-pilot-v1-r10` — do not resume it. Continuing the multi-repetition comparison requires a fresh run label (e.g. `rag-gate3-pilot-v1-r11`) starting a full new A/B cycle, per the same replacement pattern used at every prior stop (r3->r4, r4->r5, ..., r8->r9). Current evidence available for stability analysis without further spend: one complete clean A/B pair (r8); two independent runs (r9 live, r10 apparently also, though unverified) that both stopped at the same seventh B record, `sartre-q35`, in two different ways (r9: completed and newly critically failed; r10: process died before completion, outcome unknown). Awaiting user direction before any further spend.

### Isolated sartre-q35 Condition B diagnostic — 2026-07-22, outside any pilot run budget

- User asked to investigate the recurring `sartre-q35` snag cheaply before authorizing another full A/B run. Ran exactly one fresh live Condition B answer call plus one fresh blind-judge call, isolated from any run label (throwaway scripts in the OS temp scratchpad, not the repo; no pilot cache/ledger touched).
- Live `POST /api/chat` with condition B and the exact frozen question again returned zero retrieved sources (`sources: []`), reconfirming the earlier read-only finding that this question never triggers corpus retrieval — A and B receive a structurally identical prompt here.
- Fresh reply attributed the quotation to "later political writing" / "remarks on the Russell Tribunal and the war in Vietnam" (anachronistic: the Russell Tribunal was the 1960s, not the actual 1953 Liberation/Rosenberg source) and explicitly declined to name a specific book.
- Fresh blind-judge verdicts: `q35-c1` (major) FAIL — wrong context, consistent with this question's known baseline major failure. `q35-c2` (critical) **PASS** — the reply did not attribute the line to a major book; judge evidence span `"comes from my later political writing"`.
- Three independent same-question, same-condition samples now exist for `q35-c2`: baseline/A pass, r9-B fail (the stopping-triggering sample), this fresh B sample pass. Combined with the zero-retrieval finding, this is consistent with the working conclusion already recorded above: the `sartre-q35` critical regression is ordinary LLM sampling variance on an ungrounded question (no `temperature: 0`), not a mechanism-level defect Condition B introduces. This is different in kind from the `kg-05` regression, which read-only inspection already traced to an actual under-specific corpus card (a genuine, fixable RAG-content defect).
- No protected artifact, run ledger, or cache was touched by this diagnostic. Total additional spend: 1 answer call + 1 judge call, outside every run's budget.
- Exact next action: still awaiting user direction on r11 (or another path) for the broader stability question; this diagnostic narrows what's uncertain but does not by itself resolve whether B's net accuracy gain is real, since `kg-05` remains a known genuine corpus defect and only one full clean A/B pair (r8) exists.

## 2026-07-20 handoff (superseded by the above; preserved for history)

- Objective: determine whether Condition B (deeper local corpus retrieval) produces enough accuracy/citation improvement to justify its complexity and voice latency versus Condition A (current baseline) and Condition C (compact prompt hardening).
- Current gate: Gate 3 retrieval repair passed deterministic calibration; replacement pilot r6 is at the zero-spend preflight boundary.
- The user authorized repairing RAG and rerunning the hard pilot. Run label `rag-gate3-pilot-v1-r6` inherits the r4 retry/fallback rules and ceilings: answer 108, judge 108, TTS 108, total 324, with 81 complete A/B/C records required. R1-r5 remain immutable; the full 184-question evaluation remains unauthorized.

## Gate 3 replacement pilot r6 retrieval repair — 2026-07-20

- Preserved r5 at its mandatory stop. No prior run, protected input, corpus card, quote, frozen exam, manifest, embedding artifact, baseline result, or dashboard was changed.
- Full pilot diagnosis showed the old `0.67` Condition B cutoff retrieved mapped support for only 5/10 questions with eligible mapped sources. All mapped sources were in the semantic top five, so the defect was confidence gating rather than indexing.
- Rejected lowering the global cutoff because it admits known empty-support matches. Also rejected a local cross-encoder reranker: it reached mapped rank 1 on 10/10 but measured 148.058ms median / 207.207ms p95 before embedding and did not score-separate every empty-support case.
- Implemented a Condition B-only hybrid acceptance gate in `src/lib/retrieval.ts`: original `>=0.67`; or `>=0.60` with semantic/BM25 top-two agreement; or `>=0.58` with a `>=0.08` semantic margin. A/C and the source index remain unchanged.
- Added deterministic coverage in `src/lib/retrieval.test.ts`, `scripts/rag-gate3-retrieval-check.ts`, and `npm run check:rag-gate3`; `scripts/reranker-diagnostic.ts` records the rejected reranker benchmark.
- Verification: TypeScript PASS; focused retrieval 16/16; full suite 11 files / 87 tests; Gate 2 PASS with 0/23 empty-support injections and fresh p95 12.265ms; Gate 3 PASS with mapped recall 10/10 and empty-support injection 0/23. Repair used zero answer, judge, or TTS calls.
- Protected hashes and r1-r5 ledger hashes all match immediately before r6 setup. R5 remains `BAF80FB6233218BA3DD75B6E21EB1DF340B1E424F1D92DDB2A10AE2D1FB29998`.
- R6 usage is zero; no r6 path existed before preflight.

### r6 zero-spend preflight — PASS

- Started a fresh project-owned dev server with captured logs; root route returned HTTP 200.
- Required sequence passed after setting the r6 label: TypeScript; full tests (11 files / 87 tests); Gate 2 (fresh p95 14.571ms, max 42.443ms); Gate 3 (10/10 mapped recall, 0/23 empty-support injection); runner preflight; browser check (`state=running`, advancing audio clock).
- Runner reports label `rag-gate3-pilot-v1-r6`, unchanged manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, ceilings 108/108/108 and 324 total, and zero attempts.
- Exact live `cam-29` Condition B `/api/retrieve` check returned the related rebellion/revolution card plus required mapped free-speech/death-penalty card in 68.443ms. One outside-budget TTS health request returned HTTP 200 `audio/mpeg`, 23,449 bytes. No answer or judge diagnostic call was made.
- Exact next action: reconfirm r6 collision/zero usage and execute Condition A outside the sandbox. On 27 complete A records, verify usage and checkpoint before B. Mandatory safety, ceiling, and third-attempt stops remain binding.

### r6 Condition A — complete, clean

- Completed all 27 A records. Exact cumulative usage: answer 27/108, judge 27/108, TTS 27/108, total 81/324; every attempt succeeded; retries, failures, unresolved attempts, and outage exclusions are zero.
- Exactly 27 A cache records exist; all use first-attempt `web-audio`. Usage ledger SHA-256 after A: `C87E3EC0F9F9490C8F4F718069E18377B6501F154E1058ABDB588DF5D415C78E`.
- No result, audit, validation, or dashboard artifact was finalized. Dev server remains active.
- Exact next action: execute Condition B outside the sandbox. The repaired retrieval must pass every mapped-support and empty-support safety assertion; any safety stop ends r6 without C.

### r6 mandatory stop — invalid single-record latency heuristic

- B cached four clean records (`kg-10`, `aq-14`, `kg-35`, `aq-17`) and then stopped after successful answer/TTS/judge calls for empty-support `aq-18` on `B STOP: material paired latency regression on aq-18`.
- R6 stopped with answer 32, judge 32, TTS 32, all succeeded; retries/failures/unresolved attempts zero. Caches: A 27, B 4, C 0. The charged uncached `aq-18` record prevents resume. Ledger SHA-256: `27D565FB3D139664E98BA6242097AD6BD32B1926F05F7A613743F3B46CE8BB41`.
- `aq-18` injected no source; therefore a single slower model response cannot be attributed to RAG. The registered latency guardrails are condition-level median and p95 comparisons, so the per-record stop was an unscientific harness heuristic.
- Preserved r6. Removed only the per-record latency heuristic and added post-B aggregate enforcement of the registered limits: median first-token/audio delta <=250ms and p95 first-token/audio/full ratio <=1.10 across all 27 non-outage pairs. Retrieval, empty-support, mapped-support, critical-regression, retry, and ceiling stops remain unchanged.
- User authorization to repair RAG and rerun the hard pilot carries to fresh label `rag-gate3-pilot-v1-r7` with the same 108/108/108, 324-total ceiling and 81 complete A/B/C target. Exact next action: zero-spend r7 verification and fresh A/B/C execution; never resume r6.

### r7 zero-spend preflight — PASS

- Under r7: TypeScript PASS; full suite 11 files / 87 tests PASS; Gate 2 PASS (fresh p95 10.956ms, max 24.144ms); Gate 3 PASS (10/10 mapped recall, 0/23 empty-support injection); runner preflight shows the unchanged manifest hash, zero attempts, and 108/108/108/324 ceilings; browser audio clock PASS.
- Collision check found zero r7 paths. The fresh project server and previously successful live retrieval/TTS health remain active; no additional diagnostic provider call was made.
- Exact next action: execute A, then verify/checkpoint; execute B and apply aggregate latency only after all B records; proceed to C only if B completes and its aggregate guardrail passes.

### r7 Condition A — complete, clean

- Completed 27/27 A records. Answer, judge, and TTS each have 27 first-attempt successes; failures, retries, unresolved attempts, and outage exclusions are zero. A cache count is 27.
- Ledger SHA-256 after A: `8B4839374F0BFBD0DBA1B100C80E6BB456A8339C48BDE75C5013C480F91CDD6E`.
- Exact next action: execute B; per-record retrieval/critical safety remains active, and aggregate latency is evaluated only after 27 B caches exist.

### r7 mandatory stop — incomplete curated-source allow-list

- B completed and cached nine records, including repaired `cam-29`, then stopped after successful calls for `kg-25` because the valid baseline source `source:kierkegaard:4` was absent from the runner's allow-list.
- R7 usage at stop: answer 37, judge 37, TTS 37, all succeeded; retries/failures/unresolved attempts zero. Caches: A 27, B 9, C 0. Ledger SHA-256: `5518F25B76D259E9CE81790816D639D1863BF014C5722D8C6483D029C7747D74`.
- Root cause: generated embedding rows for curated `philosophers.ts` excerpts contain hashes/vectors but no IDs; the safety allow-list was built only from indexed metadata-rich corpus rows. Runtime correctly constructs curated IDs as `source:<philosopher>:<1-based index>`.
- Preserved r7. Amended the runner allow-list to include those deterministic same-philosopher curated IDs while retaining cross-philosopher and unknown-source stops.
- Fresh replacement label is `rag-gate3-pilot-v1-r8` with the same authorized ceilings and required A/B/C output. Exact next action: zero-spend r8 verification, then fresh execution; never resume r7.

### r8 zero-spend preflight — PASS

- TypeScript and 87 tests pass; Gate 2 passes (fresh p95 14.771ms); Gate 3 passes (10/10 mapped, 0/23 empty); runner preflight reports r8, unchanged manifest, and zero attempts; browser audio passes; collision count is zero.
- Exact next action: execute fresh A, B, C with the corrected allow-list and aggregate latency rule.

### r8 Condition A — complete, clean

- Completed 27 A caches with exactly 81 first-attempt successful stage calls; retries/failures/unresolved attempts zero. Ledger SHA-256: `ED727252EF48843810A9DD75E9FB946340CFE0A373A3F7656F08E986F154D401`.
- Exact next action: execute B on the same server state; aggregate latency is evaluated after all 27 B records.

### r8 A/B complete — mandatory aggregate latency stop

- B completed and cached all 27 records with every mapped-support, empty-support, source-eligibility, cross-philosopher, and critical-regression safety check passing.
- Exact cumulative usage: answer 54, judge 54, TTS 54, all first-attempt successes; retries/failures/unresolved/outage exclusions zero. Caches: A 27, B 27, C 0. Ledger SHA-256: `2EC3CF30AA149F8C186A5CB5264D45982E5B9EBF8B66D065F2DB7786BD47B6FA`.
- Registered aggregate latency: median delta first-token `+70.611ms`, first-audio `-126.825ms`; p95 ratios first-token `0.9183`, first-audio `0.9519`, full-response `1.1813`. B failed only the p95 full-response <=1.10 rule.
- Per protocol, stopped before C. Do not resume r8, create C, finalize 81 records, validate, create a human audit, regenerate the dashboard, or start the 184-question evaluation. A/B caches are complete and valid for analysis; final A/B accuracy analysis is the next action.

### r8 A/B analysis — provisional, model-judged, not human-audited

- A: flat 49/68 (72.059%); weighted 127/165 (76.970%); critical 12/13, major 30/45, minor 7/10.
- B: flat 55/68 (80.882%); weighted 139/165 (84.242%); critical 12/13, major 36/45, minor 7/10. Raw deltas: +8.823 flat points and +7.272 weighted points.
- Held-out weighted rose 70.833% to 79.167% (+8.334 points; weighted error reduced 28.6%). Inspired weighted rose 81.720% to 88.172% (+6.452 points).
- Twelve B questions received deep corpus material. Their weighted score rose 75.000% to 82.895% (+7.895). The 15 questions receiving no deep corpus also rose 78.652% to 85.393% (+6.741), demonstrating large one-repetition model/judge variance. Difference-in-differences is only about +1.154 points; do not attribute the full raw gain causally to RAG.
- Concrete A->B improvements on deep-grounded checks: `kg-15-c3`, `kg-25-c2`, and both `cam-29` checks. Deep-grounded regression: `kg-05-c1`. Other flips occurred without deep corpus and are sampling variance, including `nz-19-c2` improving while the critical `nz-19-c1` remained failed.
- B retrieved mapped eligible support on 10/10 mapped questions and injected nothing on 10/10 pilot empty-support questions. Across the full deterministic calibration it remained 0/23 empty-support injections.
- Latency details: retrieval median A/B 52.863/85.075ms; first-token median 1510.163/1580.774ms; first-audio median 3601.531/3474.706ms; full median 8748.909/8222.807ms. P95 full rose 10211.910 to 12063.686ms (+18.1%) alongside p95 reply characters +14.0%; this failed the preregistered <=10% tail rule even though first-token/audio p95 improved.
- No human audit, source-entailment audit, C comparison, final result files, dashboard regeneration, or formal go/no-go decision exists. The local dev server was stopped. Protected hashes remain exact; final TypeScript and `git diff --check` pass.
- Recommended next authorization boundary: a three-repetition A/B-only confirmation on the same 27 questions, with human audit of all disagreements/critical results, before any 184-question run or default wiring decision. R8 itself must remain stopped.

## Gate 3 replacement pilot r5 integrity and diagnostics — 2026-07-20

- Re-read the active r4 stop checkpoint and inspected the current hardened runner before r5 mutation or spend.
- Recomputed all protected hashes; frozen exam, manifest, embeddings, five baseline `results.json` files, and original dashboard all exactly match their trusted references. Preserved ledgers are byte-identical: r1 `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`; r2 `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`; r3 `7D9588099A6BB4F80A342B18AE52AAF18E2013A96287C017D78243CA2176AC88`; r4 `1504A6947F595573EAF43C08F18D42316E6F06BC4CD718CAAAA660843D688827`.
- Collision check: no file or directory path containing `rag-gate3-pilot-v1-r5` exists. R5 run usage is answer 0/108, judge 0/108, TTS 0/108, total 0/324.
- The inherited process that produced r4's `APP_UNAUTHORIZED` response was gone and port 3000 was closed. Repository inspection confirms this app's `src/middleware.ts` contains rate limiting/security headers but no app-password or `APP_UNAUTHORIZED` behavior.
- Started a fresh project-owned `npm.cmd run dev` process outside the sandbox with hidden window and captured stdout/stderr in the job temp directory. The fresh server compiled this workspace and responds HTTP 200 on `http://127.0.0.1:3000/`.
- Authorized no-budget TTS diagnostic: exactly one POST with a short sentence and valid Camus ID returned HTTP 200, `audio/mpeg`, 50,199 bytes. The refreshed ElevenLabs key is functional; no fallback or retry was needed.
- Authorized no-budget app-auth diagnostic: exactly one short Condition A POST to `/api/chat` returned HTTP 200 with `application/x-ndjson` and a 1,405-byte streamed response. The r4 `APP_UNAUTHORIZED` boundary is absent on the fresh project server. This diagnostic consumed one answer-generation call outside the r5 run budget; no judge call was made.
- Diagnostic usage outside r5 budget: answer 1 succeeded; TTS 1 succeeded; judge 0. No diagnostic retry or failure occurred.
- No runner, protected artifact, prior-run ledger, corpus, or production source was changed during diagnostics. The fresh dev server is active and safe for r5.
- Exact next action: change only `scripts/run-pilot.ts` run label from r4 to r5, then run the full required zero-spend verification sequence in order. Reconfirm r5 path isolation and zero attempts immediately before `execute A` outside the sandbox.

### r5 zero-spend preflight — PASS

- Changed only `scripts/run-pilot.ts` `RUN_LABEL` from `rag-gate3-pilot-v1-r4` to `rag-gate3-pilot-v1-r5`. All r4 retry/fallback/ledger behavior, ceilings, and actual-date derivation remain unchanged.
- Mandatory commands ran in the required order and all passed: `npx.cmd tsc --noEmit`; `npm.cmd test` (11 files, 83 tests); `npm.cmd run check:rag-gate2` (mapped positives rank 1/1/1/2/1, all unrelated/23 empty-support probes below injection, fresh p50 64.034ms / p95 104.782ms / max 144.736ms after separately reported 2182.400ms warm-up, within 150ms); `npx.cmd tsx scripts/run-pilot.ts preflight`; `npx.cmd tsx scripts/run-pilot.ts browser-check` (`state=running`, advancing audio clock).
- Runner preflight reports label `rag-gate3-pilot-v1-r5`, manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, ceilings 108/108/108 and 324 total, and zero attempts.
- Immediately-before-spend checks: no r5 file or directory path exists; all protected hashes and r1/r2/r3/r4 ledger hashes still match; fresh project dev server responds HTTP 200.
- R5 run usage remains answer 0/108, judge 0/108, TTS 0/108, total 0/324; retries 0; failures 0. Diagnostics remain separate: one successful answer and one successful TTS call outside the r5 budget.
- Active processes: the fresh project-owned dev server is running outside the sandbox with captured logs. No verification runner/browser remains active.
- Exact next action: run `npx.cmd tsx scripts/run-pilot.ts execute A` outside the sandbox. If A completes, verify 27 cache records and exact stage usage before checkpointing and starting B. Any third-attempt failure, safety stop, or ceiling exhaustion remains a mandatory whole-run stop.

### r5 Condition A — complete, clean

- `npx.cmd tsx scripts/run-pilot.ts execute A` ran outside the sandbox and completed all 27 A records.
- Exact cumulative usage: answer 27/108 succeeded, judge 27/108 succeeded, TTS 27/108 succeeded, total 81/324. Failures 0; retries 0; unresolved attempts 0.
- Exactly 27 A cache records exist. All 27 report `first_audio_path: "web-audio"`; zero are outage-excluded. The refreshed ElevenLabs path succeeded on the first attempt for every record.
- R5 continuous ledger SHA-256 after A: `848DB66B1581576CC22E6647FDA2622D55E5465D2164BB1D705498B6B8A1835F`.
- No final result file, audit file, or dashboard was written. Protected inputs and prior ledgers remain unchanged.
- Active processes: A runner/browser exited cleanly; the fresh project dev server remains active with captured logs.
- Exact next action: run `npx.cmd tsx scripts/run-pilot.ts execute B` outside the sandbox. On completion verify 27 B cache records, cumulative 162 clean attempts if no retry occurs, and all B safety rules before checkpointing C.

### r5 mandatory stop — Condition B mapped support miss

- `npx.cmd tsx scripts/run-pilot.ts execute B` ran outside the sandbox. Seven B records completed and were cached: `kg-10`, `aq-14`, `kg-35`, `aq-17`, `aq-18`, `cam-25`, and `sartre-q35`.
- The eighth attempted B record, `cam-29:B:r1`, completed its answer, first-attempt ElevenLabs TTS, and inline judge calls, then triggered the pre-registered safety stop: `B STOP: no mapped eligible support retrieved; expected one of card:camus:free-speech-and-abolishing-execution-as-tests-of-honest-rebellion`.
- The stopped record was not cached. No further record was attempted and Condition C was not started.
- Exact cumulative r5 usage at stop: answer 35/108 succeeded, judge 35/108 succeeded, TTS 35/108 succeeded, total 105/324. Failures 0; retries 0; unresolved attempts 0. There are 34 complete cached records: 27 A and seven B. The three successful stage calls for the incomplete safety-stopped record remain charged and cannot be reused.
- R5 ledger SHA-256 at stop: `BAF80FB6233218BA3DD75B6E21EB1DF340B1E424F1D92DDB2A10AE2D1FB29998`.
- Artifacts at stop: 27 A cache records, seven B cache records, zero C cache records; no final r5 result files; no human-audit file; no validation; no dashboard regeneration. No go/no-go decision can be made from this incomplete paired run.
- Post-stop integrity: frozen exam, manifest, embeddings, five baseline result files, original dashboard, and r1/r2/r3/r4 ledgers all still match their protected hashes.
- The safety miss is substantive experimental evidence: for the exact `cam-29` pilot question, Condition B failed to retrieve the eligible mapped source required by the frozen manifest despite the local Gate 2 positive probe retrieving that card for a different query wording. Per protocol, B must be repaired or rejected before another full pilot.
- Files changed/written by r5: `scripts/run-pilot.ts` run label; this checkpoint; isolated r5 `usage.json`; 27 A cache records; seven B cache records. No protected artifact or prior-run ledger was modified.
- Exact next action: DO NOT resume, retry, finalize, validate, create the human-audit file, regenerate the dashboard, start Condition C, or begin the 184-question evaluation under `rag-gate3-pilot-v1-r5`. Diagnose and repair or reject the `cam-29` mapped-retrieval miss locally. Any replacement pilot requires a new run label/budget because r5 already charged successful answer/judge/TTS calls for an uncached required record; preserve r5 exactly.

#### No-spend local diagnosis — current Condition B rejected

- Ran the exact frozen `cam-29` question through the warm local Condition B retriever with the same embeddings, while requesting the unthresholded top ten only for diagnosis. No API/provider call occurred and no cache/result/protected artifact was changed.
- Rank 1 was `card:camus:rebellion-vs-revolution-a-crucial-distinction` at `0.650644`. The required mapped card `card:camus:free-speech-and-abolishing-execution-as-tests-of-honest-rebellion` ranked 2 at `0.566213`. Both are below the protected Condition B injection threshold `0.67`, so normal runtime correctly returns no source.
- The failure is not caused by `maxResults`: the mapped card is already rank 2, within runtime's top two. It is a semantic-score/threshold failure for the exact frozen wording.
- Lowering the global B threshold to `0.566213` is not a safe repair: Gate 2 calibration measured frozen empty-support false-positive maxima through `0.6387`. Such a threshold would knowingly violate the over-injection guardrail.
- Therefore current Condition B is rejected in its present form under the pre-registered pilot rule. A credible repair requires a mechanism change—such as independently justified query expansion/reranking or a better retriever—followed by fresh deterministic calibration proving both exact mapped-query recall and empty-support rejection. No such code or corpus change is authorized by the r5 run, and none was made.
- The project-owned r5 dev server was stopped; port 3000 is closed. No r5 process remains active.
- Exact next action: preserve r5 and choose separately whether to (a) authorize a retrieval-repair task followed by a newly labeled A/B/C pilot, or (b) reject deeper RAG and authorize a smaller clean evaluation of Condition C prompt hardening against A. Do not treat the incomplete r5 cache as a go/no-go result and do not begin the full evaluation.

## Gate 3 replacement pilot r4 Phase 0 integrity — 2026-07-19

- Completely read `docs/STATUS.md`, `docs/run_stress_test_prompt.md`, this checkpoint, `data/rag/eval/pilot-manifest.json`, `scripts/pilot-harness.ts`, and `scripts/run-pilot.ts` before mutation or r4 spend.
- Recomputed every protected hash and all match the checkpoint references: frozen exam `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`; manifest `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`; embeddings `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE`; Aquinas baseline `59C0F042009AC70319E7B87C9F4D44E35FB42C2551E777E51A915976745C2470`; Camus baseline `BC7BD73912D9EE9D74EE90D937F84F22EB686CEBA4F62647719A4EDDAA90E0E6`; Kierkegaard baseline `D6EC995DB6D30531CBD8B5D8F0081B1C584DF644CDD81ECFF13DD9B623E3A56A`; Nietzsche baseline `B65E825F1F0C782B8B2A8F05DF5DEF688AE9D29CFF22DADF5C7E357A694D7B58`; Sartre baseline `CD02C0F0540041105BBFB370DB3A7655191C54F0614891BEC26BDB7F1E0B7C7D`; original dashboard `725EF388F17A769FF4FC31BB8F3B00595C03DFD2FD3D057E40C41F611B3FC110`.
- Preserved ledger hashes also match exactly: r1 `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`; r2 `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`; r3 `7D9588099A6BB4F80A342B18AE52AAF18E2013A96287C017D78243CA2176AC88`. None was deleted, reused, repaired, or modified.
- The documented dirty worktree was inspected and preserved. No card, quote, index, frozen exam, baseline result, original dashboard, or embedding artifact was changed; embeddings were not rebuilt.
- Collision check: no file or directory containing `rag-gate3-pilot-v1-r4` exists.
- R4 usage remains answer 0/108, judge 0/108, TTS 0/108, total 0/324; retries 0; failures 0. The two Phase 1 diagnostics are explicitly outside the run budget and have not yet been made.
- Active processes: no process was started by this r4 session. The inherited dev server has not yet been contacted.
- Exact next action: run the one-call judge diagnostic outside the sandbox from a throwaway script in the job temporary directory. If it fails, record the full error and stop without retry. If it succeeds, run the one-call local TTS diagnostic outside the sandbox and record both outcomes under an `r4 diagnostics` heading before editing the runner.

### r4 diagnostics — complete (two external calls, outside run budget)

- Judge path: PASS outside the sandbox. A throwaway script at `C:\Users\willm\AppData\Local\Temp\rag-pilot-r4-judge-diagnostic.ts` loaded the configured provider and called `getLLMProvider().complete()` exactly once with a trivial one-word prompt and `maxTokens: 16`; it returned a non-empty five-character reply. Two earlier wrapper invocations failed locally before importing the provider (first CJS top-level-await transformation, then invalid Windows ESM URL); neither reached `getLLMProvider()` or made an external call.
- TTS path: WARNING outside the sandbox. Exactly one POST to `http://127.0.0.1:3000/api/tts` with a short sentence and valid `philosopherId: camus` returned HTTP 502 with `{"error":"Speech synthesis unavailable."}`. An earlier PowerShell invocation failed parameter binding before sending an HTTP request.
- Underlying TTS error check: the inherited dev server's owning console is not attached to this session and no Next/dev stdout or stderr log exists in the repo or recent job-temp files. Process command-line inspection was denied by the host, and the available Codex session logs contained no `ElevenLabs error <status>` console line. Source inspection confirms `/api/tts` logs the provider stack only to the owning console and deliberately returns the generic 502 body. Therefore the exact upstream ElevenLabs status/body is unavailable from this session; the observed operational fact is the repeatable server-side provider failure represented by HTTP 502. No extra provider request was made to infer it.
- Diagnostic external usage is exactly two calls total: judge 1 succeeded; TTS 1 returned 502. These calls are explicitly outside the r4 run budget. R4 ledger usage remains answer 0/108, judge 0/108, TTS 0/108, total 0/324.
- Active processes: the throwaway scripts and diagnostics have exited. The inherited dev server remains responsive and external to this session.
- Exact next action: edit only `scripts/run-pilot.ts` for the authorized r4 label/date, 108-per-stage and 324-total ceilings, at-most-two ledgered retries with 2s/8s backoff and `retry_of`, TTS 502/network fallback to Web Speech, passive first-audio rejection handling, retry/outage metadata, and Condition B latency exclusion. Then run the prescribed zero-spend verification sequence in exact order.

### r4 runner amendments and zero-spend preflight — PASS

- Changed only `scripts/run-pilot.ts` for runner behavior: run label `rag-gate3-pilot-v1-r4`; execution date derived in America/New_York; stage ceilings 108/108/108 and total 324; at most two retries after failure with 2s then 8s backoff; every retry receives a new ledger row whose `retry_of` points to the preceding failed ordinal; answer and judge retries are ledgered independently; TTS HTTP 502/network failures retry twice then use Web Speech in the measurement browser; the first-audio promise receives an immediate passive rejection handler while retaining the original promise for the real await; answer completion is ledgered before the separate audio await; answer/TTS retries set exact retry metadata and `outage_excluded: true` with reason `retried attempt; latency not comparable`; Condition B's paired latency stop skips a retried current record or an outage-excluded A pair. Judge remains inline.
- No `scripts/pilot-harness.ts` schema, manifest, frozen input, production default, app source, corpus, embedding, baseline result, or original dashboard was changed.
- Mandatory zero-spend commands ran in the required order and all passed: `npx.cmd tsc --noEmit` PASS; `npm.cmd test` PASS (11 files, 83 tests); `npm.cmd run check:rag-gate2` PASS (five mapped positives rank 1/1/1/2/1, two unrelated plus all 23 empty-support probes below injection, fresh retrieval p50 8.872ms / p95 30.750ms / max 33.883ms after separately reported 1478.574ms warm-up); `npx.cmd tsx scripts/run-pilot.ts preflight` PASS; `npx.cmd tsx scripts/run-pilot.ts browser-check` PASS (`state=running`, advancing audio clock).
- Preflight reports run label `rag-gate3-pilot-v1-r4`, unchanged manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, ceilings answer 108 / judge 108 / TTS 108 / total 324, and zero attempts.
- Immediately-before-spend collision check: no file or directory path containing `rag-gate3-pilot-v1-r4` exists. All protected hashes and the r1/r2/r3 ledger hashes were recomputed again and remain exact matches.
- R4 run usage remains answer 0/108, judge 0/108, TTS 0/108, total 0/324; retries 0; failures 0. The two diagnostics remain separately reported outside the run budget.
- Active processes: no verification command or measurement browser remains active. The inherited dev server remains responsive and external to this session.
- Exact next action: run `npx.cmd tsx scripts/run-pilot.ts execute A` outside the sandbox. If any stage reaches a third-attempt failure or any ceiling/Condition B stop fires, preserve the ledger, checkpoint, and stop. If A completes, verify 27 A cache records and exact usage/retry/failure counts, then checkpoint before Condition B.

### r4 Condition A — complete

- `npx.cmd tsx scripts/run-pilot.ts execute A` ran outside the sandbox and completed all 27 required A records. Exactly 27 isolated cache records exist under `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r4/cache/A/`; no final result file has been written yet.
- Continuous r4 ledger: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r4/usage.json`; SHA-256 after A `CD8A851E8C40DC802B6B6B6DCC449E54290EB1AED65C664E4A9FF50084149747`.
- Exact A/cumulative usage after A: answer 27/108 succeeded, 0 failed, 0 started; judge 27/108 succeeded, 0 failed, 0 started; TTS 81/108 attempts comprising 27 succeeded and 54 failed HTTP-502 attempts; total 135/324. Retry rows: 54, with zero invalid links; every `retry_of` points to the preceding failed TTS attempt for the same stage and record.
- All 27 records followed the same operational path: first and second TTS attempts returned HTTP 502, the third attempt succeeded through the measurement browser's Web Speech fallback. All 27 cache records report `first_audio_path: "web-speech"`, `provider.retries: 2`, `outage_excluded: true`, and exact reason `retried attempt; latency not comparable`. Checks remain valid but all A records are excluded from paired latency conclusions.
- No answer or judge retry/failure occurred. No third-attempt stage failure occurred. Some Web Speech `onstart` measurements were very delayed, but the records are already outage-excluded and the stage completed rather than failing.
- Preserved ledgers remain byte-identical: r1 `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`; r2 `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`; r3 `7D9588099A6BB4F80A342B18AE52AAF18E2013A96287C017D78243CA2176AC88`.
- Remaining r4 headroom is answer 81, judge 81, TTS 27, total 189 attempts. Because the TTS provider has persistently required two retries per record, only nine additional records can complete on the same pattern before the mandatory TTS ceiling is exhausted; this is an operational risk, not permission to alter the ceiling or skip retries.
- Active processes: Condition A runner and its browser exited cleanly. The inherited dev server remains external and responsive.
- Exact next action: run `npx.cmd tsx scripts/run-pilot.ts execute B` outside the sandbox. Condition B latency-regression comparisons must skip the outage-excluded A pairs and any retried B record. On any B safety stop, third-attempt failure, or ceiling exhaustion, preserve the ledger/cache, checkpoint, and stop without starting C.

### r4 mandatory stop — Condition B first record

- `npx.cmd tsx scripts/run-pilot.ts execute B` ran outside the sandbox. The first deterministic B record was `kg-10:B:r1`.
- Answer attempt ordinal 136 failed at `2026-07-20T16:26:05.828Z` with `Answer HTTP 401: {"error":"Unauthorized. Enter the app password.","code":"APP_UNAUTHORIZED"}`. After the required 2-second backoff, retry ordinal 137 (`retry_of: 136`) failed with the same error. After the required 8-second backoff, third attempt ordinal 138 (`retry_of: 137`) failed with the same error at `2026-07-20T16:26:16.025Z`.
- This is the record's third total answer-stage failure and therefore a mandatory permanent stop for the whole r4 run. No further retry or record was attempted. Condition C was not started.
- Exact cumulative r4 usage at stop: answer 30/108 attempts = 27 succeeded, 3 failed, 0 started, 2 retries; judge 27/108 = 27 succeeded, 0 failed, 0 started, 0 retries; TTS 81/108 = 27 succeeded, 54 failed, 0 started, 54 retries; total 138/324. Failures by stage are answer 3, judge 0, TTS 54. Successful complete records are 27/81, all Condition A.
- R4 ledger: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r4/usage.json`; stopped SHA-256 `1504A6947F595573EAF43C08F18D42316E6F06BC4CD718CAAAA660843D688827`.
- Artifacts at stop: 27 A cache records; zero B cache records; zero C cache records; no final `results-pilot-rag-gate3-pilot-v1-r4-*.json` files; no human-audit file; no regenerated dashboard. The incomplete B record was not cached.
- All 27 completed A records have two TTS retries, Web Speech first-audio path, and latency outage exclusion. No mechanism-level latency comparison can be made from r4 because B and C produced no complete records.
- Post-stop integrity: frozen exam, manifest, embeddings, five baseline `results.json` files, and original dashboard all still match their protected hashes. Preserved ledgers remain byte-identical: r1 `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`; r2 `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`; r3 `7D9588099A6BB4F80A342B18AE52AAF18E2013A96287C017D78243CA2176AC88`.
- Files changed/written by r4: `scripts/run-pilot.ts`; this checkpoint; the isolated r4 `usage.json`; and 27 isolated Condition A cache records under `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r4/cache/A/`. The diagnostic throwaway script remains outside the repository in the job temp directory. No protected input or prior-run ledger was modified.
- Active processes: the failed B runner and measurement browser exited. No r4 command remains active. The inherited dev server remains external to this session.
- Exact next action: DO NOT resume, retry, finalize, validate, create the human-audit file, regenerate the dashboard, start Condition C, or begin the 184-question evaluation under `rag-gate3-pilot-v1-r4`. Await explicit user direction. Any replacement pilot requires diagnosis of the app-password 401 boundary plus a new run label/budget; r4's honest stopped ledger and cache must remain preserved.

## Gate 3 clean replacement r3 initial verification — 2026-07-19

- Completely reread `docs/STATUS.md`, `docs/run_stress_test_prompt.md`, this checkpoint, `data/rag/eval/pilot-manifest.json`, `scripts/pilot-harness.ts`, and `scripts/run-pilot.ts` before mutation or r3-budget spend.
- Recomputed every protected hash; all match the trusted references: frozen exam `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`; manifest `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`; embeddings `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE`; Aquinas baseline `59C0F042009AC70319E7B87C9F4D44E35FB42C2551E777E51A915976745C2470`; Camus baseline `BC7BD73912D9EE9D74EE90D937F84F22EB686CEBA4F62647719A4EDDAA90E0E6`; Kierkegaard baseline `D6EC995DB6D30531CBD8B5D8F0081B1C584DF644CDD81ECFF13DD9B623E3A56A`; Nietzsche baseline `B65E825F1F0C782B8B2A8F05DF5DEF688AE9D29CFF22DADF5C7E357A694D7B58`; Sartre baseline `CD02C0F0540041105BBFB370DB3A7655191C54F0614891BEC26BDB7F1E0B7C7D`; original dashboard `725EF388F17A769FF4FC31BB8F3B00595C03DFD2FD3D057E40C41F611B3FC110`.
- Reconfirmed generated-index invariants: version 2; model `Xenova/all-MiniLM-L6-v2`; 384 dimensions; 20 curated excerpts plus 259 eligible corpus units; exactly 257 `position_card` and two `verified_quote`; total 279. Per-philosopher eligible counts remain Aquinas 52, Nietzsche 59, Kierkegaard 48, Sartre 52, and Camus 48.
- `npx.cmd vitest run scripts/rag-corpus.test.ts` PASS: one file, three tests. Embeddings were not rebuilt.
- Inspected the dirty worktree and preserved all tracked/untracked user changes. No reset, cleanup, or unrelated edit was performed.
- Collision/cache check: no r3 run directory, result file, cache, or other path containing `rag-gate3-pilot-v1-r3` exists.
- Preserved r1 ledger remains exactly three attempts for `cam-29:A:r1`: answer succeeded, TTS succeeded, judge failed `Connection error.`; SHA-256 `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`.
- Preserved r2 ledger remains exactly three attempts for `cam-29:A:r1`: answer succeeded, TTS succeeded, judge failed `Connection error.`; SHA-256 `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`.
- Prior operational usage is therefore r1: 3 attempts and r2: 3 attempts, six total outside r3. Fresh r3 usage remains answers 0/81, judges 0/81, TTS 0/81, total 0/243; retries 0; failures 0.
- Root-cause control: all three `execute` commands must run outside the sandbox so the runner's direct Anthropic blind-judge call can reach the network. No connectivity probe or r3 attempt may be made from the sandbox.
- Active processes: none started by this r3 resumption. The inherited development server has not yet been contacted.
- Exact next action: change only `scripts/run-pilot.ts` `RUN_LABEL` from `rag-gate3-pilot-v1-r2` to `rag-gate3-pilot-v1-r3` and its hardcoded run date from `2026-07-19` to the actual execution date if needed; then run the complete zero-budget preflight sequence before any unsandboxed `execute A` invocation.

### Gate 3 clean replacement r3 zero-budget preflight — PASS

- Narrow execution-plumbing change completed: `scripts/run-pilot.ts` line 31 changed only from `rag-gate3-pilot-v1-r2` to `rag-gate3-pilot-v1-r3`. The hardcoded run date remains `2026-07-19`, the actual local execution date. No other runner behavior, frozen input, production default, protected artifact, or preserved ledger was changed.
- Mandatory checks completed in the required order before r3 spend: `npm.cmd run check:rag-gate2` PASS (positive mapped-card ranks 1/1/1/2/1; unrelated and all 23 empty-support probes below injection; fresh retrieval p50 6.731ms, p95 16.357ms, max 31.053ms after separately reported 1377.347ms warm-up); `npx.cmd tsc --noEmit` PASS; `npm.cmd test` PASS (11 files, 83 tests); `npx.cmd tsx scripts/run-pilot.ts preflight` PASS; `npx.cmd tsx scripts/run-pilot.ts browser-check` PASS (`state=running`, advancing audio clock).
- Runner preflight reports run label `rag-gate3-pilot-v1-r3`, manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, ceilings answer 81 / judge 81 / TTS 81 / total 243, and zero attempts.
- The inherited development server responds HTTP 200 on `127.0.0.1:3000`. `.env.local` contains nonempty Anthropic and ElevenLabs keys; presence only was checked and no value was printed or copied.
- Immediately-before-spend collision check remains clear: no r3 output, cache, run directory, or usage ledger exists. R1 and r2 ledger hashes remain unchanged at `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC` and `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`.
- Fresh r3 usage remains answers 0/81, judges 0/81, TTS 0/81, total 0/243; retries 0; failures 0. Prior operational usage remains r1 3 and r2 3, separately preserved.
- Active processes: no preflight command or browser remains active. The inherited development server remains external to this session and responsive.
- Exact next action: run only `npx.cmd tsx scripts/run-pilot.ts execute A` with sandboxing disabled so the runner's direct blind-judge Anthropic request has outbound network access. If any A stage fails, preserve the charged ledger, checkpoint, and stop without retry or continuation. If A completes, verify 27 A cache records and exactly 27 answer + 27 judge + 27 TTS attempts before checkpointing and proceeding to B.

### Material r3 TTS failure and mandatory stop — Condition A

- The exact `npx.cmd tsx scripts/run-pilot.ts execute A` invocation was run outside the sandbox as explicitly authorized. The first scheduled record was `cam-29:A:r1`.
- Continuous ledger: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r3/usage.json`; SHA-256 after stop `7D9588099A6BB4F80A342B18AE52AAF18E2013A96287C017D78243CA2176AC88`.
- Attempt 1 answer: reserved and started `2026-07-20T00:57:35.770Z`. The TTS promise rejected while the answer stream was still active, causing the runner process to terminate before the answer attempt could be marked succeeded or failed. Its ledger status therefore remains `started`; it is charged and must not be reused or repaired in place.
- Attempt 2 first-sentence TTS/first-audio: started `2026-07-20T00:57:38.562Z`, failed `2026-07-20T00:57:38.835Z` with `page.evaluate: Error: TTS HTTP 502: {"error":"Speech synthesis unavailable."}`. Exactly one TTS request was made. This is a material r3 stage failure.
- No blind-judge attempt was reserved or made, so the unsandboxed judge path was not reached. No retry was attempted. Condition B and C were not started.
- Charged r3 usage at stop is answers 1/81 (unresolved `started`), blind judges 0/81, first-audio/TTS 1/81 (failed), total 2/243; successful attempts 0; failed attempts 1; unresolved started attempts 1; retries 0.
- The incomplete record was not cached. R3 has zero cache files, zero result files, and no human-audit artifact. The only r3 artifacts are its isolated run directory and `usage.json`; no exclusive result path was created or overwritten, and the dashboard was not regenerated.
- The r3 runner exited with code 1. No `run-pilot.ts` process or Playwright `chrome-headless-shell` process remains active. The inherited development server remains external to this session and was not stopped.
- Preserved prior operational ledgers remain unchanged: r1 SHA-256 `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`, three attempts; r2 SHA-256 `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`, three attempts. Operational usage is r1 3, r2 3, r3 2, separately reported; eight attempts total across the three stopped runs.
- Post-stop integrity recheck: the frozen exam, frozen manifest, embedding artifact, five baseline `results.json` files, and original dashboard all still match their protected hashes. The frozen manifest, exam, embeddings, corpus, baseline results, original dashboard, production-default condition, and preserved r1/r2 ledgers remain unmodified.
- Exact next action: DO NOT resume, retry, finalize, validate, audit, regenerate the dashboard, or start B/C under `rag-gate3-pilot-v1-r3`. Await explicit user direction. Because the exact r3 stage ceilings have already charged one answer and one TTS attempt without producing the required record, a complete 81-record r3 pilot is no longer possible under the authorized ceilings. Any replacement run or TTS diagnosis requires separate authorization and a new run label/budget; no connectivity or TTS test should be charged to r3.

## Gate 3 clean replacement r2 preflight — 2026-07-19

- Completely reread `docs/STATUS.md`, `docs/run_stress_test_prompt.md`, this checkpoint, `data/rag/eval/pilot-manifest.json`, `scripts/pilot-harness.ts`, and `scripts/run-pilot.ts` before mutation or new-budget spend.
- Recomputed every protected checkpoint hash; all match: five baseline `results.json` files, original `dashboard.html`, frozen `questions.json`, frozen `pilot-manifest.json`, and generated `source-embeddings.json`.
- Preserved r1 ledger hash: `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC`. Its prior operational usage remains answer 1 succeeded, TTS 1 succeeded, judge 1 failed, total 3; it was not deleted, overwritten, reused, or modified.
- Reconfirmed generated-index invariants: schema version 2; 20 curated excerpts plus 259 eligible corpus units; exactly 257 `position_card` and two `verified_quote`; per-philosopher corpus counts Aquinas 52, Nietzsche 59, Kierkegaard 48, Sartre 52, Camus 48.
- `npx.cmd vitest run scripts/rag-corpus.test.ts` PASS: one file, three tests. Embeddings were not rebuilt.
- Inspected the dirty worktree and preserved all tracked/untracked user changes. No reset, cleanup, or unrelated edit was performed.
- Collision/cache check: no r2 run directory, result file, cache, or other path containing `rag-gate3-pilot-v1-r2` existed before plumbing update.
- Narrow execution-plumbing change: `scripts/run-pilot.ts` run label changed only from `rag-gate3-pilot-v1-r1` to `rag-gate3-pilot-v1-r2`; frozen inputs and production defaults are unchanged.
- Fresh r2 usage: answers 0/81; blind judges 0/81; first-audio/TTS 0/81; total 0/243; retries 0; failures 0. Prior r1 operational usage remains separately reported as 3 attempts.
- Active processes: no command started by this resumption remains active. The inherited local server has not been contacted during r2 preflight.
- Mandatory no-spend preflight completed in the required order: `npm.cmd run check:rag-gate2` PASS (corrected-card ranks 1/1/1/2/1; all unrelated and 23 empty-support probes below injection; fresh retrieval p50 6.741ms, p95 13.486ms, max 16.627ms; warm-up 997.212ms); `npx.cmd tsc --noEmit` PASS; `npm.cmd test` PASS (11 files, 83 tests).
- Runner-local checks: `npx.cmd tsx scripts/run-pilot.ts preflight` reports run label `rag-gate3-pilot-v1-r2`, manifest hash `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, and zero attempts; `browser-check` PASS with a running AudioContext and advancing audio clock. Neither check made an external answer, judge, or TTS call.
- Immediately-before-spend r2 usage remains answers 0/81; blind judges 0/81; first-audio/TTS 0/81; total 0/243; retries 0; failures 0. No r2 cache or result exists.
- Exact next action: execute Condition A only with `npx.cmd tsx scripts/run-pilot.ts execute A`. If any r2 external attempt fails, preserve the continuously written ledger and stop without retrying or continuing. If A completes, validate its 27 cache records and 81 charged attempts, checkpoint, then proceed to Condition B.

### Material r2 provider failure and mandatory stop — Condition A

- First scheduled r2 record: `cam-29:A:r1` (the unchanged deterministic order).
- Continuous ledger: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r2/usage.json`; SHA-256 after stop `BC18056559FBA4A537646569A7B7DCE275BB4305140CA85E9242D0062C8A9D21`.
- Attempt 1 answer: started `2026-07-20T00:29:16.621Z`, succeeded `2026-07-20T00:29:26.394Z`.
- Attempt 2 first-sentence TTS/first-audio: started `2026-07-20T00:29:19.197Z`, succeeded `2026-07-20T00:29:20.238Z`; exactly one TTS request was made.
- Attempt 3 blind judge: started `2026-07-20T00:29:26.398Z`, failed `2026-07-20T00:29:27.896Z` with configured-provider error `Connection error.`.
- No retry was attempted. The runner exited immediately; Condition B and C were never started. Charged r2 usage at stop is answers 1/81, blind judges 1/81 (failed), first-audio/TTS 1/81, total 3/243; successful attempts 2; failed attempts 1; retries 0; outage-contaminated incomplete records 1.
- The incomplete record was not cached. R2 has zero cache files, zero result files, and no human-audit artifact. No exclusive output path was created or overwritten, and the dashboard was not regenerated.
- Continuing cannot produce the required 81 complete records under the exact stage ceilings: the uncached `cam-29:A:r1` record would need all three stages again, requiring 82 attempts per stage for a complete pilot. The explicit instruction independently requires stopping on the failed attempt.
- Prior operational usage remains separate and preserved: r1 ledger SHA-256 is still `DE93E9DE35E6338E9E9CCF635294B14586DCC6CC4B7A7810C6D4AA898AFC66DC` with its original three attempts. Combined operational usage across aborted r1 and stopped r2 is six attempts, while the freshly authorized r2 budget alone consumed three.
- Post-stop integrity recheck: all five baseline result hashes, original dashboard hash, frozen exam hash, manifest hash, and embedding hash still match the checkpoint references. The frozen manifest, exam, embeddings, corpus, baseline results, original dashboard, production-default condition, and r1 ledger remain unmodified.
- Active processes: the r2 runner and its measurement browser exited; no command or browser started by the runner remains active. The inherited development server was not stopped.
- Exact next action: DO NOT resume, retry, finalize, validate, audit, regenerate the dashboard, or start B/C under `rag-gate3-pilot-v1-r2`. Await explicit user direction. A complete replacement would require another new run label and fresh budget; changing providers or repairing judge connectivity would be a separate diagnostic task and must not spend either preserved run's budget.

## Gate 3 execution-session preflight — 2026-07-19

- Completely reread `docs/STATUS.md`, `docs/run_stress_test_prompt.md`, this checkpoint, and `data/rag/eval/pilot-manifest.json` before any mutation or live call.
- The user explicitly authorized adopting the following recomputed SHA-256 values as the trusted frozen baseline references; every value MATCHED:
  - `data/rag/stress/aquinas/results.json`: `59C0F042009AC70319E7B87C9F4D44E35FB42C2551E777E51A915976745C2470`
  - `data/rag/stress/camus/results.json`: `BC7BD73912D9EE9D74EE90D937F84F22EB686CEBA4F62647719A4EDDAA90E0E6`
  - `data/rag/stress/kierkegaard/results.json`: `D6EC995DB6D30531CBD8B5D8F0081B1C584DF644CDD81ECFF13DD9B623E3A56A`
  - `data/rag/stress/nietzsche/results.json`: `B65E825F1F0C782B8B2A8F05DF5DEF688AE9D29CFF22DADF5C7E357A694D7B58`
  - `data/rag/stress/sartre/results.json`: `CD02C0F0540041105BBFB370DB3A7655191C54F0614891BEC26BDB7F1E0B7C7D`
  - `data/rag/stress/dashboard.html`: `725EF388F17A769FF4FC31BB8F3B00595C03DFD2FD3D057E40C41F611B3FC110`
- Other protected hashes MATCHED:
  - `data/rag/eval/questions.json`: `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`
  - `data/rag/eval/pilot-manifest.json`: `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`
  - `src/data/source-embeddings.json`: `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE`
- Parsed index invariant MATCHED: schema version 2; 20 curated excerpts plus 259 eligible corpus units, exactly 257 `position_card` and two `verified_quote`, total 279. Per-philosopher eligible counts remain Aquinas 52, Nietzsche 59, Kierkegaard 48, Sartre 52, Camus 48.
- Deterministic source-corpus/generated-index integrity command `npx.cmd vitest run scripts/rag-corpus.test.ts` PASSED: one file, three tests. Embeddings were not rebuilt.
- Frozen manifest properties MATCHED: pilot ID `rag-gate3-pilot-v1`; conditions A/B/C; one repetition; 27 exact questions; 68 checks (13 critical, 45 major, 10 minor); 10 empty-support sentinels; 17 inspired-card and 10 held-out records; frozen exam count 184 and hash above; projected usage 81 answer + 81 blind-judge + 81 first-audio/TTS = 243 external attempts; fixed 13-record audit IDs unchanged.
- Worktree inspection confirmed the documented pre-existing dirty tracked/untracked corpus, evaluation, docs, scripts, app, and generated-index work. No existing change was reset, discarded, or overwritten.
- Collision/cache search found no `results-pilot-*` artifact and no run directory/cache for `rag-gate3-pilot-v1-r1`. Protected pilot writers must still use exclusive creation.
- Execution-session external usage so far: answers 0/81; blind judges 0/81; first-audio/TTS 0/81; total attempts 0/243; retries 0; failures 0; exclusions 0.
- Active processes: none started by this execution session. The inherited development server has not been contacted.
- Exact next action: run `npm.cmd run check:rag-gate2`. If it fails, checkpoint the failure and stop. If it passes, completely inspect `scripts/pilot-harness.ts` and all related execution/judge/TTS/dashboard scripts before adding or running any orchestration.

### Execution-session Gate 2 rerun

- `npm.cmd run check:rag-gate2` PASSED before any API spend.
- All five positive corrected-card probes retrieved the mapped card at rank 1 or 2 with no reported cross-philosopher result. Two unrelated probes and all 23 frozen empty-support probes remained below the Condition B 0.67 injection threshold.
- Fresh retrieval over 30 probes: p50 `7.035ms`, p95 `21.473ms`, max `44.595ms`; separately reported local-model warm-up `1188.658ms`. The 150ms fresh-retrieval budget passed.
- External usage remains answers 0/81, judges 0/81, first-audio/TTS 0/81, total attempts 0/243; retries 0; failures 0; exclusions 0.
- Exact next action: completely inspect the prepared pilot harness, imports/call sites, answer probe, judge/provider path, first-audio/TTS path, output validation, and dashboard generator. Add only the narrow orchestration entry point required to execute the frozen manifest, if one is absent.

### Execution plumbing checkpoint before API spend

- Completely inspected `scripts/pilot-harness.ts`, its tests, pilot-manifest builder, stress probe, chat route, LLM provider, TTS route/provider, first-audio capture, streaming speech implementation, sentence chunker, conversation page, latency probe, security rate limits, and dashboard generator. The prepared harness contained schemas, validation, protected paths, cache identity, and exclusive final writes but no runnable orchestration entry point.
- Added only `scripts/run-pilot.ts`. It executes one frozen condition at a time; uses the real `/api/chat` path; starts exactly one first-sentence `/api/tts` request while the answer is streaming; waits for the running Web Audio clock to reach scheduled onset; calls the configured LLM provider once for blind judging; presents only opaque answer identity, transcript, and frozen checks; forces absent/invalid/non-verbatim evidence to fail; writes cache identities containing run label, condition, philosopher, question ID, and repetition; and delegates final schema validation/exclusive result writes to `scripts/pilot-harness.ts`.
- The runner writes `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r1/usage.json` before every external attempt. Limits are answer 81, judge 81, TTS 81, total 243. Retries are disabled because the plan has no retry headroom. A started/failed attempt remains charged and prevents pretending the budget is intact.
- Condition B runtime stops cover cross-philosopher retrieval, an ID absent from the allowed same-philosopher generated index, nonempty empty-support retrieval, failure to return an eligible mapped source when one exists, a new critical failure versus the immutable baseline, and a large paired latency regression requiring investigation.
- The mandatory in-app browser skill was read because actual browser audio onset is required. The in-app browser backend was unavailable and its prescribed discovery check returned no available browser surfaces. After reporting that, the runner uses the already-installed local Playwright Chromium solely for the measurement path; it does not alter app code or production behavior.
- Zero-provider verification: `npx.cmd tsc --noEmit` PASS; focused harness/first-audio suite PASS (2 files, 9 tests); `npm.cmd test` PASS (11 files, 83 tests); runner preflight reports the frozen manifest hash and zero attempts; browser audio smoke check PASS (`state=running`, audio clock advanced) using a locally generated silent buffer and no chat/judge/TTS call.
- The inherited local server responds HTTP 200 on port 3000. Environment-key presence was checked without exposing values: configured Anthropic LLM/model and ElevenLabs TTS credentials are present.
- Pilot output/cache collision status remains clear. The only execution-session file changed beyond the operational checkpoint is the new `scripts/run-pilot.ts`; all pre-existing dirty work is preserved.
- External usage remains answers 0/81; blind judges 0/81; first-audio/TTS 0/81; total attempts 0/243; retries 0; failures 0; exclusions 0.
- Exact next action: execute Condition A only with `npx.cmd tsx scripts/run-pilot.ts execute A`. If any attempt fails, record the charged failure and stop. If A completes, verify its 27 cache records/81 attempts and checkpoint before Condition B.

### Material local execution failure before Condition A calls

- The first `execute A` invocation stopped before opening the browser or reserving any external attempt because the new runner treated generated-index `corpusSources` as an array. The verified artifact actually stores both `sources` and `corpusSources` as objects keyed by the five philosopher IDs.
- Confirmed `usage.json` does not exist, no cache/output was written, and external usage remains exactly 0/243. This was not a provider failure or retry.
- Narrow correction: flatten the existing philosopher-keyed `corpusSources` object exactly as the preflight count did. No index, corpus, manifest, frozen exam, baseline result, dashboard, or production source is changed.
- Exact next action: rerun TypeScript, the focused tests, runner preflight, and the corpus/index integrity test. If green, restart Condition A from zero usage.

### Material provider failure and mandatory stop — Condition A

- After the local index-shape fix, `npx.cmd tsc --noEmit`, the focused pilot/first-audio tests (2 files, 9 tests), the deterministic corpus/index integrity tests (1 file, 3 tests), and runner preflight all passed with zero attempts. Condition A was restarted.
- First scheduled record: `cam-29:A:r1` (deterministically shuffled order).
- Usage ledger artifact: `data/rag/stress/pilot-runs/rag-gate3-pilot-v1-r1/usage.json`.
- Attempt 1 answer: started `2026-07-20T00:15:07.817Z`, succeeded `2026-07-20T00:15:22.650Z`.
- Attempt 2 first-sentence TTS/first-audio: started `2026-07-20T00:15:17.782Z`, succeeded `2026-07-20T00:15:20.515Z`; exactly one TTS request was made.
- Attempt 3 blind judge: started `2026-07-20T00:15:22.656Z`, failed `2026-07-20T00:15:23.932Z` with configured-provider error `Connection error.`. No retry was attempted.
- Charged usage at stop: answers 1/81; blind judges 1/81 (failed); first-audio/TTS 1/81; total attempts 3/243; successful attempts 2; failed attempts 1; retries 0; outage-contaminated records 1; latency exclusions 1 (`cam-29:A:r1`, incomplete due judge connection outage).
- The incomplete record was not written to cache or a condition output because it lacks the required judge verdicts. No `results-pilot-rag-gate3-pilot-v1-r1-*.json` file exists. No existing pilot result was overwritten.
- This failure consumes the sole judge attempt allocated to `cam-29:A:r1`. Because the successful answer/TTS measurements were not cached without a complete judged record, resuming this label would have to rerun all three stages for `cam-29:A:r1`; completing 81 successful records would therefore require ceilings of 82 attempts per stage and 246 total attempts. Continuing without that explicit expansion would leave a required record incomplete. Both retrying and continuing under the current ceilings would violate the frozen instructions, so execution stopped immediately.
- Immediately-before-stop integrity recheck: all five immutable baseline result hashes, the original dashboard hash `725EF388F17A769FF4FC31BB8F3B00595C03DFD2FD3D057E40C41F611B3FC110`, frozen exam hash, manifest hash, and embedding hash still MATCH their trusted references. The dashboard was not regenerated.
- Files written/changed by the execution session: this checkpoint; new narrow `scripts/run-pilot.ts`; and the isolated `usage.json` above. No frozen exam, manifest, cards, quotes, indexes, ingested texts, embeddings, baseline results, production-default condition, or dashboard was changed.
- Active processes: the failed runner exited; no browser or command started by it remains active. The inherited dev server remains external to this session and was not stopped.
- Exact next action: DO NOT resume or retry `rag-gate3-pilot-v1-r1`. Await explicit user direction that either (a) authorizes a new run label and a fresh 243-attempt budget while retaining the aborted r1 ledger as operational evidence, or (b) explicitly expands r1 to 82 attempts per stage and 246 total attempts so the uncached incomplete record can be rerun. Without one of those changes, the pilot decision cannot be produced.

## Work completed

- Completely read the eight binding handoff documents named in the user request.
- Inspected the worktree without modifying or discarding existing changes.
- Verified `data/rag/eval/questions.json` SHA-256.
- Completely inspected the required preflight implementation files plus `src/lib/providers/llm.ts` and `package.json`.
- Recorded runtime, provider, model, generation, and answer behavior below.
- Ran the unchanged baseline test suite successfully.
- Confirmed the already-running dev server on port 3000 and completed one live baseline streaming probe successfully.
- Inspected all card/quote schemas and the existing retrieval tests. Inventory: 257 cards (Aquinas 52, Camus 48, Kierkegaard 48, Nietzsche 57, Sartre 52); 54 quote candidates total, but only two Nietzsche BGE quotations are explicitly verified; 52 quote candidates and all 12 misattribution records remain pending.
- Added a deterministic corpus parser. An initial probe found and fixed an EOF delimiter bug (254 parsed before fix; 257 after fix). All 257 card IDs are unique and stable from philosopher + normalized title. The parser also emits the two explicitly verified quotes and excludes every pending quote/warning.
- Added the first A/B/C plumbing slice: condition parsing/default A, Condition C's compact stable hardening layer, condition-specific retrieval selection, cache-key isolation, request/response metadata, and condition-aware stress probe fields.
- Prior Gate 2 slice: extended the embedding builder in source while deliberately leaving the generated artifact at its original 20-source baseline until this completion session.
- Re-ran TypeScript and the unchanged automated suite after these edits; both pass.
- Added a concise in-progress handoff note to `docs/STATUS.md` pointing here.
- Resumed from the checkpoint, reread `docs/STATUS.md` and `docs/run_stress_test_prompt.md` completely, verified the checkpoint against the worktree, and rechecked the frozen-exam hash before test work.
- Added deterministic corpus tests that independently count 257 raw card headings, prove 257 unique eligible card records, lock their sorted stable-ID set to SHA-256 `5636648451e0c1e95479065a8984b238e36ffe633ced7d47247337e8ebbf2065`, and require citations, provenance, draft status, and stable source paths on every card.
- Added quote-eligibility tests proving the raw inventory is 54 candidates (52 pending, 2 verified) plus 12 pending misattribution warnings; only the two verified BGE records enter eligibility and both retain type `verified_quote`.
- Added A/B/C tests proving A is the default, only B selects corpus retrieval, only C selects prompt hardening, and invalid labels fail closed.
- Added exact-text and semantic-vector cache tests proving condition and philosopher isolation.
- Extracted a pure injectable `sourcesForCondition()` selection seam and tested that B receives only its requested philosopher's corpus records with metadata intact, while A and C receive curated excerpts only.
- Prior deterministic-slice milestone: TypeScript and 70 tests passed before the intentionally deferred embedding rebuild; no live API, pilot, or baseline artifact was changed.
- On resumption, completely reread `docs/STATUS.md`, `docs/run_stress_test_prompt.md`, and this checkpoint; verified the listed Gate 2 files and dirty worktree against the filesystem; and rechecked the frozen-exam hash before any project-file change.
- Confirmed the pre-build artifact still contains exactly 20 curated vectors (4 per philosopher), has no `corpusSources`, is timestamped 2026-07-12T19:02:13.8279006-04:00, and has SHA-256 `3054101A057A70A00056F0348220F372248F877A801B9121E3E22E27E42DE325`.
- Invoked the initially authorized `npm.cmd run build:embeddings` command once. The shell wrapper terminated it with exit 124 after approximately 10.8 seconds before any artifact write; no build process owned by this session remained visible afterward. At that point no recovery invocation had been made.
- After the user explicitly authorized one recovery invocation, ran `npm.cmd run build:embeddings` once with a sufficient timeout. It completed successfully: local model ready in 1,520ms, 279 vectors written in 7,728ms.
- Verified the generated artifact contains exactly 20 curated excerpts plus 259 eligible corpus units: 257 position cards and two verified quotes. Per-philosopher corpus counts are Aquinas 52, Nietzsche 59 (57 cards + 2 quotes), Kierkegaard 48, Sartre 52, and Camus 48; curated counts are four each.
- Added generated-artifact integrity coverage that compares all 259 generated records by stable ID against the deterministic parser and proves every philosopher, type, citation, provenance, status, source path, label, text, content hash, and 384-dimensional finite vector is preserved. The locked 257-card ID digest remains `5636648451e0c1e95479065a8984b238e36ffe633ced7d47247337e8ebbf2065`.
- Confirmed all 52 pending quote candidates and all 12 pending misattribution warnings remain excluded; only the two verified BGE quotations are present and typed `verified_quote`.
- Added a repeatable local Gate 2 check. Five corrected-card queries retrieve their expected card at rank 1 or 2 with no cross-philosopher result. Two unrelated queries and all 23 frozen questions whose `relevant_corpus` is empty inject no source.
- Initial local negative probes exposed that the four-excerpt 0.15 threshold was unsafe for the 259-unit Condition B corpus: frozen empty-support maxima reached 0.6387 while corrected-card probe minima were 0.7136. Added a Condition-B-only 0.67 injection guard; A and C retain the existing 0.15 threshold and A remains the default.
- Verified actual local runtime routing: C returns curated excerpts only, even after the same query populates B's cache; cache entries remain condition-scoped; all returned B sources match the requested philosopher. Added pure fresh/stale content-hash tests and a Condition B corpus keyword-fallback test.
- Final local measurement over 30 fresh retrieval probes: p50 7.090ms, p95 10.685ms, max 16.437ms, all comfortably inside the existing 150ms fresh-retrieval budget. Local model warm-up for that run was 828.556ms and is reported separately from fresh retrieval.

## Exact files changed

- `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md` (created and maintained by this session).
- `data/rag/stress/camus/live.log` (probe helper appended one view-only preflight transcript).
- `data/rag/stress/live.log` (probe helper appended the same completed preflight transcript as one atomic entry).
- `docs/STATUS.md` (Gate 2 completion counts, measurements, verification, and exact pilot-preparation handoff; existing unrelated edits preserved).
- `scripts/rag-corpus.ts` (new deterministic card/verified-quote parser).
- `src/lib/experiment-conditions.ts` (new A/B/C types, default, routing helpers, compact Condition C hardening).
- `scripts/build-embeddings.ts` (source updated to embed eligible corpus units with metadata; later run successfully in the explicitly authorized recovery).
- `src/lib/retrieval.ts` (condition-selected source sets and rich metadata/grounding format).
- `src/lib/retrieval.ts` (current slice additionally exports the pure `sourcesForCondition()` selection seam; runtime behavior is unchanged).
- `scripts/rag-corpus.test.ts` (new corpus count, stable-ID, metadata, and quote-state eligibility tests).
- `src/lib/experiment-conditions.test.ts` (new condition default/routing tests).
- `src/lib/retrieval-cache.test.ts` (new exact and semantic cache-isolation tests).
- `src/lib/retrieval.test.ts` (new philosopher/condition source-isolation and metadata-preservation tests).
- `src/lib/retrieval-cache.ts` (condition-scoped cache keys).
- `src/lib/providers/llm.ts` (optional stable prompt-hardening block).
- `src/app/api/chat/route.ts` (condition switch, retrieval timing, metadata propagation).
- `src/app/api/retrieve/route.ts` (condition switch, retrieval timing, metadata propagation).
- `scripts/stress-probe.ts` (optional A/B/C argument and richer measurements; file was pre-existing/untracked before this session).
- No card, quote, frozen exam, baseline `results.json`, or dashboard file was changed by the Gate 2 completion session.
- Gate 2 completion changed `src/data/source-embeddings.json` (generated locally), `package.json` (repeatable `check:rag-gate2` script), `scripts/rag-gate2-check.ts` (new local verification), `scripts/rag-corpus.test.ts` (generated-index integrity), `src/lib/retrieval.ts` (pure freshness seam and B-only injection guard), `src/lib/retrieval.test.ts` (threshold, freshness, and corpus fallback coverage), `docs/STATUS.md`, and this checkpoint. The earlier sentence about the generated index is historical for the pre-build slice; no card, quote, frozen exam, baseline `results.json`, or dashboard file was edited during Gate 2 completion.

## Commands, tests, and probes run

- Read-only `Get-Content -Raw` reads of all binding handoff and required implementation files.
- `Get-FileHash -Algorithm SHA256 data/rag/eval/questions.json` -> `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E` (matches required hash).
- `git status --short --branch` -> branch `master...origin/master`; pre-existing modified/untracked audit, corpus, docs, scripts, and stress artifacts are present. Preserve all of them.
- Runtime inventory: Windows NT `10.0.26200.0`, x64, Intel64 Family 6 Model 186, 16 logical processors, Node `v22.17.0`, npm `10.9.2`.
- `rg` is unavailable in this shell; use PowerShell search fallbacks.
- `npm.cmd test` -> PASS: 6 test files, 61 tests; Vitest duration 11.04s; shell wall time 40.7s.
- Port health check: `Invoke-WebRequest http://127.0.0.1:3000` -> HTTP 200.
- `npx.cmd tsx scripts/stress-probe.ts camus beginner "What do you mean by the absurd?"` -> SUCCESS, no retry/error; first text chunk 2,558ms; full response 6,228ms; 711 reply characters; retrieved the two current hard-coded sources `The Myth of Sisyphus (1942)` and `Camus contra 'philosophical suicide'`.
- Corpus inventory PowerShell checks -> 257 structurally complete cards; 54 quote candidates (2 verified, 52 pending); 12 pending misattribution records.
- Parser smoke check after first implementation -> 254 cards, exposing three EOF-terminated cards omitted by the initial delimiter regex. Parser was repaired before any embedding build.
- Parser smoke check after repair -> 257 cards, unique IDs 257, per philosopher 52/48/48/57/52, verified quotes 2.
- `npx.cmd tsc --noEmit` after implementation slice -> PASS (exit 0; shell wall time 23.7s).
- `npm.cmd test` after implementation slice -> PASS: 6 test files, 61 tests; Vitest duration 7.60s; shell wall time 23.2s.
- `git diff --check` -> PASS (no whitespace errors; only expected line-ending and inaccessible global-ignore warnings from Git).
- Final hash check before handoff -> MATCH.
- Pre-build resumption integrity check -> frozen-exam hash MATCH; at that checkpoint the generated index, baseline `results.json` files, and dashboard were still unmodified.
- First `npm.cmd test` after adding the new tests -> 69/70 passed; the only failure was a test-constant mismatch because the precomputed ID digest used literal `\\n` separators rather than actual newline separators. No production defect was found; the canonical newline-separated digest was corrected.
- Final `npx.cmd tsc --noEmit` -> PASS (exit 0; shell wall time 23.4s).
- Final `npm.cmd test` -> PASS: 9 test files, 70 tests; Vitest duration 14.18s; shell wall time 26.9s.
- Final `git diff --check` -> PASS; only expected Git permission/line-ending warnings were emitted.
- Resumption frozen-exam hash -> `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E` (MATCH).
- `npm.cmd run build:embeddings` -> FAILED/TERMINATED: exit 124 from the command wrapper after approximately 10.8 seconds; no stdout captured; generated artifact unchanged. Invocation count in this resumption: exactly 1.
- User-authorized recovery `npm.cmd run build:embeddings` -> PASS: model ready 1,520ms; Aquinas 52, Nietzsche 59, Kierkegaard 48, Sartre 52, Camus 48 eligible units; 279 total vectors; builder-reported 7,728ms.
- Generated artifact -> 1,565,519 bytes; SHA-256 `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE`; schema version 2; model `Xenova/all-MiniLM-L6-v2`; dimensions 384.
- First focused local check exposed empty-support over-injection at the inherited 0.15 threshold; expanded diagnostic measured all 23 frozen empty-support questions before selecting the B-only 0.67 guard.
- Final `npm.cmd run check:rag-gate2` -> PASS: corrected-card ranks 1/1/1/2/1; no injection for two unrelated and all 23 empty-support queries; 30 fresh probes p50 7.090ms, p95 10.685ms, max 16.437ms; local warm-up 828.556ms.
- First full suite after the artifact test -> 72/73 passed; only failure was order-sensitive comparison between identical generated/parser record sets. Comparison was corrected to sort by stable ID.
- Final `npx.cmd tsc --noEmit` -> PASS (exit 0; shell wall time 19.6s).
- Final `npm.cmd test` -> PASS: 9 files, 74 tests; Vitest duration 7.61s; shell wall time 21.1s.

## Results and artifacts

- Frozen exam valid at session start.
- No new machine-readable condition results exist from this session.
- No `run.condition` labels have been emitted from this session.
- Existing baseline artifacts remain untouched.
- Preflight live probe is operational evidence only and was not inserted into any baseline `results.json`.
- Corpus index artifact written: `src/data/source-embeddings.json`, counts and hash above. Retrieval/latency evidence is the deterministic local script output; no condition answer result, pilot selection/results/grading artifact, or dashboard regeneration exists yet.
- Deterministic test artifacts are source files only; no condition result file or generated evaluation artifact was created.

## Reproducibility settings

- Local date/time captured: `2026-07-19T17:01:02.6731409-04:00` (America/New_York).
- App provider: `anthropic` from `.env.local`.
- App model ID: `claude-opus-4-8` from `LLM_MODEL`.
- Generation: provider streaming path; `max_tokens: 1024`; extended thinking deliberately off; no temperature/top-p override in app code (provider defaults apply).
- Answer behavior: answer level is frozen per question (`beginner | intermediate | advanced | primary-text`); shared prompt requests 5-9 spoken sentences, no Markdown, a brief invitation to continue when natural; stable persona/answer-level prefix is prompt-cached and per-turn grounding is a suffix.
- TTS provider credential is configured, but first-audio capture for the pilot still requires an instrumented client/probe path and must be verified before claiming voice metrics.
- Worktree state is dirty from pre-existing user/project work. Do not reset, discard, or overwrite it. Notable existing tracked modifications: five card draft files, `docs/STATUS.md`, and `docs/rag_architecture.md`; many audit/eval/stress artifacts are untracked in Git.

## Active or unfinished processes

- A dev server was already active on `127.0.0.1:3000`; this session did not start it and does not own its process.
- No probe/test/build command remains active. Safe to resume: yes. Do not rebuild embeddings again unless source inputs change and a later task explicitly requires it.
- The current resumption started no server and owns no long-running process.
- The already-running dev server may have hot-reloaded source/artifact changes, but this session made no request to it after the rebuild. Do not use it for pilot calls without the next session's explicit approval.

## Probe/API usage and operational information

- Answer probes this session: 1 successful (`camus`, beginner, preflight baseline behavior).
- Answer probes during the current deterministic-test resumption: 0. Cumulative since this checkpoint was created: 1 preflight baseline probe.
- Other external API calls this session: 0.
- Errors/retries/rate limits this session: 0.
- Known inherited baseline usage: about 200 chat calls including retries; historical provider outage 2026-07-19 13:44-14:09Z (from baseline handoff).
- Rate limit: chat probe helper expects 20 requests/minute and retries 429s up to five attempts.

## Decisions and assumptions

- Preserve the frozen exam and all baseline files exactly; condition runs will use new filenames and distinct labels.
- Conditions will be explicit and reversible: A = current prompts/current hard-coded sources; B = identical A prompts plus eligible corpus index; C = A retrieval plus compact static hardening only.
- Position cards remain draft but may be used in experimental Condition B because they completed the documented conservative source-backed correction pass; metadata must preserve `Status: draft` and provenance so they are never represented as fully human-verified.
- Pending quote candidates will not be authoritative. Only explicitly verified/machine-verified warning records may be eligible, typed as warnings.
- Because no existing misattribution record has an explicit verified status, this slice indexes zero warnings. Do not silently promote the 12 pending warnings. A future task may add a separately verified warning record only with documented source verification.
- Eligible deep corpus totals 259 units: 257 draft/source-backed position cards plus 2 explicitly machine-verified Nietzsche BGE quotes. The successful local build makes those searchable with the 20 existing curated excerpts only when explicit Condition B is selected.
- Default request condition is A. Only B selects corpus retrieval. Only C adds prompt hardening. Retrieval cache keys include the condition, preventing A/C from reusing B results.
- No full evaluation will start without a passing pilot and explicit user approval.

## Blockers and unresolved questions

- Gate 1 has no blocker: baseline tests and live chat both passed.
- Need to design/verify pilot first-audio measurement; server-only probes currently capture first text chunk and full response, not browser audio onset.
- The requested deterministic corpus, condition, cache, source-isolation, metadata, stale/fallback, and generated-index requirements are implemented and all 74 tests pass.
- Gate 2 has no remaining blocker. Generated-index counts/metadata, known corrected-card hits, empty-support non-injection, stale/cold fallbacks, A/B/C routing, cross-philosopher and cache isolation, and local latency are all verified.
- Condition C hardening text compiles but has not been prompt-snapshot/cache-tested or live-probed.
- No pilot question set, paired A/B/C calls, blind grading, human audit, source-entailment audit, first-audio capture, dashboard regeneration, or go/no-go decision has occurred.
- npm emits a sandbox-related `Test-Path` permission warning while resolving its prefix, although `npm --version` succeeded; retry normal project commands first and escalate only if a required command fails because of sandbox restrictions.

## Frozen-exam integrity

- Expected: `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`
- Actual at checkpoint: `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`
- Status: MATCH.

## Exact next action

In a separately authorized pilot-execution session, reread the three binding handoff files and recheck the frozen exam, embedding artifact, dashboard, and five baseline `results.json` hashes. Use `data/rag/eval/pilot-manifest.json` unchanged and run label `rag-gate3-pilot-v1-r1`. Execute exactly one repetition of its 27 questions in each condition: A baseline prompts plus curated excerpts; B identical prompts plus eligible corpus retrieval; C hardened prompts plus curated retrieval only. Record 81 answer calls, 81 blind-judge calls, and 81 one-request first-audio measurements in dashboard-compatible `results-pilot-rag-gate3-pilot-v1-r1-{A|B|C}.json` files via `scripts/pilot-harness.ts`; complete the manifest's fixed 13-record human audit. Then regenerate the dashboard, apply the pilot guardrails, and stop for a pilot go/no-go decision. Do not begin the 184-question evaluation without separate approval, and do not rebuild embeddings unless source inputs changed and the discrepancy is first reported.

## Gate 3 pilot-preparation completion

### Integrity and Gate 2 reverification

- Frozen exam expected/actual SHA-256: `5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E` — MATCH.
- Generated index SHA-256: `93BC69157255746FD676DCB94BDED196C4B51AEAB68D4EF412CF9503509750BE` — unchanged from Gate 2.
- Generated index inventory: 20 curated excerpts (four per philosopher) plus 259 eligible corpus units: 257 `position_card` and two `verified_quote`; no other type.
- `scripts/rag-corpus.test.ts` reverified the source parser against the generated index (3/3 tests). No unexpected source change was found, so embeddings were not rebuilt.
- `npm.cmd run check:rag-gate2` PASS: all five positive corrected-card probes ranked 1 or 2; two unrelated and all 23 frozen empty-support probes remained below injection; 30 fresh retrievals measured p50 7.499ms, p95 22.415ms, max 53.271ms after a separately reported 928.743ms local warm-up, within the 150ms budget.

### Frozen pilot manifest and coverage

- Manifest: `data/rag/eval/pilot-manifest.json`; file SHA-256 `802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`; pilot ID `rag-gate3-pilot-v1`; 27 exact frozen questions; selected-question digest `3007CF3170FDED452B0857462B5B7B8B688800D1D9B0DBAFCBC7C2214BD65F52`.
- Every selected object exactly preserves the frozen exam's ID, philosopher, question text, category, answer level, answer key, source, checks and severities, provenance, `relevant_corpus`, `inspired_card`, and `failed_on` values. The manifest generator fails on any frozen-exam hash mismatch.
- Baseline severity failures included: all 15 questions in the critical/major union, covering the one critical failed check and all 15 major failed checks.
- Selected check severity counts: critical 13, major 45, minor 10 (68 total).
- Category counts: known-answer 9, locate 2, trap-attribution 4, trap-confusion 1, depth 8, misreading 3. Representative attribution, locate, depth, and misreading IDs plus explicit PASS-plus IDs (`kg-15`, `kg-30`, `cam-35`) are machine-readable.
- Split coverage: 17 inspired-card, 10 held-out; 25 corpus-blind, two corpus-aware; philosopher counts Aquinas 7, Nietzsche 3, Kierkegaard 8, Sartre 3, Camus 6; exactly 10 empty-support sentinels.
- Every requested selection requirement is stored as a boolean and is `true`.

### Exact projected usage — not consumed

- Formula: `N=27`; answer calls = `N × 3 conditions × 1 repetition = 81`; blind-judge calls = `N × 3 = 81`; first-audio/TTS measurements = `N × 3 = 81`, capped at exactly one first-sentence TTS request per measurement; total external calls = `N × 9 = 243`.
- Human audit: fixed 15% sample = `ceil(81 × 0.15) = 13` judge records. The exact deterministic record IDs are frozen in the manifest; all three `nz-19` condition records are included.
- Gate 3 preparation usage: zero answer, judge, TTS, browser-generation, or other external API calls. No part of the 243-call budget was consumed.

### Harness, first audio, and isolation

- `scripts/pilot-harness.ts` defines schema-versioned condition/run-labeled results with exact question ID and repetition; retrieved IDs/types/text/scores/citations; retrieval, first-token, first-audio, and full-response latency; reply characters; provider errors/retries/outage exclusion; blind check verdicts and verbatim evidence; human-audit status; and Web Audio/Web Speech measurement path.
- Dashboard-compatible output names are `data/rag/stress/<philosopher>/results-pilot-<run>-<condition>.json`. The path guard rejects `data/rag/stress/<philosopher>/results.json`, the frozen exam, dashboard, embedding artifact, and every other path outside the narrow pilot output/cache contract. Exclusive creation refuses an existing pilot result rather than overwriting it.
- Cache artifacts live under `data/rag/stress/pilot-runs/<run>/cache/<condition>/`; cache keys include run label, condition, philosopher, question ID, and repetition. Deterministic tests prove A/B/C output paths, cache paths, and cache keys are disjoint.
- The result shape retains the existing dashboard's `run.condition`, `run.date`, `run.model`, `latency_ms`, `checks`, and source `label`/`text` fields as checked aliases to the richer schema, so a separately authorized dashboard regeneration requires no hand edit.
- First-audio capture now observes the running Web Audio clock reaching the scheduled start, rather than counting `source.start()` while a context may still be suspended. Web Speech uses the utterance's actual `onstart`. Mock clock/speech tests prove one-shot capture, suspended-context waiting, and cancellation. No browser or TTS request was used for verification.

### Tests and commands

- `npm.cmd run build:pilot-manifest` — PASS; froze 27 questions, 10 empty-support cases, and the 243-call projection.
- Focused pilot/first-audio suite — PASS: 2 files, 9 tests.
- `npx.cmd tsc --noEmit` — PASS.
- `npm.cmd test` — PASS: 11 files, 83 tests.
- `git diff --check` — PASS; only expected line-ending warnings were emitted.

### Exact files changed by Gate 3 preparation

- `data/rag/eval/pilot-manifest.json` (new frozen generated manifest).
- `scripts/pilot-manifest.ts` (new deterministic selection, proof counts, and budget builder).
- `scripts/build-pilot-manifest.ts` (new manifest generator).
- `scripts/pilot-harness.ts` (new isolated result/cache paths and result schema/validation/writer).
- `scripts/pilot-harness.test.ts` (new manifest, schema, labeling, dashboard, isolation, and protection tests).
- `src/lib/first-audio.ts` (new one-shot capture and Web Audio onset observer).
- `src/lib/first-audio.test.ts` (new deterministic first-audio fixtures).
- `src/lib/useSpeech.ts` (actual Web Audio clock/Web Speech onset integration).
- `package.json` (deterministic `build:pilot-manifest` script only; production defaults unchanged).
- `docs/STATUS.md` (Gate 3 preparation handoff).
- `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md` (this completion record).
- No frozen exam, card, quote, index, ingested text, embedding artifact, baseline `results.json`, or dashboard file was changed. No dashboard was regenerated.

### Active processes and authorization boundary

- No command started by this preparation session remains active. The inherited dev server, if still running, was not contacted.
- Condition A remains the production default. The pilot and full evaluation remain unexecuted and unauthorized until a separate session explicitly authorizes the exact next action above.
