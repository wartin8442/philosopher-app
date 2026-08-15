# Corpus coverage audit — merged (2026-07-19)

Standalone audit of data/rag/ coverage against SEP/IEP, merged from the five
per-philosopher stress-test agents (Phase 3 of docs/stress_test_agents.md).
Kept separate from exam scores by design. Each section below is the
untouched per-philosopher coverage.md.

Cross-philosopher headline gaps:
- No ingested primary texts for any philosopher except partial Nietzsche
  (data/rag/texts/).
- The corpus is not wired into runtime retrieval at all (see SUMMARY.md
  finding 1) — every gap below is currently masked by parametric knowledge.
- No biography layer for most philosophers (Regine/Corsair/Mynster for
  Kierkegaard; 1273 Naples / 1277 condemnations for Aquinas; Le Soir
  républicain period for Camus; biography and the Camus break for Sartre).


---

# Aquinas

# Aquinas — Corpus Coverage Audit (Phase 3, 2026-07-18)

Audit of the Aquinas RAG corpus against SEP "Thomas Aquinas" (2022), IEP "Thomas Aquinas",
IEP "Aquinas: Moral Philosophy", and Wikiquote's sourced/disputed/misattributed sections.
Question bank (`eval-questions.json`) was frozen before the corpus was opened; this file maps
the two after the fact.

## Corpus inventory found

- `data/rag/cards/drafts/aquinas.md` — 40 position cards (Metaphysics 10, Natural Theology 12,
  Soul/Mind/Free Will 9, Epistemology 7 by heading count, Ethics 14). All `Status: draft`.
- `data/rag/indexes/aquinas.md` — works index, 7 entries, `Status: Approved`.
- `data/rag/quotes/drafts/aquinas.json` — 9 sourced quotes (all `verification: pending`),
  1 disputed entry, 1 misattribution entry.
- `data/rag/texts/` — **no Aquinas primary texts ingested.** Only
  `nietzsche-beyond-good-and-evil-zimmern` exists. The manifest's planned ingestions
  `aquinas-summa-theologiae-dominican-1920` and `aquinas-de-ente-et-essentia` have not happened.
- `src/lib/philosophers.ts` — persona prompt with 4 inline source snippets (Five Ways; natural
  law q.94; law qq.90–96; De Ente).

## A. SEP/IEP sections with no corresponding position card

Ordered by how directly the interrogation exercises them:

1. **Rejection of Anselm's ontological argument** (SEP §2: ST 1a 2.1 ad 2; SCG I.10–11).
   No card says Aquinas denies that God's existence is self-evident to us or that he rejects
   the ontological proof. Exercised by aq-18.
2. **Rejection of Augustinian divine illumination** (SEP §6.2). The abstraction card and the
   anti-Averroist card exist, but nothing states the Augustine contrast: no illumination,
   each person's own agent intellect abstracts. Exercised by aq-19.
3. **Intellect does not know singulars directly** (SEP §6.2: ST 1a 86.1). No card. Exercised by aq-33.
4. **Demonstration quia vs. propter quid; we know that God is and what God is not, not what God is**
   (SEP §6.3, §2: ST 1a 2.2, 3pr). The Scientia card covers demonstration generally but not this
   distinction or its application to the Five Ways. Exercised by aq-35.
5. **Conscience (conscientia) as an act applying principles to cases, vs. synderesis**
   (SEP §8.2: ST 1a 79.13). Synderesis card exists; conscience does not. Exercised by aq-31.
6. **Infused cardinal virtues** (SEP §8.3: ST 1a2ae 63.3 — "moral perfection requires that even
   the cardinal virtues be infused by God"). Worse than a gap: the card "Theological Virtues Are
   Gifts of Grace, Not Things You Can Earn" contrasts the theological virtues with cardinal
   virtues "built up gradually through practice and habituation", which invites the wrong answer
   to aq-32. Correction needed, not just a card.
7. **Evil as privation / reply to the problem-of-evil objection** (ST I q.2 a.3 ad 1; De Malo).
   De Malo is in the works index but no card covers evil or the Augustine "brings good out of
   evil" reply. Exercised by aq-23.
8. **Objection-vs-position structure of Summa articles as a retrieval-grounding item.** The
   persona prompt mentions the objection–reply style, but no corpus item contains the text of any
   objection with a warning label. With no ST primary text ingested, nothing grounds the
   signature trap (aq-22, aq-23) at the retrieval layer.
9. **Political philosophy beyond law**: authority/anti-anarchism, obedience and its limits,
   tyranny/tyrannicide, best form of government (IEP §9b–c; Sentences II d.44; De Regno).
   Only law cards exist. Exercised by aq-28.
10. **Biography/timeline**: 1273 mystical experience and death (quote bank covers the "straw"
    remark only), the 1277 Paris/Oxford condemnations, 1323 canonization, 1325 clarification
    (SEP §1.1, §9). The planned `wikipedia-bio` ingestion has not happened. Exercised by aq-29, aq-36.
11. **Perception details partially covered**: proper/common/accidental sensibles and interior
    senses have cards; the cogitative power (human counterpart of the estimative) does not.
    Not directly exercised.
12. **Faith and reason: the three rejected positions** (IEP §2: evidentialism, fideism,
    separatism; preambles vs. articles of faith). Cards cover the harmony and the limits of
    natural theology; the "preambles of faith" terminology appears only inside the
    "Natural Theology Has Limits" card. Adequate but thin for aq-26.
13. **God's relation to time/omnipresence nuance** (SEP §3: eternity as "present to every time",
    SCG I.66) — no card. Not exercised.
14. **Analogy of 'healthy'/three modes of predication** (IEP §3) — the analogy card covers God-talk
    only, not the general semantics. Marginal.

## B. Works-index gaps

The index (7 entries) omits works the bank and the traps depend on:

- **De unitate intellectus contra Averroistas** (1270) — cited by a card, absent from index (aq-08).
- **De aeternitate mundi** (1271) — cited by a card, absent from index (aq-11).
- **De Regno / De Regimine Principum** — absent, together with the Ptolemy-of-Lucca continuation
  warning that the misattribution entry depends on (aq-14). The quote bank cites De Regno for
  "Reason in man is rather like God in the world" yet the index has no such work.
- **De Principiis Naturae** — cited by four metaphysics cards, absent from index.
- **De Potentia** — quote bank cites it; absent from index.
- **Sermons/Collationes (Ten Commandments, Apostles' Creed)** — quote bank cites them; absent.
- **Biblical commentaries** (esp. Super I ad Corinthios 15, source of "anima mea non est ego") — absent (aq-27).
- **Quodlibetal Questions, Compendium theologiae** — absent (low priority).

## C. Quote-bank gaps

- No entry for **"To one who has faith, no explanation is necessary..."** — the most common
  fake-Aquinas quote in circulation (aq-17). The bank's misattribution list has exactly one entry.
- No entry for **"Anima mea non est ego"** (Super I ad Cor. 15) — the strongest primary-text
  anchor against the "I am my soul" misreading (aq-27); it is in Wikiquote's sourced section.
- No entry for the Sentences passage on disobeying unjust commands ("as did the holy martyrs...",
  Selected Political Writings p.183) — would ground aq-28.
- The "greatness of the human being... capable of the universe" entry's own note flags the
  citation as unverified; still pending.

## D. Question-by-question corpus support

Empty list = coverage gap (recorded above), not a defect in the question.

| Question | Supporting corpus items |
|---|---|
| aq-01 | cards: "The Five Ways: Reason Alone...", "The Five Ways Don't Prove the Christian God Specifically", "The First Way", "The Second Way"; persona source "ST I, Q.2, a.3"; index: Summa Theologiae |
| aq-02 | cards: "Natural Law's First Principle", "Natural Law Tracks Our Built-In Human Inclinations"; persona source "ST I-II, Q.94, a.2"; quote: "The law of nature ... light of the intellect" |
| aq-03 | cards: "Essence and Existence Are Really Distinct in Creatures", "God's Essence Is God's Existence"; index: De Ente et Essentia; persona source De Ente |
| aq-04 | card: "Whether the World Had a Beginning Cannot Be Proven by Reason Alone" |
| aq-05 | card: "Happiness Is Ultimately Contemplating God"; persona ethics bullet |
| aq-06 | card: "Analogical God-Talk"; persona God bullet |
| aq-07 | card: "Four Kinds of Law"; persona natural-law bullet; index: Summa Theologiae |
| aq-08 | card: "Each Person Has Their Own Individual Intellect" (cites the work); index: — (gap B) |
| aq-09 | index: Summa Theologiae ("the Five Ways are ST I, Q.2, a.3"); persona source; Five Ways cards |
| aq-10 | card: "Human Law Is Only Truly Binding When It Reflects Natural Law" (no Augustine-authorship note — partial gap); persona law bullet |
| aq-11 | card: "Whether the World Had a Beginning..." (cites De Aeternitate Mundi); index: — (gap B) |
| aq-12 | cards: "The Human Soul Is Both a Body's Form...", "Debate: Is a Disembodied Soul Alone Enough to Be 'You'?" (ST I q.75 a.4 not cited anywhere — partial gap) |
| aq-13 | quotes: disputed entry "I fear the man of a single book" |
| aq-14 | quotes: misattribution entry (Ptolemy of Lucca / sewer) |
| aq-15 | (none directly; card "Faith and Reason Cannot Genuinely Conflict" supports the correction) |
| aq-16 | quotes: "Nothing is in the intellect..." with Peripatetic-axiom caution note; card "All Human Knowledge Starts With the Senses" |
| aq-17 | (none — gap C) |
| aq-18 | (none — gap A1) |
| aq-19 | (none directly — gap A2; cards "Abstraction...", "Each Person Has Their Own Individual Intellect" adjacent) |
| aq-20 | cards: "Whether the World Had a Beginning...", "Faith and Reason Cannot Genuinely Conflict" |
| aq-21 | cards: "The Human Soul Is Immortal", "Each Person Has Their Own Individual Intellect" |
| aq-22 | (no item carries the objection text — gap A8; Five Ways cards adjacent; persona style note) |
| aq-23 | (no evil/theodicy card — gaps A7, A8; Five Ways cards adjacent) |
| aq-24 | card: "The Five Ways Don't Prove the Christian God Specifically"; card "Natural Theology Has Limits" |
| aq-25 | cards: "Natural Law Tracks...", "Natural Law's First Principle", "Natural Law Isn't the Same Thing as Modern 'Natural Rights'"; quote "law of nature ... light of the intellect" |
| aq-26 | cards: "Faith and Reason Cannot Genuinely Conflict", "Natural Theology Has Limits" |
| aq-27 | cards: "Debate: Is a Disembodied Soul Alone Enough to Be 'You'?", "The Human Soul Is Immortal" ("anima mea non est ego" not in quote bank — gap C) |
| aq-28 | (partial: card "Human Law Is Only Truly Binding..."; persona law bullet; no authority/obedience card — gap A9) |
| aq-29 | quote: "All that I have written seems like straw..." with framing note |
| aq-30 | cards: "The Second Way" (simultaneous-dependence misreading note), "Whether the World Had a Beginning...", "The First Way" |
| aq-31 | card: "Synderesis" (conscience uncovered — gap A5) |
| aq-32 | card: "Theological Virtues Are Gifts of Grace..." — **supports the wrong answer** (gap A6) |
| aq-33 | (none — gap A3; "Abstraction" card adjacent) |
| aq-34 | card: "One Substantial Form Per Thing" |
| aq-35 | card: "Scientia..." (quia/propter quid uncovered — gap A4); quote "Man reaches the highest point of his knowledge about God..." |
| aq-36 | (none — gap A10) |

## E. Other observations

- The card "One Substantial Form Per Thing" says the view "was controversial even in his own
  time" — true of the pluralism debate, but the censures themselves (Paris/Oxford 1277) were
  posthumous; a card touching the condemnations should get the timing right.
- The quote bank note on "Nothing is in the intellect..." is exemplary trap-hardening
  (flags that the tag sits inside an objection and is Aristotelian in origin). This is the
  pattern gaps A1/A2/C should copy.
- The persona prompt's instruction "Do not invent citations" plus the objection–reply style note
  are the only system-level defenses against the signature objection-vs-position trap; nothing
  at the retrieval layer carries article structure.

---

# Nietzsche

# Nietzsche corpus coverage audit (stress test, 2026-07-18)

Method: Phases 1–2 were completed corpus-blind (SEP entry "Friedrich Nietzsche" rev. 2026-06-25;
IEP entry "Nietzsche"; quotes verified against Gutenberg #1998, #4363, #52263, #52319, #52881 and
Wikiquote's sourced/misattributed sections). Only afterwards were the corpus files opened:

- `data/rag/cards/drafts/nietzsche.md` — 47 position cards in 9 sections (all `Status: draft`)
- `data/rag/indexes/nietzsche.md` — works index, 13 entries incl. a Will to Power warning (draft — Approved)
- `data/rag/quotes/drafts/nietzsche.json` — 13 sourced quotes, 4 misattributions, 1 caution (WP); 2 BGE quotes machine-verified
- `data/rag/texts/nietzsche-beyond-good-and-evil-zimmern/` — full BGE (Zimmern), 297 chunks, one aphorism per chunk
- `src/lib/philosophers.ts` — persona with anti-Nazi/antisemitism guard, "Do not fabricate quotations" instruction, 4 source cards

All five expected artifacts exist. This is a strong corpus for the doctrines; the gaps cluster in
biography/chronology, specific textual loci, and the works other than BGE having no ingested text.

## 1. SEP/IEP sections with no (or only partial) corresponding position card

| Encyclopedia section | Corpus status |
| --- | --- |
| SEP §1 Life and Works (biography: Basel chair 1869, Wagner friendship and 1876–78 break, Lou Salomé episode, 1879 resignation, Turin collapse Jan 1889, death 1900) | **No biography cards at all.** Works index gives publication dates only. Questions touching the Wagner chronology (nz-24) have only two index lines to lean on. |
| IEP §2 Periodization (juvenilia / early / middle / late periods) | **No card.** Period-confusion traps depend on general model knowledge. |
| SEP §3.1 Value creation / meta-ethics (GS 301; BGE 211 "philosophers of the future create values"; anti-realism vs constructivism debate) | Partial: persona prompt one-liner and "No Moral Facts" card (BGE 108). No card on value *creation* as a positive doctrine. |
| SEP §3.2.3 Truthfulness/Honesty (GS 2 intellectual conscience; GS 344; BGE 227; EH Pref. 3 "how much truth does a spirit endure") | Partial: only the GM III 24 science-and-ascetic-ideal card. No card on honesty as Nietzsche's cardinal virtue. |
| SEP §3.2.5 Individuality, freedom of spirit (GS 347 fanaticism vs self-determination) | **No card.** |
| SEP §3.2.6 Pluralism (values interacting as "counterforces") | **No card.** |
| SEP §4 drives and affects (drive psychology, GS 354 consciousness/representation) | Partial: consciousness card and soul-multiplicity card exist; no card on drives/affects as core psychological posits. |
| SEP §6.1 the *published* BGE 36 argument for cosmic will to power | Partial: "Not Clearly a Universal Physical Law" card cites BGE 36 correctly as hypothetical. Adequate. |
| SEP §6.3 eternal recurrence loci in Zarathustra (Z III "On the Vision and the Riddle", "The Convalescent") | Partial: "Even Zarathustra Struggles" card cites "The Convalescent"; the psychological-test card marks the Z III locator only "approximate". |
| GM I 11 "blond beast" (multi-ethnic list: Roman, Arabic, German, Japanese nobility) | **No card mentions the blond beast.** nz-27 is supported only obliquely by the "Higher Types" and Übermensch-misreading cards. Confirmed gap → card proposal 1. |
| GM I 16 "higher nature as battleground of the two valuations"; BGE 260 mixed moralities point is present but GM I 16 is absent | Partial gap → folded into card proposal 2. |
| GM III 1/28 the "would rather will nothingness than not will" formula | The ascetic-ideal card covers meaning-of-suffering but never states the formula, which is the most-quoted sentence of GM III. Partial gap → card proposal 2. |
| 1887 anti-antisemitism letters (Christmas letter to Elisabeth; draft Dec 1887; Schmeitzner break) — documented in IEP §8 and Wikiquote | Partial: the proto-Nazi misreading card asserts the fact but cites only an "approximate" EH section and SEP §1; no card carries the letter evidence. → card proposal 3. |
| Twilight "Maxims and Arrows" 26 ("I mistrust all systematizers") context — IEP §3's caution about reading it as an absolute | Quote bank has M&A 26; no card. Minor. |
| Sils Maria / "6000 feet beyond man and time" origin story of recurrence (EH; IEP §7) | No card. Minor (biography-adjacent). |

## 2. Question-by-question corpus support

Full mapping lives in `eval-questions.json` (`relevant_corpus` per question). Summary:

- **Well supported (3+ items):** nz-01, nz-03, nz-04, nz-08, nz-13, nz-18, nz-20, nz-21, nz-22, nz-25, nz-26, nz-28, nz-29.
- **Supported:** nz-02, nz-05, nz-06, nz-07, nz-10, nz-11, nz-12, nz-14, nz-15, nz-16, nz-17, nz-19, nz-23, nz-30, nz-31, nz-32, nz-33, nz-34, nz-35, nz-36.
- **Thin support (support exists but not purpose-built):**
  - nz-09 (BGE 23 "queen of the sciences"): no card, no index mention; only the raw ingested chunk bge-023. Retrieval must reach into the full text.
  - nz-24 (Wagner chronology): only two one-line index entries; no card on the Wagner relationship or the 1878 break.
  - nz-27 (blond beast): no direct corpus item; nearest cards address the Übermensch/higher-types misreading, not GM I 11.
- **No question has an empty relevant_corpus list**, but the three thin rows above are the operative coverage findings, together with the section gaps in table 1.

## 3. Notes in the corpus's favor (things the blind bank confirmed it gets right)

- The index and quote bank both carry explicit warnings that the madman passage is GS §125, not
  Zarathustra, and that The Will to Power is not a book Nietzsche wrote — the two headline traps.
- The quote bank pre-empts the Frankl paraphrase (M&A 12 note) and three of my four misattribution
  traps verbatim (dancing / muddy waters / owning yourself), plus one I had not chosen ("Nobody is
  more inferior..." — adopted as corpus-aware question nz-35).
- Card citations spot-checked against SEP/primary texts came back accurate; where the author was
  unsure, locators are honestly marked "approximate" rather than fabricated.

## 4. Corpus-aware additions

- nz-35 (trap-attribution, from the corpus's own misattribution list) and nz-36 (known-answer,
  machine-verified BGE 153) were added after unblinding, tagged `"provenance": "corpus-aware"`,
  and are excluded from headline metrics.

---

# Kierkegaard

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

---

# Sartre

# Sartre corpus coverage audit (stress test, 2026-07-19)

Method: SEP "Jean-Paul Sartre" (rev. 2026-07-10) and IEP "Jean Paul Sartre: Existentialism" were studied section by section BEFORE opening the corpus; the 34 corpus-blind questions were frozen first. This file maps encyclopedia coverage against the corpus as it exists today:

- `data/rag/cards/drafts/sartre.md` — 40 cards, sections A–I (all `Status: draft`)
- `data/rag/indexes/sartre.md` — works index, 10 entries (`Status: Approved`)
- `data/rag/quotes/drafts/sartre.json` — 11 quotes (all `verification: pending`) + 1 misattribution entry
- `data/rag/texts/` — NO Sartre primary texts (only Nietzsche BGE is ingested). Expected: all Sartre works in copyright (per source_manifest.json), but it means every "primary-text"-level answer rests entirely on cards + index.
- Persona (`src/lib/philosophers.ts`) — solid on B&N-core themes; includes the "hell is other people ... names a predicament, not misanthropy" corrective and "Do not fabricate citations".

## 1. SEP/IEP sections with NO corresponding position card

| SEP/IEP section | Missing content | Severity for the app |
|---|---|---|
| SEP §3 (Imagination, Phenomenology and Literature) | No card on The Imaginary at all: quasi-observation thesis, exclusion claim, image posits object as absent/nothingness, imagination–freedom argument, the analogon / irreality of the artwork. Only a one-line works-index entry. | High — this is a whole book and a signature doctrine |
| SEP §3 / IEP §2a (theory of emotions) | No card on the Sketch for a Theory of the Emotions (1939): emotion as "magical" transformation, activity/responsibility for emotion. The Sketch is absent even from the works index. | High |
| SEP §§5–6 (Search for a Method, progressive-regressive method) | Search for a Method (1957) missing from cards and works index; no card on the progressive-regressive method. | High for "where do you argue X" questions |
| SEP intro & §5 (The Family Idiot) | Flaubert study (1971–72) absent from cards and works index (Saint Genet is indexed; Flaubert is not). | Medium-high |
| SEP §1 (biography) | No biography chunks: ENS, agrégation (failed first attempt), Aron and the apricot cocktail (1932/33), Berlin year, meteorologist/POW 1940–41, Les Temps Modernes, funeral, Hope Now/Benny Lévy controversy. source_manifest plans Wikipedia bio chunks — not present. | Medium |
| SEP §1 (Camus falling-out) | The 1952 break over The Rebel's reception in Les Temps Modernes exists ONLY in the Camus persona prompt — nothing on the Sartre side of the corpus. | Medium |
| IEP §2d (Heidegger's "Letter on Humanism") | No card on Heidegger's criticism of Existentialism Is a Humanism. The corpus has Sartre's reservations about EH (card G) but not the philosophical counterattack. | Medium |
| SEP §4.2 / §4.3 (ethics endnote; Notebooks for an Ethics) | The promised-ethics footnote and posthumous Notebooks for an Ethics are uncited anywhere; nothing distinguishes Sartre's unwritten ethics from Beauvoir's Ethics of Ambiguity. | Medium |
| SEP §6 (Critique details) | Cards cover practico-inert/seriality/group-in-fusion/institution in outline, but Sartre's own examples (bus queue is present in the seriality card; the 1789 revolutionary crowd is NOT) and vol. 2's posthumous status (1985/1991) are missing. | Low-medium |
| SEP §7 (Black Orpheus, negritude, Fanon) | Racism card cites Anti-Semite and Jew + Wretched preface, but "Black Orpheus" (1948), "anti-racist racism", and Fanon's critique in Black Skin, White Masks are absent. | Medium |
| SEP §2 (Transcendence of the Ego fine structure) | Card exists (streetcar example) but the translucidity argument and the Pierre-repulsive / "I hate" passages are not carded. | Low |
| SEP §5 (fundamental project details) | Existential-psychoanalysis card covers conscious-but-not-known and Baudelaire; the "desire to be God" / for-itself-in-itself triad has no card (only the "useless passion" quote note). | Low-medium |
| SEP §1 / political facts | Nobel 1964 appears only as an aside in the Words index entry; never-a-PCF-member, Hungary 1956, Algeria are entirely absent. | Medium |

## 2. Question-bank support map

Supported (non-empty relevant_corpus): q01–q06, q08–q12, q14*, q15, q18, q23, q25–q33, q35, q36.
(*q14's support is only the persona's no-fabrication instruction — negative support.)

Questions with NO corpus support (coverage gaps confirmed pre-interrogation):

- q07 (theory of emotions) — no card, work not even indexed.
- q13 (Search for a Method / progressive-regressive method) — absent everywhere.
- q16 ("Freedom is what you do with what's been done to you" paraphrase) — no misattribution entry; quote bank has only one misattribution recorded.
- q17 (Camus' absurd line misattributed to Sartre) — Sartre-side corpus has nothing tying "the absurd" to Camus.
- q19 (Camus break, 1952, The Rebel) — nothing on the Sartre side.
- q20 (Heidegger's Letter on Humanism) — absent.
- q21 (Ethics of Ambiguity is Beauvoir's; Notebooks for an Ethics posthumous) — absent.
- q22 (never a PCF member; Hungary 1956) — absent.
- q24 (The Family Idiot = Flaubert) — absent from cards and works index.
- q34 (Aron, apricot cocktail, 1932/33) — no biography chunks.

Partial support worth flagging: q10 (desire-to-be-God only via a quote note), q12 (group-in-fusion card lacks the 1789 example), q31 (Imaginary has index line only; quasi-observation thesis nowhere), q32 (Wretched preface cited, Fanon's criticism absent).

## 3. Notes

- The misattributions section of the quote bank has exactly one entry. The fabricated/paraphrase quote surface (q14, q16, q18) is therefore almost entirely dependent on model behavior plus the persona's "do not fabricate citations" line, not on retrieval.
- The works index is the only corpus item marked Approved; all cards and quotes are drafts pending verification.
- Two corpus-aware questions (q35, q36) were added after reading the corpus and are tagged `"provenance": "corpus-aware"`; they are excluded from headline corpus-blind metrics.
- Questions were NOT rewritten to fit the corpus; empty relevant_corpus lists are recorded as findings above.

---

# Camus

# Camus — Corpus Coverage Audit (Phase 3, stress test 2026-07-19)

Corpus inspected: `data/rag/cards/drafts/camus.md` (46 cards, all Status: draft),
`data/rag/indexes/camus.md` (works index, Approved), `data/rag/quotes/drafts/camus.json`
(12 quotes, 2 disputed, 4 misattributions, 1 caution), `data/rag/texts/` (no Camus
primary texts — expected: all Camus works remain in copyright), persona in
`src/lib/philosophers.ts` (id: "camus").

## 1. SEP/IEP sections with no corresponding position card

| Source section | Missing content | Notes |
|---|---|---|
| SEP §2 / IEP §5.b | **Nuptials as a distinct early period** — the 1938 lyrical essays, the Pandora's-box reading taken from Nietzsche's *Human, All Too Human*, "the world is beautiful, and outside there is no salvation", the "sin against life" line from "Summer in Algiers" | "Hope as a Hidden Trap" card gestures at Pandora but omits the Nietzsche lineage and dates nothing; no card marks the *development* from naive early hedonism to the mature philosophy (IEP §5.b's central point) |
| SEP §3.5 | Response to skepticism — Pyrrho/Descartes comparison, methodical doubt as the absurd's analogue | No card |
| SEP §4 (biographical bridge) | **Entire biography layer absent**: Kabylie famine reports (1939), pacifism at *Le Soir républicain* and opposition to French entry into WWII, Combat editorship (succeeding Pascal Pia, March 1944), the Hiroshima protest (1945), "Neither Victims nor Executioners" (1946, 'socialist but not a Marxist'), expulsion from the Algerian Communist Party over the Popular Front line on colonialism | Source manifest plans Wikipedia biography chunks; not yet built. Confirmed live gaps: cam-07, cam-24 |
| SEP §2 / IEP §1 | **Dissertation** (Christian Metaphysics and Neoplatonism; Plotinus and Augustine, University of Algiers 1936) | No card, no index entry — cam-07 has empty relevant_corpus |
| SEP §4.2 | The Myth of Sisyphus is *silent* on Marxism (the critique lives in The Rebel / 'Neither Victims nor Executioners') | Nothing in corpus records this negative fact; cam-23 unmapped |
| SEP §4 / IEP §4.b | **The Just Assassins / Kaliayev** — the play, the 1905 Grand Duke Sergei assassination, historical vs. dramatized Kaliayev | The "Conditions" card carries the doctrine but neither the play nor Kaliayev appears anywhere; the play is missing from the works index. cam-30 unmapped |
| SEP §4 (LCE 339-341) | The Plague as Resistance allegory *and* the Barthes/Sartre criticism that a non-human pestilence dodges the ethics of violent resistance | cam-31 unmapped |
| IEP §5.c.v / SEP §6 | Camus's *non-militant* unbelief — "never assured enough to declare that God does not exist", respect for Christian thinkers (Augustine, Kierkegaard), Paneloux joining the sanitary squads | "Living Without God" card covers the starting point but not the tolerance/respect nuance |
| IEP §4.b | Drama generally: The Misunderstanding (1944), State of Siege (1948, Cadiz/Franco — NOT an adaptation of The Plague), Caligula's "Men die and are not happy" | Only Caligula is in the works index; no cards |
| IEP §5.c.i | Absurdist exemplars in MS (Don Juan, the Actor, the Conqueror, Kirilov/Dostoevsky) | No card |
| IEP §1 | Nobel Prize specifics (1957, citation wording, Malraux remark, Stockholm speech: "the refusal to lie about what one knows and the resistance to oppression") | Index notes 1957 Nobel in passing only |
| SEP §5 / IEP §4.a | The Fall — covered by two cards; fine | — |

## 2. Works index gaps

The Approved works index omits: **Betwixt and Between (1937), Nuptials (1938), The
Misunderstanding (1944), State of Siege (1948), The Just Assassins (1950), Summer /
L'Été (1954, incl. "Return to Tipasa"), "Reflections on the Guillotine" (1957),
Algerian Chronicles (1958), Resistance, Rebellion, and Death (1961), Notebooks**.
For a "where do you argue X?" index this is thin: two of the interrogation's locate
questions (cam-10 invincible summer; part of cam-06 guillotine) must be carried by the
quote bank or cards instead of the index.

## 3. Questions with no corpus support (empty relevant_corpus — coverage findings)

- **cam-07** (dissertation on Plotinus/Augustine) — nothing anywhere in corpus.
- **cam-23** (MS contains no critique of Marxism) — the negative fact is unrecorded;
  the model must resist inventing a section with no grounding either way.
- **cam-24** (Nuptials 1938 chronology; early-war pacifism vs. later Resistance) —
  no biography layer, no Nuptials index entry.
- **cam-30** (historical vs. dramatized Kaliayev) — The Just Assassins absent from
  index and cards.
- **cam-31** (The Plague allegory + Barthes/Sartre criticism) — not carded.

Partial-support cases worth flagging: cam-25 (The Rebel's definition of the nihilist —
"one who does not believe in what exists" — is not in the corpus; only the generic
"absurd is not nihilism" card), cam-26 (Sartre contingency vs. Camus relation
distinction not carded), cam-32 (non-militant unbelief nuance), cam-36 (early-war
pacifist period), cam-05 (Just Assassins connection), cam-22 (Jeanson / Les Temps
modernes / 1952 specifics not in the break-with-Sartre card).

## 4. Corpus strengths confirmed against SEP/IEP

- The quote bank already carries all four trap-appendix misattributions ("coffee",
  "unfree world", "don't walk behind me", "causes worth dying for") with explanations,
  plus two more ("always go too far", "life of great importance"), and — notably —
  the reverse-bait note on "invincible summer" ("it is genuine. Useful in the opposite
  direction from most misattribution checks").
- The existentialist-label caution records the exact interview (Les Nouvelles
  littéraires, 15 November 1945).
- Absurd-as-relation, philosophical suicide (Kierkegaard and Husserl by name), revolt
  → solidarity → limits, rebellion vs. revolution, Louis XVI, logical crime, the two
  tests of honest rebellion (death penalty, free speech), death-penalty ethics, and
  Algeria are all carded, matching SEP §§1-4/6 and IEP well.
- Works index dates check out against SEP/IEP (Stranger 1942, MS 1942, Rebel 1951,
  Fall 1956); index correctly notes MS's essay is 1942 despite IEP's own "1943"
  heading slip.

## 5. Method note

Questions cam-01..cam-37 were written before any corpus file was opened
(provenance: corpus-blind). cam-38..cam-40 were added after corpus reading
(provenance: corpus-aware) and are excluded from headline metrics.
