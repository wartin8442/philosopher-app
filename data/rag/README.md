# data/rag — planned RAG corpus

> **Not wired into the app.** The app currently uses lightweight hybrid
> retrieval over the `sources` arrays in `src/lib/philosophers.ts`: local
> embeddings plus keyword overlap, with keyword-only fallback while the
> embedder is cold or vectors are stale. This directory is scaffolding for the
> deepened corpus described in
> [`docs/rag_architecture.md`](../../docs/rag_architecture.md) and
> [`docs/source_strategy.md`](../../docs/source_strategy.md).

## What's here now

- `source_manifest.json` — every planned source, with license status and
  chunking plan. **This is the gate:** no text is fetched or committed unless
  its manifest entry says `ingest: "planned"` or `"curated"` with a clean
  license. `link_only` entries (SEP, IEP, 1000-Word Philosophy) are never
  ingested.

## Planned layout (created as stages land — do not pre-create)

```
data/rag/
  source_manifest.json          this manifest
  cards/<philosopher>.json      position cards (curated, human-verified)
  indexes/<philosopher>.md      works index per philosopher
  quotes/<philosopher>.json     verified quotes + misattribution warnings
  texts/<source-id>/            chunked public-domain primary texts
```

## Rules

1. **License check before fetch.** Verify the specific edition/translation in
   the manifest before downloading anything. When in doubt: link-only.
2. **No large raw dumps.** Only the selected, chunked units enter the repo
   (e.g. chosen Summa articles, not all 3,000+).
3. **Every chunk carries citations** (work + section). Chunks without
   citations don't ship.
4. **Cards are human-verified** against their `provenance` source before
   entering the corpus.
5. The app adopts this corpus only in the retrieval-upgrade stage
   (`src/lib/retrieval.ts` swap) — see the build order in
   `docs/rag_architecture.md`. Until then nothing in the app reads this
   directory.
