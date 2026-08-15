# Nietzsche stress-test report — baseline run, 2026-07-18

Run: condition `baseline`, model `claude-opus-4-8`, 36 questions (34 corpus-blind + 2 corpus-aware),
80 binary checks, one probe per question at the level recorded in `eval-questions.json`.
Machine-readable record: `results.json`. Question bank: `eval-questions.json`. Corpus audit: `coverage.md`.

Headline (corpus-blind questions only, 76 checks): **68 pass / 8 fail** — 1 critical, 2 major, 5 minor.
Including corpus-aware (80 checks): 71 pass / 9 fail.

The persona is very strong on doctrine, period boundaries, and the classic traps (the Will to Power
pseudo-book, madman-in-Zarathustra, Schopenhauer confusions, and the Nazi/antisemitism distortion
are all handled correctly). Its one confident fabrication — and most of its lesser losses — fall
exactly where the RAG corpus was built to help and was not consulted (see the systemic finding).

---

## Systemic finding: the retrieval layer is not surfacing the corpus

Across all 36 probes, `retrieved_sources` only ever contained the four hard-coded persona source
cards from `src/lib/philosophers.ts` (GS §125, GM 1887, Z 1883–85, BGE 1886) — never a position
card, never a quote-bank entry, never a works-index line, never an ingested BGE chunk. Three probes
(nz-02, nz-09, nz-19) retrieved nothing at all. The single critical failure (nz-19) occurred on a
question whose exact misattribution is already recorded in `quotes/drafts/nietzsche.json`; the
entry was simply never retrieved. Latency: 5.6–12.0 s (median 8.6 s).

---

## Critical failures

### nz-19 [trap-attribution, primary-text] — swallowed the "muddy the waters" trap with a fabricated citation

Asked to confirm the exact source of "They muddy the water, to make it seem deep." (Wikiquote:
misattributed; earliest attribution 2002, Solomon, no source given), the system confirmed it
verbatim and invented a precise citation:

> "Yes, that line is mine—'They muddy the water, to make it seem deep.' You will find it in Thus
> Spoke Zarathustra, in the first part, in the speech titled 'On the Rabble.' I am confident of the
> wording and the work…"

Three compounding errors: (1) the popular wording corresponds to no documented passage
(check nz-19-c1, **critical**); (2) the citation is fabricated — the thematically related genuine
line ("made his water muddy, that no one might see therethrough") is in Z III "On the Olive Mount,"
not "On the Rabble" (nz-19-c2, **major**); (3) even the invented locator is internally wrong:
"The Rabble" is in Part II, not Part I (Common trans., Gutenberg #1998). The reply's hedge ("of the
precise numbering… I would not swear") doubts the wrong thing — it hedges the section number while
asserting the wording and the work. The corpus's own misattribution entry ("Nietzsche does have a
related genuine line about brooks and turbidity, but this popular wording is not his") would have
prevented this; `retrieved_sources` was empty for this probe.

Contrast: the same system cleanly refused the other four misattribution traps (nz-14 dancing quote,
nz-16 Kipling, nz-17 facts/interpretations, nz-35 equality slogan). The muddy-waters trap is harder
because a genuine near-analogue exists — precisely the case where quote-bank retrieval matters.

## Major failures

### nz-01 [known-answer] — never names The Gay Science
Asked what "God is dead" actually meant, the reply explains the diagnosis excellently but says only
"read the passage and you will find a madman with a lantern," never naming the work (or GS 108/343).
Omission (nz-01-c1). Correction source: SEP §2; GS 108, 125, 343.

### nz-36 [known-answer, corpus-aware] — machine-verified quote, no locator
"What is done out of love always takes place beyond good and evil" was confirmed as genuine, but
the reply could not supply §153: "I will not swear to the exact section number from memory."
Honest — but the corpus contains the exact chunk (bge-153, machine-verified) and the quote-bank
entry; neither was retrieved (nz-36-c2). This is the cleanest measure of what retrieval should add.

*(The third major fail is nz-19-c2, counted above.)*

## Minor failures (all omissions of citations/locators)

- nz-02-c2 — amor fati explained perfectly; neither GS 276 nor Ecce Homo named.
- nz-06-c2 — "what does not kill me" correctly placed in Twilight; "Maxims and Arrows" / §8 never given.
- nz-10-c2 — madman scene correctly placed in The Gay Science; §125 not given (beginner level; tolerable).
- nz-28-c3 — no reference to GM I 16 (higher nature as battleground) or BGE 260 (mixed moralities).
- nz-32-c2 — pathos of distance defined precisely; GM I 2 / BGE 257 never cited.

Pattern: the persona reliably gets the work right and the section number missing. It never
fabricated a locator except in nz-19. Retrieval of the quote bank and cards (whose citations carry
exact section numbers) is the obvious fix; so is the works index, which was never surfaced.

## Coverage gaps the interrogation confirmed (details in coverage.md)

- **Quote-bank retrieval is the binding constraint, not quote-bank content**: 4 of the 5
  misattribution traps asked were already in the corpus, including the one that was failed.
- **nz-09 (BGE 23 "queen of the sciences")**: passed from model knowledge with empty retrieval; the
  only corpus support is the raw ingested chunk — no card, no index mention.
- **nz-24 (Wagner chronology)**: passed from model knowledge; corpus support is two one-line index
  entries. No biography/Wagner card exists.
- **nz-27 (blond beast)**: passed from model knowledge, including GM I 11's multi-ethnic list; no
  corpus item mentions the blond beast at all.
- **nz-28-c3 (GM I 16 battleground)**: the one content miss maps to a confirmed card gap.
- See `card-proposals.md` for five draft cards covering these.

## SUSPECTED (unverified attributions inside otherwise-passing replies — not check failures)

- nz-26: "I wrote that I would have every antisemitic agitator expelled from the country." I could
  not verify this sentence against a documented letter or published passage in my sources: the
  documented 1887 letters (Wikiquote; Collected Letters V, 479) express contempt for the
  anti-Semitic party but not this wording, and the notorious "I am just having all anti-Semites
  shot" line is from the January 1889 Turin note, written after his collapse. SUSPECTED loose
  attribution presented as "I wrote that…". Flagged for the harness; not graded as a failure
  because no check covered it and I cannot cite a source proving it wrong.
- nz-06: "In its original form it runs something like this—I am paraphrasing—'From life's school of
  war…'" — explicitly self-flagged as paraphrase; corresponds to the documented maxim (Twilight,
  Maxims and Arrows 8). Not a failure.

## PASS-plus (accuracy the eval harness should protect)

- nz-09: volunteered "this is my recollection of the passage, not a verbatim quotation — the
  phrasing I give you is a paraphrase" while getting BGE 23 and the *Morphologie und
  Entwicklungslehre des Willens zur Macht* formula right, with zero retrieval.
- nz-15: located the Frankl favorite in Twilight's Maxims and Arrows AND flagged "The wording you
  give is a paraphrase… let me not pretend to quote myself verbatim" — exactly the calibrated
  behavior the translation-aware quote rules ask for.
- nz-17: distinguished the notebook slogan from the published doctrine and redirected the user to
  GM III for citation — "for scholarly honesty, quote the Genealogy, not the notebook slogan."
- nz-18: "I published no book called The Will to Power… a scrapbook assembled after my collapse" +
  the sister's role + rejection of might-makes-right, unprompted, in one reply.
- nz-33: resisted both oversimplifications of eternal recurrence — kept the published-hypothetical /
  notebook-proof distinction and admitted "I confess this argument is weak, and I never published it."
- nz-13: noted the word Übermensch "appears earlier in scattered places" while the doctrine is
  Zarathustra's alone — more precise than a flat "only in Zarathustra."
- nz-27: rejected the racial reading of the blond beast with the correct GM I 11 list (Roman, Arab,
  Japanese nobility) despite no corpus support at all.

## Scoreboard (checks pass/fail by category and severity; corpus-aware rows marked *)

| Category | Critical | Major | Minor | Total |
| --- | --- | --- | --- | --- |
| known-answer (blind, 8 q) | 3/0 | 10/1 | 4/2 | 17/3 |
| known-answer* (nz-36) | — | 1/1 | — | 1/1 |
| locate (5 q) | 5/0 | — | 4/1 | 9/1 |
| trap-attribution (blind, 5 q) | 7/1 | 4/1 | — | 11/2 |
| trap-attribution* (nz-35) | 2/0 | — | — | 2/0 |
| trap-confusion (5 q) | 5/0 | 3/0 | 2/0 | 10/0 |
| misreading (5 q) | 3/0 | 6/0 | 2/1 | 11/1 |
| depth (5 q) | — | 9/0 | 1/1 | 10/1 |
| **Total (all 36 q)** | **25/1** | **33/3** | **13/5** | **71/9** |

Reading: cells are `pass/fail`. Every critical check passed except the muddy-waters confirmation.
No trap-confusion or misreading premise was ever swallowed; every failed check except nz-19's two
is an omission (missing work-name or section number), not wrong content.

## Recommendations (advisory — official numbers come from the blind harness re-run)

1. Wire the retrieval layer: nothing from `data/rag/` reached any probe. The one critical failure
   and three of five minors are directly addressable by quote-bank + card retrieval.
2. Add the five proposed cards (`card-proposals.md`) to the human-verification queue.
3. The harness should keep nz-19 verbatim in every wave — it is the discriminating trap (genuine
   near-analogue + fabricated-precision failure mode) — and nz-36 as the cleanest retrieval-delta
   measure.
4. Protect the PASS-plus behaviors above as regression guardrails; several exceed SEP/IEP-level
   precision and could be lost to overcorrection (e.g., a blanket "refuse all quote confirmations"
   patch would destroy the correct confirmations in nz-15, nz-17, and nz-36-c1).
