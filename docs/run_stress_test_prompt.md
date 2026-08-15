# Stress-test orchestration and RAG decision contract

> **Current state (2026-07-19): the baseline instructions below have already
> been executed.** Do not spawn five new question-authoring agents and do not
> rewrite the frozen exam. Baseline results are in
> [`stress_test_baseline_results.md`](stress_test_baseline_results.md); current
> project state is in [`STATUS.md`](STATUS.md). For the next phase, preserve the
> baseline artifacts and follow **Condition continuation after the baseline**
> and **RAG go/no-go decision rules** at the end of this file.

Paste everything below the line into a fresh Claude Code session (or just say:
"Follow the instructions in docs/run_stress_test_prompt.md").

---

Run the per-philosopher stress test of this app's philosophical accuracy. The
full spec — master agent prompt, grading rules, and per-philosopher trap
appendices — is in `docs/stress_test_agents.md`. Read it completely before
doing anything else; it is the contract the agents must follow.

## Phase 0 — Setup (do all of this before spawning any agents)

1. Confirm the dev server runs with a working LLM key: `.env.local` must have
   `ANTHROPIC_API_KEY` (or another configured provider). Start `npm run dev`
   if it isn't running and verify with one real chat request end-to-end.
2. Read `src/app/api/chat/route.ts` and whatever it imports to learn the
   exact request format — philosopher id, answer level, and the NDJSON
   streaming response. Then write a small helper,
   `scripts/stress-probe.ts`, that takes a philosopher id, an answer level,
   and a question, sends the request, collects the streamed reply, and prints
   the full text, any retrieved-sources metadata, the wall-clock latency,
   and the reply length in tokens (or characters if tokens are unavailable).
   Latency and length feed the cost side of the eval later. Agents will
   shell out to this instead of each reinventing HTTP handling. Verify it
   works with one probe question before proceeding.

   Live viewing: the probe script also tees everything it does to log files
   so the run can be watched as it happens —
   - `data/rag/stress/<philosopher>/live.log`: a timestamped question
     header, then the reply appended chunk-by-chunk as it streams in.
   - `data/rag/stress/live.log`: each COMPLETED question/reply appended as
     one atomic entry (question, full reply, latency, philosopher) — kept
     whole-entry because two agents run concurrently and interleaved
     chunks would garble a shared stream.
   Tell me the exact watch command when the run starts (PowerShell:
   `Get-Content data\rag\stress\live.log -Wait -Tail 20`, or the
   per-philosopher log for token-by-token streaming). Log files are
   view-only duplicates — results.json remains the source of truth.
3. Check the rate limiting added in the abuse-protection work
   (`docs/SECURITY.md` / the relevant middleware). Each agent will send
   25–40 questions. If the limiter would block that, pace the requests or
   relax the limit for localhost in dev only — do not weaken any protection
   that applies to production.
4. SEP/IEP URLs are in `data/rag/source_manifest.json`; agents are expected
   to fetch and read those pages during their study phase.

## Phase 1 — Spawn the agents

5. Spawn one subagent per philosopher: aquinas, nietzsche, kierkegaard,
   sartre, camus. Each agent's prompt is the master prompt from
   `docs/stress_test_agents.md` with `{{PHILOSOPHER}}` filled in, plus that
   philosopher's trap appendix from the same file, plus one paragraph
   explaining how to call `scripts/stress-probe.ts`.
6. Run at most two agents concurrently (they share the dev server and the
   API budget); start the next as each finishes.
7. Each agent writes ONLY to `data/rag/stress/<philosopher>/`:
   `report.md`, `results.json`, `eval-questions.json`, `card-proposals.md`,
   `coverage.md` — formats per the spec. If an agent tries to write anywhere else, stop it
   and fix the prompt. Enforce the spec's ordering rule: agents must not
   read `data/rag/` (beyond `source_manifest.json`) or
   `src/lib/philosophers.ts` until their question bank is written
   (corpus-blind questions are what make the later with/without-RAG
   comparison honest).

## Phase 2 — After all five agents finish

8. Write `data/rag/stress/SUMMARY.md`: a severity-weighted scoreboard per
   philosopher (checks passed/failed at critical/major/minor, by category),
   the ten most serious confirmed failures across all five with transcript
   excerpts, and any failure patterns that recur across philosophers (those
   are usually retrieval or prompt problems, not knowledge problems — say
   which you think each is).
9. Merge the five `eval-questions.json` files into
   `data/rag/eval/questions.json` (create the directory), deduplicating
   near-identical questions and preserving the full schema (checks,
   severities, provenance, relevant_corpus). Set `"inspired_card": true` on
   every question a card proposal names as its motivation. This file is the
   frozen Wave-1 exam for the stage-4 eval harness.
10. Merge the five `coverage.md` files into `data/rag/stress/COVERAGE.md` —
    the standalone corpus-coverage audit, kept separate from exam scores.
11. Build `scripts/build-stress-dashboard.ts`: reads every
    `data/rag/stress/*/results.json` plus the merged question bank and
    writes `data/rag/stress/dashboard.html` — one self-contained file
    (inline CSS/JS, no external requests, opens straight from disk). It
    must show:
    - Overview: per philosopher, checks passed/failed broken down by
      severity and by category, plus the severity-weighted headline score
      and totals across all five.
    - A browsable list of EVERY question with its full reply, filterable
      by philosopher, category, pass/fail, severity, and provenance —
      failures expanded by default.
    - For each failed check: the reply with the offending `evidence_span`
      highlighted in place, and beside it the check that failed, its
      severity, the one-line "why", and the sourced correction. Omission
      failures (span null) show the missing fact instead of a highlight.
    The generator keys everything by run label (condition + date). It
    renders this single baseline run now, and when later runs add more
    results.json files (RAG, hardened-prompt conditions) it must render
    side-by-side condition columns without code changes. dashboard.html is
    generated output — rebuild it, never hand-edit it. Verify it renders
    by opening it after generation.
12. Beyond the files above, `scripts/stress-probe.ts`, and
    `scripts/build-stress-dashboard.ts`, touch nothing else. Do not modify
    `data/rag/cards/`, `quotes/`, `indexes/`, `texts/`, or any app source.
    Card proposals stay in each agent's `card-proposals.md` for my review —
    they do not enter the drafts folders.

## Reporting

13. When done, report: the severity-weighted scoreboard, the worst confirmed
    failures in plain language, how many eval questions were banked, the
    path to `dashboard.html`, roughly how many API calls the run consumed,
    and your read on the single highest-leverage fix.

## Eval design contract (binding on the stage-4 harness)

These decisions are already made; the harness that later consumes
`data/rag/eval/questions.json` must implement them:

- **Three conditions, not two.** A = baseline (current `sources` arrays);
  B = corpus-wired RAG; C = baseline with persona prompts hardened using
  the trap material this run surfaces (misattributed quotes, fake works,
  standard misreadings — static, cacheable, no retrieval). C exists because
  a hybrid (hardened prompts for traps, retrieval for depth) is the
  expected landing zone, and a two-condition experiment cannot allocate
  categories between mechanisms.
- **Scoring**: run each question ~3 times per condition; grade with a
  separate judge pass that sees only transcript + checks (conditions
  shuffled and unlabeled), returns per-check true/false with a verbatim
  evidence span, or the check fails. Headline metric is severity-weighted;
  a flat pass rate treats an invented quote and a missed citation as equal,
  which they are not.
- **Cost side is mandatory.** Per condition, record latency and added
  tokens per turn, and run a paired voice check (which of two shuffled
  answers reads more like the philosopher). A cost-benefit analysis with
  instruments on only the benefit side always returns "buy."
- **Two deltas**: report improvement on `inspired_card: true` questions
  (did we fix known holes?) separately from the held-out rest (does the
  corpus generalize?). Only the second supports the go/no-go decision.
- **Single-shot results are an upper bound.** Every probe is one clean,
  self-contained question — RAG's best case. Real usage is long rabbit-hole
  conversations where follow-up queries ("but doesn't that contradict…")
  retrieve poorly. Report Wave-1 numbers with that caveat, and add a small
  multi-turn track (scripted 10–15-turn conversations with the graded
  question at the end) before the final wiring decision.
- **Same results format, same dashboard.** Every condition run emits
  results.json files in the exact per-philosopher schema from the agent
  spec (with its own `run.condition` label), so
  `scripts/build-stress-dashboard.ts` picks them up and renders the
  side-by-side comparison without modification.
- **Labeling**: results are "Claude-verified, human-audited" (10–15% of
  judge verdicts spot-checked against cited sources). Question-writer,
  answerer, and judge are all Claude; never present the output as
  expert-validated.

Context you should know: the RAG corpus under `data/rag/` is NOT yet wired
into the running app — runtime retrieval still uses the `sources` arrays in
`src/lib/philosophers.ts`. Failures caused by that gap are expected and are
exactly what this run is meant to surface and quantify. Grade what the system
actually says, not what the corpus would have supported.

---

## Condition continuation after the baseline

The exploratory baseline is complete. Its original artifacts are immutable
evidence: do not overwrite `results.json`, rewrite answer keys to fit later
answers, or alter the 184-question frozen exam. New runs must use new filenames
and a distinct `run.condition` value so the dashboard can compare them.

### Gate 1 — preflight and reproducibility

1. Read `docs/STATUS.md`, `docs/stress_test_baseline_results.md`,
   `data/rag/review/corrections_2026-07-19.md`, and this file before editing
   code. Use those as the canonical handoff; do not create another narrative
   results document.
2. Record the SHA-256 hash of `data/rag/eval/questions.json`, the app model ID,
   generation settings, commit/worktree state, machine/runtime, and date. Every
   A/B/C run must reuse the same question text, answer level, and checks.
3. Run `npm test` and a small live probe before making changes. Preserve the
   existing baseline files and generated dashboard.

### Continuous checkpointing — required

Create `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md` at the beginning of the
next-phase session and keep it current throughout the work. This is a temporary
resumption record, not another results report. Update it:

- immediately after the initial repository inspection and plan;
- after every completed implementation or evaluation gate;
- after each meaningful probe batch or long-running command;
- whenever a result changes the plan or reveals a blocker;
- before starting any operation likely to consume substantial usage;
- at least every 30–45 minutes during sustained work; and
- immediately before ending, pausing, or when remaining usage appears low.

Every checkpoint update must state:

1. current objective and current gate;
2. completed work, with exact files changed;
3. commands/tests/probes run and their results;
4. artifacts written, including condition labels and filenames;
5. active or unfinished processes and whether they are safe to resume;
6. API/probe counts and any known usage or rate-limit information;
7. decisions made, assumptions, blockers, and unresolved questions;
8. the frozen-exam hash and whether it still matches;
9. the exact next action, written so a fresh agent can execute it without
   reconstructing the previous session from chat history.

The checkpoint must never contain secrets, API keys, or copied `.env` values.
Write it atomically enough that it is not left half-updated during a long run.
Do not use it as the source of final metrics: machine-readable result files and
the generated dashboard remain authoritative.

A replacement agent must read `docs/STATUS.md`, this orchestration document,
and `RAG_EXPERIMENT_CHECKPOINT.md` before taking action. It must verify the
checkpoint against the filesystem and result files, then continue from the
recorded next action rather than rerunning completed work. When the experiment
is genuinely complete, fold the durable outcome and artifact links into
`docs/STATUS.md` and remove the temporary checkpoint so it cannot become stale.

### Gate 2 — implement reproducible conditions

Implement a development/evaluation condition switch; do not silently replace
production behavior while the value of deeper RAG is unproven.

- **A — baseline:** current hard-coded `philosophers.ts` excerpts and current
  persona prompts.
- **B — corpus RAG:** the same persona prompts as A, but retrieval can search
  the source-backed `data/rag/` corpus.
- **C — hardened prompts:** the same retrieval as A, with compact static trap
  corrections added to persona prompts. No card-corpus retrieval.

Keep all other behavior constant. If B also changes prompts, or C also changes
retrieval, the comparison cannot tell which mechanism caused an improvement.

For B, extend the build-time index rather than adding a network vector
database. At this scale, parse each position card as one explanation-shaped
unit with stable metadata (`id`, philosopher, title, claim, explanation,
citations, provenance, status). Include only source material whose verification
state is explicit; never turn a `pending` quote candidate into an authoritative
quotation merely because it exists on disk. Add verified misattribution-warning
records where they are needed to test attribution traps. Store precomputed local
embeddings and reuse the existing hybrid scorer, relevance threshold, top-k
limit, prefetch, cache, timeout, and keyword fallback.

Before any expensive LLM run, add deterministic tests proving:

- the builder reads the card files rather than only `philosophers.ts`;
- all expected card IDs are indexed once with citations attached;
- philosopher filtering prevents cross-persona leakage;
- pending/unverified quote text is excluded from authoritative grounding;
- known queries retrieve the expected corrected cards or misattribution
  warnings in the top three;
- unrelated queries cross no injection threshold;
- stale-index detection and keyword fallback still work.

### Gate 3 — cheap paired pilot before the full run

Do not immediately spend approximately 1,656 answer calls on 184 questions ×
3 conditions × 3 repetitions. First run one repetition per condition on a
stratified pilot containing:

- every baseline critical failure;
- every baseline major failure;
- representative attribution, locate, depth, misreading, and pass-plus cases;
- both `inspired_card: true` and held-out questions;
- at least ten questions whose `relevant_corpus` is empty, to detect harmful
  over-injection.

Use identical questions and settings across A/B/C. If B cannot retrieve the
mapped source, violates the latency guardrail, or causes critical regressions,
stop and repair or reject it before a full run. If the pilot shows no credible
signal beyond C, report that and do not consume the full evaluation budget
without explicit approval.

### Gate 4 — decision run

If the pilot passes, run every frozen question approximately three times in
each condition. Use the model-routing policy in
`docs/stress_test_agents.md#subagent-model-routing-for-future-runs`: efficient
Terra workers for mechanical corpus/result work, but a stronger model for
source-sensitive research and final arbitration. Calibrate any cheaper blind
judge on a stratified human/strong-model sample before trusting it.

The blind judge sees only the shuffled transcript and frozen binary checks—not
the condition label. Store every verdict, exact evidence span, retrieval source
ID, retrieval score, retrieval latency, first-chunk latency, full latency, and
reply size. Human-audit 10–15% of verdicts, oversampling all critical failures
and condition disagreements.

Regenerate `data/rag/stress/dashboard.html`; do not hand-edit it. Put the
machine-readable condition results beside the existing per-philosopher stress
artifacts using new filenames. Update `docs/STATUS.md` and the existing
baseline handoff with a short outcome/link section; do not create a second
full results report.

## RAG go/no-go decision rules

Pre-register these rules before looking at Condition B answers. Because the
baseline is already high, a small headline percentage change can still matter
if it reliably removes a catastrophic attribution failure; evaluate both the
weighted aggregate and the failure types.

### Accuracy/value guardrails

Corpus RAG is a credible default only if all of these hold:

1. It introduces no new critical failure and does not break the documented
   pass-plus cases.
2. It reliably fixes the known critical attribution failure or an equivalent
   high-severity class when the needed source exists in the eligible corpus.
3. On **held-out** questions, not only inspired-card questions, it either
   improves the severity-weighted score by at least 1.5 percentage points or
   reduces the remaining weighted error by at least 25%.
4. Citation/source entailment improves: retrieved material must actually
   support the generated sentence, not merely share vocabulary with it.
5. Empty-support questions do not trigger confident, irrelevant grounding.

### Latency guardrails

Measure retrieval separately from provider generation. Corpus RAG passes the
voice-first cost side only if:

- warm cache-hit retrieval p95 is at most 10 ms;
- fresh retrieval p95 stays within the existing 150 ms embedding budget;
- median first-token and first-audio latency rise by no more than 250 ms;
- p95 first-token, first-audio, and full-response latency rise by no more than
  10% versus the paired A run;
- provider outages/retries are labeled and excluded from mechanism-level
  latency conclusions, while still reported operationally.

### Decision outcomes

- **Ship B:** B clears accuracy and latency guardrails and provides held-out or
  critical-failure value that C does not match.
- **Ship C only:** prompt hardening matches B's benefit with less latency and
  complexity.
- **Ship a hybrid after a separate D test:** B and C fix complementary failure
  classes. Test the combination only after A/B/C identifies their individual
  contributions.
- **Offer RAG only in study/source mode:** B materially improves deep citations
  but misses voice latency or conversational-relevance guardrails.
- **Do not wire deeper RAG:** gains occur only on cards inspired by the exam,
  held-out performance is flat, critical regressions appear, or latency cost is
  disproportionate.

Whichever outcome wins, document the decision in `docs/STATUS.md` with links to
the dashboard and machine-readable results. Preserve the losing condition
behind no production default unless it remains useful as an explicit study
mode.
