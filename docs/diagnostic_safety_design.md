# Diagnostic routing — safety design (ruled and partly implemented, 2026-08-14)

**Status: decided, and the parts that do not depend on unwritten routing code
are built and tested.** This was blocking item 1 of
[`diagnostic_routing_design.md`](diagnostic_routing_design.md) — "do not ship
without this designed." It became writable only on 2026-08-14, when the last
of the thirty branch questions landed and finding F's risk list in
[`screen2_split_questions_draft.md`](screen2_split_questions_draft.md) stopped
being a moving target. The author delegated the open rulings on 2026-08-14;
they are recorded in §10 and are decisions, not proposals.

The blocking item named four undecided things:

| Undecided | Decision |
| --- | --- |
| Detection mechanism | Deterministic client-side matcher on *intent* phrasings, never on subject matter. No model in the path. **Built:** `src/lib/diagnosticSafety.ts`. |
| Fallback UX | Non-blocking notice beside the box. Offers, never diagnoses. **Built:** `src/components/SafetyNotice.tsx`. |
| May the flow continue? | Yes, always. The quiz never punishes disclosure. |
| Retention of sensitive free text | None. Ephemeral by default for *all* free text, not just flagged text. |

**What is not built** is everything that needs the routing feature to exist
first — there is no `/start` page, no `routing.ts`, and no classifier call to
gate. §11 is the wiring guide for whoever builds those.

---

## 1. What this is protecting against, precisely

Not "users typing about death." **This instrument asks them to.** The suffering
branch asks about an irreversible loss; the God branch asks whether they have
ever prayed; the worth branch asks how a twenty-year plateau sits with them.
Finding F lists eleven questions whose optional box can receive an account of
real distress, two of them rated non-mild (suffering Q1–Q3 and God Q3).

The hazard is narrower and worth stating exactly:

1. **A user in present-tense crisis** types it into a box on a philosophy quiz,
   and the product's only response is to show them eight philosophers.
2. **That text is then carried onward** — into a model prompt, into a seeded
   conversation with a persona instructed never to break character, into
   storage, or into an explanation paragraph that quotes it back.

(1) is a duty-of-care problem. (2) is a design problem entirely within our
control, and it is the more urgent of the two because it is the one the
architecture creates.

## 2. The governing constraint, applied

The design's own rule — **the shelf must render without the model** — settles
the detection question before it is asked. If safety detection required an LLM
call, then a model outage would produce a diagnostic that still routes but no
longer notices distress. That is the worst possible failure ordering.

**Therefore detection is deterministic and client-side, and it runs before the
text leaves the browser.** A model-side check may be added later as a second
layer (§6), never as the first.

## 3. Detection — match intent, never subject

The naive implementation is a keyword list containing *suicide, death, dying,
kill, hopeless*. On this product that list is close to useless, and the reason
is worth recording permanently:

> **The Camus problem.** *The Myth of Sisyphus* opens by calling suicide the
> one truly serious philosophical problem. A user answering the suffering
> branch honestly may write "I've wondered whether life is worth living" —
> which is the topic, stated well, by someone who is fine. Meanwhile "I can't
> do this anymore" contains no risk vocabulary at all.

Subject-matter matching therefore fires constantly on correct philosophical
engagement and misses the phrasings that matter. The matcher targets three
things instead, all of which are about **the speaker's present situation**
rather than the topic:

1. **First-person present intent** — "I want to die," "I'm going to kill
   myself," "I don't want to be here anymore," "I've been thinking about
   ending it."
2. **Present-tense inability** — "I can't do this anymore," "I can't go on,"
   "there's no point in going on."
3. **Recent or ongoing harm** — self-harm phrasings, and abuse disclosures in
   the present tense ("he hits me," "I'm not safe at home").

Rules for the list, which matter more than the list itself:

- **Person and tense are load-bearing.** "He wanted to die" (about a friend, on
  suffering Q2, which is deliberately third-person) is not a trigger. "I wanted
  to die last year" is a past-tense disclosure — see the ruling needed below.
- **No philosophical vocabulary in the list**: *absurd, meaningless, nihilism,
  suicide* as an abstract noun, *death, mortality, grief, loss*. All appear in
  the questions themselves.
- **The list is small, curated, and in one file**, following the precedent of
  `src/lib/security/config.ts` — "everything tunable about abuse protection
  lives here so the numbers are auditable in one place."
- **It is a floor, not a classifier.** It will miss things. Everything else in
  this design is built so that missing something is not catastrophic.

**Ruled (A), 2026-08-14 — split by phrasing, not by tense alone.** The
question was whether a past-tense disclosure triggers the notice. Neither
blanket answer survived contact with the phrase list:

- **Ordinary intensity idioms are excluded in the past.** "I wanted to die of
  embarrassment" is English, not disclosure, and it would fire constantly. So
  the *want to die* family requires the present tense.
- **Explicit self-harm language is not tense-filtered.** "I tried to kill
  myself in 2009" is worth answering, and filtering it out to satisfy a rule
  about tense would be pedantry with a real cost.

What makes the split safe is §4's conditional wording. Because the notice says
*"if any of this is about right now"*, it does not assert that a past
disclosure is a present crisis — **it hands the past/present judgment to the
reader, which is exactly the distinction a regex cannot draw and a person
can.** The UX absorbing the ambiguity is what lets the matcher stay crude.
Implemented and tested (`diagnosticSafety.test.ts`, "the Camus set" and "the
intent set").

## 4. Response — offer, never diagnose

**Not a modal.** A blocking dialog on a philosophy quiz, triggered by a phrase
match, tells a user who may be fine that the software has decided something
about them — and tells a user who is not fine that disclosure gets the door
shut. Both are wrong.

**Proposed UX:** the box stays exactly where it is. A quiet panel appears
beneath it, in the app's normal voice, styled like the existing
`AiDisclaimer` rather than like an error:

> **If any of this is about right now, please talk to someone.**
> You can reach a free, confidential helpline at any hour —
> [findahelpline.com](https://findahelpline.com) lists them by country.
> This is a philosophy app, and it isn't able to help with this.
>
> *Your answer stays on this device.*

Four deliberate choices:

- **It does not name a condition or make a claim about the user.** "If any of
  this is about right now" lets a false positive cost the reader two seconds
  and no dignity.
- **It says what the app is not.** The `AiDisclaimer` precedent is directly
  relevant: this codebase already holds that a product speaking in a human
  voice must say plainly what it is, on every surface, because "it's disclosed
  on the explore page is not good enough."
- **One international directory, not a US phone number.** The app has no
  geolocation and ships to whoever opens it; a single country's hotline is
  wrong for most readers. (If a region is ever known, a local line should be
  shown *in addition*.)
- **It tells the user what happened to their text**, which is the one factual
  reassurance available and is true (§5).

## 5. Retention and propagation — the part that is fully in our control

**Proposal: all diagnostic free text is ephemeral, whether or not it is
flagged.** Not a special case for distress — a property of the feature.

| Path | Rule |
| --- | --- |
| Storage / DB | Never written. There is no diagnostic persistence layer; do not add one. |
| Server logs | Never logged. Route handlers must not include the text in any error path — the `validate.ts` precedent already forbids raw internals escaping; this extends it inbound. |
| Analytics / instrumentation | **Never the text.** Test #8 needs *distributions of clicks*, which are non-sensitive; it does not need prose. Record option ids and a boolean `hadText`. |
| The rerank model call | Sent **only if unflagged**. This is the one hard stop. |
| The results screen | Never reprinted — already the design's rule, retained. |
| The seeded conversation | **Never seeded with flagged text.** See below. |

**The seeded-conversation stop is the most important line in this document.**
The design specifies that selecting a shelf card "opens the conversation,
seeded with the vignette response." Combined with `INJECTION_HARDENING` — the
personas are instructed never to describe themselves as an AI and never to
break character — the unmitigated path is: *a user discloses suicidal intent,
taps a card, and a simulated Nietzsche receives it as an opening prompt and
answers in character.* That must be structurally impossible, not merely
unlikely.

Therefore: **a flag suppresses seeding entirely.** The conversation opens
clean, exactly as it does for the (majority) user who typed nothing at all.
Nothing is lost that the user can perceive, because they never see the seed.

## 6. What the flow does next — it continues

**Proposal: the diagnostic never blocks, never re-routes, and never changes the
shelf after a flag.**

- Clicks alone are sufficient to route (D13 — free text "never changes group
  membership"), so dropping the text costs the user nothing but the bounded
  within-group rerank.
- Blocking would punish disclosure and teach users to withhold — worse for
  safety, not better.
- Changing the shelf ("here are some Stoics") would be the product
  prescribing philosophy as therapy, which is the single worst thing this
  feature could do.

The user finishes the quiz and gets the same shelf they would have got
otherwise. The panel stays visible while they do.

**Ruled (B), 2026-08-14: keep the boxes, drop the encouragement.** A flag on
an early branch question suppresses the *"One line is plenty"* invitation copy
on that branch's remaining questions; the boxes themselves stay. Removing an
input mid-flow is confusing and reads as punishment, but continuing to invite
elaboration after someone has told you they are in trouble is tone-deaf. This
is one boolean threaded through the branch's render — see §11.

## 7. A model-side second layer (later, optional)

Once the rerank call exists, the model already reads the unflagged text. It may
return a `concern: true` flag alongside its ranking, which shows the same
panel. Constraints, if it is built:

- It is **second**. The deterministic matcher decides whether text is sent at
  all; the model can only add a flag to text that already passed.
- Its failure mode is silence, and the shelf must render regardless — the same
  contract every other model call in this codebase has.
- It must not be given the phrase list (that would encourage matching the
  same surface features rather than reading meaning).

## 8. Adjacent hazard, out of scope, and it should not stay unowned

The diagnostic is one door into the conversation product; the risk does not end
at the shelf. **A user can type the same disclosure into the conversation
itself**, where a persona is instructed to stay in character and never identify
as an AI. Nothing in this document reaches that path, and nothing in
`src/lib/security/` addresses it — that directory handles injection and abuse,
not user distress.

Recommendation: open it as a separate item against the conversation product,
with the same three-part shape (deterministic pre-send matcher → non-blocking
panel → the model never receives it in character). Flagged here because this
design would otherwise create the *appearance* of coverage.

## 9. Test plan

Deterministic, so it is ordinary unit-testable — proposed for
`src/lib/routing.test.ts` or a sibling:

1. **The Camus set — must NOT fire.** "I've wondered whether life is worth
   living"; "sometimes it all feels pointless"; "I thought a lot about death
   after my father died"; "the absurd is the only real question." These are
   correct answers to questions the instrument asks.
2. **The intent set — must fire.** "I want to die"; "I can't do this any
   more"; "I've been thinking about ending it"; "I don't want to be here
   anymore."
3. **Person and tense.** Third-person and clearly-past phrasings behave per
   ruling A.
4. **Propagation.** Given a flag: assert the rerank call is not made with the
   text, assert nothing is written to analytics beyond `hadText`, and assert
   the conversation seed is empty.
5. **Degradation.** With the model unavailable, detection still runs and the
   panel still appears — the inverse of the usual test, and the one that
   justifies §2.

## 10. Rulings (2026-08-14 — author delegated, decided here)

1. **(A) Past tense** — split by phrasing rather than tense; see §3. Idioms
   need the present, explicit self-harm language does not, and §4's
   conditional wording carries the ambiguity.
2. **(B) Invitation copy after a flag** — keep the boxes, drop the
   encouragement for the rest of that branch.
3. **Ephemerality — adopted.** No persistence, no logging, no text in
   analytics, flagged or not. **The cost is accepted deliberately:** this
   forecloses ever mining free text for design insight — which would have
   been genuinely useful for authoring the questions — and it means test #8
   measures click distributions only. Taken because a store of other
   people's worst moments is a liability no analytics benefit repays, and
   because "we never keep it" is the only privacy claim that stays true
   without ongoing discipline.
4. **(§8) The conversation hazard is opened as its own item**, not deferred.
   It is recorded in the design doc's open items and restated in §12 below.
   Deferring it silently was the one option ruled out, because this document
   would otherwise create the appearance of coverage it does not have.

## 11. Wiring guide — what to do when the routing code is written

> **Status, 2026-08-24.** Read this section as instructions for the box
> returning, not as a description of the running app. The routing flow was
> built (§12), and the optional free-text box was then removed from it, so
> points 1–2 below — the notice, and ruling B — are **dormant**: built,
> tested, and reachable by nothing, because no screen collects the text that
> would feed them. Points 3–5 remain wired and are exercised by
> `buildSubmission` with an empty input. The paragraph immediately below
> predates the routing work and is kept as written.

Everything below is the integration the built pieces are waiting for. None of
it exists yet: there is no `src/app/start/page.tsx`, no `src/lib/routing.ts`,
and no classifier call.

**The one rule to preserve:** every path that moves free text — to the model,
into a conversation seed, into analytics — goes through `disposeFreeText()`.
Do not re-derive the conditions at the call site. That function exists so the
three places that must agree cannot drift apart, and its tests are the
enforcement.

```ts
import { disposeFreeText } from "@/lib/diagnosticSafety";
import SafetyNotice from "@/components/SafetyNotice";

// In the branch-question component, on blur or on submit of each question:
const disposition = disposeFreeText(answerText);

// 1. Render the notice beneath the box.
{disposition.showNotice && <SafetyNotice />}

// 2. Ruling B: once any question on this branch has flagged, stop showing the
//    "One line is plenty" invitation on the branch's remaining questions.
//    Keep the box itself.
const branchFlagged = branchDispositions.some((d) => d.showNotice);

// 3. The classifier call (stage 3 rerank) receives text ONLY if permitted.
const textForModel = disposition.sendToModel ? answerText : undefined;

// 4. The results screen seeds a conversation ONLY if permitted. This is the
//    sharpest rule in the feature — see §5.
const seed = disposition.seedConversation ? answerText : undefined;

// 5. Instrumentation records the disposition's analytics object and nothing
//    else. Never the text.
track("diagnostic_answer", disposition.analytics);
```

**Checklist for the reviewer of that PR:**

- [ ] No free-text value is written to storage, a cookie, or a log line.
- [ ] No route handler includes free text in an error message (the
      `validate.ts` rule about internals not escaping, applied inbound).
- [ ] The rerank prompt is assembled from `textForModel`, never the raw box.
- [ ] The conversation seed is assembled from `seed`, never the raw box.
- [ ] The results screen still never reprints free text (design doc rule).
- [ ] Tests added for the flagged path through the *actual* routing code, in
      addition to the unit tests already in `diagnosticSafety.test.ts`.
- [ ] The notice renders with the model unavailable — the check is
      client-side and synchronous, so this should be free, but assert it.

**A second layer, if wanted later (§7):** the rerank model may return
`concern: true` for text that already passed the matcher, showing the same
notice. It is strictly second: the deterministic matcher decides whether text
is sent at all, and the shelf must still render if the model is silent.

## 12. Implementation status

**Built and tested (2026-08-14):**

| File | What it is |
| --- | --- |
| `src/lib/diagnosticSafety.ts` | `checkForDistress()` — the intent/inability/harm matcher — and `disposeFreeText()`, the propagation contract from §5–§6 expressed as one testable function. |
| `src/lib/diagnosticSafety.test.ts` | 36 tests. The first suite is "the Camus set": real, healthy answers to the instrument's own questions that must *not* flag. It is the more important half of the file. |
| `src/components/SafetyNotice.tsx` | The §4 notice. Non-blocking, conditional, international directory, `aria-live="polite"`. |
| `src/components/SafetyNotice.test.tsx` | 5 tests pinning the properties that matter (conditional opener, "not able to help with this", directory link, device claim, polite announcement). |

`npx vitest run src/lib/diagnosticSafety.test.ts src/components/SafetyNotice.test.tsx` — 41 passing.
`npx tsc --noEmit` reports only the repo's known pre-existing
`scripts/rag-corpus.test.ts` error (see CLAUDE.md).

**Wired 2026-08-14**, when the routing flow was built:

| Integration point (§11) | Where |
| --- | --- |
| 1 · notice under the box | ~~`components/DiagnosticFlow.tsx`~~ — **unwired 2026-08-24** with the free-text box. Nothing calls `checkForDistress` in the flow now |
| 2 · ruling B, drop the "one line is plenty" invitation for the rest of a flagged branch | ~~same file, same screen~~ — **unwired 2026-08-24**, same removal |
| 3 · text to the model only if permitted | `lib/diagnosticSubmission.ts` — `textForModel`. Nothing consumes it yet; stage 3 is unbuilt |
| 4 · conversation seed only if permitted | **not reachable** — computed as `conversationSeed`, but there is no seed channel that satisfies the no-storage rule. Logged as open item 17 in the routing design |
| 5 · analytics record the disposition and nothing else | `lib/diagnosticSubmission.ts` — `analytics`. No sink yet |

`buildSubmission` exists so points 3–5 cannot drift apart: they read one
object, and the conditions are never re-derived. Flagged-path tests through
the real routing code are in `src/lib/diagnostic.test.ts` ("buildSubmission and
free text"), including the one that matters most — a flagged user gets the same
pole, the same routes, and the same shelf.

**Unwired 2026-08-24:** the free-text box came out of `DiagnosticFlow.tsx`, so
a branch question is now four options and nothing else. Points 1–2 above lost
their input with it, and the flow-level notice test went with the box — it
could only be written by typing into it.

Nothing in `diagnosticSafety.ts` or `SafetyNotice.tsx` was deleted, and their
41 tests still run. That is deliberate: the matcher is the part that took the
judgement (§2's intent-not-subject rule, and the Camus set that proves it),
and it should not have to be rebuilt from this document if the box returns.
Nothing imports either module now, so neither ships to the browser.

**Still not built:** the model-side second layer in §7, which waits on stage 3
existing at all.

**Still open, outside this document:** the adjacent hazard in §8 — the same
disclosure typed into an ordinary conversation, where a persona is hardened
never to break character. Nothing here reaches that path.

**Before the paper pilot:** the pilot puts these questions in front of real
people with no software in the loop to catch a disclosure, so the facilitator
should have §4's wording and the directory link to hand on paper. That is the
whole of the pilot's safety requirement — the matcher is irrelevant when a
human is reading the answers.
