# Stress-test summary — baseline run (2026-07-18/19)

Five per-philosopher agents (spec: `docs/stress_test_agents.md`) interrogated
the live app — 184 single-shot probes, `claude-opus-4-8`, condition
`baseline` (RAG corpus NOT wired; retrieval = the hard-coded `sources`
arrays in `src/lib/philosophers.ts`). Grading is Claude-verified, advisory;
official numbers come from the stage-4 harness re-running the frozen bank
(`data/rag/eval/questions.json`, 184 questions / 444 checks).

Severity weights used for the headline score: critical 5, major 2, minor 1.
Headline metrics use corpus-blind questions only (173 of 184); corpus-aware
questions are shown in the ALL columns and the dashboard.

## Scoreboard (checks passed/total, corpus-blind)

| Philosopher | Critical | Major | Minor | Weighted score | ALL incl. corpus-aware |
|---|---|---|---|---|---|
| Aquinas | 23/23 | 48/51 | 11/18 | **94.5%** | same (no corpus-aware) |
| Nietzsche | 23/24 | 32/34 | 13/18 | **93.2%** | c 25/26, m 33/36, n 13/18 — 92.7% |
| Kierkegaard | 19/19 | 54/56 | 11/13 | **97.3%** | same (no corpus-aware) |
| Sartre | 15/15 | 56/57 | 15/16 | **98.5%** | c 16/16, m 58/60, n 15/16 — 97.7% |
| Camus | 23/23 | 38/43 | 17/20 | **94.1%** | c 24/24, m 42/47, n 18/21 — 94.5% |
| **Total (all)** | **107/108** | **235/250** | **68/86** | **95.3% (weighted, all questions)** | flat pass rate 410/444 = 92.3% |

Per-category pass/fail per philosopher is in each `*/report.md` scoreboard
and rendered in `dashboard.html`.

## The ten most serious confirmed failures

1. **[CRITICAL] nz-19 — swallowed misattribution + fabricated citation.**
   Asked to confirm "They muddy the water, to make it seem deep":
   > "Yes, that line is mine … You will find it in Thus Spoke Zarathustra,
   > in the first part, in the speech titled "On the Rabble""
   Wrong three times over: the wording corresponds to no documented passage
   (Wikiquote: Misattributed), the genuine muddy-water analogue is Z III
   "On the Olive Mount", and "The Rabble" is in Part II. The corpus's own
   misattribution entry documents exactly this quote — retrieval never
   surfaced it. The only critical failure in 108 critical checks.

2. **[major] sartre-q35 — genuine quote denied.** The documented 1953
   Libération line ("fascism is not defined by the number of its victims")
   was disowned: "that precise formulation does not ring true as something
   I wrote". Over-skepticism is the mirror image of nz-19 — both are
   attribution errors a retrieved quote bank would prevent. (Quote-bank
   entry itself still pending human verification.)

3. **[major] cam-25 — wrong definition in The Rebel.** The nihilist defined
   as "the man who believes that everything is permitted", displacing The
   Rebel's actual definition (not one who believes in nothing, but one who
   does not believe in what exists).

4. **[major] cam-30 — history flattened.** The reply denied the documented
   contrast between the historical Kaliayev (practical-political refusal)
   and the play's conscientious refusal: "the difference is one of emphasis
   and meaning more than fact".

5. **[major] cam-29 — signature test dropped.** The Rebel's two concrete
   signs of a rebellion staying true include abolishing the death penalty;
   the reply substituted a vaguer treatment-of-the-vanquished test.

6. **[major] cam-36 — a period erased.** Camus's actual 1939–40 pacifism
   (Le Soir républicain) never appears; the reply denies he was ever a
   pacifist as if the early position had not existed.

7. **[major] kg-25 — persona prompt contamination.** "When I say truth is
   subjectivity" — the Postscript slogan spoken first-person, Johannes
   Climacus and the Postscript never credited. Root cause traced to the
   persona systemPrompt asserting the slogan unattributed.

8. **[major] kg-05 — the trigger unnamed.** The church-attack account never
   names Martensen, whose "witness to the truth" eulogy of Mynster was the
   trigger; only a passive "was praised after his death".

9. **[major] aq-14 — the settling fact omitted.** The sewer/prostitution
   quote was rightly disclaimed, but the fact that settles the attribution
   (Ptolemy of Lucca's Book 4 continuation of De Regimine Principum) never
   appears — and it sits in the on-disk quote bank.

10. **[major] aq-08 / sartre-q02 / nz-01 (same failure shape) — right
    content, unnamed work.** De unitate intellectus described but never
    titled; the café-waiter walk-through never names Being and Nothingness;
    "God is dead" explained without The Gay Science.

## Recurring patterns across philosophers (and what each is)

1. **The corpus is inert — a retrieval/wiring problem, not knowledge.**
   In all 184 probes, `retrieved_sources` contained only the four
   hard-coded persona snippets from `src/lib/philosophers.ts`; at least a
   dozen probes retrieved nothing at all. Every pass in this run is
   parametric base-model knowledge. This is the expected pre-wiring state,
   now quantified: the cards/quote entries that would have prevented nz-19,
   aq-14, sartre-q35, and kg-25 all exist on disk and were never surfaced.

2. **Omitted citations are the dominant failure class — retrieval + prompt.**
   26 of 34 failed checks are omissions (missing work title, section
   number, date, or name), not wrong assertions. Partly a persona-prompt
   issue (nothing asks the personas to cite loci), mostly what works-index/
   card retrieval is designed to supply. Condition C vs B in the eval will
   allocate this.

3. **First-hop traps pass, second-hop scholarship fails — knowledge depth,
   cards fix it.** The famous trap is almost always caught (54 of 55
   trap-attribution/confusion questions safe), but the scholarly detail
   behind the trap goes missing: Ptolemy of Lucca, Martensen, Sartre's 1965
   "hell is other people" clarification. This is exactly the layer position
   cards encode.

4. **Persona prompts are themselves a contamination source — prompt
   problem.** Kierkegaard's systemPrompt asserts "truth is subjectivity"
   unattributed (caused kg-25) and the blurb uses "leap of faith", which
   the quote bank itself flags as a later coinage. The model resisted the
   blurb's phrasing but obeyed the systemPrompt's. Audit all five persona
   prompts against the trap material from this run.

5. **Content errors cluster in depth questions about mid-career works —
   knowledge gaps, cards fix it.** All four Camus content-level majors are
   The Rebel / The Just Assassins specifics; no ingested primary texts
   exist for any philosopher except partial Nietzsche.

## PASS-plus behaviors the eval harness must protect

- Sartre/kierkegaard/camus agents each logged cases where the system
  out-performed the corpus or SEP itself: *Works of Love* correctly called
  "deliberations" against the works index's own mislabel (kg-30); The
  Stranger's ending handled more precisely than SEP's summary (cam-35);
  "leap of faith" resisted despite the contaminated persona blurb (kg-15).
- Consistent self-flagging of paraphrases when asked for quotes, and honest
  refusal to invent article numbers (aq: "to fabricate a precise article…
  would be to sin against the truth").

## Cost side (baseline)

184 probes: latency mean 8.6s, median 8.3s, p95 11.6s, max 14.2s; 211k
reply characters total. One ~25-minute window of provider "Generation
failed" errors (2026-07-19 13:44–14:09Z) survived by retries.

## Corrections queue

- One draft card asserts a wrong position: "Theological Virtues Are Gifts
  of Grace" implies cardinal virtues are acquired-only, contra ST I-II
  q.63 a.3 (aquinas agent, confirmed vs. primary text).
- Works-index error: *Works of Love* labeled "discourse" (they are
  deliberations).
- 42 draft card proposals across the five `*/card-proposals.md` files await
  human review; none were added to `cards/drafts/`.
- One SUSPECTED (unconfirmed) items list lives in each report; notably a
  possible fabricated Plague character "Paty" (cam-31) and an unverifiable
  first-person expulsion claim (nz-26).
