# Prompt: narrow RAG retrieval scope and refactor the eval harness

You are picking up a design pivot that was reasoned through in a prior chat
session (not visible to you) via extended discussion and a devil's-advocate
stress test. This document is the complete record of what was decided and
why. Read it fully before touching any code. Nothing here has been executed
yet — no code has been changed, no new pilot has run. You are starting from
the repository's current committed/working state.

## Phase 0 — Orientation (no spend, no code changes yet)

Read, in this order:

1. `docs/STATUS.md` — canonical "what is done, what's next" for the whole
   RAG effort.
2. `docs/rag_architecture.md` — the hybrid-grounding design and its stated
   non-goals.
3. `data/rag/stress/RAG_EXPERIMENT_CHECKPOINT.md` — full operational history
   of the pilot runs (r1 through r10). Pay special attention to the r8 A/B
   analysis, the r9 mandatory-stop section, and the "no-spend root-cause
   investigation of both known B regressions" section — those three sections
   are the direct evidence base for everything below.
4. `src/lib/retrieval.ts` — the current hybrid retrieval implementation.
5. `scripts/run-pilot.ts` and `scripts/pilot-harness.ts` — the current pilot
   runner and its schemas.
6. `data/rag/eval/pilot-manifest.json` — the frozen 27-question hard pilot.
7. `data/rag/cards/drafts/kierkegaard.md` (search for "Attack on the Danish
   State Church") and `data/rag/cards/drafts/camus.md` (search for "The
   Rebel and the Public Break With Sartre") — the two concrete defect
   examples referenced throughout this document.

Do not rebuild embeddings, do not touch any frozen exam, baseline result,
manifest, or original dashboard during this phase.

## Background: what was found, and why the design is changing

**The finding that triggered this pivot.** Condition B (the experimental
full-corpus retrieval condition) can retrieve a `position_card` that is
correctly on-topic, correctly above the injection threshold, and still
*worse* than the model's own unaided answer — because the card is vaguer
than the model's own parametric knowledge. Two confirmed instances:

- `card:kierkegaard:the-attack-on-the-danish-state-church` scored 0.7310
  (well above the 0.67 injection floor) and describes the real historical
  figures involved only as "a recently deceased bishop" and "a comfortable,
  politically-connected church official." The real names are Bishop
  Mynster and his successor Martensen. The same-day Condition A reply (no
  card injected) named both correctly. Grounding on the vaguer card
  regressed a check that the ungrounded answer passed.
- `camus.md`'s "The Rebel and the Public Break With Sartre" card describes
  the 1952 rupture as "Sartre's journal published a harshly critical
  review... Camus responded personally and angrily" without naming the
  journal (*Les Temps modernes*) or the reviewer (Francis Jeanson). Same
  defect shape: real, checkable specifics collapsed into vague paraphrase.

**The statistical-fragility finding.** Single-pass, single-judge-call
verdicts on identical questions are not stable. `sartre-q35`'s critical
check `q35-c2` FAILED in run r9, then PASSED in an isolated fresh diagnostic
run against the exact same (empty-retrieval) prompt. Condition B's raw
accuracy gain in r8 (+7.9 weighted points on corpus-grounded questions) fell
to roughly **+1.15 points** once compared against the gain the *ungrounded*
question subset showed from pure sampling/judge noise alone (+6.7 points).
One repetition of a 27-question pilot cannot reliably separate real RAG
benefit from noise.

**The latency finding.** Retrieval itself is cheap and not the real cost —
median retrieval time was 52.9ms (Condition A, 4 curated excerpts) vs.
85.1ms (Condition B, ~52-63 corpus items), both trivial against an
~8-9 second total response time. The actual guardrail failure was **P95
full-response latency, +18.1% (vs. a ≤10% rule)**, moving together with
**+14% more reply characters** — i.e., grounding text in the prompt makes
the LLM generate longer, slower replies. This scales with how *often* the
injection gate fires, not directly with raw corpus size.

**Why "just tell the model to self-check" was also rejected.** The persona
prompt (`src/lib/providers/llm.ts`) already has a self-monitoring mechanism
— a three-tier epistemic-status framework ("I argued this" / "common
interpretation" / "I did not face this directly"). The original 184-question
baseline stress test ran with that instruction already active, with no
corpus wired in, and still produced one critical failure: a swallowed
misattributed Nietzsche quote with a fabricated citation. Confabulation
happens because the model doesn't know it's wrong, not because it forgot to
check — so instructions like "always check official resources" have nothing
to execute against (`/api/chat` has no tool-calling, browsing, or external
API call in the generation path; this is confirmed in `rag_architecture.md`,
which lists agentic `search_sources` tool-calling as an explicit, unbuilt,
"later/optional" idea). Such an instruction would only make the model
*assert* verification it structurally cannot perform, which is a worse
failure mode, and it would add real generation-time latency in a
voice-latency-sensitive app for no accuracy benefit against confident
confabulation specifically.

## The design decision (what to actually build)

1. **Stop retrieving `position_card` entries into the grounding prompt, in
   any condition.** The specificity/vagueness risk is concentrated in this
   type, and it is the type most redundant with what the model's own
   training already supplies correctly and specifically.
2. **Keep retrieving only `verified_quote` and `misattribution_warning`
   type entries.** These guard a category — exact wording and exact
   citation location — that the model cannot self-verify by introspection
   no matter how it's instructed, because it doesn't know when it's wrong
   about a fact. This is a genuinely external-fact-matching problem, unlike
   general position/doctrine explanation.
3. **Common misreadings become static system-prompt text, not retrieved
   content.** They're a bounded, enumerable list (already partially present
   in the persona prompt, e.g. "Camus ≠ existentialist"). This is cheap
   (rides the cached persona prefix — no per-turn retrieval cost) and
   self-monitoring instructions are plausible for this bounded category,
   unlike exact-quote verification.
4. **Do not delete or bulk-scrap the 257 existing `position_card` drafts.**
   Deleting them was considered and explicitly rejected as disproportionate:
   only 2 confirmed specificity defects were found via a *targeted* search
   of biographical/historical card headers, not a full audit — there is no
   evidence the other ~255 cards are defective. They remain on disk,
   unused by the live retrieval path, as reference material and a candidate
   target for a future specificity audit (does each card name every real
   person/work/date its own `Provenance` line would name) — that audit is
   separate, lower-priority work, not a blocker for this refactor.
5. **Do not implement "always check official resources"-style instructions.**
   Rejected per the background section above.

## Phase 1 — Retrieval scope change (code)

In `src/lib/retrieval.ts`:

- `sourcesForCondition` and the scoring/injection path must exclude
  `position_card` from every condition's retrieval-eligible set. Only
  `curated_excerpt` (existing baseline behavior, unchanged), `verified_quote`,
  and `misattribution_warning` should ever be scored or injected.
- Re-examine whether the existing three-tier Condition-B injection gate
  (`CORPUS_INJECTION_MIN_SCORE` / `CORPUS_CONSENSUS_MIN_SCORE` /
  `CORPUS_DOMINANT_MIN_SCORE` + margin) still makes sense once the corpus
  it searches shrinks from ~259 mixed units to just the `verified_quote` +
  `misattribution_warning` subset (per `STATUS.md`, currently effectively 2
  verified quotes plus whatever `misattribution_warning` entries exist —
  confirm the exact current count by reading the generated
  `src/data/source-embeddings.json` and `data/rag/quotes/drafts/*.json`).
  Do not assume the existing thresholds transfer; flag this as needing
  fresh calibration rather than reusing 0.67/0.60/0.58 unexamined.
- Update `src/lib/retrieval.test.ts` and any other test that asserts on
  `position_card` being retrievable — those assertions need to change to
  assert the *opposite* (position cards are never retrieved) rather than be
  deleted silently.
- Add the bounded misreading list to the static persona prompt in
  `src/lib/providers/llm.ts` (or confirm what's already there is sufficient
  — check what misreading-correction text already exists before assuming
  none does).

Run `npx tsc --noEmit` and `npm test` after this phase and before proceeding.
Do not rebuild embeddings yet if it isn't required for these changes to pass;
if it is required, say so explicitly before doing it.

## Phase 2 — Eval harness refactor (`scripts/run-pilot.ts`, `scripts/pilot-harness.ts`)

Three concrete problems to fix, found by direct experience running r1
through r10 (see the checkpoint):

1. **No resumability.** Every stop (r3 through r10) required a brand-new
   `RUN_LABEL` and a full redo of every already-completed record — r9 and
   r10 each re-ran 27 clean A records and several clean B records just to
   reach the point of a prior failure again. Refactor so a run can resume
   from the next unprocessed record after an interruption or a paused
   mechanism-violation (see below), under the *same* run label, without
   discarding or re-executing already-cached records.
2. **Stop-rule semantics must split into two classes, not one:**
   - **Content-quality anomaly** — a judge verdict fails, including a "new
     critical failure" relative to the immutable baseline
     (`assertConditionBSafety`'s current final check). **Log it and
     continue the run.** Each subsequent question is an independent data
     point; nothing about continuing makes future records suspect. This
     replaces the current behavior where any new critical failure halts the
     entire run.
   - **Mechanism/invariant violation** — cross-philosopher source leak,
     ineligible/unknown source retrieved, a source injected on a
     designated empty-support question, or stage-ceiling exhaustion. **Pause
     new spend (answer/judge/TTS calls) immediately, but preserve every
     already-completed record.** Do not discard the run. This is because the
     underlying code path is still active and broken for every subsequent
     record until it's fixed — continuing would burn spend on more records
     you'd have to discard anyway. After investigation/fix, resume from the
     next unprocessed record under the same label.
3. **Lighter integrity verification.** Replace the current fully-manual
   ceremony (recompute ~10 protected file hashes by hand, rerun the full
   test suite, gate2, gate3, preflight, and browser-check, every single time
   a run label changes) with a single automated "has anything protected
   changed since it was last verified" check that a script can run in one
   command. Keep the actual safety guarantee (frozen/protected inputs
   haven't silently drifted); drop the manual re-verification ritual around
   it.

**New deliverable: a human-review dashboard.** Build a lightweight
mechanism (a generated static page, or a simple local CLI/TUI — your choice,
but it must be genuinely easy to use one record at a time) that presents,
per probe/pilot record: the real question asked, the model's actual answer,
and the judge's verdict + explanation. It must let a human approve or deny
each one, and a denial must capture a reason. This is the actual finalizing
authority — the automated LLM judge is a first-pass draft, not the final
word, precisely because the judge and the model being judged share the same
blind-spots (see the background section above on self-grading). Denial
reasons should be logged/recorded in a way that's usable later for improving
judge prompts or corpus content — don't build an automatic feedback loop
that silently retrains anything; a human decides what changes.

## Phase 3 — Recalibration scoping (analysis only, no spend)

The frozen 27-question hard-pilot manifest, its `relevant_corpus` mappings,
and the Gate 2/Gate 3 calibration thresholds were all built against the old,
broad corpus (259 units, mostly `position_card`). Once retrieval is narrowed
to `verified_quote`/`misattribution_warning` only, the searchable corpus is
drastically smaller. Produce a short written analysis (no code, no spend) of:

- How many questions in the current 27-question manifest have
  `relevant_corpus` entries that still exist under the narrowed corpus
  (i.e., point to a `verified_quote` or `misattribution_warning`, not a
  `position_card`) — these are the only ones for which Condition B can
  still inject anything.
- What the empty-support/injection-threshold calibration would need to be
  re-derived against (the new, much smaller candidate set), and roughly
  what that calibration effort would require — do not execute it yet.
- Whether the existing frozen manifest is still fit for purpose for testing
  this narrowed design, or whether a new, smaller, purpose-built question
  set (specifically targeting fabrication/misattribution traps, since
  that's the only category this narrowed corpus addresses) would be more
  honest to evaluate against.

## Explicitly out of scope — do not do these without separate authorization

- Do not delete, rewrite, or bulk-correct any of the 257 `position_card`
  drafts. That audit is separate future work.
- Do not make any live Anthropic or ElevenLabs API call. No pilot execution,
  no judge calls, no TTS calls. This phase is code and analysis only.
- Do not make a default-wiring / go-no-go decision on Condition B.
- Do not begin or plan the full 184-question evaluation.
- Do not touch the frozen exam, any of the five original baseline
  `results.json` files, the original dashboard, or any `rag-gate3-pilot-v1-r*`
  run directory. Those are immutable history.

## Standing rules

- Checkpoint your work (a short markdown log of what changed and why is
  sufficient — this doesn't need the full ceremony of the pilot-run
  checkpoints, just an honest record).
- If you find the existing corpus/count assumptions in this document don't
  match what's actually in the repository (e.g., the verified-quote count,
  or existing misreading text in the persona prompt), trust what you find
  in the repository over this document, and note the discrepancy.
- Report outcomes exactly. If something in Phase 1 or 2 turns out to be
  more involved than scoped here, stop and report rather than
  improvising scope silently.

## Appendix — eval-methodology findings from the same discussion (2026-07-23)

These weren't part of the RAG-scope decision above, but came out of the same
extended session, reviewing the eval harness's own methodology (question
generation and blind-judge grading), and are recorded here so they aren't
lost. They are about `docs/stress_test_agents.md` (the exam-authoring
contract), not about `retrieval.ts` — a future session should treat them as
a separate, already-partially-implemented thread, not part of Phase 1-3
above.

**Already implemented (this session, in `docs/stress_test_agents.md`
directly):**

- Exam/trap authorship must run on a different model family than the
  persona under test (Codex, not Claude Code) — a single shared model
  lineage authoring both the exam and the thing being examined means a trap
  neither one knows about is invisible on both sides at once, and a second
  same-lineage reviewer agent doesn't decorrelate that risk.
- Trap-finding must combine memory recall *and* live web search against
  curated debunking sources (Wikiquote `Disputed`/`Misattributed` sections
  at minimum), merged into one candidate list. A Wikiquote `Disputed` tag
  is not proof of falsehood by itself — editors apply it inconsistently —
  so the underlying cited evidence must be read, not just the tag.

**Still open, not yet implemented anywhere (raised, not resolved):**

- The exam's own ground truth (`answer_key`/`pass_if` per question) has
  never been independently audited — unlike the corpus and the harness,
  which both got real scrutiny this session. Proposed fix: a second
  reviewer agent (ideally the different-model-family one above) plus the
  human-review dashboard from Phase 2 as the final check — not yet built.
- The original 184-question baseline (`data/rag/eval/questions.json`) was
  run as a single, never-repeated pass per question (Phase 4 of the agent
  contract says so explicitly: "One probe per question"). Its headline
  numbers (95.3% severity-weighted, 1 critical failure) have an unmeasured
  noise band, by the same mechanism that produced `sartre-q35`'s flip. A
  stratified reliability re-run (the ≥30-check calibration sample already
  described in `stress_test_agents.md`'s subagent-routing section, originally
  scoped only for judge-model-swap decisions) should be repurposed to
  measure this baseline's own repeat-reliability, not executed yet.
- `normalizeJudgeChecks` (`scripts/run-pilot.ts`) verifies a judge's
  `evidence_span` is a real, exact substring of the reply — it does not
  verify the quoted span actually supports the `pass_if`. A judge can quote
  real but non-probative text and pass the code-level check. The
  human-review dashboard is the intended fix, but only if its UI explicitly
  separates "do I agree with the verdict" from "is this evidence actually
  probative" — a single approve/deny click will not reliably catch this.
- The judge's own domain knowledge is never independently verified — a
  check like "names the correct pseudonym and works" assumes the judge
  itself knows the right answer, which is the same "trust the model's
  parametric knowledge" assumption the rest of this project distrusts
  everywhere else. Same proposed fix (human dashboard), same caveat (only
  works if the human actually verifies the fact rather than trusting the
  judge's confident-sounding `why`).
- Severity (`critical`/`major`/`minor`) is assigned subjectively by
  whichever agent/model wrote each philosopher's question bank, with no
  inter-rater consistency check across philosophers — possibly different
  models per the routing table. Weighted-accuracy comparisons across
  philosophers may be aggregating inconsistently-calibrated severities.
  Not yet addressed.

### Curated trap candidates found via live web search (2026-07-23)

Cross-checked against the existing trap appendices in
`stress_test_agents.md` (bottom of that file). Marked `[confirmed]` where a
trap already in the appendix got a more precise source, and `[NEW]` where
it's not in the appendix at all. These should be folded into the relevant
philosopher's trap appendix the next time the exam is authored or revised —
not yet added to the frozen `questions.json`.

**Aquinas**
- `[confirmed]` The "remove prostitutes → sodomy" line: the real Augustine
  original is "Remove prostitutes from human affairs and you will unsettle
  everything on account of lusts" — the version attributed to Aquinas is
  Ptolemy of Lucca's paraphrase, misattributed one step further down the
  chain.
- `[NEW]` A quote about "loving those whose opinions we share and reject"
  circulates as Aquinas's; authenticity disputed/unconfirmed.
- `[NEW, subtler]` Quotes tagged "Aquinas commenting on Aristotle" trace to
  *Sententia super Metaphysicam*, where Aquinas is reporting Aristotle's
  view, not asserting his own — a reporting-vs-endorsing trap, not
  fabrication.

**Nietzsche**
- `[NEW]` "The individual has always had to struggle..." — actually Rudyard
  Kipling, a 1935 interview published in *Reader's Digest*, 1959. A
  *second*, distinct Kipling misattribution beyond "the privilege of owning
  yourself" already in the appendix.
- `[NEW]` "If you crush a cockroach you're a hero, if you crush a butterfly
  you're a villain" — appears in none of Nietzsche's works; likely origin is
  a 2015 Reddit r/showerthoughts post, not originally attributed to him at
  all. A purely internet-native fabrication with no SEP/IEP footprint —
  exactly the category a memory-only pass would miss.
- Methodological note: Wikiquote editors themselves say the `Disputed` tag
  is applied inconsistently (sometimes "weakly attributed," not "confirmed
  false") — read the talk-page evidence, don't trust the tag alone.

**Kierkegaard**
- `[confirmed, more precise]` "The mystery of life is not a problem to be
  solved, it is a reality to be experienced" — properly attributed to
  Jacobus Johannes van der Leeuw (1893-1934), *The Conquest of Illusion*.
- `[NEW]` "The truth shall set you free, but first it shall make you
  miserable" — widely attributed online; original source unconfirmed.

**Sartre**
- `[NEW]` "If you are lonely when you're alone, you are in bad company" —
  widely attributed, especially in self-help contexts; no citation found in
  his actual work.
- `[NEW, high-value]` "You don't fight fascism because you're going to win.
  You fight fascism because it is fascist" — no primary-source citation
  found. Thematically adjacent to `sartre-q35` in the current pilot
  manifest (the real 1953 Rosenberg/fascism quote) — worth including both
  in the same trap set since they're easy to confuse with each other.
- `[NEW, subtler]` A line about being "separated from himself by all the
  breadth of his being" is Sartre *characterizing Heidegger's* philosophy
  (in "The phenomenological concept of nothingness"), not his own view —
  same reporting-vs-endorsing shape as the Aquinas/Aristotle trap above.

**Camus**
- `[confirmed, more precise]` "Don't walk behind me..." is confirmed to
  actually come from a children's song used at a Jewish summer camp.
- `[confirmed, more precise]` "Causes worth dying for, none worth killing
  for" — earliest attribution to Camus is an uncited 1999 quotation book;
  the earliest actual occurrence of the sentiment on record is a January
  31, 1943 letter by Albert Dietrich, not Camus.
- Scale note: one source cited "over 56 million wrong references" across
  notable Camus misquotes — supports allocating Camus a larger trap share
  than the other four philosophers.

Sources: [Thomas Aquinas - Wikiquote](https://en.m.wikiquote.org/wiki/Thomas_Aquinas),
[Talk:Thomas Aquinas - Wikiquote](https://en.wikiquote.org/wiki/Talk:Thomas_Aquinas),
[St. Thomas and the means of conversion | They didn't say it](https://fauxtations.wordpress.com/2015/08/12/st-thomas-and-the-means-of-conversion/),
[Nietzsche Said You're a 'Hero' If You Crush a Cockroach...? | Snopes.com](https://www.snopes.com/fact-check/nietzsche-hero-crush-cockroach-villain-butterfly/),
[Talk:Friedrich Nietzsche - Wikiquote](https://en.wikiquote.org/wiki/Talk:Friedrich_Nietzsche),
[Friedrich Nietzsche - Wikiquote](https://en.wikiquote.org/wiki/Friedrich_Nietzsche),
[Søren Kierkegaard - Wikiquote](https://en.m.wikiquote.org/wiki/S%C3%B8ren_Kierkegaard),
[Talk:Søren Kierkegaard - Wikiquote](https://en.wikiquote.org/wiki/Talk:S%C3%B8ren_Kierkegaard),
[Rick On Theater: The Most Famous Thing Jean-Paul Sartre Never Said](http://rickontheater.blogspot.com/2010/07/most-famous-thing-jean-paul-sartre.html),
[Talk:Jean-Paul Sartre - Wikiquote](https://en.wikiquote.org/wiki/Talk:Jean-Paul_Sartre),
[Jean-Paul Sartre - Wikiquote](https://en.wikiquote.org/wiki/Jean-Paul_Sartre),
[Albert Camus - Wikiquote](https://en.wikiquote.org/wiki/Albert_Camus),
[Talk:Albert Camus - Wikiquote](https://en.wikiquote.org/wiki/Talk:Albert_Camus),
[The noble art of misquoting Camus -- from its origins to the Internet era (PDF)](https://www.academia.edu/19617157/The_noble_art_of_misquoting_Camus_from_its_origins_to_the_Internet_era)
