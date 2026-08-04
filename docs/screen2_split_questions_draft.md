# Screen 2 — the nine remaining split questions (draft, 2026-07-29)

Companion to [`diagnostic_routing_design.md`](diagnostic_routing_design.md). Drafts the
nine questions the status table lists as unwritten, plus a ruling on the merge
candidate. Nothing here is finished; every section ends with concerns.

All philosopher claims below are checked against `src/lib/philosophers.ts`
(`systemPrompt` and `sources`), not from memory. Where the source text supports
both poles, that is said.

**Read the four cross-cutting findings at the bottom first** — two of them change
decisions the design treats as settled.

---

## Architecture change: three questions per branch, not one

**Decided 2026-07-29, mid-drafting.** D7 specifies one split question per branch.
That does not work, and it failed the same way twice before the cause was clear.

**A single question with four options has to do two incompatible jobs.** It must
sort the user into two poles, *and* expose all four routes, because routes are the
mechanism that guarantees a bucket gets its `approach` spread. But four genuinely
distinguishable lived experiences are rarely about the same subject — so the
fourth option always drifts off-topic in order to stay distinguishable.

Both failures were instances of this:

- **Right and wrong.** One abstract question couldn't reach `moral_source` at all,
  because dilemma-shaped intuitions measure `moral_ground`. Resolved by going to
  three concrete dilemmas with four fixed answer shapes.
- **Am I free.** The *made · causes* route (Spinoza, Hume — your wants have causes
  prior to you) could not be phrased in first person without changing subject from
  freedom to desire.

**The fix is the ethics architecture, generalised.** Each branch runs **three**
concrete questions. Every question carries all four routes as its four options, so
the routes are constant across the branch and what gets read is the *pattern* of
reasons rather than a single click. Each question can then be about one concrete
thing, which is what keeps every option on-subject.

**Three, not four.** The appendix already notes the instrument is
over-parameterised: four answers carry ~10 bits against ~80 possible shelves. More
questions do **not** buy a better split — the split is binary and one question
usually gets it right. What they buy is (i) reaching routes that are otherwise
unreachable, which is a *coverage* failure rather than a precision failure, and
(ii) better free text, which is what stage 5's explanation actually runs on. Three
covers the routes without adding parameters to a decision that only needs a side.

**Inference becomes a majority tally**, as with the dilemmas: two of three shapes
agreeing fixes the pole; the free text is still stage 2's override. This makes
stage 2 *more* deterministic than the original design, not less, since the pole no
longer rests on a single button.

**Costs, stated plainly.** Ten topics × three questions is **30 authored
questions**, not ten. The flow becomes six screens where the doc promised four.
D7's claim that "branching costs authoring, not length" is now false — it costs
both. Combined with D11 (offered, not forced) and open item 13
(discoverability), a six-screen onboarding carries real drop-off risk that the
design has not yet addressed.

**Nothing settled so far is invalidated.** Every option set below already has four
options mapping to four routes, so each becomes **question 1 of 3** for its branch,
and questions 2 and 3 get authored on top. Right and wrong is already complete in
this shape.

---

## 1 · What makes a life worth living

**Recommended axis: enough ↔ more.** Is a good life one where you stop needing
something to happen, or one where you keep becoming something else?

**Why not "given vs authored"** (the existing draft, open item 5). Given/authored
is the same fault line as `moral_source` (found/made) and as `agency`
(made/makes-himself), and it correlates hard with `transcendence`. Run it and the
worth-living shelf is the God shelf with different labels — Aquinas, Aristotle,
Plato, Marcus against Nietzsche, Sartre, Camus, Beauvoir. Enough/more cuts across
all three: Epicurus is made-morality and enough; Aristotle is found-morality and
more; Nietzsche is atheist and more; Aquinas is theist and enough.

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| enough | Epicurus (emp), Marcus (lit), Spinoza (rat), Camus (lit, stretch) | **3, and thin** |
| more | Nietzsche (lit), Aristotle (emp), Mill (emp), Beauvoir (exp), Sartre (exp), Hegel (rat), Marx (emp), Plato (lit) | 4 |

Aquinas, Augustine and Plato came off the *enough* pole deliberately — see the
concern about the arrival route below. Their homes are `transcendence`,
`selfhood` and `depth`.

Support: Epicurus — "once pain is removed, pleasure cannot be increased, only
varied"; empty desires "have no limit and so cannot be satisfied." Marcus — the
dichotomy of control, "accept what is allotted without resentment." Spinoza —
"blessedness is not the reward of virtue but virtue itself." Beauvoir — confinement
to "repetition and maintenance" is freedom falling back into immanence. Mill —
individuality, experiments in living, "distribute the conditions of development."

**Options — settled 2026-07-29.**

> **What have the good stretches of your life had in common?**
>
> `[ text box — visually dominant ]`
> *One line is plenty.*
>
> Or pick the closest:
> a) I wasn't chasing anything. I'd stopped needing something to happen. → *enough · subtract* (Epicurus)
> b) I'd stopped fighting the parts I couldn't change. → *enough · accept* (Marcus Aurelius, Spinoza)
> c) I was getting better at something that mattered, and that was the whole of it. → *more · exercise* (Aristotle, Mill, Marx)
> d) They were the ones where I was outgrowing something — what had satisfied me stopped being enough. → *more · surpass* (Nietzsche, Beauvoir, Sartre)
>
> *(one of the two required)*

**Why the axis holds: both poles attack each other by name.** The shelf promises
four who disagree, so the axis has to be a real fight, and this one is textual.
Nietzsche: the last man is "the comfortable, riskless, self-satisfied creature you
despise." Mill: higher faculties are more valuable "even when less contented" — a
direct rejection of tranquility as the standard, arguing with Epicureanism
explicitly. Beauvoir: confinement to "repetition and maintenance" is freedom
falling back into immanence. Epicurus back: "empty desires have no limit and so
cannot be satisfied"; "once pain is removed, pleasure cannot be increased, only
varied."

This, not the anti-duplication argument, is the case for choosing enough/more over
the drafted given/authored — see the concern below.

**Concerns.**

- **The *enough* pole has no writable arrival route, which is why it is thin.**
  The teleological arrival people (Aquinas, Augustine, Plato) were the pole's
  numbers, but arrival cannot be phrased as something lived, because by definition
  it hasn't been reached. Every version went ambiguous: *"even the good stretches
  had something missing — I keep thinking there's a version that would finally be
  enough"* is Augustine's restless heart, and equally Nietzsche (there is no
  arrival, the wanting is the life) and Camus. It doesn't sort. So the second
  *enough* route is **acceptance** (Marcus, Spinoza) rather than arrival, which a
  newcomer can actually distinguish from subtraction — Epicurus says want less,
  Marcus says stop fighting what isn't yours to command. Cost: three solid
  candidates and one stretch, unfillable at five slots. Second instance of open
  item 12 after suffering.
- **The anti-duplication argument for this axis is weaker than it looks.** Under
  given/authored the challenger bucket is Nietzsche, Sartre, Camus, Beauvoir;
  for a theist on the God topic it is Hume, Nietzsche, Sartre, Camus — three of
  four identical, and in the bucket doing the interesting work. But a user picks
  only one topic and never sees both shelves, so by the design's own governing
  principle this failure is invisible to every individual user. It is an
  authoring-efficiency cost (pay for eleven branches, get ten shelves), not a UX
  one. The live-fight argument above is the one that should carry the decision.
- **Mood contaminates this question more than any other in the set.** Someone
  tired picks (a); someone restless picks (d). An objection to the topic, not the
  axis, and not fixable by rewording — flag for test #8.
- **(d) will collect restless people as well as growth-stretch people**, which is
  a mis-sort, since Nietzsche's self-overcoming is affirmative rather than a
  complaint. It self-corrects: they get Epicurus and Marcus as challengers telling
  them their desires are empty and have no limit, which is the confrontation they
  need. Good case for D12 — the two-bucket shelf makes the split cheap to get wrong.
- **Aristotle is this axis's weakest assignment.** "Activity of the soul in
  accordance with virtue" is on the *more* side, but virtue as a mean and Book X's
  self-sufficient contemplative life pull toward *enough*. Tag him 1–2, not 3;
  don't let him lead this bucket.
- Rejected wordings worth not re-proposing: *"I was being stretched — using
  something in me all the way"* for (c), which an Epicurean in the Garden can
  answer, so it doesn't sort; and *"I came out of them different, and I'd take
  that over comfortable"* for (d), which staples a value declaration onto a
  noticed thing, argues with (a) and (b), and collides with the suffering branch's
  (c). Present-progressive "outgrowing" is load-bearing in (d) — it locates the
  good in the process, matching "life is self-overcoming," where a completed
  "I've outgrown things" reports a result.

---

## 2 · Right and wrong

**Axis: `moral_source`, found ↔ made** — as the design already has it. But the
routes need changing (see cross-cutting finding B).

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| found | Kant (rat), Aquinas (rat), Aristotle (emp), Mill (emp), Hume (emp), Plato (lit), Augustine (exp) | 4 |
| made | Nietzsche (lit), Sartre (exp), Camus (lit), Epicurus (emp), Foucault (emp), Marx (emp) | 3 |

Support: Epicurus — "there is no justice in itself, only a compact of mutual
advantage." Hume — "moral approval arises from sentiment informed by facts,
sympathy, and a general human standpoint," which is the design's own
found-as-grown route; his justice-as-convention pulls the other way, so he is the
one philosopher this axis has to make a call about. Aquinas — natural law, "an
unjust law is a kind of violence and not law in the full sense."

Note the *found* bucket needs Plato or Augustine to reach three approaches — Kant,
Aquinas, Aristotle, Mill is legal under the cap but is only two routes.

**This branch is structurally different from the other nine — settled 2026-07-29.**
Instead of one abstract split question, it runs **three concrete dilemmas**, each
with a text box and four options, and infers the pole from the pattern. The
appendix already lists "the ethics dilemmas" among what survived the ranking
design; this restores them.

### Why a naive dilemma set would fail

**Dilemmas measure `moral_ground`, not `moral_source`.** They were built to
separate duty from outcomes, and they are nearly silent on whether morality is
discovered or invented. A trolley problem cleanly separates Kant from Mill — and
Kant and Mill are on the *same pole* here. Meanwhile Nietzsche, Foucault, Sartre,
Camus and Epicurus have no distinctive answer to a trolley problem at all. Built
the obvious way, a dilemma set sorts the *found* pole internally and leaves the
*made* pole empty: an aligned bucket of four rationalists and empiricists, and a
challenger bucket with nobody in it.

**The fix: the dilemma is the vehicle; four fixed answer shapes carry the axis.**
Each case is concrete, but the shapes are constant across all three, so what gets
read is not the choice but the kind of reason reached for — three times, which is
far more reliable than asking once in the abstract.

| | Shape | Pole |
| --- | --- | --- |
| **A** | Wrong in itself. Outcome and audience don't enter into it. | *found · discovered* (Kant, Aquinas, Plato) |
| **B** | Wrong because of real damage. You can look and see. | *found · grown* (Mill, Hume, Aristotle) |
| **C** | It's against the agreement, and the agreement is all there is. | *made · convention* (Epicurus, Foucault) |
| **D** | I wouldn't, and I can't ground it any further than that. | *made · invented* (Sartre, Camus, Nietzsche) |

### The three dilemmas

**1 · The promise nobody can check**

> A close friend, dying, asked you to pass on the money they were leaving you to a
> brother they hadn't spoken to in years. There's no will and no record of the
> conversation. The money is legally yours. The brother doesn't know it was ever
> discussed.
>
> **What would you do — and why?**
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) I said I would. Whether anyone could ever find out doesn't come into it. → **A**
> b) Promises matter because people count on them. He never knew, so I'd think about who the money actually does more good for. → **B**
> c) A promise binds because we all act as if it does. There's nothing behind this one now — I might still pass it on, but not because I'm bound to. → **C**
> d) I'd hand it over, and not for any of those reasons. I'd rather not be the person who didn't. → **D**

**2 · The harmless lie**

> You're asked to write a warm reference for someone who was genuinely bad at the
> job, for a role where their being bad won't affect anyone.
>
> **What would you do — and why?**
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Nobody gets damaged, so I'd write it. → **B**
> b) I wouldn't write it, and not because of the harm. I just won't put my name to it. → **D**
> c) It's a lie. That's the entire objection. → **A**
> d) References are a game everyone knows the rules of. Inflating one isn't really lying. → **C**

**3 · The inherited benefit**

> You find out something you have — money, a place, a job — came to you through
> something unjust that happened before you were born, which you had no hand in.
>
> **What would you do — and why?**
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Everything I have came out of some earlier arrangement. Calling this one unjust is a choice about where to start counting. → **C**
> b) If it was wrong then, it's wrong now. A wrong doesn't expire because I wasn't there. → **A**
> c) I couldn't argue it either way, but I'd feel like a fraud keeping it. → **D**
> d) What matters is whether anyone's still being harmed. If they are, fix that. If not, it's history. → **B**

Shape order is scrambled — A/B/C/D, then B/D/A/C, then C/A/D/B — so a
straight-liner produces a mixed pattern rather than a pole.

### Inference

Majority of shapes wins; A/B → *found*, C/D → *made*. **Three dilemmas guarantee a
majority; two can tie 1-1 with nothing to break it but the text**, which would push
a deterministic stage onto the model. That is the argument for three rather than
two. Stays inside stage 1–2 determinism.

**Concerns.**

- **Shape C is systematically the hardest option to click, and C is half the made
  pole.** The first draft of dilemma 1 had C endorsing keeping the money, which
  makes clicking it a confession to profiting from your own metaethics — almost
  nobody does that. Fixed by decoupling C's claim from the self-serving action
  ("I might still pass it on, but not because I'm bound to"), which is also truer
  to Epicurus, who holds compacts genuinely useful and worth keeping and only
  denies there is justice in itself behind them. Dilemma 2's C is clean; dilemma
  3's is borderline. **If C comes in under 10% across all three, the made pole is
  running on D alone and Epicurus and Foucault effectively leave the topic.**
- **This inverts D13 on this branch, probably for the better.** Buttons become
  primary, the box becomes expansion. D13's objection to required text was that
  compelled text from a disengaged user isn't signal — but expanding on a choice
  already made is the cheapest possible ask. And because the box sits *above* the
  options, an engaged user writes before reading the four shapes, so no paraphrase
  is even available to them. That is the strongest form of D13's
  no-options-as-scaffolding argument.
- **It breaks D7's promise** that every branch is one question plus a box: the
  ethics path becomes six screens where every other path is four. Defensible —
  ethics is the one topic where laypeople have strong pre-verbal intuitions about
  concrete cases and cannot state their meta-ethics — but it is an argument for
  *not* letting this pattern spread. "What's actually real" has no equivalent case.
- **Three dominant text boxes will feel long.** Each is optional, so a disengaged
  user clicks three times and moves on, but the perceived length is three screens
  of blank box. Alternative is a box on dilemma 1 only. Kept all three because a
  "why" attached to a specific case is much better signal than a generic box, and
  the free text is what stage 2's override actually reads.
- **Dilemma 3 is politically loaded** and may sort on politics rather than
  meta-ethics. It is also the best of the three at making shape C sound reasonable
  rather than cynical, which is why it survives.
- **Marx drops off this topic.** Once "whose advantage" moved to the rules branch
  (cross-cutting finding B), his C-shape answer isn't distinctively his — that's
  Epicurus and Foucault. Tag him 1 on right-and-wrong.
- **Hume's value on this field is still a coin flip** and he is load-bearing for
  the found pole's empirical route. Sentiment-based virtue is found-as-grown;
  justice-as-convention is straight made. Log the reasoning when the value is
  written.
- Rejected: the single abstract split question, whose (b) — *"right and wrong come
  down to what actually helps or hurts people"* — was more belief-y than lived,
  and whose better-reading predecessor (*"I usually know what decency asks for in
  the moment"*) didn't sort at all, since an invented-morality person can equally
  say they can just see it. That's moral epistemology, not moral source.

---

## 3 · Suffering, loss, death

**Recommended axis: reframe ↔ face.** Does the weight come off when you see the
thing rightly, or is seeing it rightly precisely what makes it heavy?

This is the actual fault line of the literature and it is distinct from
`transcendence`, which is the trap here: any option about suffering being "part
of something larger" rebuilds the God shelf. Kierkegaard is transcendent and on
the *face* side; Epicurus, Marcus and Spinoza are non-theist and on the *reframe*
side. That crossing is what keeps the two shelves different.

**Populates — but see the concern.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| reframe | Epicurus (emp), Marcus (lit), Spinoza (rat), Aquinas (rat), Augustine (exp), Plato (lit) | 4 |
| face | Heidegger (exp), Kierkegaard (exp), Beauvoir (exp), Sartre (exp), Camus (lit), Nietzsche (lit) | **2** |

Support: Epicurus — "death is nothing to us... fear of it poisons a life it
cannot touch." Marcus — "if you are distressed by anything external, the pain is
not due to the thing itself but to your estimate of it, which you can revoke."
Spinoza — "we are passive insofar as our ideas are inadequate; the remedy is a
clearer, more adequate understanding of the causes." Camus — criticizes the
"leap" to hope as "philosophical suicide"; wants to "keep the tension alive
rather than dissolve it." Heidegger — being-toward-death "individualizes Dasein."
Beauvoir — old age is "constructed and imposed, not a natural fate quietly
accepted."

**Options — settled 2026-07-29.**

> **Think of something you lost and couldn't get back — a person, a relationship, a plan you'd built on. What helped, if anything?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Deciding it wasn't the disaster I'd first taken it for. → *reframe · judgment* (Marcus Aurelius, Epicurus)
> b) Understanding it properly. Once I could see why it happened, I stopped being at its mercy. → *reframe · understanding* (Spinoza, Plato)
> c) Nothing helped, and it changed what I take seriously — permanently. → *face · it forms you* (Heidegger, Kierkegaard, Nietzsche)
> d) None of the comforting things people said were true. → *face · no consolation* (Camus, Beauvoir)

**The prompt does three jobs beyond clarity.** "Lost and couldn't get back" names
irreversibility, which is what separates this topic from ordinary misfortune. "A
plan you'd built on" licenses answering about a job or a move rather than a
bereavement — lower stakes, and it signals the topic isn't only about death. "If
anything" de-biases: *"what actually helped"* presupposes something did, and
*reframe* is the only pole with a helping mechanism, so the earlier phrasing was
pushing users toward the pole that already under-collects.

**Rejected: any superlative framing.** The first draft asked for "the hardest thing
you've had to take," which is loose idiom, demands a whole-life ranking, and
escalates exactly where escalation is least affordable. Asking for the worst thing
is asking for the worst thing.

**Concerns.**

- **This bucket breaks the approach cap under screen 4's 5/3 ratio.** The *face*
  side offers only experiential and literary. Cap of two per approach × two
  approaches = four, so a five-slot bucket is unfillable without breaking the
  cap. This is open item 12 becoming concrete, and it happens here first. Two
  fixes: tag Hume ≥2 on this topic (defensible — the *Dialogues* on evil, and his
  own documented equanimity about dying — which gives the pole an empirical
  member), or make the cap conditional on bucket size. Recommend both.
- **Highest crisis-disclosure pressure of any branch.** The prompt asks about
  "the hardest thing you've had to take" and (a) and (c) both invite an account
  of it. This branch, plus "Am I free" (a), is where the blocking safety item
  actually bites. The wording lever available: orient the prompt to *what helped*
  rather than *what happened*, which is what the draft above does — but it does
  not remove the invitation, and I don't think any wording does.
- **(c) and (d) will both over-collect.** "It changed me" is the culturally
  dominant script for talking about loss, and (d) is the tough-minded option a
  self-selected philosophy-quiz population reaches for. Expect the *reframe* pole
  to starve, and Marcus and Epicurus to spend most of their time in challenger
  buckets. Distribution problem, not a logic problem; needs test #8 from day one.
- **The reframe pole carries the same defect as the ethics dilemmas' shape C** —
  it is the hard one to click, because "I talked myself out of it" reads as not
  having really felt it. (b) survives because "I stopped being at its mercy"
  claims power rather than avoidance; (a) is the fragile one. Same fix applies:
  never let the under-collecting option sound like evasion.
- Camus on the *face* pole is exact. Camus on the *enough* pole of question 1 is
  a stretch, resting on *The Rebel*'s insistence on limits and measure. If he
  can only have one, this is the one.

---

## 4 · Who am I, really

**Recommended axis: core ↔ no core.** Is there something underneath the roles,
the history and the relationships that is you, or is that all there is?

**This is not `agency`, and it must not be.** The design has `agency` splitting
both this topic and "Am I free," which by its own rule produces two shelves with
the same people on them. The two axes genuinely cross, which is the proof they're
separate fields:

| | core self | no core self |
| --- | --- | --- |
| **you were made** | Aquinas (rational soul as given nature) | Foucault (the subject is produced) |
| **you make yourself** | Kierkegaard (a self to become, and a true one) | Sartre (existence precedes essence) |

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| core | Descartes (rat), Aquinas (rat), Plato (lit), Augustine (exp), Kierkegaard (exp) | 3 |
| no core | Hume (emp), Locke (emp), Foucault (emp), Nietzsche (lit), Sartre (exp), Heidegger (exp), Hegel (rat), Beauvoir (exp) | 4 |

Support: Locke — "personal identity consists in continuity of consciousness, not
sameness of soul or body." Hume — "you question the idea of a simple, unchanging
mental substance without denying ordinary persons, character, memory, or
responsibility." Augustine — memory as "a vast interior country containing not
only images but the self," and the search leading "inward and then upward."
Kierkegaard — "the self is a relation that relates itself to itself and is
grounded in the Power that established it." Hegel — "self-consciousness requires
recognition by another self-consciousness."

**Options — settled 2026-07-29.**

> **Think about how you are at work, with family, and on your own. Is one of them more you than the others?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) One of them is the real me. The others are versions I put on for the room. → *core · beneath the roles* (Descartes, Plato, Aquinas)
> b) None of them, quite. There's a way of being me I recognise, and I'm often not in it. → *core · a self to become* (Augustine, Kierkegaard)
> c) They're all me. There's no fixed version underneath — I am what I do. → *no core* (Hume, Nietzsche, Wittgenstein)
> d) Which of them I am was mostly set before I got a say — family, class, the language I happened to get. → *no core · constituted* (Foucault, Hegel, Beauvoir)

**The prompt carries the axis directly.** "Is one of these the real you" *is* the
core/no-core question in lived form, which is why this branch needs no abstract
framing. The earlier version — *"set aside how you'd describe yourself; what do
you actually notice?"* — gave the user nothing to notice *about*. Third instance
of the same defect (after this topic and suffering), so it is now a rule:
**abstract prompts don't work; name settings or instances.**

**Distribution shape is the healthiest in the set.** (a) costs something — it
implies you're performing with most people. (d) costs something — you didn't get a
say. (b) and (c) are both comfortable. One comfortable and one costly option *per
pole* is a diagonal skew rather than the pole-wide skew that afflicts questions
1–3.

**Rejected wording for (c): *"I stopped looking for the real one a while ago."***
Privative — it reports a search abandoned rather than a position held, so it
collects people merely tired of introspecting. "I am what I do" asserts something,
and it is exactly Nietzsche's no-doer-behind-the-deed and Hume's denial of a simple
unchanging mental substance. Uncontracted "I am" is deliberate; it carries the
declarative weight the clause needs.

**Concerns.**

- **(d) is the closest thing to axis duplication in the whole set.** Someone who
  picks it here almost certainly picks (a) on "Am I free." I kept it because the
  no-core pole needs its social-constitution route — that's Hegel, Beauvoir,
  Foucault and Marx, and without it the pole loses its rational approach
  entirely. The mitigation is that the *pools* differ: Descartes, Locke and
  Wittgenstein are on this topic and not on freedom; Spinoza, Epicurus, Kant and
  Marcus are on freedom and not really on this one. Worth measuring once tags
  exist — if the two shelves come out >60% identical, (d) is the thing to change.
- **(b) leans flattering** — "the real me I'm not living as" is the
  self-improvement narrative. Trimmed from "I'm not in it as often as I'd like" to
  "I'm often not in it," which drops the wish and keeps the phenomenon; Kierkegaard's
  despair *is* the mis-relation you'd rather not be in. It's also the only thing
  that puts Augustine and Kierkegaard on their actual subject, so keep and watch it.
- (c) attributes Wittgenstein to a *selfhood* claim. That's the private-language
  argument used at a slant; defensible as "no inner object the word 'me' names,"
  but it remains the loosest annotation in this document.

---

## 5 · Am I free

**Axis: `agency`, made ↔ makes himself.** Unchanged. The work here is fixing
option (d), which open item 6 correctly identifies as broken.

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| made | Spinoza (rat), Hume (emp), Marx (emp), Foucault (emp), Augustine (exp), Heidegger (exp), Hegel (rat) | 4 |
| makes himself | Kant (rat), Sartre (exp), Kierkegaard (exp), Epicurus (emp), Locke (emp), James (emp), Nietzsche (lit), Marcus (lit) | 4 |

Support: Spinoza — "people believe themselves free because they are conscious of
their desires and ignorant of the causes that determine them." Augustine — "the
will cannot heal itself; grace is prior, unearned, and effective." Epicurus —
"atoms deviate slightly and unpredictably from their fall, which breaks strict
necessity and leaves room for voluntary action." Locke — "mature agency includes
suspending desire long enough to examine which course conduces to lasting
happiness." Kant — "autonomy is the rational will giving universal law to
itself; freedom is not doing whatever one wants."

**Question 1 of 3 — settled 2026-07-29.**

> **Think of a big decision you've made — a job, a move, a relationship. Looking back, could you have done otherwise?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Not really. By the time I got to it, the real options had already been narrowed for me. → *made · circumstance* (Marx, Foucault, Heidegger)
> b) I chose it, but I didn't choose to want it. That part was already set. → *made · causes* (Spinoza, Hume)
> c) Yes, and that's the uncomfortable part. It was genuinely open. → *makes himself · radical* (Sartre, Kierkegaard, Nietzsche)
> d) Yes — I could have overruled what I wanted. That's what made it mine. → *makes himself · self-governance* (Kant, Locke, Marcus Aurelius)

**Anchoring all four options to one specific decision is what makes this work.**
The *made · causes* route was unwritable as a general claim — "when I trace back why
I wanted something, it goes further back than me" asks a newcomer to run a causal
regress on their own desires, which nobody does unprompted, and it drifted from
freedom to desire. Tied to the decision, it becomes one clear line: "I chose it,
but I didn't choose to want it."

**Candidates for questions 2 and 3**, to draft when circling back:

1. A pattern in yourself you've tried and failed to change — why hasn't it
   shifted? (Augustine's divided will, Spinoza, Foucault)
2. Someone else who did something bad — could *they* have done otherwise? The
   asymmetry between how people judge their own constraints and other people's is
   the sharpest probe available on this topic, and no single question could have
   contained it.

**Rejected wordings.** *"The turns that mattered"* — "turns" is a literary
metaphor. *"What happened to me"* as a third item in (a) — the disclosure
invitation on this branch, and the option works without it. *"There are moments
where it's genuinely up to me"* and *"I can want something and not act on it, that
gap is where I actually decide things"* — both true to their routes, but as lived
options they read as the same claim (I make my own choices), because both were
about *deciding*. (d) is now about *resisting*: freedom as the capacity to decline
your own impulses rather than as an open space. That is Locke's suspension of
desire and Marcus's revocable judgment, and Kant's whole objection to radical
choice is that arbitrariness isn't freedom. Also rejected: *"For the choices I
make, I am completely free"* — a doctrine statement, the exact belief-claim register
D6 exists to avoid, and it drops the pricing clause that stops (c) over-collecting.

**Concerns.**

- **(d) replaces the akrasia option and fixes it by inverting it.** The old
  version — "I know what I'd rather be doing and I keep not doing it" — was a
  free agent reporting a failure of will, which sorts to neither pole. The gap
  between wanting and acting is the same phenomenon read the other way, and it is
  *exactly* Locke's suspension of desire and Kant's autonomy. This also rescues
  the makes-himself pole's empirical and literary routes, which the old option
  didn't supply.
- **Spinoza is the philosopher this axis actively misrepresents.** He denies free
  will (→ *made*) and defines freedom as acting from the necessity of one's own
  nature, i.e. understanding (→ sounds like *makes himself*). He belongs in the
  *made* bucket and the bucket label has to be written so he isn't made to look
  like a fatalist. This is a specific instance of open item 9's warning that
  "free vs determined" mislabels Foucault — the label problem is worse than the
  doc says, because it misfires on Spinoza in the opposite direction.
- **(c) will over-collect badly.** It is the existentialism option in an app
  whose audience skews existentialist, and it's the only one of the four with any
  drama in it. (b) is the most demanding and will under-collect. Expect the split
  to skew toward *makes himself* and the aligned bucket to be Sartre-heavy.
- **(a) invites disclosure of hardship** — second only to the suffering branch.
  Safety-relevant.
- Aquinas isn't placed. He affirms free will (the will moved by the apprehended
  good, "freedom lies in rational appetite") but has no stake in this framing;
  tag him 1 on the topic and keep him off the shelf rather than forcing a pole.

---

## 6 · Why we accept the rules we're handed

**Recommended axis: consent ↔ conditioning.** When you comply, does it go through
your reasons, or does it not reach them?

**Not "the rules are legitimate vs the rules serve someone."** That is
`moral_source` in different clothes and it collides head-on with question 2. The
compliance question is separable: Hume thinks morality is real *and* that
obedience runs on convention and habit; Heidegger has no theory of moral source
at all but a complete account of why you do what one does.

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| consent | Kant (rat), Hegel (rat), Locke (emp), Mill (emp), Hume (emp), Aquinas (rat), Plato (lit) | 3 |
| conditioning | Foucault (emp), Marx (emp), Heidegger (exp), Beauvoir (exp), Nietzsche (lit) | 3 |

Support: Foucault — the Panopticon induces "a state of conscious and permanent
visibility that assures the automatic functioning of power," and "the inmate
takes over the constraint by internalizing the gaze." Heidegger — "everyday life
tends toward the anonymous *they*, where possibilities and judgments are taken
over from what one does." Beauvoir — "the ways women are invited to consent to
their own diminishment, and the real advantages offered for doing so." Locke —
"political power becomes legitimate through consent... persistent breach of trust
can justify resistance." Hegel — freedom "becomes actual through rational social
institutions in which people can recognize laws and roles as expressions of a
common freedom."

Note the consent pole needs Plato for its third route; Kant/Hegel/Locke/Mill is
two approaches at cap.

**Question 1 of 3 — settled 2026-07-29.**

> **Think of a rule you follow without really thinking about it — something at work, or in your family. Why do you follow it?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) If I try to say why, I can't. It's just what's done. → *conditioning · anonymous* (Heidegger, Foucault)
> b) I can trace it back to what I was rewarded for. → *conditioning · formed* (Nietzsche, Beauvoir, Marx)
> c) I've looked into why it's there, and it held up. → *consent · reasons* (Locke, Mill, Hume)
> d) I've never examined it, but I can see what it's holding together. → *consent · order* (Hegel, Plato, Aquinas)

**(d) resolves a D8 violation previously recorded as unfixable.** The earlier
version — *"I follow plenty of rules I never agreed to, and I think that's fine; the
alternative is everyone deciding for themselves"* — reads as the authoritarian
option and would have under-collected badly. But that framing misrepresents the
route. Hegel's claim is not "someone has to be in charge"; it is that freedom
becomes actual through institutions people "can recognize as expressions of a
common freedom." Aquinas's is that law is an ordinance of reason for the common
good. "I can see what it's holding together" is a claim about *seeing* something
rather than about submitting, so it costs nothing to click and is truer to both.

**(c) and (d) needed separating**, for the same reason (c) and (d) did on freedom —
both were "the rule is justified." Now (c) is *scrutiny passed*: the rule answers to
me, which is Locke's consent and Mill's free discussion. (d) is *legible without
scrutiny*: the rule answers to the whole, not to me, which is Hegel's Sittlichkeit.
That also puts (a) and (d) in useful contrast — both unexamined, but (a)'s rule is
**opaque** and (d)'s is **legible**. Heidegger's anonymous "they" is exactly the case
where no reason is available.

**Concerns.**

- ~~**(d) risks reading as the wrong answer.**~~ **Resolved** — see the note above.
  The fix was recognising that the earlier wording misstated the route rather than
  that the route was unfashionable.
- **(b) still overlaps question 2's made-pole**, even after moving the advantage
  route out of ethics. "Traced to what I was rewarded for" and "morality is
  something we agreed to" are different claims, but the same person picks both.
  Acceptable; the pools differ substantially.
- **(c) was rewritten to stop being flattering.** The first version — "the rules
  I keep, I keep because I've thought about them and they hold up" — is a claim
  about the speaker's virtue and would have collected everyone who thinks well of
  themselves. The current version is a claim about rules, not about the reader.
- **(a) overlaps question 9's (d)** ("most of what I'm confident about I can't
  justify"). Same self-report, different object — unexamined rules vs unexamined
  beliefs. Both are keepable but they should not be reworded to converge further.

---

## 7 · What's actually real

**Recommended axis: something behind ↔ nothing behind.** Is what you encounter a
surface over a realer structure, or is it what there is?

**The critical requirement is that the "behind" pole have a non-transcendent
route.** Otherwise this is the God shelf again. Marx's commodity fetishism,
Epicurus's atoms and Foucault's episteme are all "the real thing is hidden and it
isn't divine," and they're what make this topic its own topic.

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| behind | Plato (lit), Kant (rat), Descartes (rat), Spinoza (rat), Aquinas (rat), Epicurus (emp), Marx (emp), Foucault (emp), Augustine (exp) | 4 |
| nothing behind | Aristotle (emp), Hume (emp), James (emp), Nietzsche (lit), Wittgenstein (lit), Heidegger (exp) | 3 |

Support: Marx — "commodity fetishism makes the social character of labor appear
as an objective property of products, so relations among producers take the
fantastic form of relations among things." Foucault — "each period has an
episteme, an underlying order determining what can count as knowledge."
Augustine — "the mind knows unchanging truths not by abstracting them from sense
but by a light that is not its own." Aristotle — separated Forms "neither explain
the being of sensible things nor account for their coming-to-be; they merely
duplicate the world they were meant to explain." Heidegger — "the present-at-hand
object of detached inspection is a derivative mode."

**Question 1 of 3 — settled 2026-07-29.**

> **Think about the world you deal with every day — objects, people, money. Is that the real thing, or a surface over something else?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) A surface. Once you see how something actually works, it's nothing like how it looked. → *behind · structure* (Epicurus, Descartes, Marx)
> b) A surface. The things I'd call most solid aren't physical at all. → *behind · beyond* (Plato, Augustine, Spinoza)
> c) The real thing. This is what there is. → *nothing behind* (Aristotle, Hume, James)
> d) That question has never made sense to me. Real as opposed to what? → *nothing behind · dissolve* (Wittgenstein, Nietzsche, Heidegger)

**Hardest of the ten to make concrete**, because it is the one topic with no case
structure — there is no metaphysical equivalent of a moral dilemma. What works is
letting the prompt carry the axis directly, as on "Who am I."

**(c) is fixed, and it was the worst option in the first draft.** *"The world in
front of me is the world; I've never had the sense that anything's hidden"* read as
incurious and would have under-collected — a D8 violation in the self-deprecating
direction. The defect was that it was **privative**: a denial rather than a
position, the same fault as the rejected "I stopped looking for the real one" on
selfhood. Aristotle's actual claim is assertive: separated Forms "merely duplicate
the world they were meant to explain." "This is what there is" stands its ground in
four words.

**(d) is Wittgenstein's move verbatim** — asking what picture holds the questioner
captive. Short without being seductive, and it is where he actually belongs, which
matters for open item 7 and cross-cutting finding D.

**One architectural consequence this topic surfaced.** All four routes fit one
prompt here, but only just, and the reason matters: in the ethics dilemmas the four
shapes are *reason-types*, which generalise across any case, whereas these are
*positions*, and not every position has something to say about every case. If a
later branch cannot fit all four honestly, the fallback is questions with unequal
option counts — which **biases the majority tally**, since a route appearing in two
questions rather than three is systematically undercounted. Decide in advance
whether the tally weights by appearances. Recommend forcing four per question for as
long as it stays honest.

**Concerns.**

- **(c) reads as incurious** and will under-collect, which is a D8 violation in
  the self-deprecating direction. It's also the honest Aristotelian and Humean
  position and I can't find a version with more pull that doesn't stop sorting.
  Worst option in the document; flag for rewriting.
- **Kant on this axis is arguable both ways.** There are things in themselves
  (→ *behind*) but theoretical reason cannot know them, and "transcendental
  idealism is empirical realism" means we genuinely know appearances (→ *nothing
  behind*, or at least nothing reachable). I'd tag him *behind* at 1–2, not 3,
  and not lead a bucket with him here.
- **Hegel does not belong on the *behind* pole**, despite the obvious temptation.
  The prompt is explicit: "the Absolute is not a static entity behind the world."
  Tag him low on this topic.
- (d) is where Wittgenstein actually lives, which matters for open item 7 — see
  cross-cutting finding D.
- (b) uses a two-item list where the first draft used three. Three read as
  rhetoric and would have skewed the distribution per the "no punchy second
  sentences" rule.

---

## 8 · How do we know anything

**Recommended axis: objective ↔ perspectival.** Can you get outside your own
standpoint far enough for it not to matter, or is standpoint always part of the
answer?

**What this must not be: reason vs experience.** That is the `approach` field,
which screen 3 already collects. Splitting this topic on rationalism/empiricism
makes screens 2 and 3 the same question and wastes the branch. The design doesn't
flag this and it's the biggest trap in the remaining nine.

**The independence test passes:** Locke and Foucault are both `empirical` and
land on opposite poles; Kant and Hegel are both `rational` and land on opposite
poles. The axis is not a relabelling of approach.

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| objective | Descartes (rat), Kant (rat), Spinoza (rat), Locke (emp), Aristotle (emp), Plato (lit), Augustine (exp) | 4 |
| perspectival | Foucault (emp), Hume (emp), James (emp), Nietzsche (lit), Wittgenstein (lit), Hegel (rat), Beauvoir (exp) | 4 |

Support: Nietzsche — "there are no immaculate facts free of interpretation;
knowledge is perspectival, and honesty about this is a virtue." James — "truth
happens to an idea; it is made true by events," and the will to believe where a
question "cannot be settled on intellectual grounds." Hume — "causal expectation
comes from experience and habit, not demonstrative insight." Wittgenstein —
"following a rule is a public practice, not an interpretation that mechanically
determines every future application." Descartes — "doubt is a temporary
instrument for finding firmer knowledge, not a permanent skeptical worldview."
Hegel — truth is "a whole whose moments become intelligible through their
development," and philosophy "comprehends its age."

**Question 1 of 3 — settled 2026-07-29.**

> **Think of something you're sure about that someone you respect disagrees with. What's going on there?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) One of us is wrong, and it could be settled if we both looked properly. → *objective · the world decides* (Aristotle, Locke, Descartes)
> b) I can't argue them into it, but I can see that it's so. → *objective · self-evidence* (Plato, Augustine, Kant)
> c) We grew up in different worlds. What counts as obvious isn't the same in each of them. → *perspectival · historical* (Foucault, Hegel, Nietzsche)
> d) If I'm honest, I couldn't justify mine either. I picked it up. → *perspectival · practice* (Hume, Wittgenstein, James)

**"Someone you respect" is load-bearing.** Without it the question collects "they're
an idiot" and sorts nobody; with it the user must account for a disagreement they
cannot dismiss.

**The "(a) and (b) are one route twice" defect is resolved.** Both earlier versions
were "there's a fact of the matter." They could not be separated because the obvious
second route — *reason settles it on its own* — is precisely what re-creates screen
3. The way out: the objective pole's real second route is **self-evidence**, Plato's
recognition and Augustine's illumination ("a light that is not its own"). That is
not derivation from premises, so it does not collide with `approach`, and it supplies
the pole its literary and experiential routes.

**Hume sits on (d), not (a).** He could answer either, but custom and habit are his
signature and the practice route needs an empiricist who isn't Wittgenstein or James.

**Rejected wording for (c): *"What's 'true' for one of us just depends on our
environment and our upbringing."*** Two faults, both serious. It attributes
relativism to three philosophers whose prompts explicitly disclaim it — Foucault's
says "do not present your work as relativism about truth," Nietzsche's perspectivism
holds that *honesty* about perspective is a virtue, and Hegel's truth is a
developing whole rather than something relative to persons. And "environment and
upbringing" collapses the route into personal biography, which is already (d)'s
territory here and the rules branch's (b), leaving three options converging on
childhood. The settled version claims that standards of obviousness vary — Foucault's
episteme in plain English — not that truth is relative to persons.

**Concerns.**

- **Worst expected distribution skew of the nine.** "It depends on your
  perspective" is the culturally default answer among educated respondents, and
  (c) is written to be recognizable. Both perspectival options will beat both
  objective ones and the challenger bucket will be the interesting one for most
  users. Either accept that (the shelf shows both buckets regardless, so the cost
  is bounded) or give (c) something to cost — currently it costs nothing to claim.
- ~~**(a) and (b) are the same route twice.**~~ **Resolved** — see the note above.
  Augustine's illumination now has an option describing it, which it previously
  didn't.
- (d) overlaps question 6's (a). Noted there; keepable, but they should not be
  reworded to converge further.
- **The skew here remains the worst of the ten.** (c) is the culturally default
  answer among educated respondents and will beat everything. The architecture
  change helps in a way not anticipated when this was first flagged: **a
  three-question tally dilutes single-question skew.** Someone who reaches for "it
  depends on your perspective" once may not reach for it three times across
  different concrete disagreements — and if they do, that is a real signal rather
  than a reflex. Second argument for three questions, beyond coverage.

---

## 9 · Do these questions have answers

**Recommendation: merge into "How do we know anything," and keep the phrase.**

Open item 8's three objections all hold — a roster of three or four, no way to
fill two buckets, and no justified split. The merge is right. Two things make it
cleaner than a straight deletion:

1. **The perspectival pole above is where these philosophers already live.**
   Wittgenstein (problems as knots in language), Nietzsche (no immaculate facts),
   Hume (mitigated skepticism), Foucault. Nothing is orphaned by the merge.
2. **Two options already catch the person whose real question is "is philosophy
   confused":** question 7's (d) and question 8's (d).

**Keep the exposure, drop the branch.** Screen 1's line becomes:

> · How do we know anything at all — or are we just arguing about words?

Screen 1 returns to ten options. Screen 2 needs **ten** branches, not eleven, so
D7's "×11" becomes "×10" and the authoring estimate drops accordingly.

What is genuinely lost: nothing on the shelf, one line of screen-1 taxonomy. The
skeptic who wanted a shelf of skeptics never had one available.

---

## Cross-cutting findings

### A. The axis count does not collapse. It is ten, one per topic.

The design hoped several topics could share a stance field ("arguably one fault
line in four costumes") and expected the true cost somewhere between 345 and 506
values. Writing all ten questions settles it the other way: **every topic needs
its own field**, because two topics sharing a field is the definition of two
shelves with the same people on them, which the design rules out. The
found/made/authored family in particular had to be broken into four separate
fields (`moral_source`, `sufficiency`, `selfhood`, `legitimacy`) precisely to
stop the shelves converging.

| Topic | Field | Poles |
| --- | --- | --- |
| What makes a life worth living | `sufficiency` | enough ↔ more |
| Right and wrong | `moral_source` | made ↔ found |
| Suffering, loss, death | `consolation` | face ↔ reframe |
| Who am I, really | `selfhood` | no core ↔ core |
| Am I free | `agency` | made ↔ makes himself |
| Why we accept the rules | `legitimacy` | conditioning ↔ consent |
| Is there a God | `transcendence` | nothing beyond nature ↔ divine order |
| What's actually real | `depth` | nothing behind ↔ something behind |
| How do we know anything | `standpoint` | perspectival ↔ objective |
| Other people | `sociality` | others cost you yourself ↔ others complete you |

Every pair I checked cross-cuts on at least three philosophers, so none of these
is a relabelling of another. The two most correlated pairs, worth measuring once
values exist, are `standpoint`/`depth` and `legitimacy`/`moral_source`.

**But the authoring cost is lower than 506, not higher.** A stance field is only
ever read *after* the pool filter, so it only needs a value for philosophers
tagged ≥2 on the topic it splits — roughly fourteen, not twenty-three.

```
topic tags     23 × 10  = 230
stance fields  14 × 10  = 140   (only within each topic's pool)
approach       23 ×  1  =  23
moral_ground   23 ×  1  =  23
                        -----
                          416
```

Recommend writing it as a sparse structure so the ~90 unneeded stance values are
*absent* rather than guessed. Guessing them invites someone to widen a topic tag
later and silently inherit a value nobody thought about.

### B. Decision needed: "whose advantage" belongs to one topic, not two.

The existing "Right and wrong" draft has a made-pole route about morality being
"inherited from someone's advantage." That is the whole subject of "Why we accept
the rules we're handed." Running it in both places gives Nietzsche, Marx and
Foucault the same position on two topics and produces near-identical shelves.

**Recommendation: it lives in "Why we accept the rules," and ethics' made-pole
runs on convention + invention instead** (Epicurus, Foucault, Marx / Sartre,
Camus, Nietzsche). Cost: Marx and Foucault become weaker fits on the ethics
shelf. That seems right — genealogy and normalization are answers to *why do you
obey*, not to *where does right come from*, and Nietzsche still carries the
debunking route onto the ethics shelf either way.

This changes D9's stated routes for the ethics question, which the design lists
as "usable."

### C. Bug in a question the design treats as finished: Spinoza on the God shelf.

The "Is there a God" question annotates option (a) with Spinoza on the
*transcendent* pole. `transcendence` is defined as "nothing beyond nature ↔ a
divine order." Spinoza's position is that God *is* nature — *Deus sive Natura*,
"the terms are interchangeable," and there is exactly one substance with nothing
outside it. He is the roster's clearest statement of the negative pole, and the
draft puts him on a shelf next to Aquinas under a label like "these four build
from something beyond the physical world."

This is the same class of error as the Kierkegaard-to-the-atheist-pole bug.
Suggested fix: Spinoza comes off (a) entirely; the reasoned-route annotation is
Aquinas and Descartes, which is enough. Spinoza's home topics are `depth`,
`agency` and `consolation`, where he is unambiguous.

Two smaller things in the same question: option (c) annotates Marx, but his
`systemPrompt` contains no treatment of religion at all — the ideology material
supports it at a stretch, and his topic tag on "Is there a God" should be 1, not
2, which would remove him from the pool anyway. And on open item 4, option (d):
the wish is the only place in the whole instrument where a user is asked to
report a longing, which is why it will under-collect. **Suggested rewrite that
keeps Camus and drops the confession: "I don't think there's anything there, and
I don't think that's good news."** Same content, framed as a judgment about the
world rather than an admission about oneself, which is also better D6 compliance.

### D. Open item 7: don't give Wittgenstein a fifth approach.

His route is neither argument, evidence, felt recognition nor image — it's
dissolution, which isn't a way of persuading at all. But a fifth `approach` value
breaks D3's arithmetic: the cap of two is clean only because four slots divide by
four approaches, and a fifth value makes the cap either toothless or distorting.

Recommend keeping him `literary` and accepting the consequence: screen 3 never
*leads* a bucket with him. For a philosopher whose appeal is second-order that's
a small price, and he still reaches shelves via `depth` (d) and `standpoint` (d),
which are his actual subjects.

### E. Open item 10, famous-name crowding: make the tag value 3 scarce.

My nine questions put Plato in seven of the ten pools and Aristotle in about six.
Test #3 (>60% of shelves) will trip on Plato. But pool membership isn't shelf
membership — selection ranks by topic fit, so the fix belongs in the ranking, not
the tags.

Concretely: **reserve the value 3 for "this is one of the two or three questions
this philosopher exists to answer,"** which makes 3 scarce by definition and lets
fit-ranking demote the honest-but-peripheral 2s. Plato is a 3 on `depth` and
`standpoint`, a 2 on five other things. That resolves open item 10 in favour of
accuracy without needing an artificial cap: he stays in the pools he honestly
belongs in and stops leading buckets he isn't central to.

### F. For the safety blocker: three branches carry most of the risk.

Not a solution, but the specific list, since the safety design has to be built
against actual copy:

| Branch | Where the invitation is |
| --- | --- |
| Suffering, loss, death | The prompt names "the hardest thing you've had to take"; (a) and (c) both invite the account |
| Am I free | (a) — "what happened to me" |
| Who am I, really | (b) — "I'm not always in it" |

The wording lever that exists is orienting prompts to *what helped* or *what you
notice now* rather than *what happened*. Both suffering and freedom above are
written that way already. It reduces the pull; it does not remove it, and I don't
think any wording does — the topics are the invitation.

---

## Remaining concerns not tied to one question

- **Distribution risk is systematically one-directional.** Across the nine, the
  option likely to over-collect is almost always on the same side: existentialist,
  perspectival, tough-minded, self-authoring. The rules against flattering options
  catch individual sentences but not this, because the skew comes from the audience
  a philosophy app self-selects, not from the wording. Concrete consequence: for
  most users the *aligned* bucket will be Sartre/Nietzsche/Camus-heavy and the
  *challenger* bucket will hold the more varied and probably more interesting
  four. Worth deciding whether that's acceptable before instrumenting, because
  the fix (writing the unfashionable options with more pull) has to happen at
  authoring time.
- **Two poles have only two approaches available:** `consolation · face`
  (experiential + literary) and, marginally, `legitimacy · consent` and
  `moral_source · found` before Plato/Augustine are counted. All three become
  unfillable at five slots. Open item 12 should be resolved as "cap scales with
  bucket size" rather than a flat two.
- ~~**Three options are weak enough that I'd rewrite before tagging:** question 7's
  (c), question 6's (d), question 8's (a)/(b) pair.~~ **All three fixed in the
  2026-07-29 review.** In each case the defect turned out to be that the wording
  misstated the route, not that the route was weak — worth remembering the next time
  an option looks unsalvageable.

---

## Still to do

### 1 · Eighteen questions

Question 1 is settled for all ten branches. Right and wrong is complete at three
dilemmas. Every other branch needs **questions 2 and 3**.

| Branch | Status | Outstanding |
| --- | --- | --- |
| What makes a life worth living | Q1 settled | Q2, Q3 |
| Right and wrong | **complete** (3 dilemmas) | — |
| Suffering, loss, death | Q1 settled | Q2, Q3 |
| Who am I, really | Q1 settled | Q2, Q3 |
| Am I free | Q1 settled | Q2, Q3 (candidates below) |
| Why we accept the rules | Q1 settled | Q2, Q3 |
| What's actually real | Q1 settled | Q2, Q3 |
| How do we know anything | Q1 settled | Q2, Q3 |
| Is there a God | Q1 inherited, 2 open items | rulings, then Q2, Q3 |
| Other people | Q1 inherited, needs pole fix + audit | fix, audit, then Q2, Q3 |

**Already sketched — "Am I free" Q2/Q3.** (i) A pattern in yourself you've tried and
failed to change: why hasn't it shifted? (Augustine's divided will, Spinoza,
Foucault.) (ii) Someone else who did something bad — could *they* have done
otherwise? The asymmetry between how people judge their own constraints and other
people's is the sharpest probe on this topic, and no single question could have
contained it.

### 2 · Rulings needed on the two inherited branches

**Is there a God** — both raised in the 2026-07-29 review, neither ruled on:

- **Spinoza is on the wrong pole in option (a).** `transcendence` is "nothing beyond
  nature ↔ a divine order," and Spinoza is the roster's clearest statement of the
  negative pole — *Deus sive Natura*, one substance, nothing outside it. The draft
  shelves him beside Aquinas under a label about something beyond the physical
  world. Same class of error as the Kierkegaard-to-the-atheist-pole bug. Suggested
  fix: he comes off (a); Aquinas and Descartes carry the reasoned route.
- **Option (d)'s wish** (open item 4). Suggested rewrite: *"I don't think there's
  anything there, and I don't think that's good news."* Same Camus content, framed
  as a judgment about the world rather than a confession about oneself, and better
  D6 compliance.
- Option (c) annotates Marx, whose `systemPrompt` contains no treatment of religion
  at all. His topic tag here should be 1, which removes him from the pool.

**Other people has the same structural defect as suffering, previously unnoticed.**
Its *cost* pole is Heidegger, Kierkegaard, Sartre and Beauvoir (all experiential)
plus Nietzsche (literary) — **two approaches**, which maxes out at four under the cap
and is unfillable at screen 4's 5/3 ratio. That is the open item 12 failure, on the
topic the design calls its best-populated. Two philosophers fix it and both belong
there on the merits:

- **Foucault** (empirical) — the Panopticon is others-as-constraint: "visibility is a
  trap, and the inmate takes over the constraint by internalizing the gaze."
- **Marcus Aurelius** (literary) — "you will meet the meddling and ungrateful," and
  the inner citadel: "nowhere is quieter than one's own soul."

**Route audit for Other people.** It was authored before the four-routes-per-question
discipline existed. Its (a) and (b) are genuinely distinct routes —
recognition/formation versus friendship-as-the-good — but Aristotle is annotated to
both, which is exactly the muddle the discipline exists to catch.

### 3 · Authoring checklist for questions 2 and 3

Derived from nine rounds of revision on the question 1 set. Every rule was learned by
breaking it.

1. **Name settings or instances; never ask abstractly.** "What do you actually
   notice?" gives the user nothing to notice *about*. Three questions had to be
   rewritten for this.
2. **Anchor all four options to the same concrete thing.** A question must sort into
   two poles *and* expose four routes; if the options aren't pinned to one case, the
   fourth drifts off-subject to stay distinguishable. That is what made *made ·
   causes* unwritable on freedom until it was tied to a specific decision.
3. **No superlatives.** "The hardest thing you've had to take" demands a whole-life
   ranking and escalates where escalation is least affordable.
4. **No stapled value declarations** — *"and I'd take that over comfortable," "and
   I'd rather have the truth."* They argue with the other options and import
   flattery. The one earned exception so far is freedom's (c), "that wasn't a
   relief," because the discomfort *is* the phenomenon for Kierkegaard and Sartre,
   and it prices an option that would otherwise over-collect.
5. **No privative options.** "I stopped looking for the real one"; "I've never had
   the sense anything's hidden." These report a search abandoned rather than a
   position held, and collect people merely tired of the question.
6. **No doctrine statements.** "For the choices I make, I am completely free" is the
   belief-claim register D6 exists to avoid.
7. **First person throughout.** "You are what you do" switches to addressing the
   reader and states a thesis.
8. **When an option looks unsalvageable, suspect the wording of misstating the
   route.** Three were written off as structurally unfashionable or incurious and all
   three were fixed by finding what the philosophers actually claim — Hegel's
   institutions as embodied common freedom rather than "someone has to be in charge,"
   Aristotle's assertive "this is what there is" rather than a denial.
9. **Keep the four options at comparable length.** Redundant clauses read as emphasis
   and over-collect: "outgrowing things *and raising my bar*" says one thing twice.
10. **Plain register.** No scare quotes, no "static," no "goes further back than me."
11. **Verify against `philosophers.ts`, including its "do not" instructions.** The
    prompts explicitly disclaim positions readers commonly assign — Foucault on
    relativism, Nietzsche on nihilism, Hegel on thesis–antithesis–synthesis. An option
    that puts a disclaimed position in their mouth is the precise failure this
    codebase's quality apparatus exists to prevent.
12. **Check every new option against the other nine branches for convergence.** One
    revision had three options across two branches all converging on childhood.
13. **Scramble option order between the three questions of a branch**, so
    straight-lining produces a mixed pattern rather than a pole.

### 4 · Architectural questions the three-question pivot opened

- **Tally weighting.** If a branch can't fit four routes into a question honestly,
  option counts go unequal and a route appearing in two questions rather than three
  is systematically undercounted. Decide whether the tally weights by appearances.
  Recommend forcing four per question for as long as it stays honest.
- **Six screens against D11 and open item 13.** Offered-not-forced onboarding at six
  screens, for a feature whose target user has to recognise they want it, carries
  drop-off risk the design hasn't addressed.
- **Test #8 thresholds.** The one-live-route pattern held in every question drafted:
  one of the two routes per pole is far more clickable than the other. Tolerable — a
  route's job is to guarantee the pole's candidate list has approach spread, not to
  collect users — but roughly four options in ten will come in under 10% without the
  question being dead. Set the threshold accordingly or expect false alarms.
- **Safety, still blocking.** The branch-level risk list is now concrete: suffering
  Q1 (the prompt names an irreversible loss), freedom Q1 (a), selfhood Q1 (b). Note
  that the three-question structure **multiplies** the exposure — three text boxes per
  branch rather than one.
