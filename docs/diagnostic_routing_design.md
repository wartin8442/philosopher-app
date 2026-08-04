# Diagnostic Routing (design, not yet built)

> **Status: designed, not implemented.** Supersedes the matching approach in
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
> - **v5 (2026-07-30, this revision)** — replaces the single split question
>   with three topic-specific questions: structured orientation, structured
>   tension, and a text-only diagnostic vignette. The vignette informs bounded
>   reranking and explanation, not bucket assignment. Results are framed as
>   promising starting points and different angles, not philosophers the user
>   "agrees" or "disagrees" with. The shelf remains four plus four; intent
>   changes emphasis, not bucket size.

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

An **orientation device**. A six-question flow produces a shelf: four
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
("enumerate all 11 topics, confirm nobody is orphaned") is the only way to
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

### D4. Different angles stay on topic.

"Opposite stance" alone hands a theist Marx and Foucault, who barely engage the
God question. The topic filter applies to *both* groups.

### D5. Four per group, eight on screen.

Four is also the number of `approach` values, which is what lets D3 be a clean
cap rather than a distorting round-robin. **Consequence:** the shelf shows
roughly half the eligible pool, so selection is editorial and the ordering rules
are load-bearing.

### D6. Questions elicit reasoning, not a philosophical identity.

Novices answer abstract belief questions the way they think they should. The
structured questions therefore ask for an initial reaction and the point where
that reaction becomes difficult. The third question presents a concrete
situation and asks what matters in it and why.

The situation is third-person or hypothetical rather than a request for the
user to disclose their life. It may invite the user to draw on experience, but
personal disclosure is never the price of receiving a useful shelf.

### D7. Each topic has a three-question branch; nothing else branches.

For each topic, author three questions:

1. **Orientation** — a structured initial instinct that establishes the two
   broad result groups.
2. **Tension** — a structured complication that distinguishes reasons and
   mixed positions within those groups.
3. **Diagnostic vignette** — a short, topic-specific situation followed by a
   text-only question asking what matters, what the person should make of it or
   do, and why.

The user answers three topic-specific questions, then two universal questions:
what persuades them and what they want from the experience. Including topic
selection, the flow is six questions.

**Why:** one split supplies too little evidence for personalized selection.
Three equal binary votes would merely flatten the user at higher resolution.
Giving the questions different jobs preserves a legible shelf while allowing
contradiction and tension to become routing signal.

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
`FALLBACK_TOPICS`. Four against four is sixteen candidate cross-pairs per shelf
and only one is needed.

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

### D13. The vignette is text-only and affects reranking, not grouping.

The vignette provides something concrete to respond to without asking about the
user's private life. It has no answer buttons: buttons would scaffold a
paraphrase of authored options rather than reveal what the user notices.

The orientation answer remains the deterministic basis for the two broad
groups. The model may use the vignette to select and order candidates *within*
those groups and to choose which curated aspect of each philosopher to
highlight. It may not add an ineligible philosopher, move a philosopher between
groups, or override the diversity cap.

The vignette response is **required**. There is no Skip, "Nothing comes to
mind," or unanswered path. The prompt should explicitly invite the user to
explain what they notice, what they think the person should make of the
situation or do next, and why. More developed reasoning is better ranking data,
so the UI should encourage a thoughtful answer rather than minimizing the
requested effort.

Client and server validation reject an empty response. A model error, timeout,
malformed rerank, or guardrail failure after a valid response uses the
deterministic shelf; it does not make the vignette optional.

---

## The data

Per philosopher, in `philosophers.ts`:

### Topic tags — eleven, scored 0–3

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
| Do these questions have answers | *(merge candidate — see open items)* |

### Stance fields

| Field | Type | Poles / values | Splits |
| --- | --- | --- | --- |
| `transcendence` | −3…+3 | nothing beyond nature ↔ a divine order | Is there a God |
| `sociality` | −3…+3 | others cost you yourself ↔ others complete you | Other people |
| `agency` | −3…+3 | you were made ↔ you make yourself | Am I free; Who am I |
| `moral_source` | −3…+3 | morality is made ↔ morality is found | Right and wrong |
| `approach` | categorical | rational / empirical / experiential / literary | knowledge topics; spreads everywhere |
| `moral_ground` | categorical | duty / outcomes / character / feeling | spreads the ethics shelf |

**The final axis count is not yet known.** Several topics may share a field —
*is meaning found or authored? is morality discovered or made? is the self given
or constructed?* are arguably one fault line in four costumes. Kant breaks it
(given on morality, made on the self), so it won't collapse perfectly. **Write
the complete three-question topic branches first and let the axis count fall
out.**

**Draft `approach` values** — the one column authorable today:

| Approach | Philosophers |
| --- | --- |
| rational | Aquinas, Descartes, Spinoza, Kant, Hegel |
| empirical | Aristotle, Epicurus, Hume, Locke, Mill, James, Marx, Foucault |
| experiential | Augustine, Kierkegaard, Heidegger, Sartre, Beauvoir |
| literary | Plato, Marcus Aurelius, Nietzsche, Camus, Wittgenstein |

*Wittgenstein in "literary" is a stretch — his method is closer to dissolving a
question than persuading by image. Flagged in open items.*

**Authoring cost:** 23 × (11 topic tags + N stance fields). With four distinct
axes that's 345 values; with one per topic it's 506. Every one is arguable,
which is the point.

---

## The six questions

| Question | Prompt | Universal? | Effect |
| --- | --- | --- | --- |
| 1 | Topic — pick one | Yes | **23 → ~14.** Sets the pool and selects the three-question branch |
| 2 | Orientation | **Branched (× topic count)** | Establishes two broad result groups |
| 3 | Tension | **Branched (× topic count)** | Adds structured nuance within the groups |
| 4 | Diagnostic vignette + text response | **Branched (× topic count)** | Selects, orders, and explains within bounded candidates |
| 5 | What persuades you | Yes | Orders each group and supplies the diversity dimension |
| 6 | What are you looking to get out of this | Yes | Sets tone, `AnswerLevel`, and result emphasis |

Nothing expands. The funnel only narrows. Questions 3–5 may affect which
eligible candidates occupy the eight slots, but cannot admit a philosopher
outside the topic pool or move one across the orientation grouping.

### Question 1 — Topic

> **How to live**
> · What makes a life worth living?
> · Right and wrong — how do I actually decide what choices to make?
> · Suffering, loss, and death — how do I face them?
>
> **Who I am**
> · Who am I, really — and am I living as myself?
> · Am I free, or is it all already set in motion?
> · **Other people — do they make me who I am, or get in the way of it?**
> · Why do we accept the rules we're handed?
>
> **What's out there**
> · Is there a God — and what would it mean if there were?
> · What's actually real, underneath appearances?
> · How do we know anything at all — and do words even mean what we think?
>
> · Or: do these questions even have answers, or are we arguing about words?

**Question 1 is also the exposure mechanism.** Reading eleven topics is how
someone discovers that "why do we accept the rules we're handed" is a live
question. That is why the list is worth getting right even though only one
option is picked.

**"Other people" was added in v4.** Sixteen of twenty-three philosophers would
be tagged 2 or 3 on it — the best-populated topic on the list — and it is the
only topic that puts Hegel (recognition) and Beauvoir (becoming, the Other) on
their actual subjects rather than making them compete as junior versions of
someone else.

### Question 2 — Orientation (branched)

Each branch supplies four concrete options mapping to two broad orientations.
There is no text input on this question. It establishes the deterministic
grouping but is not displayed back as a declaration of the user's beliefs.

#### ✅ Other people

> **Think about the people you actually spend your life with.**
>
> a) A few particular people made me who I am. → *complete* (Hegel, Beauvoir, Aristotle)
> b) The best things in my life have been people. → *complete* (Epicurus, Aristotle, Augustine, Hume)
> c) When I'm in a group I tend to go along with whatever's already happening, without really deciding to. → *cost* (Heidegger, Kierkegaard, Nietzsche)
> d) I notice that around other people I do what I think they'll approve of, rather than what I'd actually do. → *cost* (Sartre, Beauvoir)

*Split chosen as "complete vs. cost" rather than "because of vs. in spite of
others," because the latter duplicates the `agency` split on "Am I free" and
would produce two shelves with nearly the same people.*

*Balance note: (a) and (b) are short and plain, (c) and (d) are specific and
recognizable. Specific options attract people who see themselves in them, so
watch the distribution — the risk is now that (c)/(d) pull ahead, not (a)/(b).*

#### 🟡 Is there a God — drafted, one open item

> **Set aside what you'd say you believe. What's actually true of you?**
>
> a) There's something behind all this. It doesn't make sense to me otherwise. → *transcendent* (Aquinas, Descartes, Spinoza)
> b) I've had moments where I was certain of it, whatever "it" is. → *transcendent* (Augustine, Kierkegaard, James)
> c) That feeling is real, but it's something we make, not something we find. → *not* (Hume, Nietzsche, Marx)
> d) I don't think there's anything there, and I'd rather there were. → *not* (Camus, Sartre, Nietzsche)

*Replaces a five-option version with two safe middles that asked for a creed.
(a)/(b) split the reasoned from the experienced route to belief — the
Aquinas/Descartes vs Augustine/Kierkegaard division that the God shelf is
supposed to show.*

**Open:** (d) asks a non-believer to admit a want, and may under-collect. It is
also the most interesting option in the set and is straight Camus.

#### Status of the other orientation questions

| Topic | Orientation question |
| --- | --- |
| What makes a life worth living | drafted — "given vs authored," not ruled on |
| Right and wrong | usable — "where morality comes from" (see D9) |
| Suffering, loss, death | old draft exists, needs rework |
| Who am I, really | **to write** |
| Am I free | old draft exists, option (d) doesn't sort (see open items) |
| Why we accept the rules | **to write** |
| What's actually real | **to write** |
| How do we know anything | **to write** |
| Do these questions have answers | merge candidate |

### Question 3 — Tension (branched)

The tension question asks where the user's initial reaction becomes difficult.
It is structured rather than free text. Its job is not to vote again on the
orientation; it distinguishes different reasons, reservations, and mixed
positions inside it.

Each option must be compatible with more than one orientation answer. Otherwise
the question is only a disguised repeat of Question 2. Contradictory-looking
answer combinations are valid and often more informative than consistent ones.

**Status: the tension bank is to write and validate for every retained topic.**

### Question 4 — Diagnostic vignette (branched, text-only)

Each topic presents a 60–100 word third-person or hypothetical situation with at
least two genuinely plausible interpretations. It then asks:

> What do you think matters most in this situation? What should the person make
> of it or do next — and why?

The response is text-only. The prompt may be adapted to the topic, but the
request for reasons is mandatory. "What would you do?" alone measures a
socially presentable action more than the reasoning that produced it.

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
> b) Evidence from how things actually go — examples, track record → **empirical**
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
> c) I want my own thinking pushed on — tell me where I'm wrong. → starts with **Try a different angle**, opening message pushes back
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
orientation     = structured answer to Question 2
starting_points = pool ∩ near the orientation
different_angle = pool ∩ meaningfully different from the orientation
tension         = structured answer to Question 3
vignette_read   = bounded model extraction from the required Question 4 text

for each group:
  rank by topic fit, tension fit, vignette relevance, and approach accessibility
  fill exactly 4 slots in rank order,
    skipping any candidate whose approach already occupies 2 slots
  use the model only to rerank eligible candidates within the group
  ties after fallback are broken by deterministic declaration order

guardrail layer validates; on failure retry once, then fall back
  to deterministic ordering
```

If a group cannot fill, loosen the threshold from `>= 2` to `>= 1`; if it still
cannot, show a short group rather than padding with a poor topic fit. This is an
explicit failure of the four-plus-four coverage target and must be visible in
the exhaustive sweep before shipping.

### Worked example — believer, God topic, persuaded by argument

| | |
| --- | --- |
| Pool | Aquinas, Augustine, Kierkegaard, Descartes, Plato, Spinoza, Kant, Hegel, Hume, Nietzsche, Sartre, Camus |
| Orientation | Question 2 (a) → positive `transcendence` |
| Start with these | **Aquinas** (rational, leads), Augustine (experiential), Kierkegaard (experiential), Descartes (rational) — cap reached on both approaches |
| Try a different angle | Hume (empirical), Nietzsche (literary), Sartre (experiential), Camus (literary) |

Two routes to God on one side; two rejections and two ways of living after it on
the other. The tension and vignette answers may change membership among
qualified candidates; Question 5 changes accessibility ordering. The
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

1. **Vignette interpretation (stage 3).** The model extracts a bounded routing
   read from the required response: the central concern, perceived tension,
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

### Why the vignette rerank is auditable

The model does not choose from the roster, determine topic eligibility, or
assign the two broad groups. Its judgment is a bounded comparison among
candidates who already qualify. Log the extracted routing signals, candidate
IDs presented, proposed ordering, relevance reasons, and any guardrail
rejection. Human review can then distinguish a bad read of the user from weak
philosopher metadata or a poor selection decision.

### Mandatory fallbacks

A valid vignette response is required to complete intake. After submission, a
model error, timeout, malformed output, or guardrail rejection falls back to
deterministic topic, orientation, tension, and approach ordering. **The shelf
must render with the model unavailable.**

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
4. **Group balance** — every path fills both groups without the loosened
   threshold. Expect this to fail first on thin-roster topics.

### Non-deterministic properties — measured, not proven

5. **Vignette interpretation and rerank eval.** Build a dual-reviewed set of
   developed responses across every topic, including answers that reject the
   framing or conflict with the structured orientation. Reviewers label the
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
v3 and has not yet been rewritten — see the Question 2 status table.

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

### Blocking

1. **Safety / crisis disclosure.** The required diagnostic vignette is
   third-person, but death, agency, meaning and God answers may still disclose
   real distress. Undecided: detection mechanism, fallback UX, whether the flow
   may continue, and how required completion behaves after a safety trigger.
   **Do not ship without this designed.**
   `src/lib/security/` handles injection and abuse, not user distress.
2. **The three-question branches are unfinished.** Complete and validate an
   orientation question, tension question, and diagnostic vignette for every
   retained topic. The vignette shapes in Question 4 are explicitly provisional.
3. **The tag values are unwritten.** 345–506 depending on the final axis count.
   `approach` is drafted and is the cheapest place to start.

### Design decisions outstanding

4. **God option (d)** — "I'd rather there were" may under-collect.
5. **"Worth living" split** — "given vs authored" drafted, not ruled on.
6. **"Am I free" option (d)** — "I know what I'd rather be doing and I keep not
   doing it" is akrasia, which is orthogonal to the make/made axis. Doesn't
   produce a side.
7. **Question 5 option (d)** groups Plato's myths, Nietzsche's aphorisms and
   Wittgenstein's language games. Not one route. Wittgenstein may need a fifth
   `approach` value or an exemption.
8. **The skeptic line.** Roster of three or four; cannot fill two groups of
   four; its split is unjustified. Merging into "How do we know" fixes all three
   and returns Question 1 to ten options.
9. **Group labels unwritten** — ~24 lines. The `agency` poles need care:
   "free vs. determined" mislabels Foucault.
10. **Famous-name crowding.** Plato and Aristotle honestly engage nearly every
    topic. The approach cap doesn't help — they're different approaches. The fix
    conflicts with tagging accurately; decide which wins.
11. **Duel coverage ~6%.** 15 curated pairs, all among the original six. Compute
    the reachable set from the sweep and author those.
12. **Required-vignette completion and quality.** Define a minimum valid
    response without pretending word count equals thoughtfulness. Test whether
    the required text materially increases abandonment and whether the added
    reranking quality justifies that cost.
13. **Discoverability.** Offered-not-forced means the novices who most need the
    router have to recognize they want it.

## Files (planned)

| Path | Contents |
| --- | --- |
| `src/lib/types.ts` | add `topics` and stance fields to `Philosopher` |
| `src/lib/philosophers.ts` | the tag values |
| `src/lib/diagnostic.ts` | topic branches (orientation, tension, vignette), topic→axis map, group copy |
| `src/lib/routing.ts` | retrieve, organize, rerank, guardrail |
| `src/lib/routing.test.ts` | golden set, spread, sweep, balance |
| `src/lib/routing-classifier.ts` | vignette extraction + bounded rerank call and schema |
| `data/rag/eval/routing-vignettes.json` | dual-reviewed vignette responses and acceptable candidate sets |
| `src/app/start/page.tsx` | quiz + shelf |

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
