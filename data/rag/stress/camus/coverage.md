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
