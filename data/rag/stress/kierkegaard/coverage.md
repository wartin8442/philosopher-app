# Kierkegaard corpus coverage audit (stress test, 2026-07-18)

Corpus surveyed AFTER the question bank was frozen (Phase 3): `data/rag/cards/drafts/kierkegaard.md` (48 cards), `data/rag/indexes/kierkegaard.md` (11 works), `data/rag/quotes/drafts/kierkegaard.json` (9 quotes, 1 disputed, 2 misattributions), `data/rag/texts/` (no Kierkegaard texts present), persona in `src/lib/philosophers.ts`.

## Headline structural findings

1. **No ingested Kierkegaard primary text.** `data/rag/texts/` contains only Nietzsche (Beyond Good and Evil). The Hollander 1923 *Selections* is marked `ingest: planned` in the source manifest but has not been ingested. Every "Reading a Primary Text"-level answer is therefore card/index-grounded only.
2. **Persona blurb contradicts the quote bank on "leap of faith".** `src/lib/philosophers.ts` blurb: "probed anxiety, despair, and the leap of faith" — and two cards are titled "The Leap of Faith as a Decision…" / "The Leap of Faith Is Not…". The quote bank's misattributions section correctly records that Kierkegaard never used a phrase translating to "leap of faith" and instructs the persona to correct users. The corpus argues with itself; retrieval order decides which voice wins (probed by kg-15).
3. **Works index misclassifies Works of Love.** Index calls it "signed religious discourse"; the subtitle is "Some Christian *Deliberations* in the Form of Discourses", and Kierkegaard's journals make the discourse/deliberation distinction load-bearing (SEP §1). Probed by kg-30.
4. **No biography layer at all.** Regine Olsen, the broken engagement, the Corsair affair, Mynster/Martensen by name, the 1841 dissertation, dates of publication beyond the index — none is in cards, quotes, or index. `wikipedia-bio` is `planned` in the manifest, not ingested.

## SEP/IEP sections with no corresponding position card

- **SEP §1 Life and Works (biographical)** — no cards: Regine engagement (1840–41), Corsair affair (1845–46, Frater Taciturnus vs P.L. Møller, Goldschmidt), Mynster/Martensen and the "witness to the truth" trigger by name, death 11 Nov 1855. (Questions kg-04, kg-23, kg-27, kg-35 depend on this.)
- **SEP §1 / IEP §1c: On the Concept of Irony (1841)** — the dissertation is absent from the works index and from every card. Socratic irony as "infinite negativity", irony/humor as confinia between stages: nothing. (kg-22)
- **SEP §1: discourse vs deliberation** — absent; index actively mislabels Works of Love. (kg-30)
- **SEP §1: The Point of View / "That Single Individual" literature** — absent. The persona prompt quotes "the crowd is untruth" with no work attribution, and no corpus item can locate the phrase. (kg-17)
- **SEP §1: Anti-Climacus's special status** (idealized Christian standpoint, "weakly pseudonymous", K places himself below Anti-Climacus and above Climacus) — no card; index only names him as pseudonym. (kg-36)
- **SEP §1 / IEP §1d–e: Postscript as intended end of the authorship; Corsair as pivot to the second authorship** — absent. (kg-35)
- **IEP §2d: the revocation of the Postscript; Climacus as humorist** — absent. (kg-33)
- **SEP §3.2 / IEP §2a: the Ultimatum sermon ending Either/Or** ("In Relation to God We Are Always in the Wrong") — absent; the Either/Or index line covers only Parts I–II life-views. (kg-10)
- **SEP §3.3.1: Philosophical Fragments' thought-project detail** (learner in untruth, the moment, teacher gives the condition) — the index one-liner is good but there is no card; the only Fragments card is the Absolute Paradox. (kg-34)
- **SEP §3.3.3: Hope, virtues, forgiveness, the upbuilding-discourse literature** — nothing beyond the "Purity of heart" quote entry. No card mentions any signed discourse before Works of Love.
- **SEP §2: despair of possibility/necessity is covered, but the weakness/defiance axis and 'despair of the forgiveness of sins' are not.** Partial.
- **SEP Chronology: Repetition** — index entry exists (good) but no card; simultaneous publication with Fear and Trembling recorded nowhere. (kg-24)
- **Works index omissions:** Two Ages / A Literary Review (cards exist but the index — the "where is this argued?" backstop — lacks it, kg-06), On the Concept of Irony, Stages on Life's Way has an index line but no cards, Prefaces, Christian Discourses, Upbuilding Discourses, Point of View, For Self-Examination.

## Questions with no corpus support (empty relevant_corpus)

- kg-04 (Corsair affair) — no card, index, or quote touches it.
- kg-10 (Ultimatum sermon location) — nothing.
- kg-33 (revocation of the Postscript) — nothing.
- kg-35 (Postscript intended as the end; what changed) — nothing.

## Questions with only partial / degraded support

- kg-05: attack-on-church cards exist but name neither Mynster nor Martensen ("a recently deceased bishop").
- kg-06: cards cover leveling/public; works index cannot answer "where".
- kg-14: fabricated-quote trap; corpus can only help via absence + F&T items.
- kg-15: supported by the misattribution entry but actively undermined by the persona blurb and two card titles using "leap of faith".
- kg-17: "the crowd is untruth" is in the persona prompt with no locating source anywhere.
- kg-22: only the Concept of Anxiety index line helps disambiguate; the actual dissertation is uncovered.
- kg-24: pseudonym recorded; same-day publication not.
- kg-27: pseudonymity cards help, but Regine and the autobiographical misreading are uncovered.
- kg-28: no card states that the stages are not an automatic developmental sequence; only a persona-prompt clause ("one leaps") gestures at it.
- kg-30: corpus item that exists (index) is itself the error.
- kg-36: index names Anti-Climacus but nothing explains the "Anti-" or the standpoint hierarchy.

## Note on corpus strengths (for fairness)

The cards are strong on: anxiety cluster, despair cluster, Fear and Trembling cluster (incl. tragic-hero contrast and anti-"blank check" misreading card), truth-is-subjectivity with explicit anti-relativist note, Danish Hegelians nuance, Works of Love non-rejection of preferential love, Christendom cluster, pseudonymity discipline. The quote bank's misattribution entries (leap of faith, van der Leeuw) directly target two of this exam's traps.
