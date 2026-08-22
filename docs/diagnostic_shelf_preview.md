# Diagnostic shelf preview — draft tags and the ten computed shelves

**Status: adopted. The matrix below is now transcribed into
`src/lib/philosophers.ts`** (`approach` + sparse signed `topics` tags), the
selection rules into `src/lib/routing.ts`, and the "Adopted shelves" table is
asserted group-for-group by `src/lib/diagnosticTags.test.ts` — so this document
and the code cannot drift apart silently. Edit a tag here and in
`philosophers.ts` together. This document does step 2 of the agreed resequencing:
draft the topic tags from the screen-2 draft's Populates tables and rulings,
then compute every deterministic shelf the diagnostic can produce, so the
actual output can be inspected — and the copy authored against it — before any
routing code exists.

Provenance: tag values marked **†** are proposals or open rulings (listed at
the bottom); everything else transcribes a judgment already made in
[`screen2_split_questions_draft.md`](screen2_split_questions_draft.md)
(Populates tables, route annotations, and dated rulings). Computation script:
session scratchpad `shelves.mjs`; selection rules as specified in
[`diagnostic_routing_design.md`](diagnostic_routing_design.md) v6 — pool =
tag ≥ 2, rank by tag then declaration order, fill four slots under the
two-per-approach cap.

**Key structural fact the enumeration makes visible:** per topic, the
deterministic shelf content is *identical for every user* — the tally only
decides which group gets which label, and the bounded rerank can shuffle
within eligibility. So the whole deterministic output space is **ten pairs of
groups**, all shown below. This is why copy can be authored now.

---

## Draft tag matrix

Format: `tag·pole`. Blank = tag ≤ 1 (out of pool). **†** = flagged proposal
or pending ruling. **^g** = ruled, with a mandatory copy guard (rulings log).
~~Struck~~ = withdrawn by a later ruling; not carried into code.

| | worth | right | suffer | self | free | rules | god | real | know | others |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aquinas | | 3·found | 2·refr | 2·core | | 2·cons | 3·div | 2·beh | | |
| nietzsche | 3·more | 3·made | 2·face | 2·noco | 2·makes | 2·cond | 3·none | 2·noth | 2·persp | 2·cost |
| kierkegaard | | | 2·face | 3·core | 3·makes | | 3·div | | | 2·cost |
| sartre | 2·more | 2·made | 2·face | 3·noco | 3·makes | | 2·none | | | 2·cost |
| camus | 2·enough† | 2·made | 3·face | | | | 3·none | | | |
| hume | | 2·found† | 2·face | 3·noco | 2·made | 2·cons | 2·none | 2·noth | 3·persp | 2·compl |
| plato | 2·more | 2·found | 2·refr | 2·core | | 2·cons | 2·div | 3·beh | 3·obj | 2·compl |
| aristotle | 2·more† | 3·found | | 2·core | | | | 2·noth | 2·obj | 3·compl |
| epicurus | 3·enough | 2·made | 3·refr | | 2·makes | | | 2·beh | | 2·compl |
| marcus-aurelius | 3·enough | | 3·refr | | 2·makes | | | | | 2·cost |
| augustine | | 2·found | 2·refr | 3·core | 2·made | | 3·div | 2·beh | 2·obj | 2·compl |
| spinoza | 2·enough | | 2·refr | | 3·made | | 2·none^g | 3·beh | 2·obj | |
| girard | | | | | 2·made | 2·cond | 2·div | 2·beh | | 3·cost |
| beauvoir | 2·more | | 2·face | 2·noco | | 2·cond | | | 2·persp | 3·cost |
| foucault | | 2·made | | 3·noco | 2·made | 3·cond | | 2·beh | 2·persp | 2·cost |
| descartes | | | | 3·core | | | 3·div | 2·beh | 3·obj | |
| locke | | | | 3·noco | 2·makes | 3·cons | | | 2·obj | |
| kant | | 3·found | | | 3·makes | 2·cons | | ~~2·beh~~ | 2·obj | |
| hegel | 2·more | | | 2·noco | | 3·cons | | | 2·persp | 3·compl |
| mill | 2·more | 3·found | | | | 3·cons | | | | 2·cost |
| marx | 2·more | | | 2·noco† | 3·made | 3·cond | | 2·beh | | |
| heidegger | | | 3·face | 2·noco | 2·made | 3·cond | | 2·noth | | 2·cost |
| wittgenstein | | | | 2·noco | | | | 3·noth | 3·persp | |

Sanity checks passing: every philosopher holds at most three 3s (finding E's
scarcity rule); every philosopher is in at least one pool; every pool splits
across both poles.

---

## The ten shelves — baseline tie-break (superseded)

> **Superseded 2026-08-14:** variant B's diversity-aware tie-break was adopted
> into the design doc, so these are no longer the shipping shelves. The
> adopted-rule shelves are listed after the variant B section below. This
> baseline is kept for comparison — the findings were made against it. It also
> preserves the pre-2026-08-22 roster, before Girard replaced James.

Rank by tag, tie-break by declaration order, cap 2 per approach. `(app, tag)`
per pick; *bumped* = in the pool, not on the shelf.

### What makes a life worth living (`sufficiency`)
- *enough*: epicurus (emp,3) · marcus-aurelius (lit,3) · camus (lit,2) · spinoza (rat,2) — 3 approaches
- *more*: nietzsche (lit,3) · sartre (exp,2) · plato (lit,2) · aristotle (emp,2) — 3 approaches
  - bumped: beauvoir, hegel, mill, marx (all by rank)

### Right and wrong (`moral_source`)
- *found*: aquinas (rat,3) · aristotle (emp,3) · kant (rat,3) · mill (emp,3) — ⚠️ **2 approaches**
  - bumped: hume, plato, augustine (rank)
- *made*: nietzsche (lit,3) · sartre (exp,2) · camus (lit,2) · epicurus (emp,2) — 3 approaches
  - bumped: foucault (rank)

### Suffering, loss, death (`consolation`)
- *reframe*: epicurus (emp,3) · marcus-aurelius (lit,3) · aquinas (rat,2) · plato (lit,2) — 3 approaches
  - bumped: augustine, spinoza (rank)
- *face*: camus (lit,3) · heidegger (exp,3) · nietzsche (lit,2) · kierkegaard (exp,2) — ⚠️ **2 approaches**
  - bumped: sartre, hume, beauvoir (rank)

### Who am I, really (`selfhood`)
- *core*: augustine (exp,3) · descartes (rat,3) · aquinas (rat,2) · kierkegaard (exp,2) — ⚠️ **2 approaches**
  - bumped: plato, aristotle (rank)
- *no core*: sartre (exp,3) · hume (emp,3) · foucault (emp,3) · nietzsche (lit,2) — 3 approaches
  - bumped: **locke (approach cap)**, beauvoir, hegel, marx, heidegger, wittgenstein (rank)

### Am I free (`agency`)
- *made*: spinoza (rat,3) · marx (emp,3) · hume (emp,2) · augustine (exp,2) — 3 approaches
  - bumped: foucault, heidegger (rank)
- *makes himself*: kierkegaard (exp,3) · sartre (exp,3) · kant (rat,3) · nietzsche (lit,2) — 3 approaches
  - bumped: epicurus, marcus-aurelius, james, locke (rank)

### Why we accept the rules (`legitimacy`)
- *consent*: locke (emp,3) · hegel (rat,3) · mill (emp,3) · aquinas (rat,2) — ⚠️ **2 approaches**
  - bumped: hume, plato, **kant** (rank) — the draft's "Kant hole," reproduced mechanically
- *conditioning*: foucault (emp,3) · marx (emp,3) · heidegger (exp,3) · nietzsche (lit,2) — 3 approaches
  - bumped: beauvoir (rank)

### Is there a God (`transcendence`) — *updated after the 2026-08-14 rulings*
- *divine order*: aquinas (rat,3) · kierkegaard (exp,3) · augustine (exp,3) · descartes (rat,3) — 2 approaches, as in the design doc's worked example ("cap reached on both approaches")
  - bumped: james, plato (rank); kant and hegel out of the pool entirely
- *nothing beyond nature*: nietzsche (lit,3) · camus (lit,3) · sartre (exp,2) · hume (emp,2) — 3 approaches
  - bumped: spinoza (rank) — in the pool for the reranker, with the copy guard

> ~~**The design doc's worked example fails under the design's own rules.**~~
> **Resolved (author ruling, 2026-08-14): Descartes `transcendence` 2 → 3** —
> the Meditations' proofs justify it, and his third 3 is within finding E's
> budget. The computed divine-order shelf now matches the worked example
> exactly (Aquinas · Kierkegaard · Augustine · Descartes); Plato drops to the
> bumped list and the shelf runs two approaches, which the worked example
> itself accepted.

### What's actually real (`depth`)
- *something behind*: plato (lit,3) · spinoza (rat,3) · aquinas (rat,2) · epicurus (emp,2) — 3 approaches
  - bumped: augustine, foucault, descartes, kant, marx (rank)
- *nothing behind*: wittgenstein (lit,3) · nietzsche (lit,2) · hume (emp,2) · aristotle (emp,2) — ⚠️ **2 approaches**
  - bumped: james, heidegger (rank)

### How do we know anything (`standpoint`)
- *objective*: plato (lit,3) · descartes (rat,3) · aristotle (emp,2) · augustine (exp,2) — 4 approaches
  - bumped: spinoza, locke, kant (rank)
- *perspectival*: hume (emp,3) · james (emp,3) · wittgenstein (lit,3) · nietzsche (lit,2) — ⚠️ **2 approaches**
  - bumped: beauvoir, foucault, hegel (rank)
  - ⚠️ only shelf with **zero** hand-curated duel pairs across groups

### Other people (`sociality`)
- *complete*: aristotle (emp,3) · hegel (rat,3) · hume (emp,2) · plato (lit,2) — 3 approaches
  - bumped: epicurus, augustine (rank); marx withdrawn from the pool (2026-08-14 ruling)
- *cost*: beauvoir (exp,3) · nietzsche (lit,2) · kierkegaard (exp,2) · marcus-aurelius (lit,2) — ⚠️ **2 approaches**
  - bumped: **sartre (approach cap)**, foucault, mill, heidegger (rank)

### Appearance counts (both groups, max 10)

nietzsche **10** ⚠️ · aquinas 6 · hume 6 · plato 6 · kierkegaard 5 · sartre 5
· aristotle 5 · camus 4 · epicurus 4 · augustine 4 · marcus-aurelius 3 ·
spinoza 3 · foucault 2 · descartes 2 · kant 2 · hegel 2 · mill 2 · marx 2 ·
heidegger 2 · wittgenstein 2 · **james 1 · beauvoir 1 · locke 1**

---

## Findings

1. **Test #3 trips on day one: Nietzsche is on all ten shelves.** Not a tag
   error individually — every 2 is defensible — but jointly he crowds the
   roster. The concentration mechanism the design built its guardrails
   against is reproduced *by the deterministic layer itself*.
2. **The declaration-order tiebreak re-creates the famous-name bias the
   product exists to fight.** The original six sit first in the roster and
   win every tag-2 tie: Beauvoir (14th), Foucault (15th), Locke (17th) and
   Mill (20th) lose systematically. Beauvoir — one of the two philosophers
   the "Other people" topic was *added for* — appears on exactly one shelf.
   Locke's personal-identity claim is bumped off the "Who am I" shelf by the
   approach cap. The coverage audit's ⚠️ "topic only" rows are confirmed
   mechanically: topic tags get them into pools, and the fill rules then
   keep them off shelves.
3. **Seven of twenty groups have only two approaches.** The cap only ever
   *blocks* a third lookalike; nothing in the fill rules *prefers* a missing
   approach. D3's claim that the cap "usually" yields three routes is
   optimistic under enumeration.
4. **A one-line algorithm change fixes five of the seven** (see variant
   below), and partially fixes findings 1–2, at zero cost to topic fit.
5. **The two residues are editorial, not algorithmic:** the *found* pole of
   ethics is four tag-3s spanning two approaches (fit and spread genuinely
   conflict — see decisions), and appearance concentration needs either tag
   pruning or a rule that spread across shelves matters.
6. **Duel coverage is fine everywhere except `standpoint`**, exactly where
   the original six thin out — confirming that composed-topic quality (not
   availability) is the remaining duel problem.

## Variant B — diversity-aware tie-break (recommended)

Same rule with one change: within a tag tier, prefer the candidate whose
approach is least represented in the group so far; remaining ties by
declaration order. Fit still outranks spread — a 3 always beats a 2.

- *Fixed to ≥3 approaches:* consolation·face (Hume's provisional tag now earns
  its slot), selfhood·core (Plato + Aristotle in, and the group gains
  empirical + literary), legitimacy·consent (Plato takes the literary slot),
  depth·nothing-behind (Heidegger in), standpoint·perspectival (Beauvoir in),
  sociality·cost (Foucault in). sufficiency·more and several others improve
  to 4.
- *Still 2 approaches:* moral_source·found only.
- *Appearances (after the 2026-08-14 rulings):* nietzsche **9** (still >60% —
  his God tag is now a 3 and he leads that shelf), augustine **7** (the
  lone-experiential effect — diversity preference loves him), aquinas 6 → 3,
  kierkegaard 5 → 3; james/locke still 1.

Full variant output is reproducible from the script; the shelves differ from
the baseline in the fourth (occasionally third) slot only.

## Adopted shelves — variant B tie-break + subsequent roster rulings

Recomputed 2026-08-22 from the matrix above after Girard replaced James; the
selection rules remain the variant B rules adopted on 2026-08-14. **These are
the shelves the copy in
[`diagnostic_shelf_copy.md`](diagnostic_shelf_copy.md) is written against.**
Leads (first pick, always a tag-3) in bold.

| Topic | Pole | Shelf | Approaches |
| --- | --- | --- | --- |
| worth | enough | **epicurus** · marcus-aurelius · spinoza · camus | 3 |
| worth | more | **nietzsche** · sartre · aristotle · hegel | 4 |
| right | found | **aquinas** · aristotle · kant · mill | 2 (ruled acceptable) |
| right | made | **nietzsche** · sartre · epicurus · camus | 3 |
| suffer | reframe | **epicurus** · marcus-aurelius · aquinas · augustine | 4 |
| suffer | face | **camus** · heidegger · hume · nietzsche | 3 |
| self | core | **descartes** · augustine · kierkegaard · plato (authored display order) | 3 |
| self | no core | **sartre** · hume · foucault · nietzsche | 3 |
| free | makes | **kierkegaard** · kant · sartre · nietzsche | 3 |
| free | made | **spinoza** · marx · augustine · girard | 4 |
| rules | consent | **locke** · hegel · mill · plato | 3 |
| rules | conditioning | **foucault** · heidegger · marx · nietzsche | 3 |
| god | divine order | **aquinas** · kierkegaard · augustine · descartes | 2 (worked example) |
| god | nothing beyond | **nietzsche** · camus · sartre · hume | 3 |
| real | something behind | **plato** · spinoza · epicurus · augustine | 4 |
| real | nothing behind | **wittgenstein** · hume · heidegger · nietzsche | 3 |
| know | objective | **plato** · descartes · aristotle · augustine | 4 |
| know | perspectival | **hume** · wittgenstein · beauvoir · hegel | 4 |
| others | complete | **aristotle** · hegel · plato · augustine | 4 |
| others | cost | **girard** · beauvoir · foucault · nietzsche | 3 |

Appearance counts: nietzsche **9** (off `know` only) · augustine **7** · hume,
sartre, plato 5 · aristotle, epicurus, camus, hegel 4 · aquinas, spinoza,
kierkegaard, heidegger, descartes, foucault 3 · marcus-aurelius, kant, mill,
marx, wittgenstein, beauvoir, girard 2 · locke 1. Only one
group remains at two approaches besides the ruled ethics found-group: the God
divine-order shelf, which the worked example accepted.

> *Updated 2026-08-14, second ruling batch: the `self · core` row and counts
> reflect Kierkegaard's `selfhood` 3 (rulings log below); the original
> computation had augustine · descartes · plato · aristotle.*

---

## Decisions this surfaces (for the author)

1. ~~**Descartes vs. Plato on the believer's God shelf**~~ — **Ruled
   2026-08-14: Descartes, via `transcendence` 3.** See the rulings log.
2. ~~**Ethics found-pole: does spread ever outrank a 3-vs-2 fit
   difference?**~~ **Ruled 2026-08-14: no — accept the shelf.** Aquinas ·
   Aristotle · Kant · Mill stands at two approaches; every member is
   individually justified, and the group's internal contrast (Kant vs. Mill
   on *why* morality is real) is exactly the "same family, different
   conclusions" effect D9 promised. Group-label copy should name that
   contrast.
3. ~~**Nietzsche (8–10 shelves) and Augustine (4–7).**~~ **Ruled 2026-08-14:
   accepted, with three conditions.** See the rulings log.
4. ~~**Adopt variant B's tie-break** into the design~~ — **Adopted
   2026-08-14**; written into the design doc's Selection rules. Residual ties
   (same tag, same approach count) still fall to declaration order, which is
   a known famous-name bias — revisit only if an authored per-topic order is
   ever written.
5. ~~**The † tags.**~~ **Ruled 2026-08-14 — see the rulings log below.**

## Rulings log — 2026-08-14 (decision 5)

All verified against `philosophers.ts` before ruling (checklist rule 11).

- **Spinoza `transcendence` 2 · nothing beyond nature — stands, with a
  mandatory copy guard** (marked `^g` in the matrix): *Deus sive Natura* is
  literally the pole's claim, but no group label or explanation may present
  him as a plain atheist — he calls the one substance God. He sits in the
  pool for the reranker; the deterministic four are Nietzsche, Camus, Sartre,
  Hume.
- **Nietzsche `transcendence` 2 → 3.** Death of God is one of the two-or-three
  questions he exists to answer; he now leads the naturalist God group. His
  third 3 is within finding E's "two or three" budget, but it raises his
  appearance count to 9/10 — decision 3 (concentration) gets harder and more
  urgent.
- **Kant and Hegel off the God pool (tag 1).** Kant's prompt contains only
  the antinomies critique — no practical-faith material — and Hegel's prompt
  expressly denies the "static entity behind the world" reading. Revisit Kant
  only if his moral-faith material is ever added to the prompt.
- **Hume `consolation` 2 · face — stands**, with the evidence gap closed: a
  sourced entry on his documented equanimity while dying (Boswell's 1776
  interview; Adam Smith's letter to Strahan) was added to his `sources` in
  `philosophers.ts`. ⚠️ Pending the project's standard human verification
  pass before it is treated as settled corpus material.
- **Plato `sociality` 2 · complete and Mill `sociality` 2 · cost — adopted**
  (supported by the Eros ascent and the despotism-of-custom material
  respectively). **Marx `sociality` — withdrawn**: his prompt's
  social-relations material is formation-shaped, not completion-shaped, and
  he is well served by rules (3) and freedom (3).
- Standing copy guards recorded: Girard's divine-order tag reflects his
  Christian account of revelation, not a generic natural-theology proof;
  Beauvoir stays 3 · cost
  and the Other-people Q1 route audit should stop annotating her on the
  complete pole.
- **Descartes `transcendence` 2 → 3 (decision 1, ruled 2026-08-14).** The
  believer's shelf is Aquinas · Kierkegaard · Augustine · Descartes, matching
  the design doc's worked example; Plato drops to the bumped list.
- **Ethics found-group accepted at two approaches (decision 2, ruled
  2026-08-14).** Fit is never sacrificed for spread; the Kant–Mill contrast
  becomes a copy requirement for that group's label.
- **Diversity-aware tie-break adopted (decision 4, 2026-08-14)** — now the
  specified fill rule in the design doc's Selection section.
- **Concentration accepted (decision 3, ruled 2026-08-14).** Nietzsche stays
  on 9 of 10 shelves (leading 3), and the same principle covers Augustine
  (7). Rationale: every appearance is individually justified, a user sees
  only one shelf, and the branch questions' route annotations depend on his
  pool membership nearly everywhere. Three binding conditions:
  1. He never leads a shelf where his tag is 2 (guaranteed by fit-first
     ranking — keep it that way).
  2. **Per-topic hook copy is mandatory**: his card must say something
     different on each shelf (death of God / ressentiment / the herd /
     self-overcoming…), and likewise for Augustine (restless heart / divided
     will / memory / grief). A shared blurb across shelves violates this
     ruling.
  3. Sweep test #3 changes from "flag >60%" to "flag >60% **unless every
     appearance carries a written justification**" — Nietzsche and Augustine
     are the two documented exceptions; the check still catches accidental
     tag inflation for everyone else.

- **Kant `depth` 2 → 1 — applied 2026-08-14, on transcribing the matrix into
  `philosophers.ts`.** The proposal stood open in
  [`screen2_split_questions_draft.md`](screen2_split_questions_draft.md) §7:
  his prompt expressly forbids treating the noumenal as "a second hidden world
  we can describe", and once that branch's Q2–Q3 were written he was its only
  pool member with no clickable route. Same reasoning as the Kant/Hegel God-pool
  ruling above. **No shelf changes** — he was on neither depth shelf, and being
  a rational tag-2 he was never the diversity tie-break's next pick on the
  *something behind* group either, so the only effect is that he leaves the
  pool and the bumped list. The struck cell in the matrix records it; the code
  carries 132 tags rather than 133.

- **Kierkegaard `selfhood` 2 → 3 (author ruling, 2026-08-14, on reviewing
  the computed shelves).** The diversity tie-break had silently dropped him
  from the *core* shelf — a displacement the variant B adoption note never
  surfaced (it named who came in, not who went out). *The Sickness unto
  Death* ("the self is a relation that relates itself to itself"; despair as
  the mis-relation) makes selfhood one of the two-or-three questions he
  exists to answer; this is his third and final 3 under finding E's budget.
  The shelf becomes **Kierkegaard (leads) · Descartes · Augustine · Plato**;
  Aristotle and Aquinas are bumped. The author first proposed Aristotle for
  the fourth slot (via telos) and withdrew it in favor of the mechanical
  result after reviewing Plato's prompt support (tripartite soul,
  recollection, the charioteer) — so no authored per-topic tie order was
  introduced; declaration order stands. Appearances: Kierkegaard 3 → 4,
  Aristotle 5 → 4. **Addendum, same day: authored display order.** The author
  ruled Kierkegaard third on the shelf rather than first — the deterministic
  default renders Descartes · Augustine · Kierkegaard · Plato, and Descartes
  leads. First use of an authored per-shelf display order (design doc,
  Selection section): presentation only, membership and tags untouched.

## Roster ruling — 2026-08-22

- **Girard replaces James** in the 23-person roster and takes the `literary`
  approach. His strongest route is `sociality` 3 · cost: mimetic desire makes
  another person both the model of what to want and the rival who obstructs it.
- Girard also receives `agency` 2 · made, `legitimacy` 2 · conditioning,
  `transcendence` 2 · divine order, and `depth` 2 · something behind. These
  encode borrowed desire, the scapegoat basis of order, biblical disclosure,
  and the concealed violence beneath myth. He renders on the agency and
  sociality shelves; the other tags keep him eligible for a future bounded
  rerank without displacing a stronger deterministic fit.
- Removing James lets Hegel fill `standpoint` · perspectival. The resulting
  four approaches improve that shelf's method spread.

## What this unlocks next

With the ten group-pairs concrete, the high-leverage authoring can start:
~20 group-label pairs and per-philosopher topic hooks written against real
shelves — and a paper pilot can show a test user a drafted question plus the
shelf it routes to and ask the only question that matters: *would you click
one of these?*
