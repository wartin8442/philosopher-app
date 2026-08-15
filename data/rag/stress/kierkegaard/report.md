# Kierkegaard stress-test report - baseline, 2026-07-18

Run: condition **baseline**, model **claude-opus-4-8**, 36 corpus-blind questions, one probe each, answer levels as recorded in eval-questions.json. Machine-readable record: `results.json`. Question bank: `eval-questions.json`. Coverage audit: `coverage.md`. Proposed cards: `card-proposals.md`.

**Headline: 84/88 checks passed. Zero critical failures out of 19 critical checks - every trap (fabricated quote, van der Leeuw misattribution, "leap of faith" citation request, "God is dead", wrong-pseudonym, wrong-title, wrong-period, relativism bait) was caught. The four failures are two majors and two minors, all omissions or attribution slips, none fabrication.** Median latency 8.2s (min 6.4s, max 12.7s).

The single most important *system* finding is not a wrong answer but a grounding fact: **retrieval never surfaced the drafted RAG corpus.** Across all 36 probes, `retrieved_sources` only ever contained the four hard-coded persona source stubs from `src/lib/philosophers.ts` (The Concept of Anxiety, Fear and Trembling, The Sickness unto Death, Concluding Unscientific Postscript) - never a position card, quote entry, or works-index line. Two probes (kg-04, kg-36) retrieved zero sources. Every correct answer above intro level is therefore resting on the base model's parametric knowledge, not on the cards/quotes/index the project has drafted. The baseline passed because the model knows Kierkegaard well; that is exactly the fragility the RAG corpus exists to remove, and the before/after harness should treat these passes as unprotected.

## Critical failures

None.

## Major failures

### 1. kg-25 (misreading, intermediate) - "truth is subjectivity" owned in the first person; Climacus never credited

Check kg-25-c2 FAILED. The reply rejects the relativist reading crisply ("I never said all such relations are equally valid") and explains appropriation correctly - but presents the slogan as Kierkegaard's own:

> "**When I say truth is subjectivity**, I am not talking about the truth of, say, a mathematical proposition or a historical date - there objectivity rules..."

Neither Johannes Climacus nor the Postscript appears anywhere in the reply. This is the signature pseudonymity discipline slipping on the highest-profile slogan - the same system that credited Climacus meticulously in kg-09, kg-12, kg-33 and kg-34. Likely root cause: the persona systemPrompt itself asserts "Truth, in the deepest matters, is subjectivity..." in Kierkegaard's own voice with no pseudonym note, and the corpus card that does credit Climacus ("Truth Is Subjectivity") was not retrieved.
Correction source: IEP sec. 2d ("Climacus, but not Kierkegaard, proclaims that 'truth is subjectivity' (as well as 'subjectivity is untruth')"); SEP sec. 1 (Kierkegaard's request that pseudonymous claims be attributed to the pseudonyms).
**Fix:** amend the persona prompt line to attribute the slogan ("as my pseudonym Johannes Climacus puts it..."), and wire the cards into retrieval.

### 2. kg-05 (known-answer, intermediate) - Martensen never named as the trigger of the church attack

Check kg-05-c1 FAILED (omission). The reply gives Mynster and the "witness to the truth" phrase, but only in passive voice:

> "When Bishop Mynster, whom I had known, **was praised after his death** as a 'witness to the truth,' I found I could not stay silent."

Who praised him - Martensen, Kierkegaard's career-long rival and the incoming bishop primate - is the historically load-bearing fact, and it is missing. This tracks the corpus exactly: the attack-on-church card says "a public eulogy calling a recently deceased bishop 'a witness to the truth'" without naming either man. The system reproduced its corpus's vagueness.
Correction source: SEP sec. 1; IEP sec. 1f. Card proposed ("What Triggered the Attack on the Church").

## Minor failures

### 3. kg-05-c3 - no vehicle of the attack named

Neither The Moment (Ojeblikket) nor the Faedrelandet articles is mentioned ("So I spoke, sharply and publicly"). Correction source: SEP sec. 1; IEP sec. 1f.

### 4. kg-04-c3 - Corsair aftermath not tied to the authorship pivot

The Corsair reply is otherwise excellent (names Goldschmidt and P.L. Moller - neither is anywhere in the corpus) but never states that the affair made him abandon the country-pastorate plan and continue writing. Correction source: SEP sec. 1. (The companion depth question kg-35, asked separately, DID get this fact right - the knowledge is in the model; the corpus just can't guarantee it.)

## Notable passes and PASS-plus findings (protect these)

- **kg-30 (deliberation vs discourse): the system is more accurate than its own corpus.** The works index labels Works of Love a "signed religious discourse"; the reply corrects this: "Works of Love I did not title a discourse but deliberations - Christian deliberations," with the SEP-verified polarity (discourse builds on a foundation already laid; deliberation "must awaken, provoke, sharpen"). The eval harness should protect this against a future retrieval layer that would inject the index's error. **Fix the index line.**
- **kg-15 (leap of faith): passed despite contaminated corpus.** The persona blurb says Kierkegaard "probed ... the leap of faith," and two card titles use the phrase; the quote bank correctly flags it as a later coinage. The reply sided with the quote bank: "That precise phrase, 'leap of faith,' you will not find set down as such in Fear and Trembling... the tidy formula is a paraphrase the age has minted, not a sentence I signed" - and refused to give a citation. Fragile win: kg-16's reply then casually offered to discuss "that 'leap' of faith" in its own voice. **Remove the phrase from the blurb and card titles.**
- **kg-07 (reverse trap): affirmed the genuine journal line** ("Yes, that thought is genuinely mine") while flagging the popular wording as "a paraphrase and a tidying-up" and adding the journal entry's harder continuation (no still point from which to understand life) - matching the quote bank's note exactly, though that entry was not retrieved.
- **kg-13/kg-14 (fabrications): clean refusals.** Van der Leeuw quote: "I do not recognize those words as mine... let me not pretend to explain what I did not write." Invented F&T sentence: "that sentence is not mine," followed by discussion of the genuine silence theme clearly separated from the fake wording.
- **kg-17: "the crowd is untruth" correctly pulled OUT of The Sickness unto Death** and placed "in a short piece I wrote around that time on the theme of the single individual" - correct (the Point of View "Two Notes"), achieved with zero corpus support; a card is proposed to make the location precise.
- **kg-21/kg-36: pseudonym hierarchy handled at depth** - unprompted correction of "Johannes Climacus wrote The Sickness Unto Death," Lazarus background for the title, and the Climacus/K/Anti-Climacus ladder ("he is above me. I placed myself between the two."), the latter with retrieval returning zero sources.
- **kg-10, kg-22, kg-33, kg-35: four zero/near-zero-corpus questions all passed** (Ultimatum sermon, Concept of Irony dissertation, the revocation, Postscript-as-intended-ending). All four are pure parametric knowledge; cards proposed for each.
- **kg-27: biographical nuance beyond the corpus** - acknowledges the Regine resonance and even the pose-as-scoundrel motive ("I wrote it partly to make myself repugnant to her, so she might let me go") while refusing the diary-as-confession reading. Nothing in the corpus mentions Regine at all.

## Accuracy nits (not check failures; for the record)

- kg-03 imports SUD's "the Power that established the self" phrasing into a Fear and Trembling answer - a voice-blend across pseudonyms, content harmless.
- kg-16 corrects "God is dead" but closes by offering to discuss "that 'leap' of faith" - phrase-hygiene inconsistency traceable to the persona blurb.
- kg-23 asserts he was "pouring out my own inheritance to publish those broadsheets" - biographically defensible but ungrounded in any corpus item; SUSPECTED-fine, unverified against my sources.

## Coverage gaps the interrogation confirmed

(Full audit in coverage.md.) The passes above notwithstanding, these have no retrievable grounding and are one model-swap away from failing:

1. Biography layer entirely absent (Regine, Corsair, Mynster/Martensen, dissertation, death) - produced this run's only major factual failure (kg-05) and one minor (kg-04).
2. On the Concept of Irony (1841) absent from index and cards (kg-22).
3. The Point of View / "That Single Individual" literature absent; persona prompt quotes "the crowd is untruth" with no locating source (kg-17, kg-25-adjacent).
4. Ultimatum sermon of Either/Or absent (kg-10).
5. Postscript revocation and Climacus-as-humorist absent (kg-33).
6. Anti-Climacus standpoint hierarchy absent (kg-36).
7. Postscript-as-intended-end / second-authorship pivot absent (kg-35, kg-04).
8. Works of Love genre mislabeled in the index (kg-30 - system currently out-performs the corpus; fix before it drags a weaker model down).
9. Two Ages missing from the works index (kg-06 passed; "where" answerable only parametrically).
10. Same-day publication of Repetition and Fear and Trembling recorded nowhere (kg-24).

## Recommended non-card fixes

1. Wire cards/quotes/index into retrieval - nothing from the drafted corpus ever reached `retrieved_sources`.
2. `src/lib/philosophers.ts` blurb: replace "the leap of faith" with "the leap".
3. Persona systemPrompt: attribute "truth is subjectivity" to Johannes Climacus/Postscript, and give "the crowd is untruth" its source ("That Single Individual").
4. Works index: Works of Love "discourse" -> "deliberations"; add Two Ages (1846) and On the Concept of Irony (1841); note same-day publication under Repetition.
5. Rename the two "Leap of Faith" cards to "The Leap ..." so card titles stop teaching the coined phrase.

## Scoreboard

Checks passed/failed by category and severity (fails named):

| Category | critical | major | minor | total |
|---|---|---|---|---|
| known-answer (7 q) | - | 14/1 (kg-05-c1) | 3/2 (kg-04-c3, kg-05-c3) | 17/3 |
| locate (5 q) | 5/0 | 7/0 | 1/0 | 13/0 |
| trap-attribution (5 q) | 9/0 | 2/0 | 1/0 | 12/0 |
| trap-confusion (7 q) | 4/0 | 10/0 | 1/0 | 15/0 |
| misreading (5 q) | 1/0 | 8/1 (kg-25-c2) | 1/0 | 10/1 |
| depth (7 q) | - | 13/0 | 4/0 | 17/0 |
| **Total** | **19/0** | **54/2** | **11/2** | **84/4** |

All 36 questions are provenance "corpus-blind"; no corpus-aware questions were added (the corpus revealed no trap the bank lacked - its own "leap of faith" contamination was already covered by kg-15/kg-16). These verdicts are advisory triage; official numbers come from the blind harness re-running the frozen bank at the recorded answer levels.
