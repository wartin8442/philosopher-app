# Photo Reading Companion (planned feature — not yet built)

> **Status: planning document.** Depends on primary-text ingestion from
> [`source_strategy.md`](source_strategy.md) — at minimum one ingested work.
> Nothing here is implemented.

## The feature

A user reading along with a philosopher — physical book or ebook — uploads a
photo of the page (or a screenshot) and the philosopher walks them through the
passage line by line, **without the user having to explain where they are**
("this is chapter X, section Y of…"). If it's one of the philosopher's major
works, the philosopher instantly knows the passage.

## Design decision: lookup key, not input text

There are two ways to build this, and we are explicitly building **Version B**:

- **Version A (rejected):** image → vision model → persona answer. This is a
  thin wrapper around what ChatGPT/Claude/Gemini already do for free, and it
  inherits raw OCR fragility: a silently misread word (a dropped "not") gets a
  confident gloss of text that isn't on the page — the worst failure mode for
  an app whose core promise is accuracy.
- **Version B (the moat):** the photo is only ever a **lookup key** into the
  canonical texts stored in our RAG corpus. The model glosses *our verified
  text*, never the OCR output.

## Pipeline

1. **Upload** — photo of a physical page or ebook screenshot.
2. **Cheap OCR** — a small/cheap model (or dedicated OCR) extracts the text.
   Imperfect is fine; the text is never shown to the persona model as content.
3. **Fuzzy match against ingested `primary_excerpt` chunks** — word-overlap /
   embedding similarity, reusing the existing hybrid retrieval machinery.
   Matching survives OCR errors and even translation differences, because
   distinctive content words ("eternal recurrence", "hourglass of existence")
   and visible section numbers carry across translations.
4. **On match:** we know the exact passage and have our own clean copy. The
   philosopher glosses the **canonical chunk**, with its citation ID built in
   ("Ah, §36 — this is where I wager that the world seen from inside is will
   to power…"). OCR errors cannot corrupt the explanation — they only make the
   search slightly fuzzier.
5. **Confirmation glance:** echo the matched passage to the user ("Looks like
   you're at *Beyond Good and Evil* §36 — right?"). One-second check for a
   user with the book open.
6. **No match** (Sartre/Camus — copyrighted, link-only forever; or a work not
   yet ingested): fall back to glossing the OCR text directly, **framed as
   inference**, grounded by position cards and the works index ("This reads
   like the absurd-hero discussion in *The Myth of Sisyphus*").

### Two-tier honesty rule

The UI must distinguish **matched** (verified against canonical text —
Aquinas, Nietzsche, other ingested works) from **inferred** (OCR + educated
guess — Sartre, Camus). One line of UI copy; a lot of trust protection.
Copyright never blocked *citations* for Sartre/Camus — position cards, works
index, and fair-use verified quotes all still apply — it only removes the
verification layer, because we cannot store their full texts.

### Reading-session continuity

Once a photo matches §36, bias the next match toward nearby passages (§37…).
Cheap heuristic; lets the philosopher say "still in the chapter on the free
spirit, I see" — makes the feature feel like genuinely reading along.

## Why one design solves four problems

The lookup-key architecture simultaneously:

1. **Kills the reference-typing friction** (the point of the feature).
2. **Fixes OCR fragility** — misreads are corrected by alignment, not glossed.
3. **Supplies citations and verified quotes for free** — they live on the chunk.
4. **Blocks image-borne prompt injection** on the matched path — photo content
   is never treated as instructions, only as a search query. Raw OCR text
   reaches the prompt only on the unmatched/inferred path, so injection
   hardening concentrates there.

## Cost / scope notes

- **Demo-first:** current goal is a great demo, not public launch. Vision/OCR
  cost is out of scope for now; if this ships publicly, revisit (candidate for
  an upgraded plan tier). The security work in `SECURITY.md` (input caps,
  injection hardening, rate limits) is text-shaped and must be extended before
  any public exposure: image size/count caps, upload non-persistence, EXIF
  stripping, vision-aware rate budget.
- **Cheap path preferred:** OCR with a small model, text-only matching,
  frontier model sees only the matched canonical text. Roughly text-request
  cost per upload; the image never needs to reach the expensive model.
- **Minimum gate:** does NOT require the full corpus — one ingested work
  (e.g. *Beyond Good and Evil* aphorisms, or the Five Ways Summa articles) is
  enough to build and demo the matched path end-to-end. Corpus ingestion still
  comes first; this feature is built on top of it, not instead of it.
