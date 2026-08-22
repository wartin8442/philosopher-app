# Diagnostic Routing (design; the deterministic router is built)

> **Status: the whole deterministic flow runs at `/start` (2026-08-14).** In
> code: the tag matrix (`philosophers.ts`, `types.ts`), all thirty branch
> questions and the two universal ones (`diagnostic.ts`), the results copy
> (`diagnosticCopy.ts`), the tally, stages 1–2 and the stage-4 guardrails
> (`routing.ts`), the six screens (`app/start/page.tsx`,
> `components/DiagnosticFlow.tsx`), cross-group duels (D10), and the safety
> layer wired per its §11 (`diagnosticSafety.ts`, `SafetyNotice.tsx`,
> `diagnosticSubmission.ts`). **Not in code: stage 3 — the model's free-text
> read and bounded rerank** (`routing-classifier.ts` and its API route), and
> the rerank eval set. The shelf is a pure function of clicks today, which is
> the state the design requires it to degrade to anyway.
>
> **Live on the landing page (author decision, 2026-08-14).** The "Don't know
> where to start?" CTA points at `/start`, and the old `/guided` placeholder is
> now a permanent redirect to it. Two things still want the author's attention
> and neither is code: his review of the results copy
> (`diagnostic_shelf_copy.md`, draft 1, currently shipping as draft) and his
> sign-off on the safety notice (`diagnostic_safety_design.md` §4).
>
> Supersedes the matching approach in
> [`onboarding_philosopher_matching.md`](onboarding_philosopher_matching.md)
> (2026-07-23). That document's *safety* and *curated-content* requirements
> remain binding.
>
> **Revision history.**
> - *v1* — ranked output, 8 axes, 8–11 questions, nearest-neighbour scoring.
>   Preserved in the appendix.
> - *v2 (2026-07-28)* — replaced ranking with a browsable shelf.
> - *v3 (2026-07-29)* — four per bucket, `approach` tag, ethics folded into the
>   standard shape.
> - *v4 (2026-07-29)* — the router becomes a **hybrid**:
>   deterministic retrieval and guardrails around a non-deterministic split and
>   rerank. Screen 2 is branched per topic with a prominent free-text box. A
>   fourth screen collects intent. "Other people" added as a topic.
> - *v5 (2026-07-30)* — replaces the single split question
>   with three topic-specific questions: structured orientation, structured
>   tension, and a text-only diagnostic vignette. The vignette informs bounded
>   reranking and explanation, not bucket assignment. Results are framed as
>   promising starting points and different angles, not philosophers the user
>   "agrees" or "disagrees" with. The shelf remains four plus four; intent
>   changes emphasis, not bucket size.
> - **v6 (2026-08-14, this revision)** — reconciled with the screen-2 draft's
>   architecture change, now canonical: each branch runs **three concrete
>   questions**, each carrying the branch's four routes as options plus an
>   optional text box; the pole is a deterministic **majority tally of
>   clicks**, and free text never changes group membership (D7 and D13
>   revised). The skeptic topic merges into "How do we know anything" (ten
>   topics). Duels: two to three per shelf, always cross-group (D10). Author
>   rulings: unfashionable options get authoring effort rather than accepting
>   audience skew (checklist rule 15); the "Start with these / Try a different
>   angle" framing is confirmed; the approach cap scales with group size (D3);
>   tag value 3 is reserved per finding E.

---

## Problem

The app's purpose is making philosophy accessible to newcomers. A first-time
user currently lands on a grid of 23 portraits with short blurbs. Real user
feedback: people don't know where to start. Two concrete failure modes:

1. **Name recognition wins.** With no guidance, traffic concentrates on Plato
   and Aristotle because those are the names people have heard, not because
   they fit.
2. **Bad first match kills interest.** Someone preoccupied with questions about
   the self who lands on a rationalist gets nothing out of it and concludes
   philosophy isn't for them.

## What this is and isn't

An **orientation device**. A six-screen flow produces a shelf: four
philosophers who begin near the user's expressed instincts on a chosen topic,
and four who approach it from a meaningfully different direction. Both groups
are labelled with *why* and explained in terms recognizable from the user's
answers. The user reads and picks.

**It does not discover whom the user agrees with, pick one philosopher, or
produce a definitive philosophical profile.** Agreement with a philosopher is
multidimensional; these questions sample one topic. The instrument's job is to
narrow 23 to a legible eight and explain why each may be worth meeting.

**Each group is deliberately broad.** A religiously inclined user's starting
group should show that there is more than one way to approach God — Aquinas
reasoning, Augustine beginning from experience, Kierkegaard from commitment,
Descartes from proof. The different-angle group might show Hume examining the
evidence, Nietzsche asking what belief did to us, Sartre working out what
follows without God, and Camus refusing consolation. Four people who merely
repeat one another is the worst outcome the shelf can produce.

It is **not** structured learning. Mini-courses and reading paths address depth
and are out of scope here.

---

## Architecture

The router is a **retrieve-then-rerank pipeline** — the standard shape for this
class of problem — with deterministic stages at both ends and model judgment in
the middle.

| Stage | Mechanism | Deterministic? | Failure mode |
| --- | --- | --- | --- |
| 0 · Intake | Questions 1–6 | Yes | — |
| 1 · Retrieve | `topic_tag[chosen] >= 2` → pool of ~14 | **Yes** | Unrecoverable, invisible |
| 2 · Organize | Structured orientation answer establishes two broad groups | **Yes** | Recoverable, visible |
| 3 · Rerank | Tension answer + vignette + approach select and order within each group | **Hybrid** | Recoverable, visible |
| 4 · Guardrail | Veto layer over the reranker | **Yes** | — |
| 5 · Explain | RAG-grounded prose | **No** | Factual mischaracterization |

### The governing principle

> Be deterministic where a mistake is **unrecoverable and invisible**.
> Be non-deterministic where a mistake is **recoverable, visible, or not even
> definable**.

Stage 1 decides who is *available*. If Kierkegaard never enters the pool, no
later stage can put him on the shelf, and no single user can detect that he was
missing. That failure profile demands determinism, because exhaustive proof
("enumerate all ten topics, confirm nobody is orphaned") is the only way to
establish the property.

Stage 2 uses a structured answer rather than asking a model to infer the user's
orientation from prose. Stage 3 interprets the vignette only inside the
qualified candidates and already-established groups. Every candidate was
already eligible; both groups are shown regardless. A poor rerank is visible
and recoverable without corrupting the candidate pool.

Stage 5 has no single ideal wording, but its claims about philosophers remain
factually and interpretively constrained. Personalization quality is graded;
grounding and faithful characterization are requirements.

### Stage 4 — the guardrail layer

The reranker proposes; deterministic rules dispose. Enforced after every model
call, with veto:

- Both groups contain exactly four (or the documented short-group fallback).
- Every returned id exists in the roster.
- No philosopher appears in both groups.
- No `approach` occupies more than two slots in a group.
- Every returned philosopher was in the retrieved pool.

Violation → retry once with the failure fed back → fall back to deterministic
ordering. **The shelf must render without the model.**

This layer exists because LLM rerankers empirically collapse onto a small
prominent subset (see Research below). The rules do not make the output smart;
they make certain outcomes impossible.

---

## Design decisions

### D1. Selection is bounded, not free.

The model never chooses from the roster. It chooses *within* a deterministically
retrieved pool, under guardrails that enforce coverage and balance.

**Why:** this codebase's entire quality apparatus (`data/rag/`, the stress
harness, `npm run check:integrity`) exists because confident-but-wrong
characterization of these philosophers is a demonstrated failure mode. A model
asked to freehand a shelf has none of that curation available to it — it has
the internet's canon, which over-weights exactly the names the problem
statement identifies as the issue.

*Supersedes v3's "no model call decides the shelf," which was more conservative
than the evidence supports.*

### D2. Compose a shelf, don't declare a match.

Groups begin with the user's structured orientation answer, but the result is
not described as agreement or disagreement. Nearest-neighbour selection is
*actively wrong* as the whole algorithm: philosophers cluster, and the four
nearest are often four people saying the same thing. Relevance scoring may
inform membership, but the shelf is composed under diversity constraints.

### D3. Breadth inside a group is engineered.

`approach` is a hard constraint: **no more than two philosophers of the same
approach per group.** Four slots against a cap of two guarantees at least two
routes and usually three.

**Why a cap rather than one-of-each.** Strict round-robin can *promote* a weak
topic fit purely to fill a route — on the God shelf it forces in Plato, the only
literary theist, ahead of Descartes and Kierkegaard. The cap only ever blocks a
fifth lookalike; it never promotes a poor fit.

*v6:* the cap scales with group size — **⌈slots/2⌉ per approach**, i.e. two at
four slots, three at five — resolving the unfillable-pole cases the screen-2
draft found (`consolation · face`, Other people's *cost* pole) without
loosening the four-slot shape.

### D4. Different angles stay on topic.

"Opposite stance" alone hands a theist Marx and Foucault, who barely engage the
God question. The topic filter applies to *both* groups.

### D5. Four per group, eight on screen.

Four is also the number of `approach` values, which is what lets D3 be a clean
cap rather than a distorting round-robin. **Consequence:** the shelf shows
roughly half the eligible pool, so selection is editorial and the ordering rules
are load-bearing.

### D6. Questions elicit reasoning, not a philosophical identity.

Novices answer abstract belief questions the way they think they should. Every
branch question therefore pins its options to a concrete instance — a decision
made, a rule followed, a loss taken — and reads the kind of reason reached for
rather than a professed position (v6; checklist rules 1–2 in the screen-2
draft).

Situations are third-person or hypothetical where the topic allows it, and may
invite the user to draw on experience, but personal disclosure is never the
price of receiving a useful shelf.

### D7. Each topic has a three-question branch; nothing else branches.

*Revised in v6 to adopt the screen-2 draft's architecture change (2026-07-29)
as canonical.*

For each topic, author **three concrete questions**. Every question carries the
branch's four routes as its four options, so the routes are constant across the
branch and what gets read is the *pattern* of reasons rather than a single
click. Each question is pinned to one concrete instance (checklist rules 1–2),
which is what keeps every option on-subject. Each question also carries an
optional free-text box; see D13.

The user's side of the topic axis is a **majority tally** of the three clicks —
two of three fixes the pole, deterministically. Documented exceptions:
"Who am I, really" runs two questions with Q1 authoritative on a 1-1 tie
(screen-2 draft §4); on "Am I free," when the two first-person questions split
1-1, the third-person Q2 decides in plain majority fashion and the explanation
copy presents the mixed pattern as mixed (ruling of 2026-08-14, §5).

The user answers three topic-specific questions, then two universal questions:
what persuades them and what they want from the experience. Including topic
selection, the flow is six screens. The drop-off risk of six screens is
accepted for v1 (author decision, 2026-08-14): the diagnostic is offered, not
forced (D11), and a click-through user spends one tap per screen.

**Why three:** one split supplies too little evidence for personalized
selection, and a single four-option question cannot both sort into two poles
and expose four routes — the fourth option always drifts off-topic to stay
distinguishable. Three questions buy route *coverage* and better free text,
not a finer split. Full argument: screen-2 draft, "Architecture change."

### D8. No safe middles.

Any option reading as the reasonable compromise ("some mix", "both", "neutral")
collects the majority and carries almost no information. Corollary: no option may
read as the *wrong* answer either, and none may read as the *flattering* one —
self-deprecating options under-collect, and self-congratulating options
over-collect from people who then get an experience they didn't want.

### D9. Ethics uses the standard two-group shape.

`moral_ground` (duty / outcomes / character / feeling) is four categories, not
two sides. So **where morality comes from** splits — *found* (discovered, or
grown out of human life) versus *made* (inherited from someone's advantage, or
invented) — and **the secret and the promise** supplies the spread, playing the
role `approach` plays elsewhere.

It also produces the "same family, different conclusions" grouping without a
third group: a user who says morality is real gets Kant, Aquinas, Aristotle and
Mill together, and the label says so.

### D10. Duel content is selected, never generated.

Gated on `hasCuratedTopics()`; renders empty rather than falling back to
`FALLBACK_TOPICS`. Four against four is sixteen candidate cross-pairs per
shelf, and the shelf shows **two to three duels, each pairing one philosopher
from each group** (v6) — a duel is the two groups' disagreement made watchable,
so a within-group pair is never selected. Prefer pairs with hand-curated
`DUEL_TOPICS` entries; fill from `composedTopics()`, which now covers every
roster pair (see open item 11, resolved).

### D11. Offered, not forced.

The grid stays reachable without the diagnostic. Preserves a clean comparison
between quiz-takers and grid-users.

### D12. The results screen is a shelf, not a decision or agreement verdict.

Eight philosophers across two labelled groups is a *browse* screen. It does not
deliver "one obvious next step." Deliberate trade for a product whose goal is
orientation.

Results are introduced with language such as:

> Based on your answers, here are eight philosophers we think you will find
> worth meeting.

The group labels are **Start with these** ("These thinkers approach the question
from somewhere near your starting point") and **Try a different angle** ("These
thinkers may challenge, complicate, or reframe that starting point").

*Framing confirmed by author decision, 2026-08-14, over the earlier
"agree/disagree" goal statement: three structured answers about one topic
cannot honestly establish agreement with a whole philosopher, and a shelf
labelled "these disagree with you" invites skipping the half that carries the
exposure value.*

### D13. Free text is optional, and it never changes group membership.

*Revised in v6. v5 specified one required, text-only diagnostic vignette per
branch; the three-question architecture replaces it with an optional text box
on every branch question, and the requirement moves to the option click.*

Every branch question **requires an option click**; the text box beside it is
optional and encouraged. Clicks decide the pole via the majority tally —
deterministically, always. Free text feeds only the bounded rerank *within*
each group (stage 3) and the explanation copy (stage 5): the model may use it
to select and order candidates inside a group and to choose which curated
aspect of each philosopher to highlight. It may not add an ineligible
philosopher, move one between groups, or override the diversity cap. A
response that contradicts the user's clicks is surfaced as nuance in the
explanation, never silently re-sorted.

This resolves a contradiction in the screen-2 draft, which at one point calls
the free text "stage 2's override": an override would push a deterministic
stage onto the model, against the governing principle and the guarantee that
the shelf renders with the model unavailable.

What survives from the v5 vignette rules: prompts stay third-person or
hypothetical where the topic allows it, personal disclosure is never the price
of a useful shelf (D6), and text the user does write is the best ranking and
explanation signal available, so the UI should invite it without demanding it.
Client and server validation now reject a question submitted without an option
click, not an empty text response. A model error, timeout, malformed rerank,
or guardrail failure still falls back to the deterministic shelf.

---

## The data

Per philosopher, in `philosophers.ts`.

> **✅ Built 2026-08-14.** The tag matrix is transcribed into
> `src/lib/philosophers.ts` and typed in `src/lib/types.ts`; the selection
> rules below are implemented in `src/lib/routing.ts`; and
> `src/lib/diagnosticTags.test.ts` asserts all twenty groups of
> `diagnostic_shelf_preview.md` member-for-member. **Topic tag and stance
> value are one signed field, not two** — see the note under Stance fields.
> `moral_ground` is the only field in this section still unwritten, and open
> item 15 asks whether it should be written at all.

### Topic tags — ten, scored 0–3

| Topic | Group |
| --- | --- |
| What makes a life worth living | How to live |
| Right and wrong | How to live |
| Suffering, loss, death | How to live |
| Who am I, really | Who I am |
| Am I free | Who I am |
| **Other people** | Who I am |
| Why we accept the rules | Who I am |
| Is there a God | What's out there |
| What's actually real | What's out there |
| How do we know anything | What's out there |
| ~~Do these questions have answers~~ | *merged into "How do we know anything" (v6; screen-2 draft §9)* |

### Stance fields

| Field | Type | Poles / values | Splits |
| --- | --- | --- | --- |
| `transcendence` | −3…+3 | nothing beyond nature ↔ a divine order | Is there a God |
| `sociality` | −3…+3 | others cost you yourself ↔ others complete you | Other people |
| `agency` | −3…+3 | you were made ↔ you make yourself | Am I free; Who am I |
| `moral_source` | −3…+3 | morality is made ↔ morality is found | Right and wrong |
| `approach` | categorical | rational / empirical / experiential / literary | knowledge topics; spreads everywhere |
| `moral_ground` | categorical | duty / outcomes / character / feeling | spreads the ethics shelf |

**Resolved (v6, per the screen-2 draft's finding A): the axis count is ten —
one stance field per topic.** Two topics sharing a field is the definition of
two shelves with the same people on them, which D2/D4 rule out; the
found/made/authored family had to be broken into `moral_source`, `sufficiency`,
`selfhood` and `legitimacy` precisely to stop the shelves converging. The full
field/pole table is in the draft (finding A). Stance values are authored
**sparsely** — only for philosophers tagged ≥2 on the topic the field splits.

**Encoding as built (2026-08-14): the topic tag and the stance value are the
same number.** A stance field is only ever read for philosophers already in
that topic's pool, so "tag 2, negative pole" and "stance −2" were always one
authored decision recorded twice — which is exactly how the preview doc's
matrix writes it (`3·enough`, `2·refr`). `philosophers.ts` therefore carries a
sparse `topics` map of signed integers, magnitude 2–3, where **negative is the
first-named pole of each axis** (`nothing beyond nature`, `others cost you
yourself`, `you were made`, `morality is made`, and the six in the screen-2
draft's finding A table). `TOPIC_POLES` in `types.ts` is the authority on
direction and `diagnosticTags.test.ts` pins it with a tag-3 anchor per pole per
topic, so a later edit cannot silently invert an axis and swap two shelves.
An absent key means tag ≤ 1 — out of the pool.

**`approach` values** — drafted here, now the shipped values in
`philosophers.ts` (asserted against this table by `diagnosticTags.test.ts`):

| Approach | Philosophers |
| --- | --- |
| rational | Aquinas, Descartes, Spinoza, Kant, Hegel |
| empirical | Aristotle, Epicurus, Hume, Locke, Mill, Marx, Foucault |
| experiential | Augustine, Kierkegaard, Heidegger, Sartre, Beauvoir |
| literary | Plato, Marcus Aurelius, Nietzsche, Camus, Girard, Wittgenstein |

*Wittgenstein in "literary" is a stretch — his method is closer to dissolving a
question than persuading by image. Flagged in open items.*

**Authoring cost — original estimate:** 23 × 10 topic tags + ~14 × 10 sparse
stance values + 23 × `approach` + 23 × `moral_ground` ≈ **416 values**. Every
one is arguable, which is the point.

**Actual after the Girard roster swap (2026-08-22): 156 written, 23 open.** The merged
encoding above removes the ~140 separate stance values, and sparse authoring
means only tagged cells are recorded rather than all 230 topic cells:

| | Estimated | Written |
| --- | --- | --- |
| topic tags | 230 | **133** (sparse; 134 in the matrix less Kant's withdrawn `depth`) |
| stance values | ~140 | **0** — merged into the tag's sign |
| `approach` | 23 | **23** |
| `moral_ground` | 23 | **0** — see open item 15 |
| | ≈416 | **156** |

---

## The six screens

| Screen | Prompt | Universal? | Effect |
| --- | --- | --- | --- |
| 1 | Topic — pick one | Yes | **23 → ~14.** Sets the pool and selects the three-question branch |
| 2–4 | Branch questions 1–3 — four routed options + optional text box each | **Branched (× 10 topics)** | Majority tally of clicks establishes the two groups; the route pattern and free text add nuance within them |
| 5 | What persuades you | Yes | Orders each group and supplies the diversity dimension |
| 6 | What are you looking to get out of this | Yes | Sets tone, `AnswerLevel`, and result emphasis |

Nothing expands. The funnel only narrows. The route pattern, the free text,
and screen 5 may affect which eligible candidates occupy the eight slots, but
cannot admit a philosopher outside the topic pool or move one across the
tally's grouping.

### Question 1 — Topic

> **How to live**
> · What makes a life worth living?
> · Right and wrong, how do I actually decide what choices to make?
> · Suffering, loss, and death; how do I face them?
>
> **Who I am**
> · Who am I, really, and am I living as myself?
> · Am I free, or is it all already set in motion?
> · **Other people; do they make me who I am, or get in the way of it?**
> · Why do we accept the rules we're handed?
>
> **What's out there**
> · Is there a God, and what would it mean if there were?
> · What's actually real, underneath appearances?
> · How do we know anything at all, or are we just arguing about words?

**Question 1 is also the exposure mechanism.** Reading ten topics is how
someone discovers that "why do we accept the rules we're handed" is a live
question. That is why the list is worth getting right even though only one
option is picked.

**"Other people" was added in v4.** Sixteen of twenty-three philosophers would
be tagged 2 or 3 on it — the best-populated topic on the list — and it is the
only topic that puts Hegel (recognition) and Beauvoir (becoming, the Other) on
their actual subjects rather than making them compete as junior versions of
someone else.

### The branch questions (branched)

*v6: "orientation" is now branch question 1 of 3; questions 2 and 3 of each
branch follow the same shape (four routed options, optional text box, the
screen-2 draft's authoring checklist). The drafts below stand as each branch's
question 1.*

Each branch question supplies four concrete options mapping to the topic's two
poles through four routes. It contributes one vote to the majority tally and
is not displayed back as a declaration of the user's beliefs.

#### ✅ Other people — route audit applied 2026-08-14

> **Think about the people you actually spend your life with.**
>
> a) A few particular people made me who I am. → *complete · formation* (Hegel, Aristotle)
> b) The best things in my life have been people. → *complete · the good* (Epicurus, Augustine, Hume)
> c) When I'm in a group I tend to go along with whatever's already happening, without really deciding to. → *cost · anonymous* (Heidegger, Kierkegaard, Nietzsche)
> d) I notice that around other people I do what I think they'll approve of, rather than what I'd actually do. → *cost · the gaze* (Sartre, Beauvoir, Foucault)

*Audit (2026-08-14), against the four-routes discipline: Aristotle was
annotated on both (a) and (b) — he keeps (a), where character friendship as
mutual formation ("the friend is another self") is distinctively his; (b)
keeps Epicurus, Augustine, and Hume. Beauvoir comes off (a) per the stance
ruling (her pole is cost); she keeps (d), where the internalized gaze is also
exactly Foucault, who joins the option. Coverage holes to close in this
branch's Q2–Q3: **Plato** (the Eros ascent — in the pool, no honest Q1
option) and **Marcus Aurelius** (others as disturbance, the inner citadel — a
third cost surface no Q1 option reaches). Same class of hole as Kant on the
rules branch. **Closed 2026-08-14** — Q2–Q3 drafted (screen-2 draft §10):
Marcus lands on the solitude question's anonymous route, Plato on the
admiration question's formation route, and a third hole this audit missed —
**Mill**, pooled the same day with no Q1 route — lands beside Heidegger on
the admiration question's taken-over-opinions option.*

*Split chosen as "complete vs. cost" rather than "because of vs. in spite of
others," because the latter duplicates the `agency` split on "Am I free" and
would produce two shelves with nearly the same people.*

*Balance note: (a) and (b) are short and plain, (c) and (d) are specific and
recognizable. Specific options attract people who see themselves in them, so
watch the distribution — the risk is now that (c)/(d) pull ahead, not (a)/(b).*

#### ✅ Is there a God — rulings applied 2026-08-14

> **Set aside what you'd say to someone else. Do you believe that there's a higher power?**
>
> a) There's something behind all this. It doesn't make sense to me otherwise. → *transcendent · reasoned* (Aquinas, Descartes)
> b) I've had moments where I was certain of it, whatever "it" is. → *transcendent · experienced* (Augustine, Kierkegaard, James)
> c) The feeling that there's a higher power is something we make, not something we find. → *not · explained* (Hume, Nietzsche)
> d) I don't think there's anything there, and I don't think that's good news. → *not · lived without* (Camus, Sartre)

*Replaces a five-option version with two safe middles that asked for a creed.
(a)/(b) split the reasoned from the experienced route to belief — the
Aquinas/Descartes vs Augustine/Kierkegaard division that the God shelf is
supposed to show.*

*Prompt and option (c) rewritten by the author, 2026-08-14. "Set aside what
you'd say to someone else" sharpens what the old "what you'd say you
believe" was reaching for — the gap is between the public answer and the
private one. (c) previously opened "That feeling is real, but…", whose
"that feeling" pointed back at (b); with a prompt that no longer mentions a
feeling, the referent dangled, and naming it fixes that. **Two things to
watch, logged rather than argued:** (i) "Do you believe…?" is closer to the
creed register this block's own note records moving away from — the four
options still answer with stances rather than yes/no, which is what keeps
D6 satisfied, so the guard is now carried entirely by the options; (ii)
"higher power" reads personal, while the pole is `transcendence` (a divine
order ↔ nothing beyond nature). Plato's Good and Spinoza's one substance
are impersonal, and both sit in this pool — so the prompt's phrase must
never be echoed back in group copy or explanations as though the shelf were
about a personal deity.*

*Q2–Q3 drafted 2026-08-14 (screen-2 draft §11), closing this branch's two
coverage holes: **Plato** joins the reasoned route on a question about the
world's order (the Good as the source of "being and intelligibility"), and
**Spinoza** — left "in the pool for the reranker" by the ruling below, with
no click able to reach him — joins the explained route on the projected-
purposes option, which explains away providence rather than God and so
keeps the copy guard intact. The branch's Q3 (praying) carries the
instrument's most serious remaining disclosure risk; see finding F.*

*2026-08-14 — the §C fixes and the (d) rewrite are applied. Spinoza off (a):
he stays in the pool on the other pole, with the copy guard. Marx off (c):
tag 1, out of the pool. (d) reworded from "and I'd rather there were" to a
judgment about the world rather than an admission about oneself — same Camus
content, better D6 compliance, no longer asks a non-believer to confess a
want. Nietzsche, previously annotated on both (c) and (d), keeps only (c):
death of God is a diagnosis of what we made and lost, not a wish.*

#### Status of the branches

Per-branch status is tracked in one place: the screen-2 draft's **"Still to
do"** table. As of v6: Right and wrong, Who am I and Am I free are complete;
six branches need questions 2–3; the God branch needs two rulings and Other
people a pole fix and route audit — see open item 2 for the agreed order.

### Question 3 — Tension (superseded in v6)

The separate "tension" question is gone: its job — distinguishing reasons,
reservations, and mixed positions inside the poles — is done by the *pattern*
of route clicks across the branch's three questions. What survives as rules:
each branch's questions probe different concrete surfaces of the axis, option
order is scrambled between them (checklist rule 13), and contradictory-looking
answer combinations are valid and often more informative than consistent ones.

### Question 4 — Diagnostic vignette (superseded in v6)

The standalone required vignette screen is gone; see D13. Its two jobs moved:
reranking signal now comes from the optional text boxes on each branch
question, and the concrete-situation discipline became checklist rules 1–2
(every question is pinned to a named instance). The quality criteria below
still apply — they are now criteria for branch-question prompts — and the
provisional shapes remain raw material for authoring questions 2–3.

Good vignettes:

- require no philosophical vocabulary;
- make no answer obviously kinder, smarter, or more socially acceptable;
- expose a central conflict in the topic rather than a peripheral curiosity;
- allow the user to reject the framing;
- can be answered without personal disclosure; and
- contain enough ambiguity for different reasoning paths to be defensible.

Provisional shapes to refine during authoring:

- **Freedom:** someone leaves a career chosen under family expectations after a
  friend's intervention, then wonders whether the decision was ever "theirs."
- **Right and wrong:** keeping a promise protects trust but risks serious harm
  to someone else.
- **Other people:** a creative group helps someone improve and feel recognized
  while making it harder to tell which choices are genuinely their own.
- **Knowledge:** personal observations support a claim while a large systematic
  study points the other way.
- **God:** an improbable survival is understood by one person as providence and
  by another as meaningful but natural coincidence.

These are design examples, not approved copy. Every final vignette requires
content review and human evaluation of whether materially different reasoning
produces sensible reranks.

### Question 5 — What persuades you

Supplies `approach`. Asks what persuades rather than what appeals; conviction is
a stance, appeal is a pose.

> Someone's trying to change your mind about something that matters. What actually moves you?
> a) A tight argument where each step follows from the last → **rational**
> b) Evidence from how things actually go, examples, track record → **empirical**
> c) Something that names an experience I've had but never had words for → **experiential**
> d) A story or image that sticks with me → **literary**

**This is the most cuttable question in the design.** Its answer primarily
decides who leads a group; the diversity cap is a property of the candidate set
and needs no user input. Kept because it is the one uniform accessibility
signal across all users and should not be inferred from one vignette response.

### Question 6 — Intent

> **What are you looking to get out of this?**
>
> a) Something specific is on my mind and I want to think it through. → applied register, `beginner`, starts with **Start with these**
> b) I want to understand what these people actually said. → `intermediate`, 4/4
> c) I want my own thinking pushed on; tell me where I'm wrong. → starts with **Try a different angle**, opening message pushes back
> d) I want to read the real thing and I need somewhere to start. → `primary-text`, leads with accessible entry works

This is the only question that shapes what happens **after** the pick, and it is
the design's answer to the standing objection in *Sequencing* — that a router's
value is capped by the quality of the destination it routes into.

It changes ordering, visual emphasis, and what happens after the pick, but
**never the four-plus-four membership contract**. Both groups are always
present, so emphasis shifts without building a filter bubble.

`AnswerLevel` already exists in `types.ts` as a manual toggle users have to
discover; this sets its default.

---

## Selection

```
pool            = philosophers where topic_tag[chosen] >= 2
pole            = majority tally of the branch's three option clicks
starting_points = pool ∩ near the pole
different_angle = pool ∩ meaningfully different from the pole
routes          = the per-question route pattern of the clicks
text_read       = bounded model extraction from any optional free text

for each group:
  rank by topic fit, route-pattern fit, text relevance, and approach accessibility
  fill exactly 4 slots by fit tier (tag 3s before 2s);
    within a tier, prefer the approach least represented in the group so far,
    skip any candidate whose approach is at the cap (⌈slots/2⌉),
    and break remaining ties by declaration order
  use the model only to rerank eligible candidates within the group

guardrail layer validates; on failure retry once, then fall back
  to deterministic ordering
```

*The within-tier diversity preference was adopted 2026-08-14 after shelf
enumeration (`diagnostic_shelf_preview.md`) showed the cap alone left 7 of 20
groups at two approaches; the preference fixes five at zero cost to fit. Fit
is never sacrificed for spread — a two-approach group of tag-3s stands (the
ethics found-group is the accepted case).*

*Display order defaults to fill order (lead first), but an authored per-shelf
display order may override it — presentation only: membership, tags, and the
lead-is-a-tag-3 property are untouched, and the stage-3 rerank still reorders
within the group at runtime. One exists so far (2026-08-14): `self · core`
renders Descartes · Augustine · Kierkegaard · Plato, moving Kierkegaard off
the front of the shelf; Descartes leads.*

If a group cannot fill, loosen the threshold from `>= 2` to `>= 1`; if it still
cannot, show a short group rather than padding with a poor topic fit. This is an
explicit failure of the four-plus-four coverage target and must be visible in
the exhaustive sweep before shipping.

### Worked example — believer, God topic, persuaded by argument

| | |
| --- | --- |
| Pool | Aquinas, Augustine, Kierkegaard, Descartes, Plato, Spinoza, Kant, Hegel, Hume, Nietzsche, Sartre, Camus |
| Pole | branch tally → positive `transcendence` |
| Start with these | **Aquinas** (rational, leads), Augustine (experiential), Kierkegaard (experiential), Descartes (rational) — cap reached on both approaches |
| Try a different angle | Hume (empirical), Nietzsche (literary), Sartre (experiential), Camus (literary) |

Two routes to God on one side; two rejections and two ways of living after it on
the other. The route pattern and free text may change membership among
qualified candidates; screen 5 changes accessibility ordering. The
four-plus-four shape remains stable.

---

## Results screen

> **Based on your answers, here are eight philosophers we think you will find
> worth meeting.**
>
> **Start with these**
> *These thinkers approach the question from somewhere near your starting
> point — and they get there by different roads.*
> Aquinas · Augustine · Kierkegaard · Descartes
>
> **Try a different angle**
> *These thinkers may challenge, complicate, or reframe that starting point.*
> Hume · Nietzsche · Sartre · Camus

Group labels are authored per topic per orientation (~24 lines). The vignette
response is not automatically reprinted on the results screen: a developed
answer may contain sensitive or private material. Personalized copy may refer
to a restrained, recognizable feature of the reasoning, but must not turn a
model inference into a declaration about the user's identity or beliefs.

Each card carries name, portrait, and `blurb`. Selecting one opens the
conversation, seeded with the vignette response and Question 6 intent.

**Cross-topic exposure lives here, not in a question:**

> *You didn't pick this one, but from what you wrote you might find "Why do we
> accept the rules we're handed?" worth a look. Nietzsche and Foucault are both
> there.*

Asking someone about a topic they didn't choose burns a screen to collect an
answer you'd mostly discard. Showing them one costs nothing and lands better
after they've seen a shelf they trust.

Duels appear below both groups, gated per D10.

---

## The non-deterministic layer

### Where the model runs

1. **Free-text interpretation (stage 3).** The model extracts a bounded routing
   read from any optional text responses: the central concern, perceived tension,
   practical stakes, relevant concepts, and the reasons the user treats as
   decisive. The structured orientation remains authoritative for group
   assignment. Contradictory reasoning is retained as nuance rather than
   "corrected" into a consistent profile.

2. **Rerank (stage 3).** Orders and selects within each retrieved, structured
   group under the stage-4 guardrails. The call receives only eligible
   candidate IDs and curated topic-specific rationales. It returns a strict
   schema containing the extracted signals, selected IDs, and a relevance
   reason for each selection.

3. **Explanation (stage 5).** RAG-grounded and personalized, but constrained by
   curated topic rationales and retrieved support. This is where most of the
   value lives — a lookup can say "you picked God, these people talk about
   God"; only a model can connect the user's reasoning to the different routes
   represented on the shelf. Every characterization of a philosopher remains a
   factual claim and must be evaluated as such.

4. **Dilemma follow-up.** A philosopher pressing the user on the answer they
   gave, rather than a static contradiction table.

### Why the free-text rerank is auditable

The model does not choose from the roster, determine topic eligibility, or
assign the two broad groups. Its judgment is a bounded comparison among
candidates who already qualify. Log the extracted routing signals, candidate
IDs presented, proposed ordering, relevance reasons, and any guardrail
rejection. Human review can then distinguish a bad read of the user from weak
philosopher metadata or a poor selection decision.

### Mandatory fallbacks

Every branch question requires an option click; free text is optional (D13).
After submission, a model error, timeout, malformed output, or guardrail
rejection falls back to deterministic topic, tally, route-pattern, and
approach ordering. **The shelf must render with the model unavailable.**

### Do not use self-reported confidence

The natural design — "if the model isn't sure, fall back" — is undermined by
findings that LLM guard models are systematically overconfident and poorly
calibrated. Trigger fallbacks on structural conditions such as invalid schema,
ineligible IDs, or repeated guardrail rejection rather than on the model
claiming uncertainty.

---

## Testing and evaluation

### Deterministic properties — proven exhaustively

1. **Golden set** — 25–30 hand-written answer profiles with expected group
   membership. `src/lib/routing.test.ts`, same shape as `retrieval.test.ts`.
   Assertions are about membership, not rank.
2. **Spread assertion** — no `approach` occupies more than two of a group's
   four slots unless the pool offers no alternative.
3. **Exhaustive sweep** — enumerate every reachable structured path and count
   appearances per philosopher. Three bug classes: any philosopher on >60% of
   shelves (tags too broad), any on none (unreachable), any appearing **only**
   in **Start with these** or **only** in **Try a different angle**.
   *Amended 2026-08-14:* the >60% check flags **unless every appearance
   carries a written justification**. Nietzsche and Augustine are the two
   documented exceptions (see `diagnostic_shelf_preview.md`, rulings log) —
   their breadth is honest, a user sees only one shelf, and the branch route
   annotations depend on their pool membership; the binding condition is
   per-topic hook copy, never a shared blurb across shelves.
4. **Group balance** — every path fills both groups without the loosened
   threshold. Expect this to fail first on thin-roster topics.

### Non-deterministic properties — measured, not proven

5. **Free-text interpretation and rerank eval.** Build a dual-reviewed set of
   developed responses across every topic, including answers that reject the
   framing or conflict with the clicked options. Reviewers label the
   central concern, tension, stakes, relevant concepts, acceptable candidate
   set, and clearly unjustified candidates.
   - Measure categorical signal extraction with agreement-adjusted metrics such
     as Cohen's kappa where the labels support it.
   - Measure selection with recall against the acceptable set and the rate of
     clearly unjustified inclusions; do not pretend there is one canonical
     four-person answer.
   - Keep 5–10% ongoing human verification and re-sample for drift.
6. **CI regression gate.** Prompt changes run the eval suite; a score drop below
   baseline blocks the merge. Curate production traces with negative feedback
   into the golden set as hard examples.
7. **Trace logging** — for evaluation-consented traces, record the structured
   answers, candidate IDs, extracted vignette signals, proposed selections,
   stated reasons, and every guardrail rejection. Do not place raw sensitive
   prose in routine analytics.
8. **Option-distribution instrumentation.** Any option taken by >70% or <10% of
   users is a dead question. Cannot be tested synthetically; instrument from day
   one.
9. **End-to-end user validation.** Ask whether each reason reflects what the
   user meant, whether each philosopher seems relevant to the chosen question,
   whether the two groups feel meaningfully different, and whether at least one
   card makes the user want to continue. This is the product success criterion;
   classifier and routing metrics are supporting evidence.

### Research this is based on

- **Retrieve-then-rerank is the standard shape.** Quality is consistently
  attributed to the *retrieval* stage rather than reranker capacity — a direct
  argument that the topic tags matter more than the prompt does.
- **LLM rerankers collapse onto prominent items.** One 2026 cold-start study
  measured a reranker concentrating on **3 unique items against 497 for random
  selection**, with popularity-based ranking beating it outright. Different
  domain and a far larger catalogue, so severity doesn't transfer directly — but
  the mechanism is the one that would put Plato and Aristotle on every shelf,
  and it is why stage 4 exists.
- **LLM diversity re-ranking works**, which suggests concentration is
  prompt-addressable rather than intrinsic.
- **Guard-model calibration is poor**, hence the rule against self-reported
  confidence.

Sources: [cold-start reranker coverage](https://arxiv.org/abs/2604.16318) ·
[LLM-as-a-judge failure modes](https://futureagi.com/blog/llm-as-a-judge/) ·
[calibrating judges with human annotations](https://galileo.ai/blog/calibrate-llm-judge-human-annotations) ·
[deterministic guardrails](https://rulebricks.com/blog/deterministic-guardrails-for-llms-building-safe-auditable-ai-systems) ·
[guard-model calibration](https://arxiv.org/abs/2410.10414) ·
[diversity re-ranking](https://dl.acm.org/doi/10.1145/3700604) ·
[eval and regression testing](https://www.braintrust.dev/articles/llm-evaluation-guide)

---

## Coverage audit (2026-07-28, annotated)

Conducted against all 23 `systemPrompt` entries in `src/lib/philosophers.ts`.

> Originally asked *"can this philosopher be someone's #1 pick?"* — the right
> question for the ranking design, stricter than the current bar. The durable
> finding is the **topic list**.

| Philosopher | Most accessible idea | Reached by |
| --- | --- | --- |
| Kierkegaard | Anxiety as "the dizziness of freedom" | agency question |
| Augustine | The divided will | agency question |
| Marcus Aurelius | The dichotomy of control | ⚠️ topic only |
| Epicurus | Empty desires; death is nothing to us | ⚠️ topic only |
| Marx | Alienated labor | agency question |
| Heidegger | The anonymous "they" | agency question |
| **Hegel** | **Recognition — you become a self through others** | ✅ **fixed by "Other people"** |
| **Beauvoir** | **Becoming; woman as Other** | ✅ **fixed by "Other people"** |
| Descartes | Could none of this be real | ⚠️ topic only |
| Locke | Personal identity over time | ⚠️ topic only |
| Plato | The ascent from beauty | ⚠️ topic only |
| Mill | The harm principle | ⚠️ topic only |
| Wittgenstein | Problems as knots in language | skeptic line |

Marcus and Epicurus reached their hooks through a death question that was cut in
v3 and has not yet been rewritten — see the branch status pointer above and
the screen-2 draft §3, where the suffering branch's Q1 is now settled.

The ⚠️ rows reach their shelf via topic tags but no question surfaces their most
vivid idea. Acceptable when the user reads eight summaries, and a direct argument
for **writing `blurb` and group copy to lead with these hooks.**

Domains no question touches: technology (Heidegger, Marx, Foucault), work as
distinct from routine.

---

## Sequencing

Routing was chosen over the alternatives (daily debate challenge, mini-courses)
by explicit decision, over a review objection that a router is a one-time
artifact and cannot address the retention failure that motivated it, and that
its value is capped by the destination it routes into.

**Question 6 partially answers the second half** — it is the one input that shapes
the destination. The retention half stands unresolved.

---

## Open items

### Next up (agreed 2026-08-14)

The decisions phase is complete: all ten branches have a settled question 1,
the draft tag matrix has no unresolved flags, and the selection algorithm and
all twenty computed groups are author-approved
(`diagnostic_shelf_preview.md`). Two writing piles remain, then the pilot:

1. **Shelf copy** (open item 9) — group labels and per-philosopher topic
   hooks, written against the computed shelves. *Draft 1 written 2026-08-14
   (`diagnostic_shelf_copy.md`); awaiting author review.*
2. ~~**Questions 2–3** (open item 2) — seven branches~~ **— done
   2026-08-14. All ten branches now have three questions.** Drafted in the
   agreed order: suffering (§3), rules Q2-replacement and Q3 (§6), other
   people (§10), worth living (§1), what's real (§7), how do we know (§8),
   God (§11). Five were redrafted and author-approved in chat; §8 and §11
   are first drafts awaiting that review. Every pool member in the
   instrument now has a clickable route. Checklist gained **rule 16**
   (spoken register beats compressed register). Four rulings are
   outstanding — see blocking item 2.
3. **Paper pilot** — copy and all thirty questions now exist, so this is
   unblocked: show test users a drafted question and the shelf it routes to,
   and ask whether they'd click one of the eight. Runs before any routing
   code is written. **One gate:** a pilot puts these questions in front of
   real people for the first time, so the safety panel's copy
   (`diagnostic_safety_design.md` §4) should be approved first — a paper
   pilot has no software to catch a disclosure, so the facilitator needs
   the resource line to hand.

**Since agreed:** the tag values went into code the same day (blocking item
3), which was not on this list because it is not a writing pile and does not
gate the pilot — the shelves it computes are the ones the copy was already
written against, now defended by a test instead of a scratchpad script. The
pilot is still the next step, and still runs before the flow is built.

Blocking item 1 (safety) still gates shipping, and the Hume equanimity
source entry added to `philosophers.ts` on 2026-08-14 awaits human
verification.

### Blocking

1. ~~**Safety / crisis disclosure.**~~ **Designed, ruled, and partly built
   2026-08-14 — `diagnostic_safety_design.md`. No longer blocking design
   work; the remaining work is integration, which cannot happen until the
   routing feature exists (that doc's §11 is the wiring guide).** Shipped
   in this repo: `src/lib/diagnosticSafety.ts` (matcher + the
   `disposeFreeText` propagation contract) and
   `src/components/SafetyNotice.tsx`, with 41 passing tests. The design
   answers all four undecided items: deterministic client-side detection on *intent* phrasings (never
   subject matter — the questions are about death and meaning, so a
   topic-keyword list fires on correct philosophical engagement and misses
   the phrasings that matter); a non-blocking offer panel; the flow always
   continues; and all diagnostic free text is ephemeral, with a flag
   additionally stopping it from reaching the rerank model **and from
   seeding the conversation** — the last being the sharpest hazard, since
   personas are hardened never to break character. *Risk list complete as
   of 2026-08-14 — all thirty questions exist, so finding F is no longer a
   moving target. Two rows are load-bearing: suffering Q1–Q3, and **God Q3
   (praying)**, which reaches illness, bereavement and crisis through a
   different door than the suffering branch and is not covered by the God
   branch's Q1.* Original statement of the item:
   Free text is now optional everywhere (D13),
   which lowers but does not remove the exposure: the optional boxes on the
   suffering, freedom, selfhood and rules branches still invite accounts of
   real distress — and, on rules Q2, of an offence — per the screen-2 draft's
   finding F risk list. Undecided: detection mechanism, fallback UX, whether
   the flow may continue after a safety trigger, and retention of sensitive
   free text. **Do not ship without this designed.**
   `src/lib/security/` handles injection and abuse, not user distress.
2. ~~**Questions 2–3 are unwritten.**~~ **All ten branches drafted
   2026-08-14.** What remains is not drafting but decisions: **author
   review** of §8 (how do we know) and §11 (God), which have not been
   through the redraft pass the other five had, and ~~four~~ **three
   rulings** — Aquinas placement (suffering Q2), Plato on the worth branch's
   surpass route (§1), and keep-or-revert on the rules Q2 prompt ending
   changed by rewrite pass 1. *(Kant off the depth pool, §7, was **applied
   2026-08-14** with the tag transcription — no shelf changed; preview doc
   rulings log.)* Status table: screen-2 draft, "Still to do."
3. ~~**The tag values are unwritten.** ~416 under finding A's sparse scheme.
   `approach` is drafted and is the cheapest place to start.~~ **Done
   2026-08-14** — 132 topic tags and 23 `approach` values are in
   `philosophers.ts`, verified cell-for-cell against the preview doc's matrix
   and proven to reproduce all twenty adopted groups. One ruling was applied
   in the course of it (Kant `depth` 2 → 1; preview doc rulings log). Only
   `moral_ground` remains unwritten — see open item 15.

### Design decisions outstanding

4. ~~**God option (d)**~~ **Resolved (2026-08-14)** — reworded to "I don't
   think there's anything there, and I don't think that's good news." A
   judgment about the world, not a confessed want.
5. ~~**"Worth living" split**~~ **Resolved** — enough ↔ more; screen-2 draft §1.
6. ~~**"Am I free" option (d)** — "I know what I'd rather be doing and I keep not
   doing it" is akrasia, which is orthogonal to the make/made axis. Doesn't
   produce a side.~~ **Resolved** — replaced by "I could have overruled what I
   wanted," which is Locke's suspension of desire and Kant's autonomy. See screen 2
   draft §5. Note the akrasia phenomenon returns usefully as that branch's Q3 (d),
   where the clause "that's not something I get to decide" gives it a pole.
7. ~~**Question 5 option (d)**~~ **Resolved** per the screen-2 draft's finding
   D: no fifth `approach` value — it breaks D3's arithmetic. Wittgenstein stays
   `literary`, never leads a group, and reaches shelves via `depth` (d) and
   `standpoint` (d), his actual subjects.
8. ~~**The skeptic line.**~~ **Resolved (accepted 2026-08-14)** — merged into
   "How do we know anything"; screen 1 runs ten options and keeps the "arguing
   about words" phrase. Screen-2 draft §9.
9. **Shelf copy drafted, pending author review** — draft 1 in
    `diagnostic_shelf_copy.md` (2026-08-14): all twenty group-label pairs and
    all eighty-plus card hooks, written against the adopted-rule shelves, with
    a per-constraint compliance check and open questions (register, length
    budget, mixed-tally intro). Originally: the highest-leverage authoring in
    the design.
   Against the computed shelves in `diagnostic_shelf_preview.md`: ~20
   group-label pairs (two per topic) and per-philosopher, per-topic card
   hooks. Binding constraints from the 2026-08-14 rulings: Nietzsche and
   Augustine carry a *different* hook on every shelf they appear on (a
   shared blurb violates the concentration ruling); Spinoza's God-shelf copy
  may not call him an atheist; Girard's divine-order copy must present biblical
  disclosure rather than a generic proof of God; the ethics found-group label
  names the Kant–Mill contrast; and
   the `agency` labels must not paint Spinoza, Hume, or Foucault as
   fatalists (the original warning here — "free vs. determined" mislabels
   Foucault — stands).
10. ~~**Famous-name crowding.**~~ **Resolved (adopted 2026-08-14)** via the
    screen-2 draft's finding E: tag value 3 is reserved for "one of the two or
    three questions this philosopher exists to answer," and fit-ranking demotes
    honest-but-peripheral 2s. Accuracy and de-crowding stop conflicting.
11. ~~**Duel coverage ~6%.**~~ **Resolved (2026-08-14) — the figure was
    stale.** `starters.ts` composes topics for every roster pair via
    `DEBATE_LENSES` (`composedTopics()`), so `hasCuratedTopics()` passes for
    essentially every cross-pair. The shelf shows 2–3 cross-group duels per
    D10, preferring the 15 hand-curated `DUEL_TOPICS` pairs when both members
    are on the shelf.
12. ~~**Required-vignette completion and quality.**~~ **Resolved by D13
    (v6):** no text is required anywhere — the option click is the required
    act. The residual question (whether optional text collects enough signal
    to earn its screen space) moves to instrumentation under test #8.
13. **Discoverability.** Offered-not-forced means the novices who most need the
    router have to recognize they want it.
14. **Crisis disclosure in the conversation product itself.** *Opened
    2026-08-14 by the safety ruling; scope is the existing chat, not the
    diagnostic.* A user can type into any conversation what the diagnostic's
    safety layer now catches in its boxes — and there the personas are
    hardened never to break character and never to identify as an AI
    (`src/lib/security/injection.ts`), so a disclosure is answered in voice
    by a simulated philosopher. `src/lib/security/` addresses injection and
    abuse, not distress, so nothing currently covers this. The diagnostic's
    three-part shape ports directly: deterministic pre-send matcher →
    non-blocking notice → the model never receives it in character. Logged
    explicitly so the diagnostic's coverage is not mistaken for the app's.
15. **Does `moral_ground` still have a job?** *Opened 2026-08-14 while writing
    the tag values — it was the one field in "The data" with no values
    anywhere to transcribe, and looking for them suggests the reason is that
    nothing reads it.* D9 gave it the role of spreading the ethics shelf,
    "playing the role `approach` plays elsewhere." Three things have since
    moved underneath that:
    - The Selection section spreads **every** group by `approach`, including
      the ethics ones. Its pseudocode, the stage-4 guardrail list, and the
      twenty computed shelves never mention `moral_ground`.
    - Decision 2 (2026-08-14) accepted the found-group at two approaches and
      made the Kant–Mill contrast **a copy requirement for that group's
      label** — not a selection input.
    - The ethics branch's four routes are `moral_source` routes (A
      *found·discovered*, B *found·grown*, C *made·convention*, D
      *made·invented*; screen-2 draft §2), and the design already feeds the
      route pattern to the rerank as "route-pattern fit". That is the
      mechanism actually distinguishing Kant from Mill inside the found group.
    - No question collects it. Question 5 supplies `approach`; nothing
      supplies duty/outcomes/character/feeling.

    So it reads as vestigial from v3, when ethics had a bespoke shape. **Author
    call:** either name what reads it (and it becomes 23 values to write), or
    strike it from the data table and the authoring cost. Deliberately not
    decided here — it is a design field, not a transcription.

16. **Question 6 (c) has no stated `AnswerLevel`.** *Opened 2026-08-14 while
    building the screen.* (a) is `beginner`, (b) `intermediate`, (d)
    `primary-text`; (c) — "I want my own thinking pushed on" — specifies only
    the emphasis flip to **Try a different angle** and a pushback in the
    opening message. The code reads it as `advanced`, on the level's own
    description ("assumes familiarity; full conceptual depth"), which is an
    inference and is marked as one in `diagnostic.ts`. It is also arguably
    wrong: wanting to be argued with is a disposition, not a reading level, and
    a beginner can have it. **Author call:** confirm `advanced`, or leave (c)
    on the existing default and let it change emphasis only.

17. **The results screen cannot seed a conversation with the free text.**
    *Opened 2026-08-14 while wiring the safety layer.* The results-screen
    section says selecting a card opens the conversation "seeded with the
    vignette response and Question 6 intent", and `disposeFreeText` has a
    `seedConversation` gate built for exactly that. There is no channel to
    carry it: `/conversation/[id]` takes `?prompt=` (an id from a fixed table)
    and `?work=`, and the safety design forbids the text reaching storage, a
    cookie, or a log line — which rules out both `sessionStorage` and a query
    parameter. So the cards link plainly today, Question 6's `AnswerLevel` is
    applied through the existing settings store, and the seed is computed but
    unused. **Author call:** whether a seeded opening is worth a
    same-page transition (the conversation mounted inside `/start`, no
    navigation) or an ephemeral server-side handoff, or whether the shelf is
    enough on its own.

## Files

| Path | Contents |
| --- | --- |
| ✅ `src/lib/types.ts` | **built** — `Approach`, `DiagnosticTopic`, signed `TopicTag`/`TopicTags`, `TOPIC_POLES`, `Pole`, and the two new `Philosopher` fields |
| ✅ `src/lib/philosophers.ts` | **built** — the 132 tag values and 23 `approach` values |
| ✅ `src/lib/diagnostic.ts` | **built** — the ten topic choices, all thirty branch questions with their routes, the tally, and the two universal questions |
| ✅ `src/lib/diagnosticCopy.ts` | **built** — the twenty group-subtitle pairs and the per-topic card hooks. Separate from `diagnostic.ts` because it is draft 1 and the questions are post-review |
| ✅ `src/lib/routing.ts` | **built (stages 1–2 and 4)** — pool, pole split, four-slot fill under the cap, and `checkGuardrails`/`resolveShelf`. Stage 3 is the only gap |
| ✅ `src/lib/diagnosticSubmission.ts` | **built** — one assembly point for everything a finished branch produces, so the three consumers of free text cannot disagree about one answer |
| ✅ `src/lib/diagnosticTags.test.ts` | **built** — the transcription's proof: all twenty adopted groups, the pole convention, spread, sweep, balance |
| ✅ `src/lib/diagnostic.test.ts` | **built** — instrument invariants (four routed options, both poles per question, routes constant per branch, straight-lining impossible) and the tally's two documented exceptions |
| ✅ `src/lib/routing.test.ts` | **built** — the golden set (test #1), the five guardrails, and results-copy coverage |
| `src/lib/routing-classifier.ts` | vignette extraction + bounded rerank call and schema — **the remaining piece** |
| `data/rag/eval/routing-vignettes.json` | dual-reviewed vignette responses and acceptable candidate sets |
| ✅ `src/app/start/page.tsx` | **built** — precomputes all twenty groups as display records so the client never imports the persona module |
| ✅ `src/components/DiagnosticFlow.tsx` | **built** — the six screens, the safety wiring, and the cross-group duel picker |
| ✅ `src/lib/diagnosticSafety.ts` | **built** — intent matcher + `disposeFreeText` propagation contract (`diagnostic_safety_design.md`) |
| ✅ `src/components/SafetyNotice.tsx` | **built** — the crisis-disclosure notice |

---

## Appendix — superseded ranking design

The first version specified **8 axes, a bank of 11 adaptive follow-ups,
second-order refiners, and nearest-neighbour scoring** producing a single ranked
recommendation. Eight to eleven questions; 391 authored values.

**Why it was built.** With one card as the output, a wrong #1 *is* the product
failing, and the argument that a bad *matched* pick costs trust in every later
recommendation was sound.

**Why it fails for a shelf.**

- Ranking precision is spent on a job the user is doing — the difference between
  #1 and #4 doesn't matter when both appear and the user reads both.
- Nearest-neighbour is the wrong function; the four nearest often sound the same.
- Over-parameterised: four answers carry ~10 bits against an output space of
  roughly 80 shelves.
- The refiners were the clearest waste — a whole screen to separate Descartes
  from Locke, both of whom land on the shelf regardless.

**What survived:** the topic list the audit produced, the ethics dilemmas, the
no-safe-middles rule, and the curated-content constraint.

**Caution about bucket size.** At four per bucket, roughly half the pool makes
the cut and the ordering rules do real editorial work. Four is also load-bearing
for D3 — the two-per-approach cap only guarantees breadth while there are four
slots to spread across. If the shelf ever shrinks below four, revisit.

**If ranking is ever needed again** — say a later surface picks one philosopher
to open a course with — start here, but rebuild against that surface's actual
success criterion rather than inheriting wholesale.
