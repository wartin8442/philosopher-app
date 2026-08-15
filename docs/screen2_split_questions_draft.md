# Screen 2 — the nine remaining split questions (draft, 2026-07-29)

Companion to [`diagnostic_routing_design.md`](diagnostic_routing_design.md). Drafts the
nine questions the status table lists as unwritten, plus a ruling on the merge
candidate. Nothing here is finished; every section ends with concerns.

All philosopher claims below are checked against `src/lib/philosophers.ts`
(`systemPrompt` and `sources`), not from memory. Where the source text supports
both poles, that is said.

**Read the four cross-cutting findings at the bottom first** — two of them change
decisions the design treats as settled.

**Transcribed into code, 2026-08-14.** All thirty questions in §§1–11 — plus
the two branch question 1s that live in the design doc (§10 and §11) — are now
in `src/lib/diagnostic.ts` with their pole and route annotations, and they run
at `/start`. The wordings there are copies, not a second source: **change a
wording here first, against one of the numbered authoring rules, then
re-transcribe.** `src/lib/diagnostic.test.ts` pins the structure this document
argues for (four routed options, both poles reachable from every question,
routes constant across a branch, option order scrambled hard enough that
clicking one letter three times cannot produce a clean pole) and both
documented tally exceptions — §4's Q1-authoritative tiebreak and §5's plain
majority with Q2 deciding a first-person split.

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
agreeing fixes the pole. This makes
stage 2 *more* deterministic than the original design, not less, since the pole no
longer rests on a single button.

**Correction (2026-08-14).** The sentence above originally continued "the free
text is still stage 2's override." Superseded by the v6 ruling (design doc
D13): free text never changes the pole or group membership — the clicks decide,
deterministically — and text informs only within-group reranking and the
explanation. An override would have pushed a deterministic stage onto the
model, which is the exact failure §2's three-question tiebreak argument exists
to avoid. Correspondingly, every question requires an option click; the text
box is optional throughout.

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

**First documented exception (2026-08-07): `selfhood` runs two.** Its axis has only
two lived surfaces and Q1 and Q2 spend both; every third angle either repeats one of
them or belongs to a neighbouring topic. See §4's ruling, including the 1-1 tiebreak
that keeps stage 2 deterministic. Treat this as an exception to be argued per branch
rather than a licence — the case rests on selfhood being bordered by `agency`,
`sociality` and `consolation` at once, which no other topic is.

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
> d) They were the ones where I was outgrowing something; what had satisfied me stopped being enough. → *more · surpass* (Nietzsche, Beauvoir, Sartre)
>
> *(option click required; the box is optional — v6 ruling, design doc D13)*

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

**Question 2 of 3 — drafted 2026-08-14, pending author review.**

> **Suppose your life stays just as it is now, same work, same people, same days, for the next twenty years. How does that sit with you?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) It isn't really up to me whether it stays the same. What's up to me is how I approach it, my mindset going through it. → *enough · accept* (Marcus Aurelius, Spinoza)
> b) Something in me refuses. Twenty years with nothing outgrown isn't a life staying good; it's a life stopping. → *more · surpass* (Nietzsche, Beauvoir, Sartre)
> c) If those days are good ones, friends, work, no dread, that's the goal. It doesn't need to add up to anything more. → *enough · subtract* (Epicurus, Camus)
> d) Only if I'm still getting better inside it. The shape can stay; staying the same can't. → *more · exercise* (Aristotle, Mill, Marx)

Option order is B/D/A/C against Q1's A/B/C/D. The "same work, same people,
same days" clause is scenario, not examples — it is what makes the
hypothetical concrete (rule 1), and it pins the scale at whole-life (rule
14) without an example list. *(a), (c) and (d) are the author's wordings,
2026-08-14; (b) approved as drafted.*

**A prospect instead of a memory, which is this branch's mood lever.** §1's
recorded weakness is that Q1 contaminates with mood — someone tired picks
(a), someone restless picks (d) — because it asks the user to sample their
past. A fixed hypothetical gives every user the *same* object to react to,
so the reaction carries more axis and less day. The plateau is also the one
scenario both poles attack by name: Beauvoir's "confinement to repetition
and maintenance" against Epicurus's "once pain is removed, pleasure cannot
be increased, only varied" — the branch's live fight, run through time.

**Camus is placed, and (c) is his exact claim.** Sisyphus is the plateau
absolutized — the same task forever — and the ruling of that book is that it
can be enough without any appeal to something more: "one must imagine
Sisyphus happy." "It doesn't need to add up to anything more" is that
sentence at newcomer scale. His stretch-tag on this pole (§1) finally has a
clickable surface.

**Nietzsche on (b) needs a stage-5 guard.** Refusing the plateau is
authentically his — the last man is "the comfortable, riskless,
self-satisfied creature you despise" — but it must never be paraphrased back
as "Nietzsche rejects repetition": eternal recurrence *affirms* a life
willed again in every detail, and amor fati is the opposite of "I couldn't
stand things staying the same." What he refuses is a life with nothing
overcome in it, not sameness as such. The explanation copy gets the last
man, not the recurrence.

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **If the next ten years go well by your own standards, what does that look like?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) There's work I'm good at and getting better at, and it's building something that goes on longer than me. → *more · exercise* (Aristotle, Mill, Hegel)
> b) I need less by then. Fewer wants, fewer fears; the good version of me isn't larger, it's lighter. → *enough · subtract* (Epicurus)
> c) I'm someone I can't fully picture from here. If I can already see the whole of it, I'm aiming too low. → *more · surpass* (Nietzsche, Beauvoir, Sartre, Plato — see note)
> d) The world doesn't have to improve much for me to be successful; the change is in how I view it. → *enough · accept* (Marcus Aurelius, Spinoza)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, completing
the branch scramble (straight-lining checked: a-a-a = E/E/M, b-b-b = E/M/E,
c-c-c = M/E/M, d-d-d = M/M/E). *Prompt, (a) and (d) are the author's
wordings, 2026-08-14; (b) and (c) approved as drafted.*

**Route membership changes — checked against `philosophers.ts`,
2026-08-14.**

| Route | Q1/Q2 | Q3 | Why |
| --- | --- | --- | --- |
| *more · exercise* | Aristotle, Mill, Marx | Aristotle, Mill, Hegel | **Hegel is placed** — (a)'s "building something that goes on longer than me" is labor as he understands it: "labor transforms both the world and the worker's self-understanding," and freedom made actual in something standing rather than in private intention. The on-shelf member with no route now has one. **Marx comes off this question only**: a personal ten-year prospectus is not his register — his emphasis is transformed *conditions*, collectively — and he stays via Q1 (c) and Q2 (d). |
| *more · surpass* | Nietzsche, Beauvoir, Sartre | + Plato, with a note | **Plato's only honest surface on this branch is the upward pull past current sight** — the ascent "toward what is," the Good as "the hardest object of study," the cave-dweller who cannot yet look at what he is climbing toward. That is (c)'s claim minus the self-creation: for Plato the not-yet-visible aim is fixed and real rather than self-made. Distinct from his sociality route (there a *person* raises your sights; here the *aim itself* exceeds them). If the author judges the Sartre/Plato cohabitation too strange, the alternative is accepting Plato route-less on this branch, as with Aquinas on suffering. |

**Concerns — question 2.**

- **(b) will over-collect, as §1 predicted for (d), and for the same
  audience reason.** The counterweights are rule 15's work on the enough
  side: (c) claims the plateau as *the goal*, assertively, and (a) makes
  acceptance an inexhaustible activity rather than a resignation. Expect
  the skew anyway; test #8.
- **The mood problem is diluted, not solved.** A user in a bad week reads
  "same days for twenty years" as a threat regardless of their position.
  The fixed scenario at least makes the contamination uniform across users,
  which the memory question could not.
- **Finding F gains a mild row:** "how does that sit with you" over a
  twenty-year plateau can collect feeling trapped — a job, a marriage, a
  town — in present tense. Lower risk class than the suffering rows;
  listed for the safety design.
- **(c) must not be paraphrased as contentment doctrine for Camus.** His
  sufficiency is revolt-inflected — lucid persistence without appeal, not
  serenity. The copy guard class is the same as Spinoza's on the God shelf:
  right group, wrong shading available.

**Concerns — question 3.**

- **(c) is the drama option again** — the branch now has three surpass
  options in a row predicted to run hot (Q1's d, Q2's b, this). This is the
  audience skew §1 named, priced as well as wording allows; the aligned
  bucket will be Nietzsche-heavy for most users, and D12's challenger
  bucket is where Epicurus and Marcus do their work.
- **(a)'s "goes on longer than me" reaches legacy-minded users** who are
  not otherwise *exercise* people — the author's wording leans further into
  legacy than the draft did, which sharpens both the pull and this
  mis-sort. Acceptable: the route's claim is that the good life is
  capacity-in-use, and building is its most recognizable form.
- **(b) is deliberately single-member.** Epicurus's subtraction is the only
  clean "lighter, not larger" position in the pool — Camus's version lives
  on Q2 (c) and Marcus/Spinoza's on (d). A (b) click is strong Epicurus
  signal, as with Spinoza on suffering Q3 (d).
- **Mild convergence watch (rule 12):** Q3 (c)'s not-yet-picturable self
  sits near selfhood's becoming-language, and Plato's annotation sits near
  his other-people route. Both distinct in subject (a future vs. a self; an
  aim vs. a person); neither touches the banned belief-origin region.

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
> **What would you do, and why?**
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) I said I would. Whether anyone could ever find out doesn't come into it. → **A**
> b) Promises matter because people count on them. He never knew, so I'd think about who the money actually does more good for. → **B**
> c) A promise binds because we all act as if it does. There's nothing behind this one now; I might still pass it on, but not because I'm bound to. → **C**
> d) I'd hand it over, and not for any of those reasons. I'd rather not be the person who didn't. → **D**

**2 · The harmless lie**

> You're asked to write a warm reference for someone who was genuinely bad at the
> job, for a role where their being bad won't affect anyone.
>
> **What would you do, and why?**
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Nobody gets damaged, so I'd write it. → **B**
> b) I wouldn't write it, and not because of the harm. I just won't put my name to it. → **D**
> c) It's a lie. That's the entire objection. → **A**
> d) References are a game everyone knows the rules of. Inflating one isn't really lying. → **C**

**3 · The inherited benefit**

> You find out something you have, money, a place, a job, came to you through
> something unjust that happened before you were born, which you had no hand in.
>
> **What would you do, and why?**
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
| face | Heidegger (exp), Kierkegaard (exp), Beauvoir (exp), Sartre (exp), Camus (lit), Nietzsche (lit), Hume (emp) | **3** — Hume added by the 2026-08-14 ruling (`consolation` 2 · face, with the sourced equanimity entry), which closes this pole's two-approach problem |

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

> **Think of something you lost and couldn't get back, a person, a relationship, a plan you'd built on. What helped, if anything?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Deciding it wasn't the disaster I'd first taken it for. → *reframe · judgment* (Marcus Aurelius, Epicurus)
> b) Understanding it properly. Once I could see why it happened, I stopped being at its mercy. → *reframe · understanding* (Spinoza, Plato)
> c) Nothing helped, and it changed what I take seriously, permanently. → *face · it forms you* (Heidegger, Kierkegaard, Nietzsche)
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
  **Resolved 2026-08-14: both recommendations were ruled in** — Hume carries
  `consolation` 2 · face (with a new sourced entry in `philosophers.ts`,
  pending human verification), and the cap scales as ⌈slots/2⌉ (design doc
  D3, v6).
- **Highest crisis-disclosure pressure of any branch.** The prompt names an
  irreversible loss and (c) and (d) both invite an account of it. This branch, plus
  "Am I free" (a), is where the blocking safety item actually bites. *(Corrected
  2026-08-07: this bullet and finding F both still quoted "the hardest thing you've had
  to take" and options (a)/(c), which the 2026-07-29 rewrite replaced — the superlative
  was cut under rule 3 and the inviting options are now the two on the `face` pole.)* The wording lever available: orient the prompt to *what helped*
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

**Question 2 of 3 — drafted 2026-08-14, pending author review.**

> **Someone you care about lost someone close to them. What did they actually need from you?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Help making sense of it. Once it stopped feeling senseless, they could start to carry it. → *reframe · understanding* (Spinoza, Augustine, Aquinas — but see the Aquinas concern)
> b) Mostly just being there. Nothing anyone said actually helped, and they could tell when the comforting things weren't true. What mattered was that I stayed. → *face · no consolation* (Camus, Sartre, Hume)
> c) The right words at the right time. A lot of grief is thoughts, and a true thing said kindly can actually take some of the weight off. → *reframe · judgment* (Marcus Aurelius, Epicurus)
> d) Room. The grief was theirs to go through, and going through it is how it became part of them. I could walk next to them, but I couldn't carry it for them. → *face · it forms you* (Kierkegaard, Heidegger)

Option order is B/D/A/C against Q1's A/B/C/D, the same scramble scheme as
freedom's Q2.

**Third person, following the freedom Q2 precedent — and on this branch it is
also the safety lever.** This is the highest-disclosure branch in the set, and
its Q1 already points at the user's own loss. Pointing Q2 at someone *else's*
grief keeps the second question answerable without a second act of
self-disclosure, the way freedom Q2's third-party subject gave people a natural
voice. It does not remove the invitation — the box can still receive the
account of the friend's loss, or of the user's own smuggled in — so finding F
gains a row rather than losing one. Magnitude is pinned by "lost someone
close to them" — bereavement, not a breakup (rule 14). *Author revision
2026-08-14: an example clause ("a parent, a partner, a close friend") was cut
as unnecessary — the phrase itself carries the pin; see the rule 14 note on
example-clause rationing.*

**The question runs the axis through practice.** Q1 asked what helped; this
asks what help *is*. If seeing the thing rightly takes weight off, then words
can do real work — (a) by making it intelligible, (c) by answering the
thoughts inside it. If seeing rightly is precisely what makes it heavy, help
can only accompany — (b) because the comforting stories are false, (d)
because the grief is doing something that shouldn't be interrupted. The
(b)/(d) split is this branch's version of freedom's person/moment split and
should be assumed on Q3 rather than rediscovered: **(b) is a claim about the
truth of consolations, (d) a claim about what grief does.**

**Route membership changes on this question — checked against
`philosophers.ts`, 2026-08-14.**

| Route | Q1 | Q2 | Why |
| --- | --- | --- | --- |
| *face · no consolation* | Camus, Beauvoir | Camus, Sartre, Hume | **Sartre goes on**: bad faith is "the self-deception by which we flee freedom," and his character note "refuses them the comfort of excuses" — the comforting story handed to a grieving person is his exact target. **Hume goes on**: "nature, action, friendship, and common affairs restore practical confidence" — company, not argument, is his stated mechanism. **Beauvoir comes off**: her no-consolation support (old age "constructed and imposed, not a natural fate quietly accepted") is about refusing imposed scripts, not about consoling practice; she stays on the branch via Q1 (d). |
| *face · it forms you* | Heidegger, Kierkegaard, Nietzsche | Kierkegaard, Heidegger | **Nietzsche comes off.** His move on another person's grief would interrogate the consoler — what the comforting is doing for the comforter — the same judged-to-judger redirect that took him off freedom's Q2, and his prompt has no pity material to support a route here. He stays via Q1 (c) and Q3 (a). **Kierkegaard leads**: indirect communication is the claim that the decisive thing cannot be handed over — "you want the reader to appropriate truth for themselves, not merely be told it" — applied to the one relation where everyone learns it. |
| *reframe · understanding* | Spinoza, Plato | Spinoza, Augustine, Aquinas | **Augustine goes on**: evil as privation — "what is called evil is the privation of good... corruption is the loss of good" — is sense-making as consolation: the thing that took what they loved is not a rival power with a face. **Plato comes off**: reason's rule over the soul reaches the option only generically; he stays via Q1 (b). **Aquinas is placed here and it is the branch's thinnest annotation — see the concern.** |

**Rule 15 work is on (a) and (c).** The culturally dominant script for grief
support is exactly (b) — "don't say anything, just be there" is the advice-column
consensus — so the reframe options are the unfashionable ones here, inverting
Q1's skew. Both are written as confident claims of real help: (a)'s "they could
start to carry it" and (c)'s "can actually take some of the weight off" assert efficacy rather
than apologize for it, and (c) names its own discipline ("at the right
moment") so it cannot be read as barging in with philosophy. The fashionable
(b) carries its honest price: "what mattered was that I stayed" concedes there
was nothing to *do*.

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **Every so often it really hits you that you are going to die. What do you do with the thought?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) I let it stay. Those moments are when I'm most honest with myself about whether I'm living the way I actually want to. → *face · it forms you* (Heidegger, Nietzsche, Kierkegaard)
> b) I think it through, and the fear mostly comes apart. I won't be there for the thing I'm afraid of, and the worry itself doesn't last either. It works most of the time. → *reframe · judgment* (Epicurus, Marcus Aurelius)
> c) Nothing, really. It's just true. I don't reach for anything comforting, and it mostly doesn't torment me. → *face · no consolation* (Camus, Hume)
> d) I zoom out. I'm a small part of something much bigger that runs the way it has to, and my ending is as natural as my beginning. Seeing it that way is what calms me down. → *reframe · understanding* (Spinoza)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, completing the
freedom-pattern scramble. Straight-lining any single letter across the three
questions produces a mixed pole pattern (rule 13 checked: a-a-a = R/R/F,
b-b-b = R/F/R, c-c-c = F/R/F, d-d-d = F/F/R).

**Back to first person, and the branch now covers its own title.** Q1 is loss,
Q2 is others' suffering, Q3 is death — the three nouns of "Suffering, loss,
death," with no two questions sharing a subject (rule 12; see the rejected
retrospective-loss candidate below, which failed exactly that check). Two
first-person questions against one keeps the tally weighted toward the user's
own case, as on freedom.

**This question is the axis's sharpest test, because Marcus and Heidegger both
say: think about death.** Marcus — "constant recollection of death is not
morbid but clarifying. Everything is short-lived... Do the work in front of
you now" — and Heidegger — being-toward-death "individualizes Dasein," and
owning finitude is what frees a life from "anonymous drift" — recommend the
same practice and sit on opposite poles. The options split them exactly where
the section header splits the poles: in (b) the thought *settles* you (weight
comes off), in (a) the thought *audits* you (seeing rightly is what makes it
heavy). If a reviewer cannot tell (a) from (b), the branch's axis is broken —
this pair is the regression test.

**Placements and non-placements, checked against `philosophers.ts`:**

- **Hume lands on (c), and the annotation is contingent.** (c) is written from
  the "Facing death without religious terror (documented, 1776)" sources entry
  — composed and cheerful without consolation, "the prospect of not existing
  after death troubled him no more than not having existed before birth."
  **That entry is still pending the project's human-verification pass**; if it
  fails verification, (c) keeps Camus and loses Hume, and his branch presence
  falls back to Q2 (b).
- **Epicurus and Hume share the you-won't-be-there structure and the options
  keep them apart by mechanism**, which is the axis itself: (b) offers a
  remedy that works on the fear, (c) declines to need one. If user testing
  shows (b) and (c) reading as the same claim, the divergence to sharpen is
  remedy-offered versus no-remedy-needed.
- **Plato is deliberately not placed.** His honest mortality option is the
  soul's survival — recollection "supports the soul's existence before birth"
  (Phaedo) — and a survival option is this branch's transcendence trap: it
  would collect every believer on the shelf and rebuild the God axis inside
  `consolation`. He stays on the branch via Q1 (b).
- **Marcus fits (d)'s content and stays on (b).** "The cosmos is a single
  ordered whole governed by reason, and each of us is a part of it. What
  happens to the whole is not evil for the part" is (d) nearly verbatim — but
  one philosopher on two options of one question is the Aristotle muddle the
  route discipline exists to catch. His most distinctive mortality material
  (recollection of death as clarifying) is (b)'s, so (b) keeps him, and (d)
  runs single-member.
- **Aquinas and Augustine are not placed here.** Their mortality frame is
  beatitude and the life to come — theistic, hence the same trap as Plato.
  Augustine's branch route is Q2 (a); Aquinas's placement problem is Q2's
  concern.

**Rejected wordings and candidates.**

- *A retrospective-loss question* ("something that hurt badly a few years ago
  — what's your relationship to it now?") — natural, and it sorts; but it is
  Q1's subject in a different tense, the convergence rule 12 exists to catch.
- *"I'd rather have it plain than dressed up"* as (c)'s spine — rule 4's
  listed example nearly verbatim ("and I'd rather have the truth"). Replaced
  with behavior: "I don't reach for a comfort."
- *An immortality option* for (d) — the transcendence trap argued under
  Plato's non-placement above.
- *The ordinary-moment settings clause* ("driving home, a birthday, lying
  awake at night") — cut entirely by author revision, 2026-08-14, under the
  example-clause rationing note on rule 14: the thought's magnitude is
  intrinsic and needs no pin, and "really hits you" carries the intrusion.
  (An earlier draft's "three a.m." had already been rejected for coloring
  the prompt anxious.)
- *"What do you do with it?"* without restating "the thought" — the referent
  drifted to "dying."

**Concerns — question 2.**

- **The Aquinas annotation is the thinnest on the branch, and it needs a
  ruling.** His prompt's consolation material is beatitude — "the ultimate
  human end is beatitude, finally the vision of God" — which no non-theistic
  option can carry without rebuilding the God shelf, and (a) reaches him only
  through reason ordering the response to loss ("virtue perfects the powers
  of the soul"). The alternatives: accept the thin annotation so every pool
  member has a route; or leave him routeless on the branch — he keeps his
  computed shelf seat (suffer · reframe, tag 2) but no click ever points at
  him, a situation no branch has yet and the tally treats as silence.
  **Recommend accepting the thin annotation**, flagged for the explanation
  copy: stage 5 must not paraphrase (a) back as Aquinas's *argument*, only as
  his direction.
- **(b) will over-collect.** It is simultaneously the culturally sanctioned
  answer and the tough-minded one — the branch's usual skews for once point
  at the same option. (c) is the pro-scribed move ("never offer perspective
  to the grieving") and will under-collect despite the rule 15 work.
  Test #8 from day one, as with Q1.
- **Convergence watch (rule 12):** (b)'s presence-and-solidarity material
  sits near the Other-people branch's *complete* pole; when that branch's
  Q2–Q3 are authored, an option about showing up for someone must not
  reappear there.
- **Finding F gains a row:** the prompt names a bereavement in the user's
  circle and the box invites the account of it — including, smuggled, their
  own.

**Concerns — question 3.**

- **(a) will over-collect** — it is the drama option, as freedom's Q1 (c) is,
  and the same audience skew applies. (b) carries the rule 15 counterweight:
  assertive, priced honestly ("It works most of the time"), and written so
  that the person the fear actually torments — who is exactly who Epicurus
  exists for — can still click it without claiming achieved serenity.
- **(c) flirts with rule 5.** "Nothing, really" reports an absence; what
  saves it is that the absence *is* the position (no consolation needed,
  none taken — the same shape as Q1's (d)), and the final clause holds a
  stance rather than a fatigue. Watch that it doesn't collect users who are
  merely tired of the question.
- **(d) is the draft's only single-member route.** Tolerable — the route
  exists on Q1 and Q2 with two and three members — but it means a (d) click
  here is nearly a Spinoza vote, which the rerank should treat as strong
  signal rather than noise.
- **Finding F gains a row:** the prompt normalizes intrusive mortality
  awareness and the box invites an account of death anxiety. Distinct from
  Q1's row — this one can collect present-tense dread rather than past loss —
  and the safety design should treat sleepless-night-style text in this box
  as its likeliest arrival point on the branch.

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
| core | Descartes (rat), Aquinas (rat), Plato (lit), Augustine (exp), Kierkegaard (exp), Aristotle (emp) | 4 |
| no core | Hume (emp), Locke (emp), Foucault (emp), Nietzsche (lit), Wittgenstein (lit), Sartre (exp), Heidegger (exp), Hegel (rat), Beauvoir (exp) | 4 |

Support: Locke — "personal identity consists in continuity of consciousness, not
sameness of soul or body." Hume — "you question the idea of a simple, unchanging
mental substance without denying ordinary persons, character, memory, or
responsibility." Augustine — memory as "a vast interior country containing not
only images but the self," and the search leading "inward and then upward."
Kierkegaard — "the self is a relation that relates itself to itself and is
grounded in the Power that established it." Hegel — "self-consciousness requires
recognition by another self-consciousness."

**Question 1 of 2 — settled 2026-07-29.**

> **Think about how you are at work, with family, and on your own. Is one of them more you than the others?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) One of them is the real me. The others are versions I put on for the room. → *core · beneath the roles* (Descartes, Plato, Aquinas)
> b) None of them, quite. There's a way of being me I recognise, and I'm often not in it. → *core · a self to become* (Augustine, Kierkegaard)
> c) They're all me. There's no fixed version underneath; I am what I do. → *no core* (Hume, Nietzsche, Wittgenstein)
> d) Which of them I am was mostly set before I got a say, family, class, the language I happened to get. → *no core · constituted* (Foucault, Hegel, Beauvoir)

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
and it is exactly Hume's denial of a simple unchanging mental substance.
Uncontracted "I am" is deliberate; it carries the declarative weight the clause
needs.

**Correction (2026-08-07).** An earlier version of the paragraph above also credited
Nietzsche's "no doer behind the deed." That argument is not in his `systemPrompt` or
`sources` — the file gives self-overcoming, self-creation, perspectivism, and
ressentiment inverting values. His place on the no-core pole stands on those; the
citation did not. Rule 11, applied to this document rather than to an option.

**Question 2 of 2 — settled 2026-08-07.**

> **Think about yourself ten years ago. What's actually still the same?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) The person I'm trying to be. I move closer to it and further from it, but there's a concrete someone I'm supposed to become. → *core · a self to become* (Augustine, Kierkegaard, Aristotle)
> b) Who I am has been made for me, by my environment and the people around me. → *no core · constituted* (Foucault, Hegel, Beauvoir)
> c) The circumstances are different, but there's a concrete me who never changes. → *core · beneath the roles* (Descartes, Plato, Aquinas)
> d) I'm the same human being, same body, same memories, but there's no deeper me underneath that. → *no core* (Locke, Hume, Wittgenstein)

Q1 is the self across settings, Q2 the self across time. Option order is B/D/A/C
against Q1's A/B/C/D.

**(d) is the closest option-to-text fit in the document.** Locke: "personal identity
consists in continuity of consciousness, not sameness of soul or body." Hume: "you
question the idea of a simple, unchanging mental substance without denying ordinary
persons, character, memory, or responsibility." Both deny the deeper me while keeping
the body and the memories, which is what (d) says in the first person.

**Aristotle joins the *core · become* route.** Added 2026-08-07 to give the core pole
a fourth `approach` value, which it otherwise lacks — the pole was rational, literary
and experiential only. Supported by "virtue is a stable disposition acquired by
habituation" and eudaimonia as activity of the soul in accordance with virtue "over a
complete life": where you have got to is not yet the whole answer. Tag him 2 on
`selfhood`, not 3 — per finding E his 3s are elsewhere.

### Ruling — this branch runs two questions, not three (2026-08-07)

Three further angles were drafted and rejected. The inventory of what the axis can
be asked about is short enough to state in full, which is the argument:

| Surface | Verdict |
| --- | --- |
| Variation across settings | **Q1** |
| Variation across time | **Q2** |
| Subtraction — "if everything in your description changed, what would be left?" | rejected: Q2 with a bigger hypothetical, and the options map one-to-one onto Q2's |
| Different origins — "if your upbringing had been different, would you be someone else?" | rejected: near-analytic, so both core options come in under 10% (test #8); also lands on Q1's (d) |
| Acting out of character | rejected |
| Accuracy of self-report — "you had to describe yourself; how true was it?" | rejected: the options don't read as things a person would say about themselves |
| Which of your competing wants is you | rejected: same defect, and it collides with the sketched freedom Q2 (the divided will) |
| Owning a past action you'd now disown | reduces to Q2 — it is Locke's appropriation |
| Whether the question makes sense at all | one option (Wittgenstein), not a question |

**Why this branch and no other.** `selfhood` is a metaphysical claim with no case
structure to generate instances from — the defect §7 records for "what's actually
real," but worse, because selfhood is bordered on three sides. The volitional surface
belongs to `agency`, the social surface to `sociality`, loss-of-self to `consolation`.
Two lived surfaces are left, and Q1 and Q2 spend both.

**Tiebreak, required.** Two questions can tie 1-1, which §2 identifies as the failure
that "would push a deterministic stage onto the model." So: **on a 1-1 tie, Q1 is
authoritative.** Defensible on this branch specifically — the note above that "the
prompt carries the axis directly" is true of this Q1 and of no other branch's. Without
this rule the branch breaks stage-2 determinism and cannot ship.

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
  but it remains the loosest annotation in this document. **What he cannot carry**
  (checked 2026-08-07): his prompt states that the private-language argument "does
  not deny pain or first-person authority." Any option phrased as *"there's nothing
  in me I'd know that someone else couldn't see"* puts the disclaimed position in
  his mouth. One rejected Q3 draft did exactly that.

---

## 5 · Am I free

**Axis: `agency`, made ↔ makes himself.** Unchanged. The work here is fixing
option (d), which open item 6 correctly identifies as broken.

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| made | Spinoza (rat), Hume (emp), Marx (emp), Foucault (emp), Augustine (exp), Heidegger (exp), Hegel (rat) | **3** — no literary member; see the Q3 concerns |
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

> **Think of a big decision you've made, a job, a move, a relationship. Looking back, could you have done otherwise?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Not really. By the time I got to it, the real options had already been narrowed for me. → *made · circumstance* (Marx, Foucault, Heidegger)
> b) I chose it, but I didn't choose to want it. That part was already set. → *made · causes* (Spinoza, Hume)
> c) Yes, and that's the uncomfortable part. It was genuinely open. → *makes himself · radical* (Sartre, Kierkegaard, Nietzsche)
> d) Yes, I could have overruled what I wanted. That's what made it mine. → *makes himself · self-governance* (Kant, Locke, Marcus Aurelius)

**Anchoring all four options to one specific decision is what makes this work.**
The *made · causes* route was unwritable as a general claim — "when I trace back why
I wanted something, it goes further back than me" asks a newcomer to run a causal
regress on their own desires, which nobody does unprompted, and it drifted from
freedom to desire. Tied to the decision, it becomes one clear line: "I chose it,
but I didn't choose to want it."

**Question 2 of 3 — settled 2026-08-07.**

> **Think of someone who did something clearly wrong. Could they have done otherwise?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) No. People act on the strongest thing pulling at them, and nobody chooses what that is. → *made · causes* (Spinoza, Hume)
> b) Yes. Holding yourself back is something you can get better at, and they hadn't. → *makes himself · self-governance* (Locke, James, Kant)
> c) No. Nobody gets out from under how they were raised and what's around them. → *made · circumstance* (Marx, Foucault, Heidegger)
> d) Yes. People are completely free in the way they act; they chose wrongly, and they should take responsibility for it. → *makes himself · radical* (Sartre, Kierkegaard, Epicurus)

Option order is B/D/A/C against Q1's A/B/C/D.

**This is the asymmetry probe** previously listed as a Q2/Q3 candidate: Q1's hinge with
the subject changed — "could *they* have done otherwise" against "could you." A user
who answers (a) or (b) on Q1 and (b) or (d) here is showing something no single
question reaches. Contradictory combinations are signal, not noise.

**Third person is a deliberate departure from checklist rule 7, and it is what makes
the question answerable in a natural voice.** People discuss other people's choices
constantly and have ready phrasings for it; nobody has a ready phrasing for their own
metaphysics. The generalizing register in (a), (b) and (c) — "people act on…",
"nobody gets out from under…" — belongs to that. It is also why the question needs no
clause establishing that the user knows the person's background: the options are claims
about people applied to the case, so rule 2 holds without one.

**The two `makes himself` routes collapse by default on this branch — twice now.** On
Q1, (c) and (d) both read as "I make my own choices" until (c) was pinned to *deciding*
and (d) to *resisting*. Here both read as "they could have stopped themselves" until
(b) was pinned to the **person** — freedom as a capacity you build and can be short of
— and (d) to the **moment**. Author Q3 with the person/moment split assumed rather than
rediscovered.

**The split is textual, not a drafting convenience.** Kant's prompt contains an explicit
rejection of (d)'s framing: "autonomy is the rational will giving universal law to
itself; freedom is not doing whatever one wants." Locke supplies the buildable capacity
— "mature agency includes suspending desire long enough to examine which course
conduces to lasting happiness" — and James the mechanism, "voluntary effort of attention
is where the self is most itself," with habit as "the great flywheel of society."
Against them, Sartre's "condemned to be free… even not choosing is a choice" and
Kierkegaard's anxiety as "the dizziness of freedom" locate freedom in the open moment
rather than in the agent's discipline.

**Route membership changes on this question — checked against `philosophers.ts`,
2026-08-07.**

| Route | Q1 | Q2 | Why |
| --- | --- | --- | --- |
| *makes himself · self-governance* | Kant, Locke, Marcus | Locke, James, Kant | **Marcus comes off.** His prompt: "severe with yourself and forgiving of others, on the ground that people do wrong through ignorance of what is good," and *Meditations* II.1, "they act so through ignorance of good and evil." On third-person wrongdoing he is on the forgiving side, not "they could have stopped themselves." **James goes on** via voluntary effort of attention. |
| *makes himself · radical* | Sartre, Kierkegaard, Nietzsche | Sartre, Kierkegaard, Epicurus | **Nietzsche is a stretch here.** His move on another's wrongdoing is to ask what the condemnation is doing for the judge — ressentiment behind blame. A fifth position with no slot. **Epicurus goes on**: the swerve "breaks strict necessity and leaves room for voluntary action… you reject the determinism of the physicists as leaving no room for responsibility." He argues *from* responsibility. |

Marcus and Nietzsche both redirect attention from the judged to the judger, which is a
property of the question rather than a wording fault, and both stay on the branch via
Q1. Consequence: the *makes himself* pole has no literary member on this question.
Tolerable — spread is a property of the candidate set, not of each question — but it is
why the annotations differ between Q1 and Q2.

**Spinoza and Foucault land better here than on Q1.** Spinoza: "not to mock, lament, or
curse human actions, but to understand them," with "people believe themselves free
because they are conscious of their desires and ignorant of the causes that determine
them." That is (a)'s stance, and it partly answers the concern below that this axis
misrepresents him — here he is not a fatalist, he is the one refusing to curse.
Foucault: "discipline produces the delinquent rather than eliminating crime; the
prison's 'failure' is part of how it functions." A question about a wrongdoer is his
subject, where Q1's (a) reaches him only as generically narrowed options.

**Question 3 of 3 — settled 2026-08-07.**

> **Think about something about yourself you've tried to change and haven't, always running late, losing your temper, putting things off. Why hasn't it shifted?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Ultimately I choose it again every time. Nothing's forcing me to do it. → *makes himself · radical* (Sartre, Kierkegaard, Epicurus)
> b) Because my environment hasn't changed, and that's what actually keeps it going. → *made · circumstance* (Marx, Foucault, Heidegger)
> c) I just haven't developed the discipline to stop it. → *makes himself · self-governance* (Locke, James, Kant)
> d) Because I want it more than I want to stop. That's not something I get to decide. → *made · causes* (Augustine, Spinoza, Hume)

Option order is C/A/D/B, differing from Q1's A/B/C/D and Q2's B/D/A/C.

**Back to first person.** Q2's third-party subject is this branch's exception, not its
new default. Two first-person questions against one also keeps the tally weighted
toward the user's own case, which is what Q2's construct-validity concern wants.

**Augustine finally has a route.** He is in this branch's pool and annotated to *no
option* on Q1 — a coverage hole not previously flagged. (d) is *Confessions* VIII in the
first person: "the problem is not that we cannot do what we want but that we do not
wholly want it. The will is divided against itself," and "the will cannot heal itself;
grace is prior, unearned, and effective." The second clause of (d) is his rather than
Spinoza's, and he supplies the *causes* route its experiential approach.

**This question rescues the route that under-collects everywhere else on the branch.**
*causes* is the most demanding option in both Q1 and Q2. On a habit you cannot break,
"I want it more than I want to stop" is simply how people talk about it — the most
natural phrasing that route has had. If it collects here, the pole survives the branch.

**The person/moment split holds without being prised apart by hand**, unlike Q1 and Q2.
(c) says the pattern is a habit you can train out of; (a) says nothing is forcing it and
you pick it again each time. That is Sartre's bad faith — "pretending to be a thing with
a fixed essence," the over-performing waiter — against James's "habit is the great
flywheel of society" and Locke's suspension of desire.

**Marcus and Nietzsche are back in play** on (c) and (a) respectively. They came off the
routes on Q2 only because its subject is a third party; on a first-person pattern
Marcus's revocable judgment and Nietzsche's self-overcoming both apply. The Q1/Q2 route
table above is a Q2-specific exception, not a branch-wide revision.

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

**Concerns — question 2.**

- **(d) reinstates a wording this branch already rejected, by author decision
  (2026-08-07).** "People are completely free in the way they act" is the third-person
  form of *"For the choices I make, I am completely free"*, listed under Rejected
  wordings above as "a doctrine statement, the exact belief-claim register D6 exists to
  avoid." Logged rather than argued: the emphasis on choice and responsibility is
  wanted, and (d) does separate cleanly from (b). What it costs, specifically:
  - Sartre's prompt states that freedom "is exercised **within, not apart from,** a
    situation" — facticity and transcendence. "Completely free in the way they act"
    overstates him in the direction his prompt guards against.
  - His character note says "You do not moralize piously." "They should take
    responsibility for it" is nearer ordinary moralism than his ownership of freedom.
    The responsibility clause itself is **not** a rule-4 violation — his source line
    reads "condemned to be free and therefore wholly responsible" — so the objection is
    to the register, not the content.
  - Epicurus does not support "completely." The swerve "leaves room for voluntary
    action"; it does not make people wholly free.

  This is rule 11 territory. Concrete consequence to guard: if group copy or the stage-5
  explanation ever paraphrases (d) back to the user as Sartre's position, it will be
  wrong.
- **A safety clause was considered and declined (2026-08-07).** A drafted prompt read
  "…did something clearly wrong — **not to you**, but someone whose background you know
  a bit about." Both clauses were cut for register. The background clause is genuinely
  unnecessary, since the options generalize about people. The "not to you" clause was
  the safety lever, so blocking open item 1 must now cover an unqualified wrongdoing
  prompt with a free-text box. **Finding F's risk list gains a row: *Am I free* Q2 — the
  prompt names someone else's wrongdoing and the box invites the account of it.**
- **Construct validity is this question's real risk.** It may measure the fundamental
  attribution error rather than `agency`, and unlike the skews §8 discusses this one is
  directional and predictable rather than random, so a three-question tally does not
  dilute it. **Ruling needed:** either the tally weights first-person questions higher on
  this branch, or a Q1/Q2 conflict is read as nuance rather than averaged into a pole.
  The design licenses the second in prose — "contradictory-looking answer combinations
  are valid and often more informative" — but the majority tally as specified implements
  the first. **Ruled (2026-08-14): plain majority stands, no weighting.** When
  the two first-person questions agree they already form the majority and Q2
  contributes nuance only; when they split 1-1, Q2 decides the pole — and the
  explanation copy must present the mixed pattern as mixed rather than as a
  clean pole.
- **Marx's prompt forbids the strong reading of (c).** Social relations shape
  consciousness "without functioning as a mechanical one-way cause," and "do not turn
  historical materialism into technological determinism." Hence "picked most of it"
  rather than "they had no choice."
- **Hume is a compatibilist and (a) must not exculpate.** "Liberty and necessity are
  compatible when liberty means acting according to one's will without external
  constraint, **within the regular causal order required for responsibility**." He
  belongs in *made* only in the no-contra-causal-freedom sense. With the Spinoza concern
  above, the bucket-label problem on this branch misfires on **two** philosophers rather
  than one: neither is a fatalist and the label cannot imply it.
- **The *causes* route under-collects in both questions.** Q1's (b) and Q2's (a) are the
  most demanding options in their sets, so Spinoza and Hume may effectively leave the
  topic — the failure mode recorded for ethics shape C. Instrument the pair together
  under test #8.
- **Kant is the weakest member of (b) as phrased.** "Something you can get better at" is
  Locke's suspension of desire and James's habit; Kant joins via "Enlightenment is
  emergence from self-incurred immaturity," not via habituation. Locke and James carry
  the route — don't lead a bucket with Kant on the strength of this question.
- **New 2026-08-07: this question breaks checklist rule 14, and it is the only settled
  question that does.** "Someone who did something clearly wrong" leaves the magnitude
  entirely open, and it has no examples to pin it — deliberately, since the two clauses
  that would have steered it were cut for register. The options are not
  magnitude-neutral: "they should take responsibility for it" is proportionate to a
  betrayal and absurd about a rudeness, while "nobody gets out from under how they were
  raised" is plausible about a serious offence and overblown about a small one. So the
  user picks a magnitude first and the option follows from it. **This compounds the
  construct-validity concern above rather than duplicating it** — that one says the
  question may measure the fundamental attribution error, this one says it may measure
  what example came to mind. Both are directional, so a three-question tally dilutes
  neither. Rule 14's lever (three examples of matched scale) is available here and is
  also the safety lever the declined "not to you" clause was carrying, which makes
  reopening the prompt worth more than it costs. **Not fixed unilaterally — Q2's
  wording is the author's call and was made.**

**Concerns — question 3.**

- **(d)'s second clause is load-bearing and cannot be cut for length.** "I want it more
  than I want to stop" on its own is akrasia, which open item 6 correctly identifies as
  sorting to neither pole. "That's not something I get to decide" is what converts it
  into a claim about causes.
- **(a) will over-collect**, as Q1's (c) does and for the same reason. A drafted version
  said the same thing twice — "I choose it again every time… I really just choose it
  every time" — which was cut under rule 9, since redundancy reads as emphasis on the
  one option already predicted to run hot.
- **(b) was re-anchored away from formation.** A drafted version read "I can't change my
  environment, and my environment is what actually shapes me." That is a claim about how
  the self was made — `selfhood`'s constituted route and the rules branch's (b) — and it
  stops answering "why hasn't it shifted." The route is that the conditions producing the
  pattern are still producing it.
- **(c)'s deficit framing is right here and would be wrong on Q2.** A missing capacity is
  a bad answer to "could they have done otherwise" and a good answer to "why hasn't it
  shifted"; "haven't developed" carries the buildability that makes it self-governance
  rather than fate. Recorded so the apparent inconsistency between Q2 (b) and Q3 (c) is
  not "fixed" later.
- **Disclosure risk is handled by the examples rather than a clause.** "Something you've
  tried to change and haven't" reaches drinking, eating and self-harm for some users. The
  three examples steer light deliberately, and given the clause declined on Q2, examples
  are the better lever on this branch — they are natural where a caveat is not. **Finding
  F gains a row: *Am I free* Q3 — the prompt asks for a personal failure to change.**
- **Hegel is annotated on none of the three questions and fits none of them honestly.**
  His freedom is institutional and his homes are `sociality` and `legitimacy`. Recommend
  tagging him 1 on `agency` so he leaves the pool — the same call already made for
  Aquinas.
- **Bug in the Populates table above: the *made* pole has three approaches, not four.**
  Spinoza is rational; Hume, Marx and Foucault empirical; Augustine and Heidegger
  experiential; Hegel rational. There is no literary member. Three still fills four slots
  under the cap (2+1+1), so this is a counting error rather than the `consolation · face`
  failure — but it means Spinoza alone supplies the rational route, and removing Hegel
  per the bullet above does not change that. Corrected in the table.

---

## 6 · Why we accept the rules we're handed

**Recommended axis: consent ↔ conditioning.** When you comply, does it go through
your reasons, or does it not reach them?

**Not "the rules are legitimate vs the rules serve someone."** That is
`moral_source` in different clothes and it collides head-on with question 2. The
compliance question is separable: Heidegger has no theory of moral source at all
but a complete account of why you do what one does, and Hume's morality rests on
sentiment while his account of *obedience* runs on convention rather than promise
— two different fields in one philosopher.

**Correction (2026-08-07).** An earlier version of that sentence said Hume's
obedience "runs on convention and habit," which reads as the conditioning claim and
sat badly against his annotation on the consent pole. The looseness was in the
illustration, not the axis — see the Hume ruling below. The separability argument
stands on Heidegger without needing Hume at all.

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

**Question 1 of 3 — settled 2026-07-29; prompt revised by the author
2026-08-14** (the example clause "something at work, or in your family" cut
under the rule 14 note on example-clause rationing; options unchanged).

> **Think of a rule you follow without really thinking about it. Why do you follow it?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) If I try to say why, I can't. It's just what's done. → *conditioning · anonymous* (Heidegger, Foucault)
> b) I can trace it back to what I was rewarded for. → *conditioning · formed* (Nietzsche, Beauvoir, Marx)
> c) I've looked into why it's there, and it held up. → *consent · reasons* (Locke, Mill)
> d) I've never examined it, but I can see what it's holding together. → *consent · order* (Hegel, Plato, Aquinas, Hume)

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

### Ruling — Hume is on the right pole and was on the wrong route (2026-08-07)

He was annotated *consent · reasons* on Q1. Checked against `philosophers.ts`, that
is the one place on this branch the source text argues against the doc:

- His account of allegiance is that it does **not** run through the subject's own
  scrutiny. "Justice and government develop through convention, coordination, shared
  interest, and utility — **not an original contract**," and *Treatise* III: obligations
  "arise gradually through convention, common interest, and the stabilization of
  coordinated practices, not from an original promise or social contract." Q1's (c)
  — "I've looked into why it's there, and it held up" — is exactly the examination he
  denies ordinary obedience performs.
- Q1's (d) — "I've never examined it, but I can see what it's holding together" — is
  that same passage in the first person. Unexamined, and legible anyway, because the
  common interest is visible in the practice.

**So he moves to *consent · order*, on both questions.** He stays on the consent pole:
the axis asks whether compliance reaches your reasons, and Hume's convention runs on
perceived common interest, which is a reason. What it does not run on is a promise,
and only the *reasons* route required one.

**This changes nothing structurally**, which is why the call could be made on accuracy
alone. Both routes sit in the same pole, so the pole's approach spread (rational,
empirical, literary) is identical either way. What it buys is that *order* — otherwise
Hegel, Plato and Aquinas, i.e. rational and literary only — gains an empiricist, and
that the *reasons* route stops claiming a philosopher who spent his career denying it.

**Consequence: `consent · reasons` is now Locke and Mill, and it is empirical-only.**
Acceptable, because a route's job is to give its *pole* approach spread and the pole
gets rational and literary from *order*. But see the Kant hole below.

**Question 2 of 3 — ❌ REJECTED draft (2026-08-07, rejected the same day).
Not part of the instrument — kept only so it is not re-proposed; the live Q2
is further down.**

**The blocking objection: the prompt does not pin the magnitude of the offence.**
"Speeding, something at work, something in your family" runs from a parking fine to a
betrayal, and the options are all written at the trivial end — "out of all proportion"
and "fine, honestly" are answers about a small thing. So the user has to decide how bad
an example to summon before they can answer, and that decision, not their position on
`legitimacy`, determines which option they pick. **This is now checklist rule 14**, and
it is the reason the question fails; the two objections below are additional rather than
the cause.

- It measures moral psychology, not the axis. Three of the four options report guilt,
  and `legitimacy` asks whether compliance reaches your reasons.
- It invites a rationalisation. Nobody reports their own rule-breaking neutrally, and
  (d) — "the reason doesn't cover what I did" — is the standard post-hoc
  self-justification, so it collects people for having broken a rule rather than for
  being on the consent pole.

Underneath all three: it is Q1's shape again. Think of a rule, report your inner state.

> **Think of a rule you've broken, even a small one — speeding, something at work, something in your family. How did it sit with you afterwards?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Guilty — and I could tell whose voice the guilt was in. That's how I was brought up, not the rule. → *conditioning · formed* (Nietzsche, Beauvoir)
> b) It didn't bother me at the time. What I noticed after was how much I rely on everyone else keeping it. → *consent · order* (Hegel, Aquinas, Plato, Hume)
> c) It sat badly, out of all proportion. Nobody knew, and I still felt watched. → *conditioning · anonymous* (Heidegger, Foucault)
> d) Fine, honestly. I know what that rule is for, and it doesn't cover what I did. → *consent · reasons* (Locke, Mill)

Option order is B/D/A/C against Q1's A/B/C/D.

**Q1 asks why you comply; Q2 asks what it costs you not to.** Breaking
the rule is what makes the axis visible: a rule that reached your reasons leaves a
different residue from one that never did. It also does what Q1 cannot — Q1's four
options are all reports of a settled state, and a newcomer has no way to check them
against anything. The aftermath of a specific breach is checkable.

**The four routes separate on the *shape* of the feeling, not its intensity.** That is
the whole construction and it is what the chat draft got wrong. (a) and (c) are both
guilt out of proportion to a small offence; they differ in whether the guilt has an
author. (a) can name whose voice it is — Beauvoir's "upbringing, myth, law, economy,
expectation," Nietzsche's genealogy, where values "have a history and a psychology."
(c) cannot: "nobody knew, and I still felt watched" is the Panopticon in the first
person — Foucault's "the inmate takes over the constraint by internalizing the gaze" —
and Heidegger's anonymous *they*, where judgments "are taken over from what one does"
and there is nobody in particular to have taken them from. Symmetrically, (b) and (d)
are both untroubled, and differ in whether the reason was available in advance (d) or
only visible afterwards (b).

**(b) is the best-priced option in the branch.** It admits the thing didn't bother you
*and* concedes you are living off other people's compliance, so it costs something to
click in both directions at once — which is the distribution shape §4 identifies as
healthiest. It is Hume's convention, Aquinas's "ordinance of reason for the common
good," and Hegel's institutions "in which people can recognize laws and roles as
expressions of a common freedom."

**(b) is not the universalizability test and must not be reworded into it.** "How much I
rely on everyone else keeping it" is an observation about depending on a practice.
"What would go wrong if everyone did" — the phrasing an earlier draft used — is Kant's
maxim test, and Kant is not on this route. The two sound alike and are different
claims: one is about a standing dependence, the other about a contradiction in willing.

**Route change on this question — checked against `philosophers.ts`, 2026-08-07.**

| Route | Q1 | Q2 | Why |
| --- | --- | --- | --- |
| *conditioning · formed* | Nietzsche, Beauvoir, Marx | Nietzsche, Beauvoir | **Marx comes off.** (a) locates formation in a personal upbringing with an audible voice in it. His prompt puts formation at the level of social arrangements — "ideology is not simply a lie imposed from above; social arrangements generate forms of thought that invert, naturalize, and stabilize them" — and forbids the mechanical reading: relations shape consciousness "without functioning as a mechanical one-way cause." A structural claim has no first-person aftermath to report, which is a property of the question, not a wording fault. He stays on the branch via Q1's (b), "what I was rewarded for," which is impersonal enough to carry him. |

Same shape as freedom Q2's exception: the question's subject determines who can answer
it, and a philosopher can be right for a branch and wrong for one of its questions. **Q3
should be the structural question of this branch** — a rule you think is wrong and keep
anyway, or who a rule is for — which is where Marx is strongest and where Foucault and
Beauvoir gain rather than lose.

**Kant is annotated on neither Q1 nor Q2, and that is a coverage hole, not an oversight.**
He is in the consent pool and belongs there more sharply than anyone — autonomy is "the
rational will giving universal law to itself," and heteronomy is precisely a rule whose
reason is not your own. But he cannot have (d): "the reason doesn't cover what I did" is
an agent judging the scope of a rule case by case, and Kant's objection to exactly that
move is the centre of his ethics. And he cannot have (b), for the reason above. **Q3
must place him**, or he leaves a branch he ought to lead. The angle that fits is
*Enlightenment* — "emergence from self-incurred immaturity through public use of reason"
— which is a question about deferring rather than about breaking. Same class of hole as
Augustine's on freedom Q1, which Q3 closed there.

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

**Concerns — question 2.**

- **Three of the four options differ from the version drafted in chat, and the
  changes are listed so they can be reverted rather than rediscovered.** (i) (a) was
  "Guilty — and the guilt says more about how I was raised than about the rule";
  changed because it and (c) were then both *disproportionate guilt* and separated only
  by intensity, which a user cannot use. The current version separates them by whether
  the guilt has an author, which is also what separates Beauvoir and Nietzsche from
  Heidegger and Foucault. (ii) (b) was "It didn't bother me, but I could see what would
  go wrong if everyone did"; changed because that is Kant's maxim test in an option Kant
  is not on, and because the shrug-plus-insight combination reads as special pleading —
  the open concern carried in the handoff. (iii) (c) and (d) were shortened past the
  other two and were evened up under rule 9. **The prompt is unchanged**, including its
  three examples.
- **(a) will still over-collect**, and it now makes a fourth option across the
  instrument that resolves to childhood — with `standpoint`'s (d) ("I picked it up"),
  `selfhood`'s (d) ("set before I got a say") and this branch's own Q1 (b) ("what I was
  rewarded for"). Rule 12 was written after one revision produced three of these. The
  defence is that this one is about the *shape of a feeling* rather than the origin of a
  belief or an identity, and that a user meets at most one of the other three. Weakest
  point in the question; measure it before the wording is defended further.
- **This is the instrument's first prompt that asks the user to report an offence,
  and that is a different risk class from the rest of finding F.** The other branches
  invite disclosure of suffering; this one invites disclosure of something the user did
  and may not have been caught for. The three examples steer light deliberately — the
  same lever chosen on freedom Q3 over a caveat clause — but "something at work" reaches
  fraud and "something in your family" reaches worse. Blocking open item 1 has to cover
  a free-text box attached to an admission, which is a retention and disclosure question
  and not only a crisis-response one.
- **(c) may collect anxiety rather than the anonymous route.** "I still felt watched" is
  a good description of internalized discipline and also a good description of a
  disposition that has nothing to do with `legitimacy`. Foucault's point is that the
  watching has no watcher; the option can't say so without becoming a thesis. Accept and
  instrument; there is no wording that separates the phenomenon from the temperament.
- **The self-exemption worry moved from (b) to (d), where it is defensible.** "The
  reason doesn't cover what I did" is a person applying a rule's purpose to their own
  case and finding it doesn't reach — which is what the *reasons* route claims people do,
  so if it reads as convenient, that is the route being visible rather than a fault.
  Watch it under test #8 anyway: a self-selected audience may click it as a flex.
- **The routes are now lopsided at four and two.** *consent · order* carries Hegel,
  Aquinas, Plato and Hume; *consent · reasons* carries Locke and Mill. Legal — routes
  exist to guarantee approach spread, not to be equal — but if Kant lands on *reasons*
  in Q3 as recommended, the split becomes 4/3 and stops looking like an artefact.

**Question 2 of 3 — drafted 2026-08-14, replacing the rejected 2026-08-07
draft. Pending author review.**

> **Someone new asks you why one of your rules is the way it is. If you're being completely honest about what you believe, what do you tell them?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) I'd catch myself repeating what was said to me, almost word for word. → *conditioning · formed* (Nietzsche, Beauvoir)
> b) I'd point at what it holds together. Watch how things run here for a week and the rule explains itself. → *consent · order* (Hegel, Aquinas, Plato, Hume)
> c) Some version of "that's just how we do it." And honestly, that's the whole answer; I don't have a reason underneath it. → *conditioning · anonymous* (Heidegger, Foucault)
> d) The actual reason for it. And if that reason ever stopped being true, I'd drop the rule. → *consent · reasons* (Locke, Mill)

Option order is B/D/A/C against Q1's A/B/C/D, the slot the rejected draft
held.

**The shape change is the fix.** The rejected Q2 failed on rule 14 (unpinned
offence magnitude) and, underneath that, on being Q1 again — think of a rule,
report your inner state. This question asks for *behavior*: what actually
comes out of your mouth when compliance is challenged by someone who hasn't
been conditioned into it yet. That is checkable in a way a settled state is
not, it is a situation everyone has ready phrasings for (the freedom-Q2
lesson), and the newcomer supplies what Q1's "without really thinking" hides —
the moment a rule has to account for itself. Magnitude is pinned by "one of
*your* rules" — a rule the user owns and could be asked to explain is a
household or workplace rule, not a law or a moral crisis. *Author revision
2026-08-14: the asker examples ("a new hire, a kid, a houseguest") were cut
under the rule 14 rationing note; "someone new" carries the situation.*

**The honesty clause is the author's revision (2026-08-14).** "If you're
being completely honest about what you believe" was added to the prompt to
close the gap the behavioral framing left open: what people *actually* say to
a kid is often the social script ("because I said so"), which would have
funneled position-holders of every kind into (c). The clause points the
answer at the belief behind the utterance — the performed explanation and the
honest one come apart exactly on this branch's axis, and the question wants
the honest one.

**The axis runs through what you can transmit.** A rule that reached your
reasons can be handed over as a reason (d). A rule that is legible without
scrutiny can be pointed at doing its work (b) — seeing, not submitting, per
Q1 (d)'s D8 fix. A rule that never reached your reasons surfaces as either an
inherited script with an audible author (a) or an anonymous "how we do it"
with none (c) — the same has-an-author split that separated the rejected
draft's (a) and (c), preserved here because it is what separates
Beauvoir and Nietzsche from Heidegger and Foucault.

**Safety consequence, recorded for finding F:** replacing the broken-rule
prompt retires this branch's offence-report risk — the new Q2 asks for no
admission and its box invites an explanation, not a confession. Finding F's
rules-Q2 row is annotated accordingly; the rejected draft stays above as the
record of why.

**Route notes — checked against `philosophers.ts`, 2026-08-14.**

| Route | Q1 | Q2 | Why |
| --- | --- | --- | --- |
| *conditioning · formed* | Nietzsche, Beauvoir, Marx | Nietzsche, Beauvoir | **Marx stays off, for the rejected draft's recorded reason.** "Repeating what was said to me, almost word for word" locates formation in a personal upbringing with an audible author; his formation is structural — "social arrangements generate forms of thought that invert, naturalize, and stabilize them" — and his prompt forbids the mechanical one-way reading. He stays on the branch via Q1 (b) and returns on Q3, the structural question. |
| *consent · order* | Hegel, Plato, Aquinas, Hume | unchanged | (b) is Hume's convention made conversational — the common interest "visible in the practice" — and Hegel's institutions one can "recognize as expressions of a common freedom." |
| *consent · reasons* | Locke, Mill | unchanged | (d)'s revisability clause is Mill's free discussion (a rule kept alive by its reason) and Locke's trust that can be forfeited. **It is deliberately not the maxim test** — the rejected draft's warning stands: Kant is not on this route until Q3. |

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **Think of a rule you follow even though you think it's wrong or pointless, a dress code, a report nobody reads. Why do you keep following it?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Honestly, it's easier to just go along with it. I could push back, and I keep not doing it; that one's on me, not the rule. → *consent · reasons* (Kant, Locke, Mill)
> b) Following it isn't really a decision I make. It's just what everyone does here, and the moment to step out of line never actually comes. → *conditioning · anonymous* (Heidegger, Foucault)
> c) Because it isn't only mine to drop. Even a pointless rule is holding something up, and other people are counting on it being kept. → *consent · order* (Hegel, Aquinas, Plato, Hume)
> d) When I ask who the rule actually works for, it isn't me. It stays because it suits the people it suits. → *conditioning · formed* (Marx, Nietzsche, Beauvoir)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, per the ethics
precedent as the Still-to-do section specified.

**This is the structural question §6 promised, and both fixed jobs are done.**
A rule you think is wrong and keep anyway is where compliance and consent
come apart cleanly — Q1 asked why you comply, Q2 what you can transmit, Q3
what holds when your own judgment has already voted no.

- **Kant is placed, and the branch stops leaking its sharpest member.** (a)
  is *Enlightenment* in the first person: "emergence from self-incurred
  immaturity through public use of reason" — the immaturity is self-incurred,
  which is exactly the option's "that one's on me, not the rule." He lands on
  *consent · reasons* as recommended, the route becomes Kant, Locke, Mill
  (4/3 against *order*, as predicted), and heteronomy — a rule whose reason
  is not your own — is finally an option a user can click.
- **Marx is back, on the route built for him.** (d) is the whose-advantage
  question at the structural level — ideology that naturalizes arrangements —
  with no personal voice required, which is what kept him off both Q2s.
  Finding B's ruling that "whose advantage" belongs to this topic alone is
  honored: the option lives here and nowhere else in the instrument.
- **Beauvoir's annotation on (d) carries a nuance stage 5 must keep.** Her
  prompt's claim is that consent to diminishment is *invited and rewarded* —
  "the real advantages offered for doing so" — so her version of (d) includes
  rules that partly suit the very people they diminish. The option's "it
  suits the people it suits" leaves room for that reading; explanation copy
  should not flatten her into "the rules serve someone else."

**The (a)/(b) split is the deferral version of freedom's person/moment
split.** Both options keep a rule the user disowns, and they differ in where
the not-resisting lives: (a) owns it as a choice being made and remade — the
push-back is available and declined — while (b) reports that the occasion
for deciding never even forms; the "they" has absorbed it. If a reviewer
can't tell them apart, apply the recorded fix: (a) is priced self-blame,
(b) is the missing moment.

**Rejected wordings.**

- *"I rely on everyone else keeping it"* as (c)'s spine — the rejected Q2's
  best-priced phrasing is available again now that its question is dead, but
  it answers "what would happen if I stopped" rather than "why do you keep
  following it"; "people are counting on it being kept" keeps the dependence
  claim pointed at the question asked.
- *"Because I'd be the problem if I stopped"* for (b) — reads as social fear,
  which is temperament, not the anonymous route; the Foucault/Heidegger claim
  is about the missing occasion, not anxiety about others' opinions.
- *"It's not worth the fight"* for (a) — drops the self-incurred clause that
  makes it Kant's; without "that's on me," it is indistinguishable from (b).
- *A law you think is unjust* as an example — wrong magnitude class (rule
  14), and it invites political self-disclosure the branch doesn't need;
  "outlived its reason" keeps the examples domestic.

**Concerns — question 2 (replacement).**

- **(d) will over-collect and (c) is the hard click.** Claiming "the actual
  reason" flatters the explainer; admitting "I don't have a reason
  underneath it" costs.
  Rule 15's counterweight is (c)'s honesty being *accurate* — the option
  concedes exactly what Heidegger claims is true of everyone most of the
  time — and (b) giving the unexamined-but-legible position real pull
  ("watch how things run here for a week"). Instrument under test #8.
- **(a) requires unusual self-awareness.** Catching the inherited voice in
  your own mouth is a reflective achievement; users who would sort *formed*
  may lack the observation and land on (c). The tally survives it — both
  options are conditioning — but the route pattern under-reports the
  Nietzsche/Beauvoir nuance. Acceptable: the pole is what the tally needs.
- **Convergence check (rule 12):** (a) is the fifth childhood-adjacent option
  across the instrument (the rejected Q2's count plus one). Defense as
  before: it reports transmission behavior, not origin of belief; and a user
  meets at most one or two of the others. The count is now high enough that
  whichever branch drafts next should avoid the region entirely.

**Concerns — question 3.**

- **(a) is the instrument's first self-blame option, and it is deliberately
  priced.** Rule 4's stapled-declaration ban is not violated — "that's on me"
  is the route's content (self-incurred immaturity), the same earned
  exception as freedom's "that wasn't a relief." But a user in a low mood may
  click it as confession rather than position; stage 5 must not paraphrase it
  back as a character judgment.
- **(c) can be read as loyalty rather than legibility.** "People are counting
  on it" is Hume's convention, but it is also what a person says about a rule
  they merely lack the nerve to break. The difference from (a) is that (c)
  affirms the rule's work; watch whether users split on that or on
  temperament.
- **(d) names no villain deliberately.** "It suits the people it suits" stays
  descriptive; a sharper "it protects the people in charge" would be truer to
  Marx alone and false to Beauvoir's invited-consent nuance, and would
  collect grievance rather than analysis.
- **Free text here can turn political.** The prompt steers domestic, but "a
  rule you think is wrong" will collect laws, employers, and churches from
  some users. Not a finding F crisis row — no distress invitation — but the
  retention question (what the box stores about stated dissent) belongs to
  blocking item 1's scope, and is noted there.

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

> **Think about the world you deal with every day, objects, people, money. Is that the real thing, or a surface over something else?**
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

**Question 2 of 3 — drafted 2026-08-14, pending author review.**

> **Think of a time you saw through something everyone around you treated as just how things are, a price, a job title, a way of living. What did seeing through it show you?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) That some things shift with opinion and some don't. The price turned out to be arbitrary, but what I was judging it against isn't. → *behind · beyond* (Plato, Spinoza, Augustine)
> b) I'm not sure I saw through anything. I found another way of describing it, and the new description can trick you just as much as the old one. → *nothing behind · dissolve* (Wittgenstein, Nietzsche)
> c) That it was built. It had been sitting there looking like a fact of nature, but it has a history, and that means it could be different. → *behind · structure* (Marx, Foucault, Epicurus)
> d) That it works. Most "just how things are" is an arrangement people keep because it does something for them, and seeing that isn't seeing through it, it's seeing it clearly for the first time. → *nothing behind* (Hume, Aristotle, James)

Option order is B/D/A/C against Q1's A/B/C/D. The example clause survives the
rationing note deliberately: without "a price, a job title, a way of living"
the domain is unpinned — the user can reach for religion, which rebuilds the
God shelf inside `depth`, or for Santa Claus, which is the wrong magnitude.
The three examples pin *social convention at adult scale*, which is the one
domain where all four positions have something to say.

**This is the topic's one case structure, found late.** §7's recorded problem
is that metaphysics has no dilemma equivalent — but the *seen-through
convention* is a lived metaphysical event: everyone has one, and the four
readings of it are exactly the four routes. It also finally gives the section
intro's own star witness a route: **Foucault is placed** on (c), in his own
words — "what appears necessary has a history, and therefore need not be as
it is" — beside Marx's arrangements "looking like a fact of nature."

**(c) is deliberately authorless.** An earlier wording — "somebody's
arrangement" — put a conspirator behind the curtain, which is a rule 11
violation for Foucault (power is "relational, dispersed... not merely held by
a state or a class") and a cheapening of Marx (fetishism is structural, not a
scheme). "It has a history" carries the route without a villain, and stage 5
must keep it that way.

**(d) is the rule 15 rescue of the branch's weakest position.** The plain
route's Q1 option is flagged as the worst in the document; here it gets its
own assertive content — Hume's actual account of convention ("justice and
government develop through convention, coordination, shared interest, and
utility"), Aristotle's endoxa, James's what-works. "Seeing that isn't seeing
through it, it's seeing it clearly for the first time" claims the deeper
insight for the no-depth position, which is exactly the pull the pole has
been missing.

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **Think about something that would stay true no matter what happened to the world, two and two making four, say. What kind of real is that?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) It's a truth about ordinary things. Two rocks and two rocks make four rocks; you don't need a second world to make that true. → *nothing behind* (Aristotle, James)
> b) It's the order the world itself runs on. The same necessities sit under every surface, no matter what the surface looks like. → *behind · structure* (Descartes, Epicurus)
> c) It lives in how we use it. The certainty comes from the practice of mathematics itself, no ghostly realm behind it, and nothing missing because of that. → *nothing behind · dissolve* (Wittgenstein)
> d) It isn't anywhere in the world, and that's the point. Some things are real without being things, and those are the steadiest real there is. → *behind · beyond* (Plato, Augustine, Spinoza, Aquinas)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, completing the
branch scramble (straight-lining checked: a-a-a = Be/Be/No, b-b-b = Be/No/Be,
c-c-c = No/Be/No, d-d-d = No/No/Be). The single example ("two and two making
four, say") is domain-pinning of the same kind as Q2's: without it the user
supplies "God's love" or "my values," and the question stops measuring
`depth`.

**Placements and route thinning — checked against `philosophers.ts`,
2026-08-14.**

| Route | Q1/Q2 | Q3 | Why |
| --- | --- | --- | --- |
| *behind · beyond* | Plato, Augustine, Spinoza | + Aquinas | **Aquinas is placed**, via the gradations-of-being material in his prompt (the fourth way's "gradations of being" — some reals steadier than others), with no God named in the option. Medium-thin rather than suffering-thin: the supporting text exists, it is just usually deployed theistically. |
| *nothing behind* | Aristotle, Hume, James | Aristotle, James | **Hume comes off this question only**: his prompt has no mathematics material (the relations-of-ideas fork isn't in it), so annotating him would outrun rule 11. He stays via Q1 (c) and Q2 (d). James is the loose member — math as the paradigm of what "connects with other beliefs and stands up" — kept with that flag. |
| *nothing behind · dissolve* | Wittgenstein, Nietzsche, Heidegger | Wittgenstein | Certainty-as-practice is nobody else's subject. Single-member route, strong-signal precedent (Spinoza on suffering Q3, Epicurus on worth Q3). Nietzsche and Heidegger stay via Q1 (d). |

**~~Proposed~~ ruling — Kant off the `depth` pool (tag 2 → 1). ✅ Applied
2026-08-14** when the matrix was transcribed into `philosophers.ts`; recorded
in the preview doc's rulings log. Confirmed no shelf change: he is a rational
tag-2, and `rational` was already occupied by Spinoza before tier 2 opened on
the *something behind* group, so the diversity tie-break never reached him.
Original statement of the proposal: He is the one
pool member left with no route after these two questions, and the reason
tracks the Kant/Hegel God-pool precedent exactly: any *behind* option he
could ride collides with his prompt's own "do not" — "Do not present the
noumenal realm as a second hidden world we can describe." Q3 (b) was drafted
mind-neutral precisely because wording it to include Kant ("any world you
could meet must already have that shape") makes it stop being Descartes and
Epicurus's option. §7's standing concern already says "arguable both ways…
tag him 1–2." Recommend 1: out of the pool, off the bumped list, no shelf
change (he was never on this shelf). ~~**Author ruling needed.**~~

**Concerns — question 2.**

- **(c) will over-collect** — seeing-through is flattering, and this
  audience arrives pre-sold on it. (d) is the counterweight and carries the
  branch's rule 15 burden; instrument the pair under test #8.
- **"A price" grazes Q1's example list** ("objects, people, money").
  Accepted: Q1 uses money as scenery, Q2 as the seen-through case, and
  fetishism has no better newcomer instance.
- **Finding F, mild row:** the box can collect disillusionment narratives —
  a lost faith, a family myth, an institution that failed the user. Lower
  risk class; listed for the safety design.
- **(b) must not collect global cynicism.** "The new description can trick
  you just as much as the old one" is Wittgenstein's picture-holding-captive
  plus Nietzsche's unmasking-is-also-interpretation, not "nothing is ever
  really seen through." If stage 5 paraphrases it, it paraphrases the
  method, not a shrug. The redraft's opening ("I'm not sure I saw through
  anything") is closer to spoken register than the drafted "I'd be careful
  with 'saw through'" but leans nearer modesty than method — watch that it
  does not collect users who simply distrust their own judgment.

**Concerns — question 3.**

- **Reserves mathematics for this branch.** The know branch's objective pole
  lives next door to this material (geometry that doesn't care where you
  stand), and its Q2–Q3 are still unwritten: **they must not use
  mathematical examples**, or the two branches' questions converge (rule
  12). Recorded here because this question claims the territory first.
- **(d) will over-collect among the spiritually-inclined** without asserting
  anything theistic — which is by design (the route is the pole's honest
  transcendent-adjacent one) but means the *beyond* route's Q3 count needs
  reading alongside its Q1/Q2 pattern rather than alone.
- **(a)'s two-rocks concreteness is load-bearing.** Abstract phrasings of
  the in-things position ("universals are instantiated") are unsayable by a
  newcomer; if the option is ever rewritten, the rocks stay.
- **The branch's three thinned routes all sit in this question** ((a), (b),
  (c) at two, two, and one members). Option counts stay four-per-question,
  so the tally is unbiased; only the route-pattern nuance thins, and the
  affected philosophers all have earlier routes.

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

**Question 1 of 3 — settled 2026-07-29; option (b) rephrased 2026-08-14** on
the author's note that it read unclear. Old: *"I can't argue them into it,
but I can see that it's so."* The bare "it's so" left the claim ambiguous
between *this is true* and *this is true for me* — which is the pole
boundary, so the ambiguity fell exactly where the question can least afford
it. The added clause states the objective claim in the plainest available
words. Route and members unchanged.

> **Think of something you're sure about that someone you respect disagrees with. What's going on there?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) One of us is wrong, and it could be settled if we both looked properly. → *objective · the world decides* (Aristotle, Locke, Descartes)
> b) I can't argue them into it, but I can see that it's true, and I don't think that's just my opinion. → *objective · self-evidence* (Plato, Augustine, Kant)
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

**Question 2 of 3 — drafted 2026-08-14, pending author review.**

> **Someone tells you about something they've lived through that you never have, and it doesn't fit how you thought the world worked. What do you do with what they tell you?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) I listen, but there are some things I can see clearly enough myself that another person's experience isn't going to overturn them. → *objective · self-evidence* (Plato, Augustine, Spinoza)
> b) I'd believe them, and see how it fits with the rest of what I know. That's the only test anything I believe has ever had. → *perspectival · practice* (Hume, Wittgenstein, James)
> c) I'd want to know more before I let it change much. What they went through is evidence, and evidence can be weighed against the rest. → *objective · the world decides* (Aristotle, Locke, Descartes)
> d) They can see something from where they've stood that I can't get to from here. It isn't that I need more information; I'd have had to live it. → *perspectival · historical* (Beauvoir, Foucault, Hegel)

Option order is B/D/A/C against Q1's A/B/C/D. No example clause: "something
they've lived through that you never have" is its own pin (rule 14, and the
rationing note).

**Testimony is where standpoint actually bites, which is why this is the
branch's second question.** Q1 asks about a disagreement with a peer, where
both sides have the same access; this asks about a report from a life you
have no access to. The objective pole has to say what it does with a source
it cannot check, and the perspectival pole has to say whether standpoint is
a limit on *you* — a much sharper claim than "people see things
differently."

**(b) rephrased 2026-08-14** on the author's note. Old: *"I take it on board
and see how it sits with everything else I think. That's how all of it got
here — none of it was checked from outside."* "Checked from outside" is a
philosopher's phrase for a philosopher's idea (no view from nowhere), and
rule 10 catches it. The replacement makes the same claim as a plain
report — the coherence-and-working test is the *only* test — which is James
("leads us satisfactorily through experience, connects with other
beliefs"), Hume's custom, and Wittgenstein's practice, without naming the
doctrine.

**Beauvoir is placed, on the route her prompt names.** (d) is the situated
knower: "body, history, economic dependence, and the expectations of others
do not abolish freedom but set the terms on which it is exercised," and her
method's insistence that "the abstraction is worthless without the case."
She is on the computed `standpoint` shelf and had no Q1 route — the last
shelf member in the instrument without one.

**Spinoza is placed on (a), and the annotation is careful.** His route is
adequacy, not authority: "we are passive insofar as our ideas are
inadequate," and the third kind of knowledge, which "grasps things through
their eternal essence." An adequate idea carries its own mark, which is what
(a) claims. The wording deliberately avoids derivation-from-premises
language, which would collide with `approach` — the trap this branch exists
to avoid.

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **Take something you're really sure about. What would actually have to happen for you to change your mind?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Honestly, my life would have to change. You don't get argued out of something your whole world treats as obvious. → *perspectival · historical* (Foucault, Hegel, Nietzsche, Beauvoir)
> b) Show me something that doesn't fit. Facts that don't line up would do it, and not much else would. → *objective · the world decides* (Aristotle, Locke, Descartes)
> c) It would have to stop working. When holding something keeps leading me wrong, that's when it goes. → *perspectival · practice* (Hume, Wittgenstein, James)
> d) Nothing anyone said could do it. But I could come to see it better than I do now; that has happened before, and it changed things. → *objective · self-evidence* (Plato, Augustine, Kant, Spinoza)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, completing
the branch scramble (straight-lining checked: a-a-a = Ob/Ob/Pe, b-b-b =
Ob/Pe/Ob, c-c-c = Pe/Ob/Pe, d-d-d = Pe/Pe/Ob).

**The revisability question is the axis stated as a practice.** "What would
change your mind" is the one epistemology question a newcomer answers
fluently, and the four answers are the four routes without any of them
having to describe *how knowing works* — which is what made Q1's (a)/(b)
pair so hard to separate. (d) is the objective pole's honest hard case: it
sounds closed and isn't, because the second sentence makes the belief
answerable to better seeing rather than to nothing.

**Kant returns here after Q1 (b) and no Q2 route.** Q2's testimony framing
gave him nothing — his self-evidence is the a priori conditions of any
experience whatsoever, which no one else's experience bears on either way,
so annotating him there would have said nothing. (d) is his: what can move
you is clearer critical seeing, not a report and not an argument from
outside.

**Concerns — question 2.**

- **(d) will over-collect, as the branch's whole distribution problem
  predicts.** Standpoint talk is the culturally default register among this
  audience, and (d) is the most sympathetic thing on the screen. The rule 15
  counterweights are (c)'s refusal to be bullied by a story ("evidence can
  be weighed") and (a)'s claim of real sight; neither will fully hold. This
  branch is the one where the three-question tally matters most — see Q1's
  final concern.
- **(a) must not read as dismissive.** "I listen, but…" is doing real work:
  without the first clause the option becomes refusal to hear someone, which
  is a character judgment rather than a position, and Augustine and Plato
  both have listening built into their method. Do not shorten it.
- **Finding F, mild row:** the box invites the account of someone else's
  hard experience, and users often supply their own alongside. Lower risk
  class than the suffering rows.
- **Convergence check (rule 12), and it is tight:** (b) is adjacent to Q1's
  (d) ("I picked it up") — same route, same branch, so a consistent click is
  signal rather than a fault, per the suffering-branch precedent. But (b) is
  written about *incorporation* rather than *origin*, deliberately: the
  belief-origin region is closed across the instrument, and this branch is
  where it would be easiest to reopen.

**Concerns — question 3.**

- **(a) is the belief-origin ban's closest legal approach.** "My life would
  have to change" is a claim about what would *revise* a belief, not about
  where it came from, and it names no childhood. It is the last option in
  the instrument allowed anywhere near that territory; nothing in the God
  branch may go closer.
- **(b) under-collects among users who have never had a belief overturned
  by evidence**, which is more people than the option's plainness suggests.
  Accepted: it is the honest empiricist answer and the pole needs it.
- **(c) may read as pragmatism-about-truth**, which is James's actual view
  and Wittgenstein's and Hume's only loosely. Stage 5 should attribute
  "stops working" to James, and reach Wittgenstein through practice and Hume
  through custom rather than through utility.
- **(d) carries four members and is the branch's only four-member route.**
  That is a fit fact rather than a fault — the objective pole's distinctive
  claim is exactly this — but it means a (d) click is weak evidence about
  *which* objective philosopher, and the rerank should lean on Q1/Q2 for
  that.

---

## 9 · Do these questions have answers

**Recommendation: merge into "How do we know anything," and keep the phrase.**
**Accepted 2026-08-14** — screen 1 runs ten options; the design doc is updated.

Open item 8's three objections all hold — a roster of three or four, no way to
fill two buckets, and no justified split. The merge is right. Two things make it
cleaner than a straight deletion:

1. **The perspectival pole above is where these philosophers already live.**
   Wittgenstein (problems as knots in language), Nietzsche (no immaculate facts),
   Hume (mitigated skepticism), Foucault. Nothing is orphaned by the merge.
2. **Two options already catch the person whose real question is "is philosophy
   confused":** question 7's (d) and question 8's (d).

**Keep the exposure, drop the branch.** Screen 1's line becomes:

> · How do we know anything at all, or are we just arguing about words?

Screen 1 returns to ten options. Screen 2 needs **ten** branches, not eleven, so
D7's "×11" becomes "×10" and the authoring estimate drops accordingly.

What is genuinely lost: nothing on the shelf, one line of screen-1 taxonomy. The
skeptic who wanted a shelf of skeptics never had one available.

---

## 10 · Other people

*Added 2026-08-14. This branch is inherited — its Q1 lives in the design
doc's question blocks (route audit applied 2026-08-14) rather than in this
draft's §§1–9 — but its Q2–Q3 are authored here like every other branch's.*

**Axis: `sociality`, complete ↔ cost.** Do other people make you who you are,
or get in the way of it? Split ruled as complete/cost rather than "because
of / in spite of" to avoid duplicating `agency` (design doc note).

**Populates.**

| Pole | Candidates | Routes |
| --- | --- | --- |
| complete | Aristotle (emp), Hegel (rat), Plato (lit), Augustine (exp), Epicurus (emp), Hume (emp) | 4 |
| cost | Beauvoir (exp), Nietzsche (lit), Foucault (emp), Kierkegaard (exp), Sartre (exp), Marcus (lit), Mill (emp), Heidegger (exp) | 3 |

**Q1 (design doc, audited 2026-08-14)** routes: (a) *complete · formation*
(Hegel, Aristotle), (b) *complete · the good* (Epicurus, Augustine, Hume),
(c) *cost · anonymous* (Heidegger, Kierkegaard, Nietzsche), (d) *cost · the
gaze* (Sartre, Beauvoir, Foucault).

**The audit's hole list was one short.** It names Plato and Marcus Aurelius
as pool members with no Q1 route. **Mill is a third**: his `sociality` 2 ·
cost was adopted in the same 2026-08-14 ruling batch (the
despotism-of-custom material), and no Q1 option reaches him. All three are
placed below — Marcus by Q2, Plato and Mill by Q3.

**Question 2 of 3 — drafted 2026-08-14, pending author review.**

> **You get a real stretch of time entirely to yourself. What actually happens?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) It's good for a while, then it goes flat. Good things don't fully count for me until I've shared them with someone. → *complete · the good* (Epicurus, Hume)
> b) I can relax, and don't have to keep putting on a performance for other people. → *cost · the gaze* (Sartre, Beauvoir, Foucault)
> c) Without anyone to interact with, I stop feeling like myself. Being around other people is when I most feel like myself. → *complete · formation* (Hegel, Aristotle)
> d) It takes a while to stop hearing what everyone else thinks. Then I'm actually with myself, and I do my clearest thinking there. → *cost · anonymous* (Heidegger, Kierkegaard, Marcus Aurelius)

Option order is B/D/A/C against Q1's A/B/C/D. No example clause: "a real
stretch entirely to yourself" carries the scale (rule 14 rationing note).

**Solitude inverts the axis, which is what makes it a second question rather
than Q1 again.** Q1 asks what others are in your life; this asks what their
absence is. The two cost options split on the branch's recorded line: (b) is
relief because *the watcher* is gone — the gaze, the managing, the
performance — while (d) is relief because *the absorbed opinions* drain away
and your own thinking returns. One ends being seen; the other ends thinking
others' thoughts. The complete options both name a real lack: (a) goods that
don't count unshared, (c) a self that fades without others. *(b) and (c)
are the author's wordings, 2026-08-14: (b) plainer than the drafted version,
and (c) recast from "growth stalls" to "I stop feeling like myself" — a
sharper fit for Hegel (self-consciousness satisfied only in another
self-consciousness) and warmer to click, which eases the rule 15 worry the
first draft carried.*

**Marcus Aurelius is placed, on the surface the audit predicted.** (d) is the
inner citadel — "nowhere is quieter than one's own soul; retire into yourself"
— and the anonymous route is his honest home: his cost is neither the gaze
nor absorption but the meddling world he practices withdrawing from.
Heidegger (the "they" losing its grip) and Kierkegaard (the single
individual) carry the same option for the same reason.

**Route membership changes — checked against `philosophers.ts`, 2026-08-14.**

| Route | Q1 | Q2 | Why |
| --- | --- | --- | --- |
| *complete · the good* | Epicurus, Augustine, Hume | Epicurus, Hume | **Augustine comes off.** "It goes flat" is not his solitude — his interiority is where the search happens, and much of his work is written alone, addressed to God. He stays via Q1 (b); his common-loves material returns on Q3's concerns. |
| *cost · anonymous* | Heidegger, Kierkegaard, Nietzsche | Heidegger, Kierkegaard, Marcus | **Nietzsche off, Marcus on.** Nietzsche's solitude is congenial (distance from the herd) but (d)'s register — quiet, clarity, honest thinking — is the Stoic retreat, not self-overcoming; annotating him would blur the option that finally places Marcus. He stays via Q1 (c). |

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **Think of someone you know and genuinely admire. What has knowing them done to you?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) I've noticed I hold a lot of their opinions naturally, and I can't really say I consciously accepted them; they mostly came because I admire the person. → *cost · anonymous* (Mill, Heidegger)
> b) They raised my standard for myself. Wanting to be worth being with that person changed what I want from life. → *complete · formation* (Plato, Aristotle, Hegel)
> c) Around them I edit myself. Some part of me is always managing what they see, and I can't tell what that costs me. → *cost · the gaze* (Sartre, Beauvoir)
> d) Knowing them is simply one of the best things I have. The friendship itself is the point. → *complete · the good* (Epicurus, Hume)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, completing the
branch scramble (straight-lining checked: a-a-a = Co/Co/cost, b-b-b =
Co/cost/Co, c-c-c = cost/Co/cost, d-d-d = cost/cost/Co). *(a) and (b) are
the author's wordings, 2026-08-14; (c) and (d) approved as drafted.*

**Both remaining placements land here, on their own material.**

- **Plato, on (b), is the Eros ascent** — desire, rightly educated, climbing
  from a beautiful person toward what the person made visible. "Raised my
  standard for myself… changed what I want from life" (author's wording,
  2026-08-14) is that claim at newcomer scale, and it is exactly why Q1 (b)
  was never honest for him: for Plato the admired person is a rung, not the
  terminus. Aristotle joins via character friendship as mutual formation
  (the audit's "the friend is another self"), Hegel via recognition.
- **Mill, on (a), is the living-conviction claim.** An opinion held on an
  admired person's authority is his "dead dogma" — true perhaps, but
  "repeated as prejudice" rather than "understood as a living conviction."
  Heidegger joins: judgments "taken over from what one does," here from a
  particular someone. This is the branch's version of the taken-over-opinion
  phenomenon, and it places Mill exactly where his cost tag pointed.

**Foucault is deliberately off (c).** A particular admired person's gaze is
Sartre's look and Beauvoir's flight into being loved; Foucault's gaze is
anonymous and normalizing — a watcher with no one behind it — which is why
his routes are Q1 (d) and nothing here. The distinction is the same one that
separates (a) from (c) on rules Q2.

**Rejected wordings.**

- *"Think of the person you most admire"* — superlative, rule 3.
- *"I don't need it to be improving me — the friendship is the point"* for
  (d) — the first clause argues with (b), which rule 4 exists to prevent;
  the assertion survives without it.
- *A love question* ("someone you've loved intensely") as the Q3 subject —
  Plato's ascent fits, but the cost routes strain (Heidegger and Foucault
  have no honest option about a beloved), and the disclosure pull is higher
  for no routing gain.
- *"The standards I hold myself to are particular people, still talking"*
  for Q2 (c) — converges with rules Q2 (a)'s inherited voice (rule 12), and
  drifts toward the formation-region this branch was warned off; the route's
  claim is present friction, not internalized authors.

**Concerns — question 2.**

- **(b) and (d) will over-collect together.** Solitude-positive is the
  romantic answer in a self-selected philosophy audience, and both cost
  options offer it. The rule 15 counterweight is that (a) and (c) are
  written as assertive claims with real pull — (a) is Epicurus's actual
  position stated without apology, (c) admits stalling, which prices it —
  but expect the cost pole to run hot and instrument under test #8.
- **(c)'s author revision retired the hardest-click worry.** The drafted "I
  coast" conceded something unflattering; "I stop feeling like myself" is a
  claim people make warmly about themselves, so *formation* should collect
  honestly now. Residual watch: it may now pull extroverts generally, not
  just the recognition position — a temperament risk of the same kind as
  rules Q2's (c), and instrumented the same way.
- **Finding F gains a mild row:** the box can collect loneliness or
  isolation ("it goes flat" invites the account of a life where there is no
  one to share with). Lower risk class than the suffering rows; listed so
  the safety design sees it.
- **Sartre and Foucault now have two routes each; Nietzsche has one.** His
  single route (Q1 c) is thin for a philosopher on this shelf, but his other
  surfaces here (ressentiment, the judged-to-judger redirect) are
  question-subjects this branch deliberately avoids. Accept, or revisit if
  a Q3 rewrite ever reopens.

**Concerns — question 3.**

- **(a) converges toward the standpoint branch's picked-it-up option**
  (rule 12): both report beliefs held without deciding. Defense: this one
  names a particular living source and stays in the admiration frame — it
  is about a relationship, not the origin of belief in general — and the
  childhood-formation region is fully avoided (an admired person you know
  now, not upbringing). The instrument's convergence budget is spent;
  whichever branch drafts next must not touch belief-origin at all.
- **(b) risks reading as aspiration rather than completion.** "Changed what
  I want from life" is formation through another person, but a user may
  click it about ambition generally. Acceptable: the prompt pins it to a
  known, admired person.
- **(c) invites mild self-surveillance disclosure** — "what that costs me"
  can collect an account of a controlling relationship. Same risk class as
  Q2's row; noted with it rather than separately.
- **(d) is the least dramatic option and may under-collect** despite being
  two philosophers' sincerest position. If test #8 shows it starving, the
  fix is wording pull per rule 15, not removing the route — it is the only
  place Epicurus's friendship-as-the-greatest-good is clickable after Q1.

---

## 11 · Is there a God

*Added 2026-08-14. Inherited branch — its Q1 and the 2026-08-14 rulings live
in the design doc's question blocks; Q2–Q3 are authored here, as with §10.
This is the instrument's most sensitive branch and the last one drafted.*

**Axis: `transcendence`, a divine order ↔ nothing beyond nature.**

**Routes (from Q1):** *transcendent · reasoned* (Aquinas, Descartes),
*transcendent · experienced* (Augustine, Kierkegaard, James), *not ·
explained* (Hume, Nietzsche), *not · lived without* (Camus, Sartre).

**Pool after the rulings**: divine order — Aquinas 3, Kierkegaard 3,
Augustine 3, Descartes 3, Plato 2, James 2; nothing beyond nature —
Nietzsche 3, Camus 3, Sartre 2, Hume 2, Spinoza 2 (copy guard). Kant, Hegel
and Marx are out of the pool.

**Two coverage holes, and they are the ones the rulings predicted.** Plato
and Spinoza are pool members with no Q1 route. Spinoza's is the more
consequential: the 2026-08-14 ruling left him "in the pool for the
reranker" after taking him off Q1 (a), which meant the branch had a member
no click could reach. Both are placed below.

**Question 2 of 3 — drafted 2026-08-14, pending author review.**

> **Think about the fact that there's a world at all, and that it hangs together the way it does. What do you make of that?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Sometimes it stops me, and in those moments it doesn't feel like an accident. I couldn't defend that, and I don't try to. → *transcendent · experienced* (Augustine, Kierkegaard, James)
> b) It's extraordinary and it doesn't mean anything. I'd rather hold both of those than give up either one. → *not · lived without* (Camus, Sartre)
> c) It doesn't explain itself. Something has to account for there being an order here at all, and that's where I end up. → *transcendent · reasoned* (Aquinas, Descartes, Plato)
> d) It hangs together because that's what a world that lasts looks like. The purposes are ours; we read them in, and then find them there. → *not · explained* (Hume, Nietzsche, Spinoza)

Option order is B/D/A/C against Q1's A/B/C/D.

**Plato is placed on (c), and it is his own claim rather than Aquinas's.**
The Good "stands above the others as the sun stands above visible things,
giving both being and intelligibility" — an order that does not account for
itself, and a source that does. (c) is worded as the *demand* for an account
rather than as a proof, which is what lets Aquinas's Five Ways, Descartes's
non-deceiving God, and Plato's Good share one option honestly.

**Spinoza is placed on (d), and this is the copy guard working, not being
bent.** (d) is Ethics I Appendix nearly in his own words: "people suppose
all things act for an end because they are conscious of their appetites and
ignorant of the causes of them; nature has no end set before it, and final
causes are human fictions." What (d) explains away is **providence and
purpose**, not God — he can click it while holding that the one substance
*is* God. The option contains no denial of God for exactly this reason, and
stage 5 must never gloss a (d) click as atheism for him. Hume's
passions-and-institutions analysis and Nietzsche's genealogy sit on the same
option without that qualification.

**Question 3 of 3 — drafted 2026-08-14, pending author review.**

> **Have you ever found yourself praying, or doing something like it, even once, even without believing? What was that?**
>
> `[ text box ]` *One line is plenty.*
>
> Or pick the closest:
> a) Yes, when I was frightened. I think that's something people do, and it tells you about us rather than about the universe. → *not · explained* (Hume, Nietzsche, Spinoza)
> b) Maybe, but I don't put weight on moments like that either way. Either there's something there or there isn't, and how I felt in a bad hour doesn't settle it. → *transcendent · reasoned* (Aquinas, Descartes)
> c) No, or not for a long time. There's no one to ask, and I'd rather face that straight than talk myself into company. → *not · lived without* (Camus, Sartre)
> d) Yes, and whatever that was, it wasn't nothing. It's the closest I've come to knowing anything about it. → *transcendent · experienced* (Augustine, Kierkegaard, James)

Option order is C/A/D/B against Q1's A/B/C/D and Q2's B/D/A/C, completing
the branch scramble (straight-lining checked: a-a-a = Tr/Tr/No, b-b-b =
Tr/No/Tr, c-c-c = No/Tr/No, d-d-d = No/No/Tr).

**A practice question, deliberately, after two questions about the world.**
Q1 asks whether you believe, Q2 what you make of there being a world; both
are stances. Praying is a thing people have *done*, including people who
believe nothing, and it is the one place this topic touches an ordinary
life. The "even once, even without believing" clause is what makes it
answerable by the whole roster of users rather than only by believers — and
it is the option-neutrality lever this branch needs most.

**The James guard is honored in (d)'s wording.** "Whatever that was, it
wasn't nothing" is precisely his position — religious experience taken
"seriously as data, without thereby endorsing any doctrine" — and the
option names no doctrine, no God, and no content. Augustine (a work
addressed to God) and Kierkegaard (the leap over objective uncertainty)
carry the same option with more commitment; stage 5 must not level them to
one another.

**Aquinas and Descartes on (b) is the branch's most counter-intuitive
annotation, and it is textual.** Aquinas prays; the route claim is not that
he does not, but that his *grounds* are the Five Ways, and his prompt's
method is the objection-and-reply, not the recounted experience. Descartes
likewise rests clear and distinct perception on a non-deceiving God rather
than on any moment. Stage 5 should say "this is not where their belief is
grounded," never "they have no inner life."

**Rejected wordings and candidates.**

- *A suffering-and-evil question* ("why would a world like this have a God
  in it") — the obvious second question for this branch, and rejected on two
  counts: it duplicates the suffering branch's subject (rule 12), and it
  puts the instrument's highest-disclosure prompt on its most sensitive
  branch. Not worth the sort it would produce.
- *"Do you believe in God?"* in any phrasing — the creed question Q1 was
  built to avoid (D6); the design doc's own note records that a five-option
  version asking for a creed was replaced.
- *"Something bigger than yourself"* for Q2 (a) — collects everyone
  (concerts, mountains, one's children) and sorts nobody.
- *"When you look at the night sky"* as Q2's frame — a stock trigger that
  primes awe and pre-loads (a); the plainer "there's a world at all" asks
  the same question without staging the answer.
- *"Who were you talking to?"* as Q3's second sentence — a good sentence
  and a trap: it forces the user to answer the metaphysical question inside
  the prompt, which is what the four options are for.

**Concerns — question 2.**

- **Convergence with `depth` is the real risk here (rule 12).** "What do you
  make of there being an order" is adjacent to what's-real Q1's
  surface-or-substrate question. They stay distinct because this one asks
  what the order *implies* and depth's asks what the world *is made of* —
  and because the depth branch's options carry no transcendent route at all.
  Watch it in the paper pilot: if testers report the two branches feeling
  the same, this is the question to change, not Q1 or Q3.
- **(b) is the branch's best-priced option** — it concedes the wonder and
  refuses the conclusion, which costs something in both directions — and it
  will still under-collect against (a), because (a) is the socially
  easiest thing to say. Instrument the pair.
- **(d) risks reading as dismissive of believers.** "We read them in, and
  then find them there" is a claim about projection, not about believers
  being foolish; the second clause is deliberately descriptive. If it needs
  a rewrite, keep the mechanism and lose any implied verdict.

**Concerns — question 3.**

- **Finding F gains a row, and it is not a mild one.** "When I was
  frightened" is in an option, and the box beside a prayer question will
  collect illness, bereavement, and crisis — the same material as the
  suffering branch, reached from a different door. The safety design must
  cover this branch's Q3 explicitly; it is not covered by the God branch's
  Q1, which asks only about belief.
- **(c) must not collect the merely irreligious.** "No, or not for a long
  time" is a position (there is no one to ask), not a report of not being
  raised religious — the belief-origin ban applies here, and the second
  sentence is what keeps it a stance.
- **(a) and (d) can be the same memory.** A user who prayed once in a bad
  hour may read either option as theirs; the split is what they now make of
  it, which is the axis. That is the intended behavior, but it makes this
  the branch's likeliest question for a mixed 1-1-1 pattern — the D7 tally
  ruling (plain majority, mixed presented as mixed) does the work.
- **Nobody is annotated on more than one option per question**, checked; the
  Q1 → Q2 → Q3 route membership is stable across the branch apart from the
  two placements, which is unusual in the instrument and reflects how
  cleanly this topic's four positions separate.

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

### E. Open item 10, famous-name crowding: make the tag value 3 scarce. *(Adopted 2026-08-14.)*

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
| Suffering, loss, death · Q1 | The prompt names an irreversible loss; (c) and (d) both invite the account |
| Am I free · Q1 | (a) — the narrowed-options answer is where a hard history gets told |
| Who am I, really · Q1 | (b) — "I'm often not in it" |
| Am I free · Q2 | The prompt names someone else's wrongdoing and the box invites the account; the "not to you" clause that would have covered this was declined for register |
| Am I free · Q3 | The prompt asks for a personal failure to change — reaches drinking, eating, self-harm |
| Why we accept the rules · Q2 | ~~The prompt asks the user to report an offence they may not have been caught for~~ **Retired 2026-08-14**: the rejected offence-report draft was replaced by the transmission question, which invites no admission. Residual on this branch: Q3's box can collect stated dissent (a retention question, noted in its concerns), not distress |
| Suffering, loss, death · Q2 | The prompt names a bereavement in the user's circle and the box invites the account of it — including their own, smuggled into the third person |
| Suffering, loss, death · Q3 | The prompt normalizes intrusive mortality awareness ("it really hits you") and the box can collect present-tense death anxiety, not just past loss |
| Other people · Q2–Q3 | Mild, listed for completeness: the solitude box can collect loneliness or isolation ("it goes flat"), and Q3 (c)'s "what that costs me" can collect an account of a controlling relationship |
| What makes a life worth living · Q2 | Mild: the twenty-year plateau prompt can collect present-tense feeling trapped — a job, a marriage, a town |
| What's actually real · Q2 | Mild: the seeing-through box can collect disillusionment narratives — a lost faith, a family myth, an institution that failed the user |
| How do we know · Q2 | Mild: the box invites the account of someone else's hard experience, and users often supply their own alongside |
| **Is there a God · Q3** | **Not mild.** The prayer prompt plus "when I was frightened" in option (a) will collect illness, bereavement and crisis — the suffering branch's material reached through a different door. The God branch's Q1 does not cover this; the safety design must name Q3 separately |

**Updated 2026-08-07.** The last three rows were promised in §5 and §6 and had never
been written here; the first two were quoting prompts that have since been rewritten
("the hardest thing you've had to take" was cut under rule 3, and "what happened to me"
was cut from freedom (a)). **Six of the outstanding questions have not been drafted yet,
so this list will grow.** Do not treat it as complete when the safety design is built
against it.

The wording lever that exists is orienting prompts to *what helped* or *what you
notice now* rather than *what happened*. Both suffering and freedom above are
written that way already. It reduces the pull; it does not remove it, and I don't
think any wording does — the topics are the invitation. The second lever, established
on freedom Q3 and used again on rules Q2, is **steering with light examples rather than
a caveat clause** — examples are natural where a caveat is not.

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
  authoring time. **Ruled (2026-08-14, author decision): fix at authoring
  time.** Every remaining question is written under checklist rule 15; residual
  skew is accepted only after the wording has done its work, and measured under
  test #8.
- **Two poles have only two approaches available:** `consolation · face`
  (experiential + literary) and, marginally, `legitimacy · consent` and
  `moral_source · found` before Plato/Augustine are counted. All three become
  unfillable at five slots. Open item 12 should be resolved as "cap scales with
  bucket size" rather than a flat two. **Ruled (2026-08-14): the cap scales —
  ⌈slots/2⌉ per approach, i.e. two at four slots, three at five.** Design doc
  D3, v6.
- ~~**Three options are weak enough that I'd rewrite before tagging:** question 7's
  (c), question 6's (d), question 8's (a)/(b) pair.~~ **All three fixed in the
  2026-07-29 review.** In each case the defect turned out to be that the wording
  misstated the route, not that the route was weak — worth remembering the next time
  an option looks unsalvageable.
- **Naturalness degrades across a branch, and it is a property of the instrument
  rather than of any one draft.** The most natural phrasing of a route is spent on
  Q1; by the second or third question the phrasings still available are ones nobody
  would say about themselves out loud. Both rejected selfhood Q3 drafts failed this
  way — on how the options read, not on whether they sorted. **This is the standing
  exception to checklist rule 8:** when the objection is "that isn't how a person
  talks" rather than "that option is unfashionable," the route is not being
  misstated and rewriting will not fix it. Cut the question instead. Expect this
  wherever an axis is thin, and expect it to be the binding constraint on the
  sixteen questions still outstanding.

---

## Rewrite pass 1 on the 2026-08-14 drafts (same day, requested by the author)

> **Partly superseded by pass 2 (below), which the author approved.** Where
> the two passes touch the same option, **pass 2's wording is what ships**;
> this log is kept for its reasoning, which pass 2 did not always overturn
> deliberately. The three reversals are called out in the pass 2 record.

Scope: all ten questions drafted 2026-08-14 — worth living Q2–Q3 (§1),
suffering Q2–Q3 (§3), rules Q2 (replacement) and Q3 (§6), what's-real Q2–Q3
(§7), other people Q2–Q3 (§10) — every drafted wording treated as open under
the authoring checklist, **excluding the lines recorded as the author's own,
which were not touched.** Changes are listed old → new so they can be
reverted rather than rediscovered; the changes themselves are pending the
same author review as the drafts they amend.

**Changed — eight wordings.**

- **Suffering Q2 (c):** "Part of grief is thoughts" → "Grief is partly made
  of thoughts." The old clause stumbled grammatically ("is thoughts"); the
  claim is unchanged.
- **Suffering Q2 (d):** "you can walk beside it" → "you can walk beside
  them." Walking beside the *person* is how the grief idiom actually runs;
  "beside it" (the grief) was a literary metaphor of the kind rule 10 cuts.
- **Suffering Q3 (d):** "runs on its own necessity" → "runs the way it
  must." "Necessity" is Spinoza's word, not a newcomer's (rule 10); "the way
  it must" is the same claim in plain register, and the annotation loses
  nothing.
- **Rules Q2 prompt:** "what do you find yourself saying?" → "what do you
  tell them?" "Find yourself saying" implies unpremeditated speech, which
  pulls against the author's honesty clause — the clause asks for the belief
  behind the utterance, and the involuntary register was quietly funneling
  everyone back toward (c)'s social script, the exact failure the clause was
  added to close. The honesty clause itself is untouched. (a) still works:
  catching yourself repeating is the *answer*, and no longer needs the
  question to presuppose it.
- **Rules Q3 (b):** "it's just what one does" → "it's just what's done."
  Matches Q1 (a)'s phrasing for the same route ("It's just what's done") —
  a deliberate route echo, as on suffering's no-consolation pair — and
  "one does" was the stiffest register in the option set.
- **Real Q2 (b):** "Careful with 'saw through.'" → "I'd be careful with 'saw
  through.'" The bare imperative addressed the asker, the register rule 7
  exists to stop; first person restores it and the caution is unchanged.
- **Real Q3 (b):** "the same necessities under every surface" → "the same
  laws under every surface." Rule 10 again; "laws" is exact for both members
  (Descartes's laws of nature, Epicurus's regularities) and is how a person
  says it. Still mind-neutral, so the Kant exclusion the option was built
  for holds.
- **Real Q3 (c):** "The certainty is a feature of the practice of
  mathematics" → "The certainty is built into the practice of counting."
  The double "of" clunked, and "counting" is the concrete verb the prompt's
  own example (two and two) points at — rule 1's concreteness applied at
  option level. Nothing in Wittgenstein's annotation depends on the word
  "mathematics."

**Examined and left standing** — recorded so the pass is known to have
covered them and the reasoning is not re-run:

- **Worth Q3 (c), "If I can already see the whole of it, I'm aiming too
  low."** Examined as a possible rule 4 violation — it can read as arguing
  with the other options, and it adds pull to the branch's third hot surpass
  option in a row. Verdict: stands. The clause is the route's *content*
  rather than a stapled declaration — the aim exceeding current sight is
  exactly the surpass claim and the whole of Plato's annotation — and it is
  self-directed ("**I'm** aiming too low"), not a ranking of other clickers.
  Every alternative drafted for this pass either lost Plato's carry
  (rewordings about the *self* changing rather than the *aim* exceeding
  sight) or restated the first sentence (rule 9). The over-pull worry is
  already priced in the question's first concern.
- **Worth Q2 prompt and (b); worth Q3 (b).** (b)'s "I need less by then" was
  checked for tense awkwardness against the prompt's frame and reads
  naturally inside "what does that look like?"
- **Suffering Q2 prompt, (a), (b); Q3 prompt, (a), (b), (c).** Q3 (c)'s "I
  don't reach for a comfort" is the recorded replacement for a rejected
  rule 4 wording and was left alone. Q2 (b)'s near-verbatim echo of Q1 (d)
  ("the comforting things people say aren't true") was examined and kept:
  same route, same branch — a consistent click across the pair is the
  signal the tally reads, not a templating fault.
- **Rules Q2 (a)–(d); Q3 prompt, (a), (c), (d).** Q3 (d)'s "it suits the
  people it suits" was re-examined for reading as evasive and kept — the
  descriptive flatness is the recorded Beauvoir guard, and every sharper
  version drafted named a villain.
- **Real Q2 prompt, (a), (c), (d); Q3 prompt, (a), (d).** Q2 (a)'s "what I
  was measuring it against isn't" is compressed but earns it — the beyond
  route has no plainer honest surface here, and the sentence's puzzle is
  the position.
- **Other people Q2 prompt, (a), (d); Q3 prompt, (c), (d).** The Q3 prompt's
  "done to you" was examined for cost-pole priming (its faint edge of harm
  could nudge a branch already predicted to run cost-hot). Kept: every
  neutral alternative drafted ("what difference has knowing them made")
  went flat enough to cost the question its honest-answer register, and
  (b)/(d) survive the edge comfortably.

## Rewrite pass 2 (2026-08-14, approved by the author in one pass)

The author asked for the drafts to be redrafted and shown in chat for
review, then approved the set. **These wordings are what ships**, and they
are now in §§1, 3, 6, 7, 10. Governing principle, added to the checklist as
**rule 16**: prefer the sentence a person would say out loud over the
compressed or aphoristic one. Author-supplied lines were not touched.

Rewritten: suffering Q2 (a)–(d) and Q3 (a), (b), (d); rules Q2 (a)–(d) and
Q3 (a)–(c) plus a trim of the Q3 prompt's examples from three to two;
other people Q2 (a); what's-real Q2 (a)–(d) and Q3 (a)–(d).

**Three deliberate reversals of pass 1, recorded so they are not "fixed"
back:**

- **Real Q3 (b):** pass 1 moved "necessities" → "laws" on rule 10; pass 2
  restores "the same necessities sit under every surface." Both are plain;
  "necessities" keeps Epicurus's atomic regularities from sounding
  legislated, which "laws" faintly does.
- **Real Q3 (c):** pass 1 moved "practice of mathematics" → "practice of
  counting"; pass 2 restores mathematics. "Counting" narrows Wittgenstein's
  claim to arithmetic, and the option's point is the practice as a whole.
- **Rules Q3 (b):** pass 1 set "it's just what's done" to echo Q1 (a); pass
  2 uses "It's just what everyone does here." The route echo is lost, the
  spoken register is gained — and "here" does work the echo did not, naming
  the local "they."

**One thing the author should know:** pass 1 also changed the **rules Q2
prompt** ending, "what do you find yourself saying?" → "what do you tell
them?", on the argument that the involuntary register pulled against the
author's own honesty clause. The author's honesty clause is intact, but the
closing four words are pass 1's, not the author's. Flagged for an explicit
keep-or-revert.

---

## Still to do

### 1 · ~~Fourteen questions~~ — all drafted (2026-08-14)

**Redraft passes complete (2026-08-14).** The five branches below went
through two rewrite passes the same day (both logged above, "Rewrite pass
1" and "Rewrite pass 2"); pass 2's wordings are the live ones and were
approved by the author in a single review. Lines the author supplied
himself were left untouched, with one flagged exception (the rules Q2
prompt ending — see the pass 2 record). The wordings now in §§1, 3, 6, 7
and 10 are **post-review**: improve them only against a specific rule, not
for style.

**Agreed order (2026-08-14): the two inherited-branch fixes first (God
rulings, Other people pole fix and route audit — decisions, not drafting),
then questions 2–3 branch by branch beginning with Suffering, loss, death.**
**Both inherited fixes landed the same day**; the question pile starts with
Suffering. The parallel copy pile (group labels and card hooks) and the paper
pilot are tracked in the design doc's open items, "Next up."

**All ten branches now have a full question set (2026-08-14).** Question 1
was already settled everywhere; the seven branches that needed questions 2
and 3 were drafted over this session, in the agreed order, and the last two
— How do we know (§8) and Is there a God (§11) — closed the pile. Right and
wrong is complete at three dilemmas; Who am I, really at two questions plus
a tiebreak (§4's ruling); Am I free at three. Why we accept the rules had a
Q2 drafted and rejected on 2026-08-07 — kept in §6 with its blocking
objection so it is not re-proposed, and it is where checklist rule 14 came
from.

**What "drafted" means here:** the wordings are post-redraft and
author-approved for the five branches reviewed in chat (§§1, 3, 6, 7, 10);
§8 and §11 are first drafts awaiting the same review. **Every pool member in
the instrument now has at least one clickable route** — the last holes
closed were Beauvoir and Spinoza on the know branch, and Plato and Spinoza
on God. Nothing is blocked on drafting; what remains is review, four
rulings, the safety design, and the pilot.

| Branch | Status | Outstanding |
| --- | --- | --- |
| What makes a life worth living | Q1 settled; **Q2–Q3 drafted 2026-08-14** — Camus and Hegel routed, Plato annotated with a note | author review (incl. the Plato-on-surpass call) |
| Right and wrong | **complete** (3 dilemmas) | — |
| Suffering, loss, death | Q1 settled; **Q2–Q3 drafted 2026-08-14** | author review (Aquinas placement ruling in §3's Q2 concerns) |
| Who am I, really | **complete** (2 questions + tiebreak) | — |
| Am I free | **complete** (3 questions) | — |
| Why we accept the rules | Q1 settled; **Q2 (replacement) and Q3 drafted 2026-08-14** | author review (Kant placed, Marx returned, offence risk retired) |
| What's actually real | Q1 settled; **Q2–Q3 drafted 2026-08-14** — Foucault and Aquinas routed | author review + Kant pool ruling (proposed 2 → 1, §7) |
| How do we know anything | Q1 settled; **Q2–Q3 drafted 2026-08-14 (§8)** — Beauvoir and Spinoza placed, Kant returned | author review |
| Is there a God | Q1 settled (rulings applied 2026-08-14); **Q2–Q3 drafted 2026-08-14 (§11)** — Plato and Spinoza placed | author review; Q3 needs the safety design before it ships |
| Other people | Q1 settled (audit applied 2026-08-14); **Q2–Q3 drafted 2026-08-14 (§10)** — Plato, Marcus and the audit's missed third hole, Mill, all placed | author review |

**"Suffering, loss, death" Q2–Q3 were drafted 2026-08-14** — the first branch
authored under rule 15, and the first whose fashionable and sanctioned options
coincide (Q2's presence option). Q2 is third person per the freedom precedent,
which on this branch doubles as the safety lever; Q3 is the Marcus/Heidegger
axis test. Pending: author review, and the Aquinas placement ruling (§3,
Q2 concerns). The four philosophers Q1 left unplaced — Aquinas, Augustine,
Sartre, Hume — all have routes.

**"Am I free" is complete as of 2026-08-07.** Both sketched candidates were used: the
third-person asymmetry probe became Q2, and the pattern-you-can't-change question became
Q3. See §5 for the person/moment split the two `makes himself` routes require, the
Q2-only route table, and the tally ruling Q2 still needs.

**"Why we accept the rules" Q2 (replacement) and Q3 were drafted 2026-08-14 —
both fixed jobs done.** The new Q2 abandons the rejected broken-rule shape for
a transmission question (explaining a rule to a newcomer), which also retires
the branch's offence-report risk from finding F. Q3 is the structural question
as specified — a rule you think is wrong and keep — it **places Kant** on
*consent · reasons* via Enlightenment's self-incurred immaturity, brings Marx
back on the whose-advantage option, and runs C/A/D/B against Q1's A/B/C/D and
Q2's B/D/A/C as required. Pending author review; see §6's two new concerns
blocks.

### 2 · Rulings needed on the two inherited branches

**Is there a God** — both raised in the 2026-07-29 review. **Fully ruled
2026-08-14** (see `diagnostic_shelf_preview.md`, rulings log, and the updated
question block in the design doc): Spinoza comes off option (a) and carries
`transcendence` 2 on the *nothing beyond nature* pole with a mandatory copy
guard; Nietzsche's tag rises to 3 and he keeps only option (c); Kant and
Hegel leave the God pool (their prompts cannot support a pole); Descartes
rises to 3 so the worked-example shelf computes as written; Marx's tag is 1;
and the option (d) rewrite below is **accepted**.

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

**Fully ruled 2026-08-14:** the Foucault and Marcus Aurelius additions are
adopted in the draft tag matrix (`diagnostic_shelf_preview.md`), Beauvoir's
stance is ruled *cost* (her prompt's Other/diminishment material supports no
other pole), and Plato joins the *complete* pole (the Eros ascent) while a
proposed Marx addition was withdrawn. **The Q1 route audit is done** — see
the updated question block in the design doc: Aristotle keeps (a) only,
Beauvoir keeps (d) only, Foucault joins (d); Plato and Marcus Aurelius are
pool members with no Q1 option, to be placed by this branch's Q2–Q3.

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
   reader and states a thesis. **Exception, 2026-08-07:** a question whose subject is a
   third party is third person by design, and its options may generalize about people
   ("nobody gets out from under how they were raised"). The rule exists to stop options
   addressing the reader or stating theses, not to forbid a third-party subject.
   Freedom Q2 is the first instance, and third person is the cheapest fix available for
   the naturalness problem below: people have ready phrasings for other people's
   choices and none for their own metaphysics.
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
14. **Pin the magnitude of any instance the prompt asks the user to supply.**
    Added 2026-08-07, from the objection that killed the rules branch's first Q2:
    *"it's too vague whether it's something big or small to feel bad about."* The four
    options are always written at one magnitude — "out of all proportion" and "fine,
    honestly" are answers about a trivial offence and monstrous ones about a serious
    one. If the prompt leaves the scale open, the user has to choose a magnitude before
    they can answer, and **the magnitude they choose determines the option they pick**,
    so the question measures how bad an example came to mind rather than the axis. This
    is not rule 3 (no superlatives), which forbids asking for the extreme; it is the
    complementary failure of not asking for anything in particular. The lever is the
    examples: three of matched, unmistakable scale. Freedom Q1's "a job, a move, a
    relationship" and Q3's "always running late, losing your temper, putting things off"
    both do this correctly. Rules Q2's "speeding, something at work, something in your
    family" ran from a parking fine to a betrayal.
    **Author note, 2026-08-14 — ration the example clauses.** Examples are
    rule 14's lever, not a mandatory prompt part, and a set where *every*
    prompt carries an "— x, y, z" clause reads templated. Use a clause only
    where the magnitude genuinely needs pinning and no phrase inside the
    prompt can carry it; prefer the in-prompt phrase where one exists
    ("lost someone close to them," "one of your rules"). Applied same day:
    example clauses cut from suffering Q2 and Q3, rules Q1 and Q2; retained
    where they are load-bearing (freedom Q1 and Q3, suffering Q1, rules Q3,
    both depth questions — there the clause keeps users out of religion and
    off the wrong magnitude). Rules Q3 was later trimmed from three examples
    to two: the pin holds at two, and three was reading as rhetoric.

16. **Spoken register beats compressed register.** Added 2026-08-14 from the
    author's line-by-line rewrites across five branches, and applied in the
    same-day redraft pass. The recurring correction was the same one every
    time: em-dash-joined clauses, aphoristic pairs ("not a sentence, that's
    the goal"), and nouns doing verbs' work read as *written* options, and
    a written option is a small claim the user has to translate before they
    can recognize themselves in it. Prefer the sentence a person would
    actually say out loud, even when it is longer and flatter. This is not
    a licence to pad — rule 9's comparable-length rule still binds — and it
    does not weaken rule 15: an assertive claim in plain speech is still
    assertive.
15. **Write the unfashionable option with as much pull as the fashionable
    one.** Author ruling, 2026-08-14, resolving the one-directional
    distribution risk: the audience a philosophy app self-selects skews
    existentialist, perspectival and tough-minded, so the Stoic, Epicurean,
    Thomist and rationalist options must be written as assertive claims a
    person would be glad to make — rule 8's lesson (the wording usually
    misstates the route) is the method — and the fashionable option should
    carry an honest price where one exists (the earned exception in rule 4).
    Do not accept "that pole under-collects" until the wording has done this
    work.

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
