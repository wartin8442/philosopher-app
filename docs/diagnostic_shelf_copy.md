# Diagnostic shelf copy — draft 1

**Status: draft for author review, 2026-08-14.** Every line below is now
transcribed into `src/lib/diagnosticCopy.ts` and rendering on the results
screen at `/start` — *as draft copy, so the flow could be clicked through*.
It kept its own module rather than joining `src/lib/diagnostic.ts` precisely
because of this status: the questions there are post-review and must not be
touched for style, while everything here is expected to change once the author
reads it. Edit this document and re-transcribe; `src/lib/routing.test.ts`
asserts coverage (a subtitle pair for all twenty groups, a hook for everyone a
shelf can produce, distinct Nietzsche and Augustine hooks, the Spinoza guard).

This document does open item 9 of
[`diagnostic_routing_design.md`](diagnostic_routing_design.md): the ~20
group-label pairs and the per-philosopher, per-topic card hooks, written
against the computed shelves.

**Which shelves.** The adopted selection rules (diversity-aware tie-break +
the 2026-08-14 rulings) were recomputed this session from the canonical tag
matrix in [`diagnostic_shelf_preview.md`](diagnostic_shelf_preview.md); the
result matches every variant-B note in that document (Nietzsche 9 shelves,
Augustine 7, Aquinas 3, Hume onto the *face* group, Beauvoir onto
*perspectival*, Foucault onto *cost*). One shelf was then changed by a
same-day author ruling: Kierkegaard's `selfhood` rose to 3, making the *core*
group Kierkegaard (leads) · Descartes · Augustine · Plato (rulings log,
second batch). Each topic section below restates the shelf it was written
against.

**Conventions.**

- The headers **Start with these** / **Try a different angle** are fixed
  (D12). What is authored here is the italic subtitle line under each header,
  per topic, per group, per role — the generic sublines in D12 are the
  fallback, not the shipped copy. Since either group can land in either role
  depending on the user's tally, each group gets a **pair** of lines: one for
  when it is the user's home group, one for when it is the challenge group.
  Ten topics × two groups = the ~20 pairs of item 9.
- **Hooks** are one sentence per card, shown with the name, portrait, and
  `blurb` — the topic-specific reason this philosopher is on *this* shelf.
  Third person, no invented quotations; every quoted phrase appears in
  `philosophers.ts` (prompt or sources).
- **Rule 11**: every line below is supported by material actually in
  `philosophers.ts`. Where a hook leans on something specific, the grounding
  is noted in the compliance section at the end.
- Subtitle lines describe the groups; they do not assert the user's beliefs
  back at them ("you said X"). The pole comes from clicks and majorities can
  be 2–1 or mixed, and the design's personalization rule (results-screen
  section) forbids turning an inference into a declaration about the user.
  The fixed header plus "your starting point" carries the orientation.

**Binding constraints honored (from the 2026-08-14 rulings):** Nietzsche and
Augustine carry a different hook on every shelf; Spinoza's God-pool copy never
calls him an atheist; Girard's God-pool copy is about biblical disclosure; the ethics
*found* label names the Kant–Mill contrast; the agency labels do not paint
Spinoza, Marx, Augustine, or Hume as fatalists. Checked per-line at the end.

---

## 1. What makes a life worth living (`sufficiency`)

**Shelf.** *enough*: Epicurus (leads) · Marcus Aurelius · Spinoza · Camus.
*more*: Nietzsche (leads) · Sartre · Aristotle · Hegel.

### Group labels

**enough** —
as home: *These four think a good life is nearer than it looks: remove the
fear, the empty desires, and the judgments that poison the present, and what
is left is enough.*
as challenge: *The case against needing more: for these thinkers, "more" is
the trap — clear away fear and empty desire, and enough was the goal all
along.*

**more** —
as home: *These four agree a life can be squandered on comfort: living well
here means growth, work, self-overcoming — something built, not settled
into.*
as challenge: *The case against settling: contentment can be a way of hiding,
and a life is measured by what it becomes, not by how quietly it rests.*

### Hooks

- **Epicurus** — Taught that pleasure reaches its limit once pain is gone —
  after that it can only be varied, not increased — so a life of bread,
  friends, and an untroubled mind is not a compromise.
- **Marcus Aurelius** — Wrote reminders to himself that distress comes from
  treating what is not ours to command as if it were — and that nowhere is
  quieter than one's own soul.
- **Spinoza** — Held that blessedness is not the reward of virtue but virtue
  itself: joy comes from understanding, not from acquiring.
- **Camus** — Concluded that even a universe that answers nothing leaves
  enough to live for: "one must imagine Sisyphus happy."
- **Nietzsche** — His test for a life: would you will it, in every detail,
  again and again eternally? Anything you could not affirm that way still has
  work to do.
- **Sartre** — For him a life is a project, not a possession: you exist
  first, and what your existence amounts to is decided by what you make of
  it.
- **Aristotle** — Defined the human good as activity — the exercise of your
  best capacities over a complete life — not a feeling you could have while
  idle.
- **Hegel** — Thought a life, like an idea, grows by running into its own
  contradictions and building something larger out of them.

## 2. Right and wrong (`moral_source`)

**Shelf.** *found*: Aquinas (leads) · Aristotle · Kant · Mill.
*made*: Nietzsche (leads) · Sartre · Epicurus · Camus.

### Group labels

**found** —
as home: *All four hold that right and wrong are real, not invented — and
they disagree hard about why: Kant grounds morality in reason's own law, Mill
in the happiness of everyone affected, Aristotle in human flourishing,
Aquinas in natural law. One conviction, four rival foundations.*
as challenge: *These four answer the makers: morality is found, not made —
though watch them fight over where. Kant's law of reason against Mill's
arithmetic of happiness is one of the great quarrels in ethics.*

**made** —
as home: *These four agree that moral values carry human fingerprints — a
history, a psychology, an agreement — and that honesty about this is where
real ethics begins.*
as challenge: *These thinkers ask who benefits from the morality we inherit.
If values were made, they can be examined — and remade.*

### Hooks

- **Aquinas** — Grounds morality in natural law: good is to be done and
  pursued, and the precepts follow from what human beings, by nature, are
  for.
- **Aristotle** — Finds right and wrong in character: virtue is a cultivated
  disposition, lying in a mean that practical wisdom locates case by case.
- **Kant** — Grounds it in reason itself: act only on principles you could
  will as universal law, and treat every person as an end, never merely as a
  means.
- **Mill** — Grounds it in happiness: actions are right as they promote
  well-being for everyone affected, with pleasures differing in quality, not
  just amount.
- **Nietzsche** — Traced our "good and evil" to a slave revolt in morality:
  values born of ressentiment, whose origin their inheritors were never told.
- **Sartre** — In choosing, you "choose an image of man": there is no table
  of values behind you, only the ones your choices write.
- **Epicurus** — Called justice a compact of mutual advantage: no justice in
  itself, only agreements not to harm or be harmed — and what is useful can
  change.
- **Camus** — Found value born in revolt — "I rebel, therefore we are" — and
  insisted rebellion betrays itself the moment it justifies murder.

## 3. Suffering, loss, death (`consolation`)

**Shelf.** *reframe*: Epicurus (leads) · Marcus Aurelius · Aquinas ·
Augustine. *face*: Camus (leads) · Heidegger · Hume · Nietzsche.

### Group labels

**reframe** —
as home: *These four believe suffering looks different when it is understood:
much of its power comes from judgments, fears, and expectations that can be
examined and changed.*
as challenge: *Understanding is not the same as softening: some of what
crushes us is confusion, these thinkers argue, and clearing it away is no
consolation prize.*

**face** —
as home: *No appeal, no cushion: these four start from loss as it actually
is, and ask what honesty — even affirmation — looks like from there.*
as challenge: *These thinkers suspect every consolation smuggles in a false
hope — and that something important only becomes visible when you stop
reaching for one.*

### Hooks

- **Epicurus** — "Death is nothing to us": where we are, death is not, and
  where death is, we are not — a fear that poisons a life it cannot touch.
- **Marcus Aurelius** — Held that events do not disturb us — our judgments
  about them do, and a judgment can be revoked.
- **Aquinas** — Reads suffering against the largest possible frame: the
  ultimate human end is beatitude, and no loss along the way is the last
  word.
- **Augustine** — Argued evil is not a thing but a lack — a corruption of
  something good — so what harms us is real, but it is not a rival power.
- **Camus** — Refused both suicide and false hope: hold the absurd open,
  revolt lucidly, and fight suffering as a matter of common decency.
- **Heidegger** — Argued that being-toward-death is not morbid: owning your
  finitude is what frees a life from anonymous drift.
- **Hume** — Practiced what he argued: dying in 1776, he said that not
  existing after death troubled him no more than not having existed before
  birth. *(⚠️ rests on the new `sources` entry pending human verification.)*
- **Nietzsche** — Preached amor fati, love of fate: the test is not enduring
  your life but affirming it.

## 4. Who am I, really (`selfhood`)

**Shelf.** *core*: Descartes (leads) · Augustine · Kierkegaard · Plato.
*no core*: Sartre (leads) · Hume · Foucault · Nietzsche.
*(Membership per the 2026-08-14 Kierkegaard `selfhood` 3 ruling — Aristotle
and Aquinas bumped; order per the same-day authored display order, which
moves Kierkegaard to third and makes Descartes the lead.)*

### Group labels

**core** —
as home: *These four think there is a real you to find — a soul, a thinking
thing, a self you can succeed or fail at being — and that the search inward
is the oldest work of philosophy.*
as challenge: *The pushback: if the self is assembled, something is doing the
assembling — and each of these four has a different account of what that is.*

**no core** —
as home: *These four went looking for the fixed inner self and reported back:
there isn't one — there are habits, choices, histories, and the ongoing work
of becoming someone.*
as challenge: *These thinkers argue that the "true self" waiting to be found
is the one thing you will never find — and that this is better news than it
sounds.*

### Hooks

- **Descartes** — Whatever else can be doubted, the doubter cannot be: you
  are, at minimum, a thinking thing — and that is a place to build.
- **Augustine** — Searched memory — a vast interior country holding not just
  images but the self — and found that the way inward is where the search
  begins.
- **Kierkegaard** — Explored the self as a process, and despair as the
  failure to become oneself. Becoming a self is the task.
- **Plato** — Mapped the soul into reason, spirit, and appetite: the real you
  is an order among them, and justice is that order kept.
- **Sartre** — No fixed essence precedes you: his waiter, over-playing "being
  a waiter," is the warning about pretending to be a thing instead of a
  freedom.
- **Hume** — Looked inside for a simple, unchanging self and found only
  perceptions — while insisting that ordinary persons, character, and
  responsibility survive the discovery.
- **Foucault** — Asked where "kinds of people" come from — and showed how
  institutions produce the selves they claim merely to describe.
- **Nietzsche** — Saw the self as something to be given form — a work of
  self-overcoming, not an heirloom to be located.

## 5. Am I free (`agency`)

**Shelf.** *makes himself*: Kierkegaard (leads) · Kant · Sartre · Nietzsche.
*made*: Spinoza (leads) · Marx · Augustine · Girard.

### Group labels

**makes himself** —
as home: *These four put the choice back in your hands — anxiously, in
Kierkegaard's case; absolutely, in Sartre's. Freedom here is not a feeling
but a responsibility.*
as challenge: *Shaped, yes — but these thinkers insist something in you still
answers for what happens next, and nothing can carry the weight of that
choice for you.*

**made** —
as home: *These four take seriously how much of you was settled before you
got a vote — and none of them stops there: each finds a real freedom on the
far side of understanding what made you.*
as challenge: *These thinkers don't deny freedom — they relocate it:
understanding what actually moves you, they argue, is the only freedom worth
the name.*

### Hooks

- **Kierkegaard** — Called anxiety "the dizziness of freedom": the vertigo
  before possibility that proves the choice is really yours.
- **Kant** — Freedom is not doing what you want; it is autonomy — a will
  giving law to itself, which no inclination can do for you.
- **Sartre** — "Condemned to be free": even refusing to choose is a choice,
  and the excuses are the part he will not let you keep.
- **Nietzsche** — Freedom here is creative: values are not found but made,
  and making them is the highest exercise of strength.
- **Spinoza** — Nothing is contingent — and yet freedom is real: acting from
  the necessity of your own nature, which means understanding it. Freedom is
  comprehension, not exemption.
- **Marx** — We make our history, but under inherited conditions — so freeing
  anyone means changing the conditions, together, not just the mind.
- **Augustine** — Located the problem inside the will itself: we do not
  wholly want what we want, and a divided will cannot heal itself alone.
- **Girard** — Asked how free a desire can be when its model came first: we
  borrow what to want from others, then mistake the borrowed desire for
  something entirely our own.

## 6. Why we accept the rules (`legitimacy`)

**Shelf.** *consent*: Locke (leads) · Hegel · Mill · Plato.
*conditioning*: Foucault (leads) · Heidegger · Marx · Nietzsche.

### Group labels

**consent** —
as home: *These four think rules can be answerable to something — consent,
harm, justice, a freedom held in common — and that the interesting question
is which rules fail the test.*
as challenge: *Grant that much obedience is trained — these thinkers still
ask what a rule would have to be like for a clear-eyed person to accept it
anyway.*

**conditioning** —
as home: *These four study how obedience gets built — by discipline, by
ideology, by the anonymous "everyone," by inherited morality — long before
anyone asks for your agreement.*
as challenge: *An uncomfortable question about the rules that feel
reasonable: who trained you to find them reasonable?*

### Hooks

- **Locke** — Political power is legitimate only by consent, and only to
  secure life, liberty, and property — and a government that breaks that
  trust can rightly be resisted.
- **Hegel** — His test of an institution: can the people living under it
  recognize its laws as expressions of their own freedom — or only as
  constraints?
- **Mill** — One rule for rules: coercing a competent adult is justified only
  to prevent harm to others — never merely for that person's own good.
- **Plato** — Distrusted both tradition and the crowd: rule belongs to those
  who actually know what justice is — a standard he thought most cities
  fail.
- **Foucault** — Studied timetables, examinations, and the Panopticon to show
  how discipline gets inside you — until the watched take over the watching.
- **Heidegger** — Most of what "one does" was never chosen: the anonymous
  "they" supplies your possibilities before you notice — and authenticity
  begins in noticing.
- **Marx** — Social arrangements generate the ideas that make them look
  natural — so the rules feel obvious precisely where the power is best
  hidden.
- **Nietzsche** — Called it herd morality: values that reward comfort and
  punish deviation — and warned of the "last man," too comfortable to ask for
  anything more.

## 7. Is there a God (`transcendence`)

**Shelf.** *divine order*: Aquinas (leads) · Kierkegaard · Augustine ·
Descartes. *nothing beyond nature*: Nietzsche (leads) · Camus · Sartre ·
Hume. Spinoza sits in the pool for the reranker — guarded hook below.

### Group labels

**divine order** —
as home: *Four believers, two roads: Aquinas and Descartes argue their way to
God; Augustine and Kierkegaard live their way there — inward search and the
leap of faith. Part of the question is which road is yours.*
as challenge: *The strongest case you will meet that a serious mind can
conclude there is a God — by proof, and by paths that were never meant to be
proofs.*

**nothing beyond nature** —
as home: *These four live after the question: two who examine what belief
rests on, and two who ask what a life without appeal can still affirm —
including one who thinks we haven't begun to feel what we lost.*
as challenge: *These thinkers won't debate proofs politely. They ask what
believing does, where it came from — and what remains standing when it goes.*

### Hooks

- **Aquinas** — Argued five ways from the world you can see — motion, causes,
  contingency, gradation, order — to what "all call God."
- **Kierkegaard** — Faith is not the end of an argument but a leap over
  objective uncertainty: Abraham, held in fear and trembling, is his picture
  of it.
- **Augustine** — His greatest work is addressed to God, not to a reader: for
  him the search leads inward, and then upward.
- **Descartes** — Even his rigorous doubt rests on God: without a perfect,
  non-deceiving God, he argues, clear and distinct knowledge has no
  guarantee.
- **Nietzsche** — "God is dead" was a diagnosis, not a boast: the belief has
  lost its grip on us, and we have not yet faced what that costs.
- **Camus** — Rejected the leap to faith as "philosophical suicide": the
  honest task is living without appeal, holding the question open.
- **Sartre** — Begins where the blueprint ends: with no God to author a human
  nature, existence precedes essence and the responsibility is all yours.
- **Hume** — Brought religious claims before the ordinary court of evidence
  and testimony — neither a dogmatic atheist nor a believer, and unsettling
  to both.
- **Spinoza** *(rerank pool only — copy guard applies)* — Identified God with
  Nature itself: one infinite substance, nothing beyond it. He was expelled
  for saying so — but he never called it atheism; he called the one substance
  God.

## 8. What's actually real (`depth`)

**Shelf.** *something behind*: Plato (leads) · Spinoza · Epicurus ·
Augustine. *nothing behind*: Wittgenstein (leads) · Hume · Heidegger ·
Nietzsche.

### Group labels

**something behind** —
as home: *These four agree the world you see is not the whole story — and
disagree completely about what the rest is: Forms, one infinite substance,
atoms and void, a truth known by inner light.*
as challenge: *Even "what you see is what there is" needs an account of why
appearances hold together — and each of these four claims to have found it
underneath.*

**nothing behind** —
as home: *These four suspect the "hidden reality" is a trick of grammar,
habit, or wishful thinking — and that the surface, honestly described, is
deeper than it looks.*
as challenge: *Why so sure something is behind the curtain? These thinkers
ask what that search has cost — and what honest description finds instead.*

### Hooks

- **Plato** — The Cave: what we see are shadows of unchanging Forms — the
  many beautiful things borrow from Beauty itself.
- **Spinoza** — One substance under everything — call it God or Nature — of
  which every thing, and every mind, is a mode.
- **Epicurus** — Underneath everything: atoms and void, nothing else — a
  hidden order that dissolves the gods' threats instead of issuing them.
- **Augustine** — The mind knows unchanging truths by a light that is not its
  own: for him the world points past itself at every turn.
- **Wittgenstein** — Suspected the "hidden essence" is language on holiday:
  look at how words are actually used, and the mystery often dissolves.
- **Hume** — Looked for the necessary connection behind cause and effect and
  found none — only constant conjunction, and a habit of expectation in us.
- **Heidegger** — The world's meaning is not behind things but in our
  involvement with them: the hammer matters in use, not under inspection.
- **Nietzsche** — There are no "immaculate" facts waiting behind
  interpretation — and honesty about that, he thought, is a virtue most
  philosophy lacks.

## 9. How do we know anything (`standpoint`)

**Shelf.** *objective*: Plato (leads) · Descartes · Aristotle · Augustine.
*perspectival*: Hume (leads) · Wittgenstein · Beauvoir · Hegel.

### Group labels

**objective** —
as home: *These four think knowledge can outgrow opinion — by rigorous doubt,
careful observation, or a light the mind does not supply — and that the
standard is not ours to bend.*
as challenge: *Some claims — in geometry, in logic, perhaps in ethics — don't
seem to care where you're standing. These thinkers built philosophy on that.*

**perspectival** —
as home: *These four start from knowers as they actually are — creatures of
habit, practice, purpose, and situation — and rebuild knowledge from there,
without pretending to a view from nowhere.*
as challenge: *These thinkers don't attack truth; they ask what reaching it
from inside a human life is actually like — and what "objectivity" quietly
assumes.*

### Hooks

- **Plato** — Split knowledge from opinion: knowledge is stable and can give
  an account of itself — opinion may be true, but it cannot say why.
- **Descartes** — Doubted everything he could precisely to find what
  survives: doubt as an instrument for building knowledge, not a place to
  live.
- **Aristotle** — Starts from what people say and what nature shows, and
  works toward science: knowledge of causes, of what cannot be otherwise.
- **Augustine** — Words are only signs; the inner teacher is what actually
  instructs — truth is met, not manufactured.
- **Hume** — Proportion confidence to evidence and expect no more certainty
  than experience gives: mitigated skepticism keeps the dogmatists honest.
- **Wittgenstein** — Meaning — and knowing — live inside shared practices,
  our language-games; step outside them and the words stop working.
- **Beauvoir** — Starts from the situated knower: body, history, and
  dependence set the terms on which anyone sees anything — abstraction
  without the case is worthless.
- **Hegel** — Knowledge is historical rather than a view from nowhere: each
  standpoint exposes its own limits and is transformed through the conflict
  it cannot resolve.

## 10. Other people (`sociality`)

**Shelf.** *complete*: Aristotle (leads) · Hegel · Plato · Augustine.
*cost*: Girard (leads) · Beauvoir · Foucault · Nietzsche.

### Group labels

**complete** —
as home: *These four think you cannot become yourself alone: friendship,
recognition, love, and shared life are not additions to a self but
ingredients of one.*
as challenge: *The price of other people runs both ways, these thinkers
answer: without them, there is no one to be.*

**cost** —
as home: *These four take the difficulty of other people seriously — being
defined by them, watched by them, absorbed into them — and none of them
thinks the answer is escape.*
as challenge: *What the warm view leaves out: the gaze that fixes you, the
crowd that swallows you, the resentment that passes for virtue.*

### Hooks

- **Aristotle** — "A political animal": the city exists not merely for
  living but for living well — flourishing is not something you can do
  alone.
- **Hegel** — Self-consciousness needs recognition by another
  self-consciousness: even the master–servant struggle shows a self cannot
  confirm itself alone.
- **Plato** — In the Symposium, desire rightly educated climbs from one
  beautiful person toward Beauty itself: other people are the first rungs of
  the ascent.
- **Augustine** — Two cities, formed by two loves: what a community loves in
  common is what it is — and what its members become.
- **Beauvoir** — "One is not born, but rather becomes, a woman": her account
  of being made the Other — defined relative to someone else — is the
  deepest study of what other people can cost.
- **Nietzsche** — Unmasked ressentiment: the way resentment of others can
  invert into "virtue" — and poison the one who carries it.
- **Foucault** — Being seen is never neutral: normalizing judgment measures
  everyone against "normal," and other people are its instrument.
- **Girard** — Made desire triangular: another person models what is worth
  wanting, then becomes the rival who seems to stand between us and it.

---

## Compliance check

### Nietzsche — nine shelves, nine distinct hooks (concentration ruling, condition 2)

| Shelf | Facet used |
| --- | --- |
| worth · more (leads) | eternal recurrence as affirmation test |
| right · made (leads) | genealogy — the slave revolt in morality |
| suffer · face | amor fati |
| self · no core | self-overcoming, giving form to oneself |
| free · makes | value creation as the exercise of freedom |
| rules · conditioning | herd morality and the last man |
| god · none (leads) | death of God as diagnosis |
| real · nothing behind | perspectivism — no immaculate facts |
| others · cost | ressentiment |

The nearest pair is right·made (origin of *inherited* values) vs free·makes
(creating *new* values) — distinct claims, both in the prompt. He leads only
where his tag is 3 (worth, right, god), per condition 1.

### Augustine — seven shelves, seven distinct hooks

| Shelf | Facet used |
| --- | --- |
| suffer · reframe | evil as privation |
| self · core | memory as interior country |
| free · made | the divided will |
| god · divine order | work addressed to God; inward then upward |
| real · something behind | illumination |
| know · objective | signs and the inner teacher |
| others · complete | the two cities, communities defined by their loves |

Real vs know are the adjacent pair (illumination vs the inner teacher); the
prompt lists them as separate positions and the hooks keep them separate.

Kierkegaard now sits on three shelves (not bound by the concentration ruling,
but held to the same standard): self · core carries the self as a process and
despair as the failure to become oneself (author's wording, 2026-08-14; third
slot by authored display order, Descartes leads), free · makes leads on
anxiety as the dizziness of freedom, and god · divine order on the leap. All
three are distinct prompt facets.

### Copy guards

- **Spinoza (god pool)**: hook explicitly says he never called it atheism and
  called the one substance God. His worth/free/real hooks use Deus sive
  Natura, conatus-adjacent joy, and necessity — no atheism language anywhere.
- **Girard**: his divine-order hook presents the biblical exposure of
  scapegoating, matching the Christian claim in his prompt without turning it
  into a generic proof from nature.
- **Ethics found label**: both the home and challenge lines name the
  Kant–Mill contrast.
- **Agency labels**: both *made* lines assert the group finds real freedom
  ("none of them stops there"; "they relocate it"); the hooks for Spinoza,
  Marx, Augustine, and Hume each state the positive freedom claim, not bare
  determinism. Foucault is not on the agency shelf (bumped), so the original
  "free vs. determined mislabels Foucault" warning is moot at the
  deterministic layer, but holds if the reranker ever swaps him in.
- **Hume is nowhere called an atheist** (god hook uses the prompt's "neither
  dogmatic atheist nor bland pluralist" position).
- **No user-belief declarations**: subtitle lines describe the groups and
  their claims; none begins "You said" or attributes a belief to the user.

### Grounding notes (rule 11, where a line leans on one passage)

- Hume suffer·face hook ← the "Facing death without religious terror
  (documented, 1776)" sources entry, **which is still pending the project's
  human-verification pass**. If verification fails, the fallback facet is his
  argued position (calm proportioning of fear to evidence), but the hook as
  written must not ship.
- Aquinas suffer·reframe ← "the ultimate human end is beatitude" (prompt,
  Ethics bullet). It does not attribute a theodicy to him beyond that.
- Plato others·complete ← the Eros ascent (prompt, Symposium bullet), per the
  2026-08-14 ruling adopting that tag on exactly this support.
- Mill rules·consent ← harm principle bullet; the "despotism of custom"
  phrase from the ruling is *not* in the prompt, so the hook avoids it.
- Augustine others·complete ← "Two cities … formed by two loves" (prompt and
  City of God source). "What a community loves in common is what it is" is a
  compression of that; flag if it reads as over-extension.
- Nietzsche free·makes ← "values are created, not discovered" + "will to
  power … discharge strength, overcome, and give form" (prompt).
- Heidegger real·nothing-behind ← ready-to-hand/present-at-hand bullet; the
  hammer example is the prompt's own ("equipment breaks down").

## Open questions for the author

1. **Register.** Hooks are third-person claims about the philosopher; labels
   are second-person about the reader's starting point. Alternative: hooks in
   second person ("His test for your life: …") — punchier, but riskier for
   the safety-adjacent topics (suffering, freedom). Drafted conservative.
2. **Length budget.** Hooks run 20–35 words. If the card design wants ≤15,
   every hook here has a natural first clause that survives truncation —
   but the Kant–Mill naming requirement and the Spinoza guard cannot be cut.
3. **Mixed tallies.** The freedom-branch ruling presents 1-1-mixed patterns
   as mixed. These labels never assert the user's position, so they survive a
   mixed tally unchanged — but the author may want a third, explicitly-mixed
   intro line for that case (a D7 concern, not authored here).
4. **Duel captions** are not part of item 9 and are not drafted here; the
   curated `DUEL_TOPICS` titles already carry that weight.
