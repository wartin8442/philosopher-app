# Baseline stress test — record and handoff (run 2026-07-18/19)

> **Audience: future AI sessions (and Will).** This documents what the Wave-1
> baseline stress test did, what it found, where every artifact lives, and
> what should happen next. The spec it executed is
> `docs/stress_test_agents.md` (agent contract) driven by
> `docs/run_stress_test_prompt.md` (orchestration). Read those for the rules;
> read this for the results.

## What was done

Five independent stress-test agents — one per philosopher (aquinas,
nietzsche, kierkegaard, sartre, camus) — each:

1. Studied the SEP/IEP entries **before** looking at the project corpus
   (corpus-blind question design, so the exam doesn't inherit the corpus's
   blind spots).
2. Froze a question bank (34–40 questions each) with pre-registered answer
   keys, sources, and binary pass/fail checks tagged critical/major/minor.
3. Mapped each question to the corpus items that *should* answer it, and
   audited corpus coverage against SEP/IEP.
4. Interrogated the live app (184 probes total, one per question, via
   `scripts/stress-probe.ts` against `POST /api/chat` on the dev server).
5. Graded every check with copy-exact evidence spans (machine-verified as
   substrings of each reply) and wrote reports + draft card proposals.

Run conditions: `condition: baseline`, model `claude-opus-4-8`, the RAG
corpus **not** wired into the app — runtime retrieval was only the
hard-coded `sources` arrays in `src/lib/philosophers.ts`. That was the
point: quantify what the base model + persona prompt alone gets right, so
the corpus-wired condition (B) and hardened-prompt condition (C) have an
honest before-number. Grading is Claude-verified, human-audit pending;
never present these numbers as expert-validated.

## Where everything lives

| Artifact | Path |
|---|---|
| Frozen Wave-1 exam (184 questions, 444 checks, merged, deduped) | `data/rag/eval/questions.json` |
| Cross-philosopher summary + top failures + patterns | `data/rag/stress/SUMMARY.md` |
| Merged corpus-coverage audit | `data/rag/stress/COVERAGE.md` |
| Interactive dashboard (self-contained HTML, open from disk) | `data/rag/stress/dashboard.html` |
| Per-philosopher report / results / bank / card proposals / coverage | `data/rag/stress/<philosopher>/` (5 files each) |
| Probe helper (send one question, collect reply + sources + latency) | `scripts/stress-probe.ts` |
| Dashboard generator (rebuild, never hand-edit the HTML) | `scripts/build-stress-dashboard.ts` |
| Post-baseline card correction ledger with sources | `data/rag/review/corrections_2026-07-19.md` |

Frozen exam SHA-256 (recorded 2026-07-19):
`5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E`.
Condition runs must report this same hash or explain why the comparison is no
longer apples-to-apples.

Regenerate the dashboard any time with
`npx tsx scripts/build-stress-dashboard.ts`. It globs
`data/rag/stress/*/results*.json` and keys columns by `run.condition`, so
later condition runs (B: RAG-wired, C: hardened prompts) render
side-by-side with **no code changes** — just drop in results files using
the same schema with their own `run.condition` label.

## Headline results

Severity-weighted score (critical 5 / major 2 / minor 1), baseline:

| Philosopher | Critical | Major | Minor | Weighted |
|---|---|---|---|---|
| Sartre | 16/16 | 58/60 | 15/16 | 97.7% |
| Kierkegaard | 19/19 | 54/56 | 11/13 | 97.3% |
| Aquinas | 23/23 | 48/51 | 11/18 | 94.5% |
| Camus | 24/24 | 42/47 | 18/21 | 94.5% |
| Nietzsche | 25/26 | 33/36 | 13/18 | 92.7% |
| **Total** | **107/108** | **235/250** | **68/86** | **95.3%** (flat 410/444 = 92.3%) |

Cost side: 184 probes, latency mean 8.6 s / median 8.3 s / p95 11.6 s,
211k reply characters. (~200 chat API calls including retries.)

### The five findings that matter

1. **The RAG corpus is completely inert at runtime.** Across all 184
   probes, `retrieved_sources` contained only the four hard-coded snippets
   per philosopher from `src/lib/philosophers.ts`; a dozen probes retrieved
   nothing. Every pass below rests on the base model's parametric
   knowledge. This was expected (the wiring doesn't exist yet) and is now
   quantified.
2. **One critical failure, and it's the thesis of the whole project**
   (nz-19): asked to confirm the misattributed "They muddy the water, to
   make it seem deep," the app said "Yes, that line is mine" and fabricated
   a *Zarathustra* citation. The quote bank on disk documents this exact
   misattribution. Mirror image at sartre-q35: a *genuine* documented 1953
   Sartre quote was denied. Both are attribution errors retrieval would
   prevent.
3. **Omissions dominate:** 26 of 34 failed checks are missing
   work-titles/sections/names/dates, not wrong assertions. First-hop traps
   almost all pass (54/55 trap questions safe); second-hop scholarship
   (Ptolemy of Lucca behind the sewer quote, Martensen behind the church
   attack, Sartre's 1965 "hell is other people" clarification) goes
   missing. That layer is exactly what position cards encode.
4. **Persona prompts are themselves a contamination source.** Kierkegaard's
   systemPrompt asserts "truth is subjectivity" unattributed → the app
   spoke Climacus's slogan first-person (major failure kg-25). The blurb
   also uses "leap of faith", which the project's own quote bank flags as a
   later coinage. Audit all five persona prompts against the trap material.
5. **Content-level errors cluster in Camus mid-career depth** (*The
   Rebel* / *The Just Assassins* specifics — 4 majors), where no primary
   texts are ingested.

### Things future work must NOT break (PASS-plus)

The system currently *out-performs its own corpus* in places — the eval
harness must protect these when the corpus gets wired:

- kg-30: *Works of Love* correctly called "deliberations" against the works
  index's own mislabel (the index is wrong; fix the index, not the model).
- kg-15: resisted "leap of faith" despite the contaminated persona blurb.
- cam-35: more precise than SEP's own summary of The Stranger's ending.
- Consistent honest refusals to invent article numbers / paraphrase
  self-flagging when asked for exact quotes (multiple philosophers).

### Post-baseline correction status

A conservative source-backed pass subsequently reviewed all 257 draft cards.
It made 19 substantive factual/fairness corrections plus one terminology
cleanup while leaving debatable interpretations alone. The authoritative list
of changes and sources is
[`data/rag/review/corrections_2026-07-19.md`](../data/rag/review/corrections_2026-07-19.md);
do not duplicate that list here.

Still unresolved outside the position-card files:

- the Kierkegaard works index labels *Works of Love* a “discourse” rather than
  “deliberations”;
- the persona prompts still require a separate Condition C audit, including
  pseudonym attribution and “leap of faith” wording;
- the Sartre 1953 Rosenberg/fascism quote-bank entry remains pending human
  verification;
- the suspected *Plague* character “Paty” claim (cam-31) and Nietzsche
  first-person expulsion claim (nz-26) remain unconfirmed and must not be
  silently promoted to fact.

## Recommendations, in leverage order

1. **Implement corpus retrieval as experimental Condition B, not an assumed
   production upgrade.** The baseline suggests high leverage, but the value
   must be measured against its latency and complexity using the pre-registered
   go/no-go rules in `docs/run_stress_test_prompt.md`.
2. **Harden the persona prompts with this run's trap material** (Condition
   C — static, cacheable, no retrieval): known misattributions, fake works
   (*The Will to Power*), pseudonym attribution rules, and citation habits.
   Cheap, and the eval is designed to measure exactly how much of the gap
   it closes on its own.
3. **Review the 42 draft card proposals** in
   `data/rag/stress/*/card-proposals.md` (10 aquinas, 5 nietzsche,
   10 kierkegaard, 11 sartre, 6 camus) through the normal
   human-verification queue, and fix the corpus errors listed above.
4. **Then run conditions B and C** per the binding eval-design contract in
   `docs/run_stress_test_prompt.md` (three conditions, ~3 reps, blind
   judge, cost side mandatory, inspired-card delta reported separately from
   held-out, multi-turn track before final wiring decision).

## Operational notes for future runs

- `scripts/stress-probe.ts` handles the chat rate limit (20/min) with
  retry-on-429; agents shell out to it, one probe per question. It tees
  live logs to `data/rag/stress/live.log` (whole entries) and
  `data/rag/stress/<philosopher>/live.log` (streaming chunks).
- Run at most two agents concurrently (shared dev server + API budget).
- Session usage limits WILL interrupt multi-hour agent runs. Mitigations
  that worked: resume agents from transcript after the reset window; have
  each agent maintain a `CHECKPOINT.md` in its output directory (updated
  every phase / ~5 units of work, deleted on completion) so a fresh agent
  can recover from disk alone. Avoid launching probe batches as an agent's
  own background process — it dies with the agent's session; foreground
  loops with checkpoints survive better.
- One ~25-minute window of provider "Generation failed" errors occurred
  (2026-07-19 13:44–14:09Z) and was survived by retries — check for
  outage windows before interpreting latency data.
- Answer levels are `beginner | intermediate | advanced | primary-text`;
  the harness must re-ask each question at the `answer_level` recorded in
  the bank or before/after numbers aren't comparable.
- Use the subagent routing policy in
  [`stress_test_agents.md`](stress_test_agents.md#subagent-model-routing-for-future-runs):
  Terra for bounded mechanical/read-heavy work, a stronger supported model for
  source-sensitive research and arbitration, and a calibration sample before
  trusting a cheaper blind judge.
