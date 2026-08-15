# Prompt: harden the pilot runner and execute rag-gate3-pilot-v1-r4

You are executing the Gate 3 RAG pilot for this project. Three prior runs
(r1, r2, r3) each died on the first record and never completed a single one
of the 27 required records. The failure post-mortem is in
`data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md`: r1/r2's blind-judge calls
failed with `Connection error.` because the runs were sandboxed and the
judge is the runner's only direct outbound call (answers and TTS go through
the local dev server); r3 ran unsandboxed but died before reaching the judge
when one TTS request returned 502 — a condition the production client
absorbs by retrying and falling back to Web Speech, which the runner treated
as fatal. The zero-retry protocol is hereby amended as specified below.
This prompt is your authorization for those amendments and for run label
`rag-gate3-pilot-v1-r4` with the budget in Phase 3.

## Phase 0 — Orientation and integrity (no spend)

1. Completely read `docs/STATUS.md`, `docs/run_stress_test_prompt.md`,
   `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md`,
   `data/rag/eval/pilot-manifest.json`, `scripts/pilot-harness.ts`, and
   `scripts/run-pilot.ts`.
2. Recompute and confirm every protected hash listed in the checkpoint
   (frozen exam, manifest, embeddings, five baseline results.json files,
   original dashboard). On any mismatch: checkpoint the mismatch and stop.
3. Preserve the r1/r2/r3 ledgers exactly as they are. Never delete, reuse,
   or repair them.
4. Do not rebuild embeddings. Do not touch any card, quote, index, frozen
   exam, baseline result, or the original dashboard.

## Phase 1 — Connectivity diagnostics (max 2 external calls, charged to no run budget)

Run both checks OUTSIDE the sandbox. Record both outcomes in the checkpoint
under a "r4 diagnostics" heading before proceeding.

1. **Judge path:** a throwaway script (in the job tmp dir, not the repo)
   that calls `getLLMProvider().complete()` once with a trivial one-word
   prompt and `maxTokens: 16`. Success = any non-empty reply. This is the
   first-ever test of the unsandboxed judge path; if it fails, capture the
   full error, do NOT retry, checkpoint, and stop — the pilot cannot proceed.
2. **TTS path:** one POST to `http://127.0.0.1:3000/api/tts` with a short
   sentence and a valid philosopherId. If it returns 502, check the dev
   server console output and report the underlying ElevenLabs error (likely
   quota or rate limit) before proceeding — a 502 here is a warning, not a
   stop, because the amended runner falls back to Web Speech.

## Phase 2 — Runner amendments (code changes to `scripts/run-pilot.ts` only)

Make exactly these changes. Do not change `scripts/pilot-harness.ts`
schemas, the manifest, frozen inputs, production defaults, or app code.

1. **Run label and date:** set `RUN_LABEL` to `rag-gate3-pilot-v1-r4` and
   replace the hardcoded `"2026-07-19"` run date with the actual execution
   date.
2. **Bounded ledgered retries:** each stage attempt (answer, judge, TTS) may
   be retried at most 2 times per record, with backoff of 2s then 8s. Every
   attempt — including retries — is reserved and finished in the usage
   ledger exactly as today (a retry is a new attempt row; add a
   `retry_of` field pointing at the failed ordinal). A record fails
   permanently only after 3 total attempts at some stage; that remains a
   mandatory stop for the whole run.
3. **TTS 502 = fall back, not fatal:** mirror production `useSpeech`
   behavior. On TTS HTTP 502 (or network failure), retry per rule 2; if
   still failing, fall back to Web Speech in the measurement browser and
   record `first_audio_path: "web-speech"`. Only a Web Speech failure after
   fallback fails the TTS stage.
4. **Fix the unhandled-rejection crash:** attach a passive `.catch(() => {})`
   handler to the first-audio promise at creation (keep the original promise
   for the real `await`), so a TTS rejection during the answer stream can
   never crash the process and strand an answer attempt as `started`. The
   answer attempt must always be finished as `succeeded` or `failed`.
5. **Latency honesty:** any record whose answer or TTS stage needed a retry
   gets `provider.retries` set to the retry count and is flagged
   `outage_excluded: true` with reason `"retried attempt; latency not
   comparable"` — its checks still count, but it is excluded from paired
   latency comparisons (including the Condition B latency-regression stop,
   which must skip such records rather than fire on them).
6. Judge remains inline after each answer (no batch decoupling in r4);
   retries per rule 2 apply to it.

After the edits and BEFORE any spend, run in order:
`npx.cmd tsc --noEmit`, `npm.cmd test`, `npm.cmd run check:rag-gate2`,
`npx.cmd tsx scripts/run-pilot.ts preflight`, and
`npx.cmd tsx scripts/run-pilot.ts browser-check`. All must pass. Preflight
must show run label `rag-gate3-pilot-v1-r4`, the unchanged manifest hash
`802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7`, and zero
attempts. Confirm no file or directory containing `rag-gate3-pilot-v1-r4`
exists before the first spend.

## Phase 3 — Authorized r4 budget

- Required output: 81 complete records (27 questions × conditions A, B, C
  × 1 repetition), executed in order A, then B, then C.
- Stage attempt ceilings (successes + retries combined): answer 108,
  judge 108, TTS 108; total ceiling 324. These ceilings exist to absorb
  retries — they are not a license for more than 81 successful records per
  stage.
- The 2-retry-per-stage-per-record limit and all existing stop rules
  (Condition B safety stops, ceiling exhaustion, third-attempt failure)
  remain mandatory stops: preserve the ledger, checkpoint, and stop without
  further spend.
- Run every `execute` command outside the sandbox.

## Phase 4 — Execution and wrap-up

1. `execute A`; on completion verify 27 A cache records and checkpoint.
2. `execute B`, then `execute C`, checkpointing after each.
3. Write the fixed 13-record human-audit file with status `pending` entries
   only — do NOT fabricate audit notes; the human audit is Will's.
   If `finalize` requires completed audits, stop after `execute C`,
   checkpoint, and report that the run is ready for human audit instead of
   inventing one.
4. After finalize + `validate` pass (81 records, 15 protected files),
   regenerate the dashboard with `npx tsx scripts/build-stress-dashboard.ts`.
5. Update the checkpoint and `docs/STATUS.md` with results, exact usage
   (attempts, retries, failures per stage), and the pre-registered go/no-go
   inputs. Do NOT make the go/no-go decision and do NOT start the
   184-question full evaluation — both require separate approval.

## Standing rules

- Maintain the checkpoint file after every phase and before/after every
  spend boundary, as prior sessions did.
- Never overwrite an existing pilot artifact; all writes stay inside the
  documented pilot paths.
- Report outcomes exactly; a failed run with an honest ledger is an
  acceptable outcome, a repaired ledger is not.
