# Source Strategy (planned corpus — not yet ingested)

> **Status: planning document.** Companion to
> [`rag_architecture.md`](rag_architecture.md). The machine-readable version of
> this plan is [`data/rag/source_manifest.json`](../data/rag/source_manifest.json).

## Guiding rules

1. **License first.** Nothing is scraped, downloaded, or committed unless its
   license clearly permits it. Copyrighted sources (SEP, IEP, modern
   translations, all Sartre/Camus works) are **link-only references** in the
   manifest — used as authority when writing our own material, never ingested.
2. **Explanation-shaped chunks win.** Retrieval works on self-contained,
   one-idea units. Secondary/encyclopedic material has that shape natively;
   primary texts are ingested only where their structure already provides it
   (Summa articles, Nietzsche aphorisms).
3. **Every chunk carries citations.** The point of the corpus is that when a
   user asks "where is this argued?", the philosopher can name the work (and
   section when known). A chunk without a `citations` field doesn't ship.
4. **Prefer paraphrase over quotation** unless the wording is verified
   (existing rule from `ADDING_A_PHILOSOPHER.md`). Verbatim quotes live only in
   the verified-quotes files, sourced via Wikiquote's *sourced* sections or the
   ingested primary texts themselves.

## Chunk-type taxonomy

| Type | What it is | Why it exists |
|---|---|---|
| `position_card` | Our own 3–6 sentence synthesis of ONE position, with explicit citations and (optionally) misreadings to resist. **Corpus backbone.** | The only way to get citation-dense, Q&A-shaped, license-clean commentary. Legal: ideas/facts aren't copyrightable; we synthesize in our own words and record provenance. |
| `primary_excerpt` | A natively self-contained unit of a public-domain primary text (one Summa article; one aphorism). | Grounding in the philosopher's own words; citation ID built in. |
| `verified_quote` | A verbatim quote with confirmed wording + exact location; optionally a note on common misattributions. | Directly attacks the fabricated-quotation failure mode. |
| `works_index` | One small doc per philosopher: each major work, date, one sentence on what it argues. | Answers "where is this argued?" even when chunk-level retrieval misses. Cheap, high value. |
| `biography` | Timeline / life facts (CC BY-SA sources fine here). | Keeps dates and life events accurate; not used for interpretive positions. |
| `reference_link` | Metadata + URL only. Never ingested. | SEP/IEP etc. — authority for card-writing; maintainer-facing. |

Target per philosopher (initial): ~30–60 position cards, 1 works index,
~10–20 verified quotes, plus primary excerpts where available.

## Per-philosopher plan

### Aquinas — richest ingestable corpus
- **Ingest:** *Summa Theologiae*, 1920 Fathers of the English Dominican
  Province translation (public domain; CCEL / sacred-texts / isidore.co carry
  it). **Selected articles only** (Five Ways, natural law, virtue, soul,
  essence/existence — not all 3,000+). Chunk = one article. Public-domain
  translations of *De Ente et Essentia* also exist.
- **Cards:** metaphysics (act/potency, esse), natural theology, ethics,
  natural law — written from SEP "Aquinas" + related entries.

### Nietzsche — second-richest
- **Ingest:** Project Gutenberg public-domain translations, chunked by
  aphorism/§: *Thus Spake Zarathustra* (Common), *Beyond Good and Evil*
  (Zimmern), *Genealogy of Morals* (Samuel), *The Antichrist* (Mencken),
  *Twilight of the Idols* (Ludovici), *Joyful Wisdom* / *The Gay Science*
  (Common).
- **Caveat (record in manifest):** these 1900s-era Levy-edition translations
  are dated versus Kaufmann's (which is copyrighted). Fine for grounding and
  citation anchoring; the persona prompt, not the translation, carries voice.
- **Cards:** death of God as diagnosis, ressentiment/genealogy, will to power,
  eternal recurrence, misreadings (nihilist, proto-Nazi, "existentialist").

### Kierkegaard — thin public domain; card-heavy
- **Ingest:** Hollander's 1923 *Selections from the Writings of Kierkegaard*
  (Project Gutenberg #60333; public domain) — Diapsalmata, *Fear and
  Trembling* excerpts, etc. The only meaningful PD English Kierkegaard.
- **Not ingestable:** Hong translations (Princeton, copyrighted);
  Swenson/Lowrie (1936+, still in US copyright). Danish originals are PD but
  unusable for English retrieval.
- **Cards:** stages of existence, the leap, teleological suspension of the
  ethical, subjectivity as truth, pseudonymity (cards must note which
  pseudonym "argues" what — important for honest citations).

### Sartre and Camus — zero ingestable primary text
- **Everything in copyright** (Camus d. 1960, Sartre d. 1980; French life+70;
  English translations separately copyrighted). Manifest entries are
  `reference_link` only.
- **Corpus:** position cards + works index + a small number of short
  verified quotes within fair-use bounds. No full-text ingestion of any kind.
- Cards written from SEP/IEP entries; misreadings to resist include "Camus =
  existentialist" (already in the persona prompt).

## Supporting sources

| Source | License | Use |
|---|---|---|
| Stanford Encyclopedia of Philosophy | Copyrighted | **Link-only.** Primary authority for writing position cards; record the entry + section in each card's `provenance`. |
| Internet Encyclopedia of Philosophy | Copyrighted | Link-only; secondary authority for cards. |
| Wikiquote | CC BY-SA | Ingestable with attribution. Use *sourced* sections only; note disputed/misattributed quotes explicitly. |
| Wikipedia | CC BY-SA | Ingestable with attribution — `biography`/timeline chunks only, not interpretive positions. |
| Rebus Community *Introduction to Philosophy* series | CC BY | Genuinely ingestable but organized by topic, not philosopher. Low priority; a few chapters may serve beginner-level grounding. |
| 1000-Word Philosophy | Authors retain copyright | Link-only. |
| Old PD histories of philosophy (Windelband etc.) | Public domain | Skip — dated scholarship, low citation density. |

## Metadata schema (per source, in the manifest)

`id`, `philosophers[]`, `title`, `author`, `translator`, `translationDate`,
`originalDate`, `sourceType` (taxonomy above), `license`, `licenseNote`,
`ingest` (`planned` | `curated` | `link_only`), `url`, `chunking`, `notes`.

## Position-card format (reference)

```json
{
  "type": "position_card",
  "philosopher": "nietzsche",
  "claim": "The 'death of God' is a cultural diagnosis, not an argument for atheism.",
  "explanation": "3–6 sentences, our own words.",
  "citations": ["The Gay Science §125 (the madman)", "The Gay Science §343"],
  "misreadings": "Often misread as celebration; Nietzsche treats it as crisis.",
  "provenance": ["SEP: Friedrich Nietzsche, §4"]
}
```

Cards may be drafted with Claude's help but are **human-verified against the
provenance source before entering the corpus.**

## Curation workflow (per philosopher)

1. Read the SEP entry (+ IEP where useful); list the 30–60 positions worth a card.
2. Draft cards; verify each against provenance; fill citations from the works
   themselves where possible.
3. Write the works index.
4. Pull verified quotes (Wikiquote sourced sections / ingested primary text).
5. For Aquinas/Nietzsche: select the primary units to ingest and record them
   in the manifest before fetching anything.
6. Add everything to `source_manifest.json`; only then fetch/commit text.
