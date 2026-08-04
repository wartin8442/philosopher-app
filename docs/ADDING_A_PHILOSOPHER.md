# Adding a philosopher

Adding a philosopher is a one-time curation task (~2–3 hours for a flagship,
less for a supporting figure). A complete addition touches:

- `src/lib/philosophers.ts` for the conversation persona and grounding sources
- `src/lib/profiles.ts` for the profile introduction and major works
- `src/lib/starters.ts` for level-specific starters and a debate lens
- `public/philosophers/` for the portrait

## 1. Identify reliable sources

- **Stanford Encyclopedia of Philosophy** (free, high quality) — your backbone.
- 1–2 scholarly overviews or journal articles (Google Scholar).
- Primary text excerpts where legally available and genuinely useful.

## 2. Read and synthesize

Extract, from the sources:

- Core philosophical positions (in your own words).
- Key texts and dates.
- Characteristic reasoning patterns and vocabulary.
- Common **misreadings** to avoid (write the prompt to resist them explicitly).
- The philosopher's tone/manner in conversation and debate.

## 3. Write the conversation profile

Add an entry to the `PHILOSOPHERS` array:

```ts
{
  id: "hume",                       // url-safe, unique
  name: "David Hume",
  dates: "1711–1776",
  blurb: "One or two sentences for the profile card.",
  voiceNote: "Genial, skeptical, empirical",  // short tone phrase
  accent: "#7a9e7e",                // theme color (hex)
  initials: "DH",
  // elevenLabsVoiceId: "…",        // optional; else a default voice is used
  systemPrompt: `You are David Hume...

Character and manner:
- ...

Core positions you may draw on:
- ...

(Extend from principles when a question exceeds your works, and say so. Do not
fabricate citations.)`,
  sources: [
    { label: "An Enquiry Concerning Human Understanding (1748)", text: "1–3 sentence accurate paraphrase or excerpt." },
    // 3–5 excerpts total
  ],
}
```

> **After adding or editing any `sources` entry, run `npm run
> build:embeddings`.** Retrieval scores excerpts against vectors precomputed
> into `src/data/source-embeddings.json`; until you rebuild, the new
> philosopher's retrieval silently falls back to keyword matching (you'll see
> a console warning). Production builds regenerate them automatically.

### System prompt guidelines

- Keep it focused (roughly under ~2000 tokens). Substance and voice only — the
  shared preamble in `src/lib/providers/llm.ts` already supplies the in-character
  and accuracy rules and the answer-level instruction, so don't repeat them.
- Write positions as things the philosopher *holds*, in the first person voice
  the model should adopt.
- Name the **misreadings** to avoid explicitly (e.g. Nietzsche ≠ nihilist/Nazi;
  Camus ≠ existentialist).
- Describe debate manner (does the philosopher press, concede, use irony?).

### Source excerpts

- 3–5 short, accurate excerpts or paraphrases with a clear citation `label`.
- These feed the lightweight retrieval grounding (`src/lib/retrieval.ts`); they
  are never read aloud. Prefer paraphrase over verbatim quotation unless you are
  certain of the wording.

## 4. Add the public profile and starters

Add a matching entry to `PROFILES` in `src/lib/profiles.ts`, three questions
per level in `CONVERSATION_STARTERS`, and one `DEBATE_LENSES` entry in
`src/lib/starters.ts`. The profile and conversation IDs must exactly match.
Place the portrait under `public/philosophers/` and set `image` on the
conversation profile.

## 5. Voice (optional)

If using ElevenLabs, set `elevenLabsVoiceId` to a voice that fits, or add the
philosopher to `DEFAULT_ELEVENLABS_VOICES` in `src/lib/providers/tts.ts`. With
no key, the browser voice is used automatically.

## 6. Test

Run the app, open a conversation, and spot-check:

- Does the philosopher stay in character and in the first person?
- Are positions accurate against your sources? Try a few edge/interpretive
  questions and confirm the model flags interpretations and extensions.
- Try a duel against an existing philosopher to check they engage each other's
  actual statements.

Run `npx tsc --noEmit` and `npm test`, then rebuild source vectors with
`npm run build:embeddings`.

## 7. Release them

A philosopher is invisible until their id is added to `DEMO_ROSTER_IDS` in
`src/lib/demoRoster.ts`. Until then the carousel, landing rail, and duel picker
skip them, and their profile, conversation, and API routes return 404. Once the
id is on the list they appear on every surface automatically.
