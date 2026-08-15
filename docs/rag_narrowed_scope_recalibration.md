# Recalibration scoping after the retrieval-scope narrowing

Written 2026-07-23. No API call, no pilot run, no manifest edit, no change to
any frozen artifact.

> **Superseded in part, same day.** Sections 0-2 below were written when the
> narrowed corpus was 2 units. The `misattribution_warning` parser identified
> as missing in §0 has since been written, seven warnings verified, and the
> embeddings rebuilt — so the corpus is now 10 retrievable units and the
> thresholds have been re-measured. **Read §5 (appended at the end) first**;
> it records what actually happened and supersedes §2's "roughly what that
> calibration effort would require". §3's argument against the frozen manifest
> still stands, and is now stronger.

Context: `src/lib/retrieval.ts` now excludes `position_card` from every
condition's retrieval-eligible set (`RETRIEVABLE_CORPUS_TYPES`). The frozen
27-question hard-pilot manifest, its `relevant_corpus` mappings, and the Gate 2
/ Gate 3 thresholds were all built against the old corpus. This document scopes
what would have to be re-derived, and argues that the frozen manifest is no
longer the right instrument.

## 0. Correction to the brief: there are no misattribution warnings

The refactor brief assumed the narrowed corpus would be "2 verified quotes plus
whatever `misattribution_warning` entries exist." Measured against the repo:

| Type | Indexed units |
| --- | --- |
| `position_card` | 257 (now unretrievable) |
| `verified_quote` | 2 |
| `misattribution_warning` | **0** |

`misattribution_warning` is a declared type in `RetrievedSource`, `CorpusUnit`,
and `PilotRetrievedSource` — but **nothing produces one**. `scripts/rag-corpus.ts`
has `parsePositionCards` and `parseVerifiedQuotes` and no third parser;
`loadEligibleCorpusUnits` returns only those two. `scripts/rag-corpus.test.ts`
already asserts the count is zero. The raw material exists but is unparsed: the
`misattributions` (12) and `disputed` (4) arrays in
`data/rag/quotes/drafts/*.json`, each with a quote and a sourced explanation.

**So the live narrowed corpus is 2 units, both Nietzsche, both from *Beyond Good
and Evil* (§146 and §153).** Four of five philosophers now have an empty
retrievable corpus, and Condition B is effectively inert for them.

Per-philosopher retrievable corpus, after narrowing:

| Philosopher | Was | Now |
| --- | --- | --- |
| Aquinas | 52 | 0 |
| Nietzsche | 59 | 2 |
| Kierkegaard | 48 | 0 |
| Sartre | 52 | 0 |
| Camus | 48 | 0 |

## 1. Manifest questions that can still inject anything

Recomputed with the runner's own `mappedEligibleIds` matcher against the live
index, once under the old scope and once under the narrowed scope:

**10 questions → 1.**

| Question | Mapped units (old) | Mapped units (narrowed) |
| --- | --- | --- |
| `nz-36` | 1 | **1** — `quote:nietzsche:bge-153:…` |
| `aq-01` | 5 | 0 |
| `nz-01` | 3 | 0 |
| `kg-05` | 3 | 0 |
| `sartre-q02` | 4 | 0 |
| `cam-04` | 3 | 0 |
| `aq-08`, `cam-29`, `cam-35`, `cam-36` | 1 each | 0 |
| the other 17 | 0 | 0 |

`nz-36` is the only question in the frozen pilot for which Condition B can
inject anything at all. It is also, not coincidentally, the only manifest entry
whose `relevant_corpus` names a machine-verified quotation
(`quotes/drafts/nietzsche.json :: quote BGE §153 (machine-verified)`).

Three questions are worth calling out because they look like they should
survive and do not — they map to *misattributions*, the exact category this
narrowing is meant to serve:

- `aq-14` → `quote-misattribution: Prostitution in towns is like the sewer in a palace`
- `nz-19` → `misattributions 'They muddy the waters to make them look deep.'`
- `kg-15` → `misattributions: 'Leap of faith.'`

All three are unretrievable only because no parser emits `misattribution_warning`
units. They are the strongest evidence that the missing parser, not the
narrowing, is what currently guts Condition B.

The 10 empty-support sentinels (`aq-17`, `aq-18`, `aq-33`, `aq-36`, `kg-04`,
`kg-10`, `kg-33`, `kg-35`, `sartre-q07`, `cam-30`) are unaffected — they were
designed to retrieve nothing and still do, but they now prove much less, since
under a 2-unit corpus almost any question retrieves nothing.

## 2. What the thresholds would have to be re-derived against

`CORPUS_INJECTION_MIN_SCORE` (0.67), `CORPUS_CONSENSUS_MIN_SCORE` (0.60),
`CORPUS_DOMINANT_MIN_SCORE` (0.58) and `CORPUS_DOMINANT_MIN_MARGIN` (0.08) are
left unchanged in code and marked uncalibrated. They must not be reused as-is:

- **The floor's justification is gone.** 0.67 was set between the highest frozen
  empty-support score (0.6387) and the lowest corrected-*card* probe score
  (0.7136). Both endpoints were measured on cards. A large card corpus raises
  accidental top-1 similarity; a two-unit corpus does not have that problem, so
  0.67 is probably far too strict for its new job.
- **The fallback gates now do the opposite of their purpose.** Consensus and
  dominance exist to rescue semantically correct cards the single cutoff missed
  (the r6 repair). With no cards in scope they only widen the gate for
  quotations — a behavior never measured.
- **The empty-support evidence does not transfer.** The 0/23 non-injection
  result says how *cards* score against those 23 questions. It says nothing
  about how a verified quotation scores against them.
- **Both gate checks now fail by construction**, and have been made to say so
  (`scripts/superseded-calibration-guard.ts`). Gate 2's five positive probes all
  expect specific cards; Gate 3 asserts per-philosopher vector alignment against
  the full indexed corpus (4 vs 56 for Aquinas) and a 10/10 mapped recall that
  is now 1/1.

**Rough effort, if run against today's 2-unit corpus:** small but close to
worthless. Two positives (BGE §146, §153) against 23 empty-support sentinels is
not enough separation data to defend any threshold; you would be fitting a
cutoff to two points. The honest sequence is corpus-first, calibration-second:

1. Add a `parseMisattributionWarnings` to `scripts/rag-corpus.ts` covering the
   12 `misattributions` and 4 `disputed` entries (needs a decision on whether
   `disputed` is eligible — the appendix's own warning is that a Wikiquote
   `Disputed` tag is applied inconsistently and the cited evidence must be read).
2. Promote source-checked pending quotes. 52 of 54 quote candidates are
   `pending`; only the two machine-verified BGE quotes are eligible. This is
   human verification work, already listed as open in `STATUS.md`.
3. Rebuild embeddings — **this changes `src/data/source-embeddings.json`, a
   protected artifact**, so it needs its own authorization and a
   `npm run check:integrity -- --record --force` refresh afterwards.
4. Only then re-derive thresholds and rewrite the Gate 2/Gate 3 probes.

Step 3 is the reason none of this was done here: the brief forbids rebuilding
embeddings without saying so explicitly, and steps 1–2 are meaningless without it.

## 3. Is the frozen 27-question manifest still fit for purpose?

**No.** It should be retired for this design and replaced with a smaller,
purpose-built set. Reasons, in order of strength:

1. **It measures a capability the narrowed design no longer has.** 26 of 27
   questions cannot receive any injection. An A/B comparison over them would be
   26 identical-prompt pairs plus one real test — i.e. an expensive measurement
   of sampling noise. The r8 difference-in-differences already showed how large
   that noise is (+6.7 weighted points on questions that received *no* corpus
   material at all), and `sartre-q35` already demonstrated a single-sample
   critical verdict flipping on re-run.
2. **Its question mix targets the wrong categories.** The manifest is 9
   known-answer, 8 depth, 4 trap-attribution, 3 misreading, 2 locate, 1
   trap-confusion. Depth and known-answer questions are exactly what the design
   decision moved *out* of retrieval's remit and into the model's parametric
   knowledge; misreadings moved into static prompt text. Only the
   trap-attribution/confusion group (5 questions) tests what the narrowed corpus
   is for, and three of those five are the misattribution entries that do not
   exist as units yet.
3. **Its `relevant_corpus` mappings are stale by construction** — they were
   written against a corpus that was 99% cards.

What a replacement should look like, when authorized:

- **Purpose-built for fabrication and misattribution traps only**, since that is
  the sole category this corpus now addresses. Roughly: for each philosopher, a
  set of "did you say X?" probes where X is a documented misattribution, plus
  genuine-quote controls to check the persona does not over-refuse real
  quotations (`sartre-q35`'s `q35-c1` is the existing example of that failure
  mode — the baseline *denied* a quote the project's own quote bank treats as
  likely genuine).
- **Repeated, not single-pass.** The whole statistical-fragility finding says one
  repetition cannot separate signal from noise. Fewer questions run several
  times beats 27 run once, at comparable cost.
- **Authored on a different model family** than the persona under test, per the
  contract already added to `docs/stress_test_agents.md`.
- **Ground truth independently audited** — the open appendix item. The new
  human-review dashboard (`npm run review`) is the intended final check, and it
  now separates "do I agree with the verdict" from "is this evidence actually
  probative" precisely because a single approve/deny click would not catch a
  judge quoting real but non-probative text.
- The curated trap candidates in the appendix of
  `docs/refactor_rag_scope_and_eval_harness_prompt.md` (the Kipling/Nietzsche
  and Reddit/cockroach items especially, which have no SEP/IEP footprint) are
  ready-made material for it.

Existing artifacts stay frozen either way: `data/rag/eval/questions.json`, the
27-question manifest, the five baseline `results.json` files, the original
dashboard and every `rag-gate3-pilot-v1-r*` directory are untouched history.

## 4. Honest summary (as of the 2-unit state)

The narrowing is defensible on the evidence — the two confirmed defects are real
and the category argument is sound. But as implemented against *today's* corpus
it does not produce a smaller-but-sharper Condition B; it produces a Condition B
with almost nothing to retrieve. The missing `misattribution_warning` parser is
the gap between the design as reasoned and the design as running, and closing it
is the highest-value next step — well above recalibrating thresholds or running
another pilot.

---

# 5. What was then actually done (2026-07-23, same day)

## 5.1 The parser exists; the corpus is 10 units

`parseMisattributionWarnings` was added to `scripts/rag-corpus.ts`. Eligibility
gates on the same `verification` field verified quotes use, rather than on which
array an entry sits in — so `disputed` is not categorically excluded, and
`misattributions` is not automatically admitted. That uniform rule is deliberate:
a warning is not safer than a quotation. Asserting "you never said that" about a
line the philosopher *did* write is its own failure mode, and the baseline
already committed it once (`sartre-q35-c1`, which denied a quote the project's
own quote bank treats as likely genuine).

Seven warnings were verified and admitted; eight remain pending. Embeddings were
rebuilt: **267 eligible units (257 cards + 3 verified quotes + 7 warnings), 287
vectors total.** Retrievable, by philosopher:

| Philosopher | Retrievable units |
| --- | --- |
| Nietzsche | 5 (3 quotes, 2 warnings) |
| Kierkegaard | 2 warnings |
| Camus | 2 warnings |
| Aquinas | 1 warning |
| **Sartre** | **0 — still entirely uncovered** |

`src/data/source-embeddings.json` changed hash from `93BC6915…` to
`BF467BE6E571EB0A8C74A89D1721BEBFF4F700A6408EF828A1A767F59A3C9933`. The
integrity baseline was re-recorded, and `protected-integrity.test.ts` was
amended to stop pinning this file to a historical hash — it is a *generated*
artifact, and pinning it asserted it must never be regenerated, which is false.
The eight genuinely immutable references are still asserted exactly.

## 5.2 A corpus entry was factually wrong, and so is the exam

Verifying "They muddy the waters to make them look deep" against primary text
established that **it is a genuine Nietzsche line**, not a misattribution:

> "Sie sind mir auch nicht reinlich genug: sie trüben alle ihr Gewässer, daß es
> tief scheine."
> — *Also sprach Zarathustra*, Zweiter Teil, "Von den Dichtern"

confirmed verbatim against textlog.de and zeno.org. Three things encoded the
false claim and two were corrected:

- `data/rag/quotes/drafts/nietzsche.json` — entry moved from `misattributions`
  to `quotes`, verified for the **German wording only**, with the English
  flagged as a rendering by no identified translator. **Corrected.**
- `conditionCHardening()` in `src/lib/experiment-conditions.ts` — instructed the
  persona that the line "has no source in Nietzsche and must not be accepted or
  assigned a work citation," which would have actively driven it to deny a real
  quote. **Corrected.**
- `data/rag/eval/questions.json` / the pilot manifest — `nz-19`'s `answer_key`
  asserts the wording "has no documented source in Nietzsche" and offers Z III
  "On the Olive Mount" as a merely thematic analogue. The author missed the Z II
  passage, which is a near-verbatim match. **Not corrected — frozen.**

The consequence is significant and unresolved. `nz-19-c1` ("Does not confirm the
popular wording as an exact verbatim quotation with a definite citation") is
**the project's single baseline critical failure** — the one in the 95.3%
headline, and the concrete example the whole RAG effort was justified by. The
baseline reply said "Yes, that line is mine … Thus Spoke Zarathustra … the first
part … 'On the Rabble'." Scored against the facts rather than the answer key:

- *attribution* — **correct**. The line is his.
- *location* — **wrong**. It is Part Two, "On the Poets", not Part One, "On the
  Rabble" (and "On the Rabble" is itself in Part Two).

So the model made a real wrong-locator error, but `nz-19-c1` grades the correct
half as a critical failure. The project's headline finding is a
fabricated-quotation story; the evidence supports a wrong-section story, which
is a materially less alarming failure and one the persona prompt already tells
the model to avoid by naming the work and admitting locator uncertainty.

This is precisely the open appendix item — "the exam's own ground truth has
never been independently audited" — landing on the single most load-bearing
question in the exam. It was found by auditing one quote. **A full audit of the
27-question manifest's answer keys should precede any further pilot spend**, and
`nz-19` should be excluded or rewritten in any replacement question set.

## 5.3 Thresholds re-measured, and they are now easy

Local, zero-spend, exact frozen question wording, Condition B, unthresholded:

| | score |
| --- | --- |
| `kg-15` → leap-of-faith warning | **0.7769** |
| `nz-36` → BGE §153 quote | **0.7721** |
| `aq-14` → Ptolemy/sewer warning | **0.7013** |
| highest empty-support sentinel (`kg-10`) | **0.3054** |
| other nine sentinels | 0.0000 – 0.2583 |

**A ~0.40-wide gap, against ~0.075 under the old corpus** (empty-support 0.6387
vs. lowest true positive 0.7136). This is the clearest evidence yet that the
narrowing was right: removing the cards did not just reduce risk, it made the
injection decision nearly trivial. `CORPUS_INJECTION_MIN_SCORE` stays at 0.67 —
anything from ~0.35 to ~0.70 separates these sets, but three positives is too
thin a basis for widening the gate. The r6 consensus/dominant fallbacks are now
redundant; retained only because at a 0.3054 ceiling they cannot misfire.

At 0.67, injection fires on exactly three of the 27 pilot questions, all
correct, with zero false positives.

Two known misses:

- **`nz-19` scores 0.4533** and injects nothing, so the app would not surface
  the quote that would have corrected it. Given §5.2, this question should not
  be used to tune anything.
- **`cam-35` / `cam-36`** top out at 0.32 on irrelevant warnings ("Don't walk
  behind me" against a question on *The Stranger*'s ending). Correctly below
  threshold — these are misreading questions, which the design moved to static
  prompt text, not retrieval.

## 5.4 What §3's conclusion becomes

Unchanged and strengthened. Mapped-support counted by the runner's
`mappedEligibleIds` heuristic is still **1 of 27**, even though retrieval now
demonstrably surfaces the right unit for `aq-14` and `kg-15`. The heuristic is a
normalized-substring match tuned to card *titles* and does not match quote-shaped
reference strings like `"quote-misattribution: Prostitution in towns is like the
sewer in a palace"`. That gap was left unfixed on purpose: contorting the matcher
to make a manifest already argued unfit produce better numbers would be fitting
the instrument to the answer. Gate 2 and Gate 3 remain guarded and unrepaired for
the same reason.
