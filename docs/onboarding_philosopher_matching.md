# Onboarding: Philosopher Matching (proposal, not yet built)

> **SUPERSEDED, 2026-07-28** by
> [`diagnostic_routing_design.md`](diagnostic_routing_design.md), which
> replaces the freeform-LLM matcher below with a deterministic diagnostic over
> a hand-authored philosopher × axis matrix. In particular, the "structured
> philosopher tagging — rejected" decision below is **reversed**; see D1 in the
> new document for why the reversal is possible (the intake format changed, so
> the taxonomy no longer has to match novice vocabulary).
>
> Still binding, carried forward: the **safety / crisis-disclosure** open item,
> and the requirement that duel and starter content be **selected from curated
> data, never generated live**.
>
> Retained for the record of what was considered and why.

> **Status: proposed, stress-tested via devil's-advocate review on 2026-07-23.
> Not implemented.** This document records the feature as it stood after that
> review — the original pitch, what changed under scrutiny, and what's still
> open. Treat the "Design decisions" section as binding on any implementation;
> the "Open items" section is not optional polish, it's unfinished spec.

## Problem

The app's stated purpose is making philosophy accessible to people with no
background in it. Today, a first-time user lands on a list of philosophers
with no guidance on where to start — fine for someone who already knows they
want Camus, not for someone who doesn't know what they're looking for.

## Proposal

An optional onboarding path, alongside (not replacing) direct browsing:

1. The AI asks the user open-ended questions about what they're curious about
   or wrestling with.
2. The AI asks follow-ups until it has enough signal, then recommends one or
   more philosophers suited to the user's interest.
3. The AI can also suggest a **duel** — two philosophers who disagree on the
   thing the user described — as an entry point.

This sits in front of the existing browse experience as an alternative, not a
gate. A user can always skip straight to picking a philosopher themselves.

## Design decisions (from review)

The initial version of this pitch was materially riskier than what's
described below. Each decision here is the resolution of a specific objection
raised in review — see "Rejected approaches" for what was ruled out and why.

### Matching: freeform, ungrounded LLM judgment — OK

Determining *which philosopher* fits a vague, non-technical statement of
interest ("I think about whether anything really matters") is a coarse
categorization task. No structured tagging system. Reasoning:

- A novice user cannot be expected to phrase their interest in terms a tag
  taxonomy would need to be exhaustive to catch.
- A wrong or imprecise match is a soft failure — the user can pick a
  different philosopher. It is not a factual claim that can be wrong in a way
  that damages trust.
- The model's general knowledge of well-known philosophical
  positions/movements is adequate for this specific job, even though (see
  below) it is not trustworthy for finer-grained claims.

### Duel/starter content: select from the existing curated system — required, not generated fresh

**Do not have the model generate new duel topics or new philosopher-position
one-liners at onboarding time.** The app already has exactly this content,
hand-curated and vetted: `src/lib/starters.ts` —
`CONVERSATION_STARTERS` (three curated openers per philosopher per level) and
`DUEL_TOPICS` (curated debate topics per philosopher pair, chosen for where
that specific pair actually collides).

The onboarding flow's job is to **select** the best-fitting existing pair and
topic (and optionally paraphrase the topic back in the user's own words), not
to invent a fresh characterization of what a philosopher believes. If a
genuine gap in curated coverage is found (a real disagreement between two
philosophers that isn't reflected in any existing `DUEL_TOPICS` entry), add it
to `starters.ts` as curated content — don't paper over the gap with live
generation.

**Why this matters:** live generation of "Kierkegaard holds X, Sartre holds
darker Y"-style claims is a factual claim about a real philosopher's
position, made unconstrained, at the first-impression moment of the app. This
project already has direct evidence that confident, unverified
characterization of these exact five philosophers' positions produces errors
— see the disputed `nz-19-c1` attribution and the resulting correction pass
(`data/rag/review/corrections_2026-07-19.md`), and `rag_architecture.md`'s
explicit risk callout for model-only output: *"interpretive flattening (pop
readings like 'Nietzsche the nihilist')."* Reusing curated content removes
this failure mode entirely for the onboarding surface.

### Safety handling — required, not yet designed

Open-ended intake questions ("why do you feel anxious," "what are you
searching for") will produce some fraction of honest disclosures of real
distress, not just philosophical curiosity — this is not a generic chatbot
risk, existential distress is core subject matter for this app specifically.

**This is unresolved.** The flow must not proceed to a confident philosopher
recommendation (e.g., routing someone in crisis to absurdism content with no
safety net) without some check on user input first. What's still undecided:

- Mechanism: lightweight input classifier vs. a prompt-level instruction to
  the matching model itself.
- Fallback behavior when triggered (what the user sees, whether/how the flow
  can continue afterward).
- Where this sits relative to the existing hardening in `src/lib/security/`
  (that layer handles injection/abuse, not user distress — this is a
  different category of check).

Do not ship the matching flow without this designed and implemented.

### Sequencing relative to RAG corpus work

Building this now, ahead of finishing the RAG corpus/retrieval-accuracy work
described in `rag_architecture.md`, was judged a reasonable prioritization
call: the corpus layer is explicitly an unresolved experiment ("not yet a
production decision," gates failing by design per `STATUS.md`), and this
feature is core to the app's stated accessibility mission, not a polish item.

Caveat: this sequencing decision applies to *corpus/citation accuracy*. It
does not license reverting the duel/starter content to freeform generation
"to save time" — that's a different, riskier feature than the one specified
above, not a faster version of the same one.

## Rejected approaches

- **Structured philosopher tagging for matching.** Rejected: would require an
  impractically broad tag taxonomy to catch how novices actually phrase
  interest, and adds friction the model doesn't need for a coarse task.
- **Live-generated duel topics and position one-liners.** Rejected: real,
  evidenced hallucination/misattribution risk on this exact roster (see
  above), at the worst possible moment (first impression) for a novice with
  no ability to sanity-check the claim.
- **RAG-grounding the matching step itself.** Considered, not adopted:
  matching is low-stakes enough that the corpus dependency isn't justified.
  (Duel/starter content is handled by curated selection instead, which
  sidesteps needing corpus grounding there too.)

## Open items (must be resolved before implementation)

1. **Safety/crisis-disclosure handling** — mechanism and fallback UX not yet
   designed (see above).
2. **Question-loop bound** — the flow is "ask follow-ups until confident,"
   with no defined cap. An unbounded interrogation is a real drop-off risk
   for a low-patience novice who is likely already unsure about engaging.
   Needs a concrete limit or a "good enough, recommend now" fallback.
3. **Discoverability** — this is an optional path alongside direct browsing,
   which avoids forcing friction on users who don't want it, but means the
   novices who most need guidance have to recognize they want it. Copy/UI
   framing for the entry point should be validated, not assumed.
