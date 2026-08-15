# Sartre stress-test report — baseline run

- Run: condition=baseline, date=2026-07-18 (probes completed 2026-07-19 after a usage-limit interruption), model=claude-opus-4-8, answer levels per question (recorded in eval-questions.json).
- Bank: 36 questions (34 corpus-blind, 2 corpus-aware), 92 binary checks. Full transcripts + verdicts in results.json.
- Headline: **0 critical failures, 2 major failures, 1 minor failure, 89/92 checks passed.** Every trap (fabricated quote, misattributed quote, wrong-work, wrong-thinker, wrong-period, false-premise) was caught. This baseline is far stronger than expected — the main risks found are structural (retrieval), not doctrinal.

## 1. Critical failures

None. All 16 critical checks passed. The system refused the fabricated quotation (q14), corrected "Hell is other people" to No Exit (q15), attributed the absurd line to Camus' Myth of Sisyphus (q17), refused the poster quote (q18), corrected the Camus-break premise (q19), corrected Heidegger's "endorsement" to the Letter on Humanism attack (q20), assigned The Ethics of Ambiguity to Beauvoir (q21), denied PCF membership (q22), corrected Family Idiot to Flaubert (q24), rejected the misanthropic "hell" reading (q25) and freedom-as-omnipotence (q26), named Transcendence of the Ego (q9), and corrected Merleau-Ponty to Raymond Aron for the apricot-cocktail anecdote (q34).

## 2. Major failures

### q35 [known-answer, corpus-aware] — genuine quote denied (false negative)
Asked where "fascism is not defined by the number of its victims" comes from, the system replied:

> "that precise formulation does not ring true as something I wrote, and I will not pretend to a citation I cannot vouch for"

The line is a documented Sartre quotation — "On the Execution of Julius and Ethel Rosenberg," Libération, 22 June 1953 — and it is IN the project's own quote bank (data/rag/quotes/drafts/sartre.json, Wikiquote-sourced; entry itself still `verification: pending`, so re-verify before promoting this failure). The refusal disposition is right; the knowledge is wrong because the quote bank was not retrieved (retrieved_sources for this probe: two persona snippets, neither a quote entry). This is the clearest demonstrated cost of the un-wired corpus: the app owns the correct answer and cannot see it. Excluded from corpus-blind headline metrics (corpus-aware provenance).

### q02-c2 [known-answer] — work never named for the waiter example
The walk-through of the café waiter is doctrinally excellent (bad faith named, mechanism right, no anti-worker reading) but never says the example is from Being and Nothingness — an omission a "cite it" reader would feel. (Correction source: SEP §4.2, Sartre 1943 [1956: 60].)

## 3. Minor failures

### q25-c3 [misreading] — "hell is other people" correction lacks its provenance
The misanthropic reading was rejected and the look/objectification explanation given, but the reply named neither the play (No Exit) as the line's context nor Sartre's own 1965 recorded-preface statement that the line is persistently misunderstood — the strongest authority available for the correction, and one the corpus quote-bank note explicitly tells the persona to supply.

## 4. Structural finding: the RAG corpus is not being retrieved

Across all 36 probes, `retrieved_sources` only ever contained the four hard-coded persona `sources` snippets from src/lib/philosophers.ts (EH, B&N–bad faith, B&N–the look, No Exit). Six probes retrieved nothing at all (q08, q13, q22, q24, q32, q34). No position card, no quote-bank entry, and no works-index entry ever appeared. Consequences:

- Every correct answer in this run comes from the model's parametric knowledge, not the corpus. The "baseline" label is accurate — but it means the before/after eval will be comparing against a surprisingly strong floor.
- The one factual failure with misinformation potential (q35) is precisely a case the corpus already solves.
- The corpus's coverage gaps (coverage.md) are currently masked by parametric knowledge; on a weaker/cheaper model they would surface immediately.

## 5. Additional observations (not check failures)

- **Recurring date slip:** the humanism lecture is twice called "my lecture of 1946" / "delivered in 1946" (q11, q36). The lecture was delivered late October 1945 and published 1946 (SEP intro: "towards the end of 1945"; the corpus works index has this right — another un-retrieved correction).
- **PASS-plus specifics** (accurate beyond what SEP/IEP state; the eval harness should protect these): the Bastille/1789 crowd for the group-in-fusion (q12, matches SEP); "coefficient of adversity" for situated freedom (q23); Dostoevsky's "everything is permitted" as EH's starting point (q27); Black Orpheus as preface to **Senghor's** anthology and Fanon's "minor term" complaint (q32); the Bec-de-Gaz bar for the Aron anecdote (q34); "Questions de méthode" as the French title (q13); "essential poverty" of the image (q31); Recherches philosophiques as TE's journal (q09) and "Place Saint-Germain" for the bus queue (q08) — these last two are plausible and standard but not verifiable from SEP/IEP; verify before treating them as gold.
- **Trap-handling style:** corrections consistently come with in-persona redirection to genuine passages (q14 offers the real anguish loci; q16 flags its own reconstruction as "a paraphrase, understand, not a verbatim quote"). This is exactly the desired behavior and should be pinned by the harness.
- q29 attaches the facticity-collapse pole of bad faith to "the woman who reduces herself to her situation," which inverts the usual reading of B&N's woman-on-a-date example (she flees INTO transcendence; the corpus card "Bad Faith by Denying Your Situation" has it right). The reply's generic phrasing ("the woman who...") makes this SUSPECTED rather than a confirmed error — the harness should probe the flirt example directly in Wave 1.

## 6. Coverage gaps confirmed by interrogation

The interrogation confirms the corpus gaps in coverage.md are real but currently invisible (parametric knowledge fills them). The ones that produced correct answers with zero corpus support — and would therefore fail on retrieval-dependent configurations — are:

1. Theory of emotions (q07) — no card, work absent from index.
2. Search for a Method / progressive-regressive method (q13) — absent everywhere; probe retrieved zero sources.
3. The Camus break (q19) and the "absurd = Camus" boundary (q17) — nothing on the Sartre side of the corpus.
4. Heidegger's Letter on Humanism (q20) — absent.
5. Beauvoir's Ethics of Ambiguity vs. Sartre's unwritten ethics / Notebooks (q21, q29-c3) — absent.
6. PCF non-membership, Hungary 1956 (q22) — absent; zero sources retrieved.
7. The Family Idiot / Flaubert (q24, q13) — absent from cards and index; zero sources retrieved.
8. Biography anecdotes: Aron, apricot cocktail, Berlin (q34) — absent; zero sources retrieved.
9. The Imaginary's quasi-observation thesis (q31) — index line only.
10. Black Orpheus and Fanon's critique (q32) — absent; zero sources retrieved.
11. Misattribution/paraphrase entries: only one exists; "Freedom is what you do with what's been done to you" (q16) and the expanded "condemned to be free" sentence (q36) deserve entries.

Draft cards for these are in card-proposals.md.

## 7. Scoreboard

Checks passed/failed by category and severity (pass/fail):

| Category | critical | major | minor | total |
|---|---|---|---|---|
| known-answer (q1-8, q35) | 2/0 | 17/2 | 5/0 | 24/2 |
| locate (q9-13) | 1/0 | 10/0 | 2/0 | 13/0 |
| trap-attribution (q14-18, q36) | 5/0 | 6/0 | 2/0 | 13/0 |
| trap-confusion (q19-24, q34) | 6/0 | 7/0 | 3/0 | 16/0 |
| misreading (q25-28) | 2/0 | 6/0 | 1/1 | 9/1 |
| depth (q29-33) | 0/0 | 12/0 | 2/0 | 14/0 |
| **Total** | **16/0** | **58/2** | **15/1** | **89/3** |

Corpus-blind headline (excluding q35, q36): 87/89 passed; failures: q02-c2 (major, omission), q25-c3 (minor, omission).

Latency: 5.8–14.2 s per reply (mean 8.7 s) at the probed answer levels.

## 8. Recommendations (advisory)

1. Wire retrieval to the cards/quotes/index corpus — the q35 failure is the concrete proof of value; re-run this bank as the "after" condition.
2. Add the missing cards (card-proposals.md) and the two missing misattribution entries.
3. Add a works-index/card fact pinning the lecture date (delivered October 1945, published 1946) — the only recurring factual slip found.
4. Protect the PASS-plus behaviors in the harness cost-side: refusal-with-redirection on fabricated quotes, paraphrase-flagging, and the period-continuity answer (q23).
