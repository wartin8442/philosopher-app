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
