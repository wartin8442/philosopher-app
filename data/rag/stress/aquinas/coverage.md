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
