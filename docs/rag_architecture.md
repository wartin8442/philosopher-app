# RAG Architecture (partially implemented)

> **Status: planning document, first layer now shipped.** The app now runs
> embedding-based hybrid retrieval (local all-MiniLM vectors + keyword
> overlap) over each philosopher's curated `sources` array, with prefetch and
> caching — see [`ARCHITECTURE.md`](ARCHITECTURE.md) for what is live and
> [`STATUS.md`](STATUS.md) for progress. This document specifies the deeper
> RAG layer (larger per-philosopher corpora, chunking, citations) that the
> current implementation is designed to grow into.

## Design decision: hybrid grounding, not strict RAG

Evaluated and settled (July 2026):

- **Not model-only.** Risks: fabricated/mangled quotations, interpretive
  flattening (pop readings like "Nietzsche the nihilist"), no verifiable
  citations, and poor scaling to lesser-known philosophers.
- **Not strict RAG-only.** Wrong tool for roleplay: conversation quality
  collapses into stitched summaries, retrieval misses become answer failures,
  latency hurts a voice-first app, and extrapolation questions ("Aquinas, what
  would you say about AI?") have no source document by definition.
- **Hybrid (chosen).** Claude generates from the persona prompt + native
  knowledge by default. Retrieval runs cheaply on every user turn but injects
  grounding **only above a relevance threshold** (the common case is zero
  injections). Retrieved material enters the system prompt as grounding notes
  that *influence* the answer without *constraining* it. The model may use
  broader general knowledge when sources are incomplete, but must flag
  epistemic status (see below).

## Epistemic status: three tiers

The shared preamble in `src/lib/providers/llm.ts` already enforces the
distinction in spoken replies:

1. **"I argued this"** — position stated in the philosopher's works (grounding
   notes make this checkable, and let the reply name the work).
2. **"This is a common interpretation / how I would read my own position"** —
   interpretive claims are flagged as such.
3. **"I did not face this directly, but from my principles..."** — reasonable
   extrapolation, explicitly framed.

The model must never present tier 2 or 3 as tier 1, and must never pretend the
philosopher said something the sources don't support.

## Citation behavior (planned prompt addition — not yet applied)

Citations are **not volunteered** in conversation. When the user asks "where is
this argued?", the reply names the work — and the section if it appears in the
grounding notes. If unsure of the exact location, name the work and say the
section is uncertain rather than guessing. (Wrong-section-number is the most
likely citation error; graceful degradation is both honest and in character.)

Channels:

- **Spoken:** natural-language references only ("as I wrote in the
  Genealogy..."). Citations are never read aloud (existing rule).
- **Visual:** the existing "Show sources" panel displays the grounding used for
  a reply, with citation labels. Planned upgrade: distinguish "grounded by N
  sources" from "answered from general knowledge."
- **Metadata:** `/api/chat` already returns a `sources` array; with the real
  corpus each item gains full metadata (work, section, translator, license,
  URL) from `data/rag/source_manifest.json`.

## Retrieval unit: explanation-shaped chunks

The unit that retrieves well is a **self-contained explanation of one idea**,
not "secondary rather than primary" per se. Consequences:

- **Position cards** (our own citation-anchored synthesis; see
  [`source_strategy.md`](source_strategy.md)) are the corpus backbone — they
  are Q&A-shaped by construction.
- **Primary texts are ingested only where their native structure already
  provides the shape:**
  - Aquinas: one *Summa* article per chunk (question → objections → sed
    contra → answer → replies; citation ID built in: Part, Question, Article).
  - Nietzsche: one numbered aphorism/section per chunk (citation ID built in:
    work + § number).
- Continuous-prose authors (Kierkegaard, Sartre, Camus) lean on position cards
  and short verified excerpts instead.

## Planned pipeline (build order)

Each stage is independently shippable; stop/reassess after each.

1. **Corpus curation (no code).** Write position cards, works indexes, and
   verified-quotes files per `source_strategy.md`; record everything in
   `source_manifest.json`. Highest accuracy-per-hour of any stage.
2. **Ingestion.** Fetch/clean the license-clean primary texts; chunk by native
   structural unit (article / aphorism) with citation anchors; store as plain
   files under `data/rag/` (layout in `data/rag/README.md`).
3. **Retrieval upgrade.** Replace the body of `retrieveSources()` in
   `src/lib/retrieval.ts` with embedding-based nearest-neighbour search over
   the corpus. The interface was designed for this swap; **call sites do not
   change.** Keep the threshold-gating behavior: score every turn, inject only
   clearly relevant chunks (top-k ≤ 2–3, above a similarity floor).
   - Corpus scale (thousands of chunks, not millions) needs **no vector
     database** — precomputed embeddings loaded in-process (or SQLite) is
     sufficient. Do not add infra until scale demands it.
4. **Eval harness.** A small fixed set of known-answer and known-trap questions
   per philosopher (e.g. "is the madman passage in *Zarathustra* or *The Gay
   Science*?"; "was Camus an existentialist?") run before/after each corpus or
   retrieval change, so accuracy claims are measured, not vibes.
5. **Later / optional:** agentic retrieval (a `search_sources` tool Claude
   calls when it decides it needs grounding) for a text-only "study mode" —
   more precise but adds a round-trip; wrong for voice-first latency today.

## Non-goals

- No retrieval on every token / no forced injection every turn.
- No external vector DB, no new dependencies, until stage 3 justifies them.
- No change to duel orchestration (duels can adopt grounding later using the
  same `buildSystemPrompt` path).
- Retrieval must never override the persona voice; grounding notes are advisory
  context, and are never read aloud.
