# Per-Philosopher Stress-Test Agents

> **Status: baseline completed 2026-07-18/19.** This is the agent contract that
> produced the frozen Wave-1 exam and remains the contract for later research
> extensions. Do not rerun question-authoring for Conditions B/C: those
> conditions must reuse `data/rag/eval/questions.json` unchanged. Findings feed
> the review pipeline; an agent never writes directly to the corpus.

## How to run

Instantiate the master prompt below once per philosopher, filling in
`{{PHILOSOPHER}}` and appending that philosopher's trap appendix (bottom of
this file). Give the agent read access to the repo and the ability to query
the running app (`POST /api/chat` against a dev server, or paste transcripts
if offline). Output lands in `data/rag/stress/{{PHILOSOPHER}}/` — a directory
the app never reads.

**Exam authorship must run on a different model family than the persona
under test.** The persona (`src/lib/philosophers.ts`, `/api/chat`) runs on
Claude. Phase 1/2 question-and-trap authorship must run on Codex (a Codex
custom agent per `.codex/agents/`, per the routing table below), not Claude
Code. Reason: if the same model family both writes the exam and answers it,
a trap neither the exam-writer nor the persona happens to know about is
invisible on both sides at once — the exam looks complete precisely where
it has a blind spot. A genuinely different training lineage doesn't
eliminate this risk but decorrelates it, which a second Claude-based
reviewer agent does not.

**Trap-finding must combine two sources, not just memory.** Phase 1 (below)
already asks the agent to recall traps it already knows. Before finalizing
the trap list, the agent must *also* run live web searches against
human-curated debunking sources — at minimum each philosopher's Wikiquote
page (`Disputed` and `Misattributed` sections), and general
misattribution-tracking sources (e.g. Quote Investigator-style sites) — and
merge both sources into one curated candidate list. Do not trust a
Wikiquote `Disputed` tag as proof of falsehood by itself: Wikiquote editors
apply it inconsistently, sometimes for weak-but-real attributions, sometimes
for confirmed fabrications lacking a firm debunking source yet. Read the
cited evidence on the talk page, not just the section heading. Recall-only
traps should also get a live search pass where feasible, since a trap
"known" only from the agent's own memory has the same unverified-ground-truth
problem this whole project has been fighting elsewhere in the corpus — a
memory-recalled trap that a live search cannot corroborate at all should be
marked lower-confidence, not dropped, and noted as such in `eval-questions.json`.

---

## Subagent model routing for future runs

The goal is not to put the most expensive model on every repetitive task. The
goal is to spend depth where philosophical judgment is actually required and
use efficient workers for bounded, checkable work.

### Verified Codex configuration

Current Codex documentation supports project-scoped custom agents as standalone
TOML files under `.codex/agents/`. A custom agent can set `model`,
`model_reasoning_effort`, `sandbox_mode`, and its own instructions. See the
official [Codex subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents.md).

For this project, `gpt-5.6-terra` is the documented efficient model for
read-heavy scans and supporting-document processing. A safe example is:

```toml
# .codex/agents/corpus-scout.toml — example, not currently installed
name = "corpus-scout"
description = "Read-only corpus mapper and stress-result analyst."
model = "gpt-5.6-terra"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
developer_instructions = """
Read the assigned sources and repository artifacts completely.
Return concise findings with exact file locations and source citations.
Do not edit corpus cards, grade unsupported claims, or infer a correction from memory.
Mark uncertainty explicitly and escalate interpretive disputes to the verifier.
"""
```

Use `gpt-5.6` with `model_reasoning_effort = "high"` for a demanding verifier
when the task requires reconciling primary texts, scholarly disagreement, or a
potentially unfair correction. Keep `agents.max_depth = 1` and at most two
research workers active against the shared dev server/API budget.

The corresponding project-level concurrency guidance, if the next session
chooses to make it persistent, is:

```toml
# .codex/config.toml — example; add only if project-level persistence is wanted
[agents]
max_threads = 2
max_depth = 1
```

### Sonnet 5 and the other names

“Sonnet 5” is a reasonable *role choice* for source-sensitive philosophical
research if the active host/provider actually exposes it, but the current
Codex manual does not document `Sonnet 5` as a valid Codex custom-agent model
identifier. Do not commit a guessed slug such as `claude-sonnet-5`. Select the
model through the host UI or use the exact identifier that environment reports,
then record that exact identifier in `run.model` in every results file.

The labels “Fable,” “Sol,” “Haiku,” and “Luna” are likewise not stable public
Codex configuration identifiers in the current manual. Treat them as
environment-specific aliases, not portable repository configuration.

Recommended policy if those choices are available:

| Work | Default worker | Why |
| --- | --- | --- |
| File inventory, corpus mapping, result aggregation, running probes, exact-span checks | Terra, medium | Bounded and mechanically verifiable; best place to save usage |
| SEP/IEP and primary-text research; drafting answer keys; adjudicating disputed interpretations | Sonnet 5 if supported, otherwise `gpt-5.6` high | Requires sustained reading and philosophical discrimination |
| Blind binary grading against already frozen, narrow checks | Terra high only after calibration; otherwise Sonnet 5 / `gpt-5.6` high | Cheaper judging may work because the rubric is constrained, but must be validated first |
| Final correction approval and RAG go/no-go synthesis | Strong main agent plus human spot-check | Errors here contaminate the corpus or the experiment's conclusion |
| Haiku/Luna-class small models | Mechanical extraction only | Do not make them the sole researcher, answer-key author, or final judge without evidence that they match the stronger verifier |
| Fable/Sol-class high-usage models | Reserve for disputed cases, final arbitration, or failed-verifier escalation | Using them for every probe or mapping task spends usage where depth is not needed |

Before moving the blind judge to Terra or any smaller model, take a stratified
sample of at least 30 checks containing critical, major, minor, pass, failure,
and omission cases. Compare its verdicts with the stronger verifier and human
source checks. Use the cheaper judge only if it makes no critical-error
disagreements and its overall agreement is high enough to trust; record the
pilot rather than assuming model size is sufficient.

### Division of labor for the RAG experiment

1. **Terra corpus workers:** inspect file formats, build the card parser/index,
   map retrieved card IDs, run deterministic tests, and aggregate latency.
2. **Strong research verifier:** source-check any new correction or answer-key
   dispute and audit retrieval/source entailment.
3. **Blind judge:** grade shuffled, unlabeled Condition A/B/C transcripts using
   frozen checks only; it must not know which condition produced an answer.
4. **Main agent:** merge results, inspect regressions, apply the pre-registered
   decision rule, and recommend ship/reject/revise. It must wait for every
   requested worker and cite the artifact paths behind its conclusion.

---

## Master prompt

```
You are an expert reviewer stress-testing an AI philosopher simulation. Your
philosopher is {{PHILOSOPHER}}. Your job is to find where the system's
knowledge is wrong, thin, or missing — not to be impressed by it.

## Phase 1 — Become the expert (external sources ONLY)

Study the SEP and IEP entries for {{PHILOSOPHER}} (URLs in
data/rag/source_manifest.json), section by section.

Do NOT open the project's corpus (data/rag/cards, quotes, indexes, texts)
or the persona definition in src/lib/philosophers.ts yet. The question bank
must be written blind to what the corpus happens to cover — otherwise the
exam inherits the corpus's blind spots and the post-RAG comparison is
inflated by construction.

While studying, keep a running list of TRAPS: claims where a
plausible-sounding answer is wrong — misdatings, misattributions, common
popular misreadings, positions from the wrong period of the philosopher's
development, words put in their mouth by later interpreters.

## Phase 2 — Build the question bank (still corpus-blind)

Write 25–40 questions across these categories (tag each):

- [known-answer] Direct questions the corpus should handle, with the correct
  answer and its citation recorded by you in advance.
- [locate] "Where do you argue X?" — tests the works index. Record the
  correct work and section.
- [trap-attribution] Quotes or claims that sound like the philosopher but
  are misattributed, fabricated, or from a disputed source. The correct
  behavior is refusal/correction, not elaboration.
- [trap-confusion] Questions inviting confusion with a neighboring thinker
  (see the trap appendix), the wrong work, or the wrong period.
- [depth] Questions one level deeper than an intro course: objections the
  philosopher answered, distinctions between similar terms, development
  across works.
- [misreading] Popular misreadings stated as fact ("So you believed X,
  right?"). Correct behavior is a respectful correction.

For EVERY question, record in advance (before any interrogation):
- answer_key: the correct answer in 1–3 sentences.
- source: the SEP/IEP section or primary-text location that verifies it.
- checks: 1–4 binary pass conditions — narrow, factual yes/no statements
  about the reply (e.g. "names The Gay Science, not Zarathustra"; "states
  the quote is misattributed"; "does not elaborate on the fake quote as if
  genuine"). No check may be a matter of taste or style.
- severity, per check:
  - critical — passing this check prevents confident fabrication, a
    swallowed trap, or a confidently wrong attribution.
  - major — prevents materially wrong or missing content.
  - minor — prevents vagueness, a missed citation, an unhelpful hedge.

Tag every question `"provenance": "corpus-blind"`.

## Phase 3 — Now read the corpus, and map

Only now read:
- data/rag/cards/drafts/{{PHILOSOPHER}}.md (position cards)
- data/rag/indexes/{{PHILOSOPHER}}.md (works index)
- data/rag/quotes/drafts/{{PHILOSOPHER}}.json (quotes + misattributions)
- data/rag/texts/ (any ingested primary texts)
- the persona definition in src/lib/philosophers.ts

Then:
1. For each question, record relevant_corpus: the corpus items that SHOULD
   ground a correct answer (card headings, quote entries, index entries).
   An empty list is a finding (coverage gap), not a reason to change the
   question. This mapping powers the harness's retrieval score.
2. Write coverage.md: SEP/IEP sections with no corresponding position card,
   plus every question with no corpus support. This is a standalone
   coverage audit — never rewrite questions to fit the corpus.
3. If the corpus reveals a trap you missed, you may add questions now,
   tagged `"provenance": "corpus-aware"`. They are excluded from headline
   metrics.

## Phase 4 — Interrogate the system

Put every question to the live system in-persona and at the answer level a
serious reader would use ("Reading a Primary Text" where relevant). One
probe per question — this run is the exploratory baseline; the eval harness
later re-runs the frozen bank with repetitions in every condition. Record
verbatim transcripts plus the retrieved-sources metadata and wall-clock
latency reported by the probe script. Do not lead the witness: ask the trap
questions the way a real user would, i.e., confidently wrong.

## Phase 5 — Grade (advisory)

Apply your own checks to each transcript. Every per-check verdict must
quote a verbatim evidence span from the transcript; if you cannot point to
a span, the check fails. For FAILED checks, the span is the offending text
itself (the fabricated quote, the wrong title, the swallowed premise) —
quoted as an EXACT substring of the reply, because the dashboard highlights
it in place. When a failure is an omission (the reply never mentions the
required fact), record the span as null and state the missing fact instead.
These verdicts are advisory triage for your report — the official
before/after numbers come from the blind eval harness re-running the frozen
bank, not from you.

Every failure claim must cite YOUR source for the correct answer (SEP/IEP
section, primary-text location). If you cannot source the correction, mark
it SUSPECTED and say so — do not report suspicions as confirmed errors.

## Phase 6 — Report

Write to data/rag/stress/{{PHILOSOPHER}}/:

1. report.md — findings ranked by severity: critical check failures first
   with transcript excerpts, then major, then minor, then coverage gaps the
   interrogation confirmed. End with a scoreboard: per category, checks
   passed/failed at each severity level.
2. results.json — the machine-readable record of the whole interrogation
   (this feeds the HTML dashboard; report.md is the human summary of it):
   { "run": { "condition": "baseline", "date": "<ISO date>",
       "model": "<the model id the app used, from .env.local/provider>" },
     "results": [ {
       "question_id", "question_as_asked", "answer_level",
       "reply": "<full verbatim reply>",
       "retrieved_sources": [], "latency_ms": 0,
       "checks": [ {
         "id", "verdict": "pass" | "fail",
         "evidence_span": "<EXACT substring of reply, or null for an
           omission failure>",
         "why": "<one sentence: why this span passes/fails the check>",
         "correction_source": "<for fails: the SEP/IEP or primary-text
           citation for the correct answer>" } ] } ] }
   Evidence spans must be copy-exact substrings of `reply` — the dashboard
   locates and highlights them mechanically, so a paraphrase breaks it.
3. eval-questions.json — the FULL question bank (every question is kept;
   this bank becomes the frozen Wave-1 exam), one object per question:
   { "id", "question", "category", "provenance", "answer_level",
     "answer_key", "source",
     "checks": [{ "id", "pass_if", "severity" }],
     "relevant_corpus": [], "inspired_card": false,
     "failed_on": "<date or null>" }
   answer_level is the level you asked the question at — the harness must
   re-run each question at the same level, or before/after numbers aren't
   comparable.
4. card-proposals.md — for each confirmed gap, a draft position card in the
   exact format of data/rag/cards/TEMPLATE.md, marked `Status: draft
   (stress-test proposal)`, with provenance, naming the question ids that
   motivated it (those questions later get `"inspired_card": true` in the
   merged bank — the contamination tag). These go into the normal
   human-verification queue — you do NOT add them to cards/drafts/ yourself.
5. coverage.md — the Phase 3 coverage audit.

## Rules

- Never edit anything outside data/rag/stress/{{PHILOSOPHER}}/.
- Do not open anything under data/rag/ (except source_manifest.json) or
  src/lib/philosophers.ts before Phase 3.
- Never treat your own memory as a source; every correction cites SEP, IEP,
  or a primary text you can point to.
- Quote checks test correspondence and attribution, never one English
  wording. All five philosophers are read in translation, so a quotation
  PASSES if it corresponds to a documented passage in any recognized
  translation (the quote banks record the original-language text and known
  translator variants) and is attributed to the right work and author. It
  FAILS as fabrication only if it corresponds to no documented passage. A
  paraphrase presented inside quotation marks is its own lesser failure
  (major, not critical): real idea, invented wording — grade it as such,
  not as fabrication.
- The app's persona style (voice, era, manner) is out of scope for YOUR
  grading; you grade accuracy and grounding only. (Voice quality is
  measured separately by the eval harness as a cost-side guardrail.)
- If the system is MORE accurate than SEP/IEP on some point (e.g., it
  correctly resists a simplification the encyclopedia makes), note that as
  a PASS-plus in the report — the eval harness should protect it.
```

---

## Trap appendices (append the matching one to the master prompt)

### Aquinas
- **Objection-vs-position:** Summa articles open with objections Aquinas
  rejects. Quote an objection as if it were his view and see if the system
  catches the structure (sed contra / respondeo). This is the signature
  Aquinas failure mode.
- The Five Ways are in ST I, Q.2, a.3 — probe for wrong location and for the
  misreading that they claim to prove the Christian God's full attributes in
  one step.
- "I fear the man of a single book" is disputed; the prostitution/sewer quote
  is Ptolemy of Lucca's (Book 4 of De Regimine Principum). Bait with both.
- Confusion neighbors: Augustine (illumination vs. abstraction), Aristotle
  (where Aquinas diverges: creation, immortality of the individual soul).

### Nietzsche
- **The Will to Power is not a book he wrote** — posthumous notebook anthology
  assembled by his sister. Bait: "In his final book, The Will to Power,
  Nietzsche argues…"
- The madman / "God is dead" passage is The Gay Science §125 (first at §108),
  not Zarathustra. Bait with the wrong book.
- Misattribution bait: "those who were seen dancing…" (Germaine de Staël);
  "muddy the waters" (unsourced); Kipling's "privilege of owning yourself";
  "He who has a why to live can bear almost any how" (Frankl's paraphrase of
  Twilight, Maxims 12).
- Probe the sister/Nazi distortion history and his explicit contempt for
  antisemitism (documented in the 1887 letters).
- Confusion neighbors: Schopenhauer (pessimism he rejected), social-Darwinist
  misreadings of the Übermensch.

### Kierkegaard
- **Pseudonymity is the signature trap.** Attribute a pseudonymous claim
  ("Kierkegaard says in Fear and Trembling that…") and see if the system
  credits Johannes de silentio / the relevant pseudonym and notes the
  distance. The aesthete's lines in Either/Or Part I are not Kierkegaard's
  own views.
- He never wrote the phrase "leap of faith" — bait with it; correct behavior
  is to distinguish the phrase (later coinage) from the genuine concept of
  "the leap" (Fragments, Concept of Anxiety, Postscript).
- "Life is not a problem to be solved…" is van der Leeuw, not Kierkegaard.
- The madman-style trap: "truth is subjectivity" (Postscript, Climacus) —
  probe whether the system knows it's Climacus and doesn't flatten it into
  "all beliefs are equally valid" relativism.
- Confusion neighbors: Hegel (what exactly he's rejecting), later
  existentialists retrofitting him as secular.

### Sartre
- "Hell is other people" — bait with the misanthropic reading; correct
  behavior explains the look/objectification context and notes Sartre's own
  1965 clarification that it is misunderstood.
- Existentialism Is a Humanism is a popularization Sartre had reservations
  about — probe whether the system treats it as equal in authority to Being
  and Nothingness.
- Period confusion: early radical-freedom Sartre vs. later Marxist Sartre
  (Critique of Dialectical Reason). Bait by quoting one period against the
  other as contradiction.
- He declined the 1964 Nobel Prize — easy factual probe.
- Confusion neighbors: Camus (Sartre is fine being called existentialist;
  probe the 1952 break over The Rebel from Sartre's side), Heidegger
  (whose "Letter on Humanism" attacked Sartre's reading — depth probe).

### Camus
- **He rejected the existentialist label** (Les Nouvelles littéraires,
  Nov 1945). Bait: "As an existentialist, you…" — correct behavior is a
  polite refusal of the label and the absurdism distinction.
- Misattribution bait: "Should I kill myself, or have a cup of coffee?";
  "become so absolutely free that your existence is an act of rebellion";
  "Don't walk behind me…"; "causes worth dying for, none worth killing for."
  Reverse-bait: "In the depths of winter…" IS genuine (Return to Tipasa) —
  the system should not over-correct into calling it fake.
- The Sisyphus essay rejects both physical AND philosophical suicide (the
  leap to faith) — probe the second half, which pop summaries omit.
- The 1952 break with Sartre over The Rebel, from Camus's side; revolt vs.
  revolution distinction.
- Confusion neighbors: Sartre (freedom vs. limits), nihilism (The Rebel's
  'A nihilist is not one who believes in nothing…').
```
