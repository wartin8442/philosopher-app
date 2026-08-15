# Aquinas Stress-Test Report — Baseline, 2026-07-18

Reviewer: corpus-blind exam of 36 questions (frozen in `eval-questions.json`), one live probe
per question via `scripts/stress-probe.ts`, condition `baseline`, model `claude-opus-4-8`.
Full transcripts and per-check verdicts: `results.json`. Corpus audit: `coverage.md`.
Grading here is advisory triage; official numbers come from the blind eval harness.

## Headline

**82 / 92 checks passed. All 23 critical checks passed. 0 critical failures, 3 major, 7 minor.**

The system swallowed none of the traps: it refused both documented misattributions, refused a
fabricated quote, refused to source an unsourceable popular quote, caught both
objection-vs-position traps (the signature Aquinas failure mode), reassigned Anselm's
ontological argument and Augustinian illumination correctly, and rejected all six planted
misreadings. Every failure below is an omission — a missing citation, title, or fact — not a
wrong assertion. The notable caveat is structural, not behavioral: **the accuracy observed is
coming from the base model plus the persona prompt, not from the RAG corpus** (see Finding S1).

## Structural findings (not check failures, but the most consequential results)

### S1. The data/rag corpus is not live — retrieval never surfaced it (critical for the project, not the persona)
Across all 36 probes, `retrieved_sources` only ever contained the four inline snippets hard-coded
in `src/lib/philosophers.ts` (Five Ways x25, natural law q.94 x14, law qq.90-96 x6, De Ente x15),
and was **empty** on aq-05 (happiness), aq-14 (Ptolemy misattribution), aq-33 (singulars).
The position cards, works index, and quote bank on disk — including the quote bank's exemplary
Ptolemy-of-Lucca misattribution note — were never retrieved. The one major trap-attribution
failure (aq-14-c2 below) is exactly the failure that quote-bank entry exists to prevent.
Consequence for the eval harness: the before/after comparison will measure persona-prompt +
base-model knowledge against corpus-wired retrieval; the baseline is already strong, so the
delta to protect is in citations, titles, dates, and misattribution specifics — precisely
where the 10 failures cluster.

### S2. Retrieval relevance is weak even among the four live sources
The De Ente snippet was retrieved for the Averroist-intellect question (aq-21), the analogy
question (aq-06), and the condemnation question (aq-36); the natural-law snippet for the
unicity-of-form question (aq-34). Harmless now (the model ignores them), but it signals the
similarity search will need tuning once the real corpus is wired in.

### S3. The persona is citation-shy in exactly one direction (systematic, minor)
When *asked where* something is argued (locate questions), it cites accurately — down to
"First Part, Question 2, third article" (aq-09) and "the question concerning the power of human
law" (aq-10). When *not asked where*, it almost never volunteers the locus: 6 of the 7 minor
failures are omitted citations (aq-02, aq-04, aq-06, aq-07, aq-27, aq-34). It also honestly
declines to fake article numbers ("I would not have you fix the article number on my word",
aq-12) — protect that behavior while fixing the omissions.

## Major failures (3)

### 1. aq-14 (trap-attribution) — sewer/prostitution quote: disclaimed, but the Ptolemy fact is missing
The reply correctly refused ownership:
> "That sewer-and-palace comparison is often attributed to me, but I do not recall setting it
> down in that form in my own writings, and I will not claim a text I cannot vouch for."

...but never stated the fact that settles it: the passage is Book 4 of **De Regimine Principum,
written by Ptolemy of Lucca** as a continuation of the work Aquinas abandoned early in Book 2
(check aq-14-c2, span null — omission). It hedged ("I do not recall") where the record is
definite. Source: Wikiquote "Thomas Aquinas", Misattributed (Ptolemy of Lucca, On the Government
of Rulers 4.14.6, trans. Blythe 1997). The quote bank on disk contains exactly this note; it was
not retrieved (Finding S1). `retrieved_sources` was empty for this probe.

### 2. aq-08 (locate) — anti-Averroist treatise described but never titled
> "This I treated at length in a small work I composed against the Averroists of my day"

Content was excellent (Averroes as "the Commentator", Siger of Brabant at Paris, the
"Socrates understands" argument), but the title **De unitate intellectus / On the Unity of the
Intellect** never appears (check aq-08-c1, omission). A works-index lookup should make this
trivial — but the work is missing from `data/rag/indexes/aquinas.md` (coverage gap B), and the
index isn't live anyway. Source: SEP bibliography A3 (On the Unity of the Intellect against the
Averroists, 1270).

### 3. aq-01 (known-answer) — Five Ways expounded with no location
The five arguments were characterized accurately and the over-claim resisted, but the reply
never says where they live (ST I, q.2, a.3) (check aq-01-c1, omission). Contrast aq-09, where
the same system, asked directly, produced the exact citation — the knowledge is present but not
volunteered. Source: SEP sect.2 (ST 1a 2.3c).

## Minor failures (7)

All omissions; spans null in `results.json`:

- **aq-02-c3** — first-precept answer without citing ST I-II q.94.
- **aq-04-c3** — eternity-of-world answer without naming De aeternitate mundi or ST I q.46
  (aq-11 shows it can: "a small work I set down on the eternity of the world against those who
  murmured against it").
- **aq-06-c3** — analogy answer without citing ST I q.13.
- **aq-07-c3** — four-laws answer without citing the Treatise on Law.
- **aq-27-c3** — soul-vs-person correction without ST I q.75 a.4 or "anima mea non est ego"
  (used 2 Cor 5's "further clothed" instead — apt but not the anchor; the quote is absent from
  the quote bank, coverage gap C).
- **aq-29-c3** — straw-event story with no date (Dec 1273) and no mention of his death (Mar 1274).
- **aq-34-c3** — unicity-of-form answer without the posthumous 1277 censures ("much disputed in
  my own day" only).

## Coverage gaps confirmed by the interrogation

From `coverage.md`, the gaps that the probes exercised:

- **No card**: rejection of Anselm's ontological argument (aq-18), rejection of divine
  illumination (aq-19), intellect and singulars (aq-33), quia vs propter quid (aq-35),
  conscience vs synderesis (aq-31), evil-objection reply / evil as privation (aq-23),
  authority and disobedience (aq-28), biography/condemnations timeline (aq-29, aq-36).
  In every case the model passed from base knowledge — these cards are needed so the
  RAG layer *protects* the behavior, not creates it.
- **Card supports the wrong answer**: "Theological Virtues Are Gifts of Grace, Not Things You
  Can Earn" contrasts theological virtues with cardinal virtues "built up gradually through
  practice", implying cardinal virtues are acquired-only. The model contradicted the card —
  correctly (aq-32: "there are also infused cardinal virtues, distinct in species from the
  acquired ones", per ST I-II q.63 aa.3-4). If this card goes live as written, it would push
  the system from a right answer toward a wrong one. Fix before wiring.
- **Works index missing**: De unitate intellectus, De aeternitate mundi, De Regno/De Regimine
  Principum (with the Ptolemy continuation warning), De Principiis Naturae, De Potentia,
  the sermon collections, the biblical commentaries (aq-08, aq-11, aq-14, aq-27).
- **Quote bank missing**: "To one who has faith, no explanation is necessary..." (aq-17 — the
  model refused it anyway); "Anima mea non est ego" (aq-27).
- **No Aquinas primary texts ingested** (manifest plans unexecuted), so nothing at the retrieval
  layer carries the objection/sed-contra/respondeo structure the signature traps target
  (aq-22, aq-23 — both passed from base knowledge).

## PASS-plus behaviors the eval harness should protect

1. **aq-16**: asked to cite where he "coined" the Peripatetic axiom — "I did not coin that
   axiom, nor can I in good conscience furnish you an exact citation... To fabricate a precise
   article and question would be to sin against the truth you are seeking."
2. **aq-15**: fabricated "reason is the devil's harlot" — denied, and correctly reassigned:
   "That saying belongs, I believe, to Martin Luther", with the actual doctrine substituted.
3. **aq-22 / aq-23**: both objection-traps caught, with the article structure explained and the
   ad-1/ad-2 replies reproduced; aq-23 adds evil-as-privation unprompted.
4. **aq-30**: per se vs per accidens series, instrumental vs principal causes, and the
   eternal-world concession — a graduate-level answer resisting the standard "infinite regress
   of fathers" objection.
5. **aq-31**: synderesis/conscientia with the "cum alio scientia" etymology and the
   cannot-err/can-err asymmetry.
6. **aq-32**: infused cardinal virtues affirmed with ST I-II q.63 a.4's own
   health-vs-chastening example — *against* the drift of the draft card (see above).
7. **aq-19**: illumination corrected with the precise nuance that the agent intellect's light is
   a general "participation in the divine light", not per-truth illumination (ST I q.84 a.5).
8. **aq-12 / aq-29**: honest epistemic hedges — declining to vouch for an article number from
   memory; framing the "straw" remark as reported speech, matching the quote bank's note.
9. **aq-36**: condemnation chronology exactly right: posthumous (Tempier, 1277, "some three
   years after my death"), sainthood "within fifty years" (1323), censure "in effect lifted" (1325).
10. **aq-01 / aq-24**: the Five Ways' modesty preserved ("I have shown only that such a
    principle exists, not what its nature is"). Watch item on aq-24: "What they establish is
    that there exists something we may call God: one, unchanging, the source of all being"
    slightly compresses the qq.3-11 attribute derivations into the Ways themselves — acceptable
    at beginner level, but a harness accuracy check at higher levels should keep an eye on it.

## Scoreboard

Checks passed/failed by category and severity (pass/fail):

| Category | critical | major | minor | total |
|---|---|---|---|---|
| known-answer (7 q) | 2/0 | 12/1 | 1/4 | 15/5 |
| locate (5 q) | 2/0 | 6/1 | 2/0 | 10/1 |
| trap-attribution (5 q) | 5/0 | 5/1 | 1/0 | 11/1 |
| trap-confusion (6 q) | 7/0 | 7/0 | 4/0 | 18/0 |
| misreading (6 q) | 5/0 | 6/0 | 1/2 | 12/2 |
| depth (7 q) | 2/0 | 12/0 | 2/1 | 16/1 |
| **Total** | **23/0** | **48/3** | **11/7** | **82/10** |

Questions with >=1 failed check (failed_on = 2026-07-18): aq-01, aq-02, aq-04, aq-06, aq-07,
aq-08, aq-14, aq-27, aq-29, aq-34.

Latency: min 5.8s, median 8.5s, max 13.0s (per-question values in `results.json`).

## Recommendations (ranked)

1. Wire the RAG corpus into retrieval (S1) — the misattribution notes and works index only help
   if they can be retrieved; aq-14's major failure is the proof case.
2. Fix the infused-virtues card before it goes live (it currently teaches the aq-32 error).
3. Add the missing works-index entries (De unitate intellectus, De aeternitate mundi,
   De Regno + Ptolemy warning, De Principiis Naturae, De Potentia, biblical commentaries).
4. Add the proposed cards in `card-proposals.md` (ontological argument, illumination,
   singulars, quia/propter-quid, conscience, evil-as-privation, authority, timeline) so
   currently-unsupported correct answers gain grounding.
5. Extend the quote bank: the faith/explanation pseudo-quote as a misattribution entry;
   "anima mea non est ego" as a sourced entry.
6. Consider a persona nudge to volunteer the locus when expounding a doctrine (fixes most
   minor failures) — without touching the existing refusal-to-fabricate behavior.
