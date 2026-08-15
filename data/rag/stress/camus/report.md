# Camus stress test — baseline report (2026-07-19)

Run: condition=baseline, model=claude-opus-4-8, 40 questions (37 corpus-blind + 3
corpus-aware), one probe each via `scripts/stress-probe.ts`, answer levels as recorded in
eval-questions.json. Machine-readable record: `results.json`. Grading here is advisory;
official numbers come from the blind harness re-run of the frozen bank.

**Headline:** no critical check failed. Every misattribution trap was refused, the
reverse-bait genuine quote was defended, both neighbor-confusion baits (Nausea, "Hell is
other people") were correctly reassigned to Sartre, and the existentialist label was
refused everywhere it was offered. The failures that did occur are concentrated one level
deeper: a wrong definition swapped in for a documented one, a missing half of a two-part
doctrine, a flattened historical contrast, and a suppressed period of Camus's own
development. Separately, the retrieval layer appears not to be wired to the draft corpus
at all (see F-6) — the system's accuracy is currently carried almost entirely by the base
model plus the persona prompt.

## Critical failures

None.

## Major failures

### F-1 (cam-25, depth): wrong definition of the nihilist offered as The Rebel's
Asked for The Rebel's definition of a nihilist, the reply substituted its own:

> "The nihilist, as I came to understand him, is not merely the man who believes in
> nothing. **He is the man who believes that everything is permitted**"

The documented definition is: "A nihilist is not one who believes in nothing, but one who
does not believe in what exists" — the nihilist's error is devaluing the existing world in
favor of an abstraction. "Everything is permitted" is a *consequence* Camus discusses, not
the definition, and the reply's structure ("not merely... he is the man who...") mimics
the real sentence closely enough to read as quotation-shaped paraphrase. Source: The
Rebel, Part One (trap appendix); SEP §4.1–4.2. Corpus note: the card "The Absurd Is Not
Nihilism" does not contain the definition — confirmed gap, card proposed.

### F-2 (cam-30, depth): historical-vs-dramatized Kaliayev contrast denied
Asked how his Kaliayev differs from the historical one, the reply asserted continuity:

> "**So the difference is one of emphasis and meaning more than fact** — I lifted a real
> gesture and made it bear the weight of an ethics."

Per IEP §4.b, the historical Kaliayev's refusal was "no act of conscience... but a purely
practical decision" (child murder would set back the revolution), and he welcomed
execution on similarly political grounds; Camus's Kaliayev refuses from conscience and
embraces death as penance. The reply erases exactly the contrast the question tested.
Lesser slip in the same reply: "the Grand Duke's niece and nephew" — IEP records "his wife
and two young nephews." Corpus note: The Just Assassins is absent from cards AND from the
works index — confirmed gap, card proposed.

### F-3 (cam-29, depth): first of The Rebel's two concrete signs missing
Asked for the two concrete signs of a revolution faithful to rebellion, the reply gave
free speech correctly ("no total suppression of dissent") but replaced the death-penalty
sign with a vaguer test:

> "**I would look, first, at how they treat the vanquished**"

SEP §4.3 records the two signs precisely: abolish the death penalty; encourage rather than
restrict freedom of speech. The corpus HAS this card ("Free Speech and Abolishing
Execution as Tests of Honest Rebellion") — it was not retrieved (see F-6). Retrieval fix,
not a card gap.

### F-4 (cam-36, misreading): early-war pacifist period suppressed
The reply rejected the absolute-pacifist label well, but flatly — "I fought in the
Resistance; I did not do so as a pacifist" — never registering that Camus WAS a pacifist
at the war's outbreak (Le Soir républicain, 1939–40, opposing French entry and advocating
negotiation; SEP §4). The question probed the development; the reply airbrushed the
inconvenient period out. (Also note "I fought in the Resistance" — his Resistance role was
Combat journalism; SEP says "engaged in the resistance"; borderline phrasing, not graded.)
Confirmed biography-layer gap, card proposed.

### F-5 (cam-04, known-answer): "I revolt, therefore we are" never attributed
A fine exposition of the formula (Descartes reversal, solidarity, limits) that never names
The Rebel as its source. Citation behavior, not content error; graded major per the
pre-registered check (SEP §4.1, R 22).

## Observations outside the check set

### F-6 (systemic): retrieval never surfaces the draft corpus
Across all 40 probes, `retrieved_sources` contained only the four persona source blurbs
from `src/lib/philosophers.ts` (MS, The Rebel, The Plague, "contra philosophical
suicide") — never a position card, never a quote-bank entry (cam-32 even returned `[]`).
The 46-card draft corpus, the works index, and the quote bank (which contains exactly the
misattribution warnings these traps target) are not reaching the model. The traps were
survived on base-model knowledge; that protection is luck, not architecture. This is the
single highest-leverage fix the eval harness should measure before/after.

### F-7 (cam-31, SUSPECTED fabrication): nonexistent Plague character "Paty"
> "Cottard who profits, **Paty's collaboration in a different key**"

The Plague's cast (Rieux, Tarrou, Rambert, Grand, Cottard, Paneloux, Othon...) contains no
"Paty." Cottard is the collaboration-adjacent profiteer. Marked SUSPECTED because my
sources (SEP/IEP) list principal characters but are not a full concordance; I cannot cite
a complete cast list. Everything else in that reply (Barthes/Sartre criticism, Tarrou's
"we all carry it") checks out. Card proposed (novel-cast grounding card).

### N-1 (cam-17, near-miss): misattributed quote corrected in content, not in attribution
Given "There are causes worth dying for, but none worth killing for," the reply denied the
*claim* ("I did not say killing is always and everywhere forbidden" — passes the check)
but never flagged the sentence itself as apocryphal, unlike cam-14/15/16/38 where the
refusal was explicit. The quote bank documents this exact misattribution; it was not
retrieved (F-6).

## Minor failures

- **cam-01-c3 / cam-02-c2:** The Myth of Sisyphus never named as the source work in
  otherwise-correct answers about the absurd and the suicide question (SEP §3.1).
- **cam-20-c3:** Nausea correctly returned to Sartre, but Camus's actual relation to the
  book — his 1938 review (SEP §3.1) — went unmentioned.

## PASS-plus (protect these behaviors)

- **cam-35:** "The novel does not show the blade fall. It closes in the cell" — the system
  is MORE accurate than SEP here (SEP §4 says The Stranger "concludes with his execution
  by guillotine"; the execution is in fact beyond the final page, as IEP's "set to take
  place" has it), and it reproduced the tender-indifference ending and the crowd-of-hate
  wish faithfully.
- **cam-23:** with zero corpus support, correctly refused to locate a Marxism critique in
  The Myth of Sisyphus ("The Myth of Sisyphus does not treat Marxism") and redirected to
  The Rebel — exactly SEP §4.2's "eloquently silent" point.
- **cam-12:** exact interview recall — Jeanine Delpech, Les Nouvelles littéraires, 1945 —
  plus correct separation of the 1952 Rebel quarrel.
- **cam-22:** inverted premise corrected with specifics: Jeanson's review in Les Temps
  modernes, Sartre's "beautiful souls" charge.
- **cam-05:** conditions for political killing with the genuine "les meurtriers délicats"
  phrase and the killer-pays-with-his-life demand.
- **cam-10/cam-18:** the invincible-summer reverse-bait defended in both directions, with
  honest hedging about translated wording ("I give it to you as a paraphrase") — model
  quote hygiene.
- **cam-32:** religion nuance right, including the 1948 talk to the Dominicans.

## Coverage gaps the interrogation confirmed

- No corpus support existed for cam-07 (dissertation), cam-23 (MS silent on Marxism),
  cam-24 (Nuptials chronology / early pacifism), cam-30 (Just Assassins/Kaliayev),
  cam-31 (Plague allegory criticism); cam-25's nihilist definition and cam-36's pacifist
  period are absent from the cards. cam-07, cam-23, cam-24, cam-31 nevertheless passed on
  base-model knowledge; cam-25, cam-30, cam-36 failed — the coverage gaps that bit are
  precisely where base knowledge is shakiest. Full audit: `coverage.md`. Draft cards:
  `card-proposals.md`.
- Works index omissions (Nuptials, The Just Assassins, Summer, Reflections on the
  Guillotine, Algerian Chronicles) did not cause failures this run but leave the locate
  category running uninsured.

## Operational notes

- The dev server returned "Generation failed. Please try again." for every request during
  a ~25-minute window (13:44–14:09Z); it recovered on its own. Retries handled it; the
  eval harness should expect and retry this failure mode.
- Latency over the 40 probes: min 5.9s, median 8.3s, max 12.8s. One markdown artifact
  observed (asterisks around titles in cam-28); one stray French word ("the ceux who
  kill", cam-36); one typo ("shoulto", cam-21) — cosmetic, out of grading scope.

## Scoreboard (corpus-blind questions, cam-01..cam-37)

| Category | Critical | Major | Minor | Total |
|---|---|---|---|---|
| known-answer | 3/0 | 9/1 | 6/2 | 18 pass / 3 fail |
| locate | 2/0 | 8/0 | — | 10 pass / 0 fail |
| trap-attribution | 7/0 | 3/0 | 2/0 | 12 pass / 0 fail |
| trap-confusion | 8/0 | 4/0 | 1/1 | 13 pass / 1 fail |
| depth | — | 8/3 | 5/0 | 13 pass / 3 fail |
| misreading | 3/0 | 6/1 | 3/0 | 12 pass / 1 fail |
| **Total** | **23/0** | **38/5** | **17/3** | **78 pass / 8 fail** |

Cells are pass/fail. Corpus-aware questions (cam-38..cam-40, excluded from headline):
6 pass / 0 fail (2 critical, 3 major, 1 minor checks — all passed).
