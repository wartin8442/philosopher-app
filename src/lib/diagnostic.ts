import type { AnswerLevel, Approach, DiagnosticTopic } from "@/lib/types";
import type { Pole } from "@/lib/routing";

/**
 * The diagnostic router's instrument: the six screens' worth of authored
 * questions, and the deterministic tally that turns clicks into a pole.
 *
 * Everything here is transcription, not invention. The screen-1 topic list and
 * the two universal questions come from docs/diagnostic_routing_design.md
 * ("The six screens"); the thirty branch questions come from
 * docs/screen2_split_questions_draft.md, whose §§1–11 hold the post-review
 * wordings (see its "Rewrite pass 2" record — those are the ones that ship).
 * **Do not improve a wording here.** Change it in the draft doc first, against
 * one of that document's numbered authoring rules, then transcribe.
 *
 * This module is imported by the client flow, so it must never import
 * `philosophers.ts` — that module is ~96KB of persona prompt the browser must
 * not download (see philosopherDisplay.ts). The only import below is a type,
 * which erases at compile time.
 *
 * The card copy — group subtitles and per-philosopher hooks — lives next door
 * in `diagnosticCopy.ts`, because it is on a different review clock: the
 * questions are author-approved, the copy is draft 1.
 */

/* -------------------------------------------------------------------------
 * Screen 1 — topic
 * ---------------------------------------------------------------------- */

export interface TopicChoice {
  topic: DiagnosticTopic;
  /** The screen-1 line, verbatim. Also the branch's title on screens 2–4. */
  label: string;
}

/**
 * The ten topics under their three headings, in the design doc's order.
 *
 * The headings are not data the router uses — screen 1 is also the *exposure*
 * mechanism (design doc: "Reading ten topics is how someone discovers that
 * 'why do we accept the rules we're handed' is a live question"), and the
 * grouping is what makes ten options readable rather than a wall.
 */
export const TOPIC_GROUPS: { heading: string; choices: TopicChoice[] }[] = [
  {
    heading: "How to live",
    choices: [
      { topic: "sufficiency", label: "What makes a life worth living?" },
      {
        topic: "moral_source",
        label: "Right and wrong, how do I actually decide what choices to make?",
      },
      {
        topic: "consolation",
        label: "Suffering, loss, and death; how do I face them?",
      },
    ],
  },
  {
    heading: "Who I am",
    choices: [
      {
        topic: "selfhood",
        label: "Who am I, really, and am I living as myself?",
      },
      {
        topic: "agency",
        label: "Am I free, or is it all already set in motion?",
      },
      {
        topic: "sociality",
        label:
          "Other people; do they make me who I am, or get in the way of it?",
      },
      { topic: "legitimacy", label: "Why do we accept the rules we're handed?" },
    ],
  },
  {
    heading: "What's out there",
    choices: [
      {
        topic: "transcendence",
        label: "Is there a God, and what would it mean if there were?",
      },
      { topic: "depth", label: "What's actually real, underneath appearances?" },
      {
        topic: "standpoint",
        label:
          "How do we know anything at all, or are we just arguing about words?",
      },
    ],
  },
];

/** Flat lookup for the topic line, e.g. for the results screen's heading. */
export const TOPIC_LABELS: Record<DiagnosticTopic, string> = Object.fromEntries(
  TOPIC_GROUPS.flatMap((g) => g.choices).map((c) => [c.topic, c.label]),
) as Record<DiagnosticTopic, string>;

/* -------------------------------------------------------------------------
 * Screens 2–4 — the branch questions
 * ---------------------------------------------------------------------- */

export interface BranchOption {
  /** The a)–d) letter the draft doc uses. Stable id for logging a pattern. */
  key: "a" | "b" | "c" | "d";
  text: string;
  /** Which side of the topic axis this click votes for. */
  pole: Pole;
  /**
   * The route this option takes to its pole, in the draft doc's naming
   * (`enough · subtract`, `made · causes`, …). Routes are constant across a
   * branch by design — they are what guarantees the group can be filled with
   * four different `approach` values — and the *pattern* of routes across the
   * three clicks is what stage 3 reranks on.
   */
  route: string;
}

export interface BranchQuestion {
  /**
   * The case the question is pinned to, where it needs one. Only the ethics
   * dilemmas carry this; every other question folds its instance into the
   * prompt (checklist rules 1–2).
   */
  scenario?: string;
  prompt: string;
  options: [BranchOption, BranchOption, BranchOption, BranchOption];
}

export interface Branch {
  topic: DiagnosticTopic;
  /** Names the two poles for this branch, in TOPIC_POLES' signed order. */
  poleNames: { negative: string; positive: string };
  questions: BranchQuestion[];
  /**
   * Which question decides when the clicks tie. Only reachable on a branch
   * with an even number of questions, which is `selfhood` alone (draft doc §4:
   * "on a 1-1 tie, Q1 is authoritative").
   */
  tiebreakQuestion?: number;
}

const o = (
  key: BranchOption["key"],
  pole: Pole,
  route: string,
  text: string,
): BranchOption => ({ key, pole, route, text });

/**
 * All ten branches. Option order is deliberately scrambled between the
 * questions of a branch (checklist rule 13) — do not "tidy" the poles into a
 * consistent a/b/c/d order, the scramble is what stops straight-lining.
 */
export const BRANCHES: Record<DiagnosticTopic, Branch> = {
  /* 1 · What makes a life worth living — draft doc §1 */
  sufficiency: {
    topic: "sufficiency",
    poleNames: { negative: "enough", positive: "more" },
    questions: [
      {
        prompt: "What have the good stretches of your life had in common?",
        options: [
          o(
            "a",
            "negative",
            "enough · subtract",
            "I wasn't chasing anything. I'd stopped needing something to happen.",
          ),
          o(
            "b",
            "negative",
            "enough · accept",
            "I'd stopped fighting the parts I couldn't change.",
          ),
          o(
            "c",
            "positive",
            "more · exercise",
            "I was getting better at something that mattered, and that was the whole of it.",
          ),
          o(
            "d",
            "positive",
            "more · surpass",
            "They were the ones where I was outgrowing something; what had satisfied me stopped being enough.",
          ),
        ],
      },
      {
        prompt:
          "Suppose your life stays just as it is now, same work, same people, same days, for the next twenty years. How does that sit with you?",
        options: [
          o(
            "a",
            "negative",
            "enough · accept",
            "It isn't really up to me whether it stays the same. What's up to me is how I approach it, my mindset going through it.",
          ),
          o(
            "b",
            "positive",
            "more · surpass",
            "Something in me refuses. Twenty years with nothing outgrown isn't a life staying good; it's a life stopping.",
          ),
          o(
            "c",
            "negative",
            "enough · subtract",
            "If those days are good ones, friends, work, no dread, that's the goal. It doesn't need to add up to anything more.",
          ),
          o(
            "d",
            "positive",
            "more · exercise",
            "Only if I'm still getting better inside it. The shape can stay; staying the same can't.",
          ),
        ],
      },
      {
        prompt:
          "If the next ten years go well by your own standards, what does that look like?",
        options: [
          o(
            "a",
            "positive",
            "more · exercise",
            "There's work I'm good at and getting better at, and it's building something that goes on longer than me.",
          ),
          o(
            "b",
            "negative",
            "enough · subtract",
            "I need less by then. Fewer wants, fewer fears; the good version of me isn't larger, it's lighter.",
          ),
          o(
            "c",
            "positive",
            "more · surpass",
            "I'm someone I can't fully picture from here. If I can already see the whole of it, I'm aiming too low.",
          ),
          o(
            "d",
            "negative",
            "enough · accept",
            "The world doesn't have to improve much for me to be successful; the change is in how I view it.",
          ),
        ],
      },
    ],
  },

  /*
   * 2 · Right and wrong — draft doc §2.
   *
   * Structurally different from the other nine: three concrete dilemmas rather
   * than three angles on an axis, because dilemma-shaped intuitions measure
   * `moral_ground` and the four fixed answer *shapes* are what carry
   * `moral_source`. A/B are the found pole, C/D the made pole.
   */
  moral_source: {
    topic: "moral_source",
    poleNames: { negative: "made", positive: "found" },
    questions: [
      {
        scenario:
          "A close friend, dying, asked you to pass on the money they were leaving you to a brother they hadn't spoken to in years. There's no will and no record of the conversation. The money is legally yours. The brother doesn't know it was ever discussed.",
        prompt: "What would you do, and why?",
        options: [
          o(
            "a",
            "positive",
            "found · discovered",
            "I said I would. Whether anyone could ever find out doesn't come into it.",
          ),
          o(
            "b",
            "positive",
            "found · grown",
            "Promises matter because people count on them. He never knew, so I'd think about who the money actually does more good for.",
          ),
          o(
            "c",
            "negative",
            "made · convention",
            "A promise binds because we all act as if it does. There's nothing behind this one now; I might still pass it on, but not because I'm bound to.",
          ),
          o(
            "d",
            "negative",
            "made · invented",
            "I'd hand it over, and not for any of those reasons. I'd rather not be the person who didn't.",
          ),
        ],
      },
      {
        scenario:
          "You're asked to write a warm reference for someone who was genuinely bad at the job, for a role where their being bad won't affect anyone.",
        prompt: "What would you do, and why?",
        options: [
          o("a", "positive", "found · grown", "Nobody gets damaged, so I'd write it."),
          o(
            "b",
            "negative",
            "made · invented",
            "I wouldn't write it, and not because of the harm. I just won't put my name to it.",
          ),
          o(
            "c",
            "positive",
            "found · discovered",
            "It's a lie. That's the entire objection.",
          ),
          o(
            "d",
            "negative",
            "made · convention",
            "References are a game everyone knows the rules of. Inflating one isn't really lying.",
          ),
        ],
      },
      {
        scenario:
          "You find out something you have, money, a place, a job, came to you through something unjust that happened before you were born, which you had no hand in.",
        prompt: "What would you do, and why?",
        options: [
          o(
            "a",
            "negative",
            "made · convention",
            "Everything I have came out of some earlier arrangement. Calling this one unjust is a choice about where to start counting.",
          ),
          o(
            "b",
            "positive",
            "found · discovered",
            "If it was wrong then, it's wrong now. A wrong doesn't expire because I wasn't there.",
          ),
          o(
            "c",
            "negative",
            "made · invented",
            "I couldn't argue it either way, but I'd feel like a fraud keeping it.",
          ),
          o(
            "d",
            "positive",
            "found · grown",
            "What matters is whether anyone's still being harmed. If they are, fix that. If not, it's history.",
          ),
        ],
      },
    ],
  },

  /* 3 · Suffering, loss, death — draft doc §3 */
  consolation: {
    topic: "consolation",
    poleNames: { negative: "face", positive: "reframe" },
    questions: [
      {
        prompt:
          "Think of something you lost and couldn't get back, a person, a relationship, a plan you'd built on. What helped, if anything?",
        options: [
          o(
            "a",
            "positive",
            "reframe · judgment",
            "Deciding it wasn't the disaster I'd first taken it for.",
          ),
          o(
            "b",
            "positive",
            "reframe · understanding",
            "Understanding it properly. Once I could see why it happened, I stopped being at its mercy.",
          ),
          o(
            "c",
            "negative",
            "face · it forms you",
            "Nothing helped, and it changed what I take seriously, permanently.",
          ),
          o(
            "d",
            "negative",
            "face · no consolation",
            "None of the comforting things people said were true.",
          ),
        ],
      },
      {
        prompt:
          "Someone you care about lost someone close to them. What did they actually need from you?",
        options: [
          o(
            "a",
            "positive",
            "reframe · understanding",
            "Help making sense of it. Once it stopped feeling senseless, they could start to carry it.",
          ),
          o(
            "b",
            "negative",
            "face · no consolation",
            "Mostly just being there. Nothing anyone said actually helped, and they could tell when the comforting things weren't true. What mattered was that I stayed.",
          ),
          o(
            "c",
            "positive",
            "reframe · judgment",
            "The right words at the right time. A lot of grief is thoughts, and a true thing said kindly can actually take some of the weight off.",
          ),
          o(
            "d",
            "negative",
            "face · it forms you",
            "Room. The grief was theirs to go through, and going through it is how it became part of them. I could walk next to them, but I couldn't carry it for them.",
          ),
        ],
      },
      {
        prompt:
          "Every so often it really hits you that you are going to die. What do you do with the thought?",
        options: [
          o(
            "a",
            "negative",
            "face · it forms you",
            "I let it stay. Those moments are when I'm most honest with myself about whether I'm living the way I actually want to.",
          ),
          o(
            "b",
            "positive",
            "reframe · judgment",
            "I think it through, and the fear mostly comes apart. I won't be there for the thing I'm afraid of, and the worry itself doesn't last either. It works most of the time.",
          ),
          o(
            "c",
            "negative",
            "face · no consolation",
            "Nothing, really. It's just true. I don't reach for anything comforting, and it mostly doesn't torment me.",
          ),
          o(
            "d",
            "positive",
            "reframe · understanding",
            "I zoom out. I'm a small part of something much bigger that runs the way it has to, and my ending is as natural as my beginning. Seeing it that way is what calms me down.",
          ),
        ],
      },
    ],
  },

  /*
   * 4 · Who am I, really — draft doc §4.
   *
   * The one branch that runs two questions. Its axis has two lived surfaces
   * (variation across settings, variation across time) and Q1/Q2 spend both;
   * every third angle drafted either repeated one or belonged to a neighbouring
   * topic. Two questions can tie, so Q1 is authoritative — without that rule
   * the branch loses stage-2 determinism and cannot ship.
   */
  selfhood: {
    topic: "selfhood",
    poleNames: { negative: "no core", positive: "core" },
    tiebreakQuestion: 0,
    questions: [
      {
        prompt:
          "Think about how you are at work, with family, and on your own. Is one of them more you than the others?",
        options: [
          o(
            "a",
            "positive",
            "core · beneath the roles",
            "One of them is the real me. The others are versions I put on for the room.",
          ),
          o(
            "b",
            "positive",
            "core · a self to become",
            "None of them, quite. There's a way of being me I recognise, and I'm often not in it.",
          ),
          o(
            "c",
            "negative",
            "no core",
            "They're all me. There's no fixed version underneath; I am what I do.",
          ),
          o(
            "d",
            "negative",
            "no core · constituted",
            "Which of them I am was mostly set before I got a say, family, class, the language I happened to get.",
          ),
        ],
      },
      {
        prompt: "Think about yourself ten years ago. What's actually still the same?",
        options: [
          o(
            "a",
            "positive",
            "core · a self to become",
            "The person I'm trying to be. I move closer to it and further from it, but there's a concrete someone I'm supposed to become.",
          ),
          o(
            "b",
            "negative",
            "no core · constituted",
            "Who I am has been made for me, by my environment and the people around me.",
          ),
          o(
            "c",
            "positive",
            "core · beneath the roles",
            "The circumstances are different, but there's a concrete me who never changes.",
          ),
          o(
            "d",
            "negative",
            "no core",
            "I'm the same human being, same body, same memories, but there's no deeper me underneath that.",
          ),
        ],
      },
    ],
  },

  /*
   * 5 · Am I free — draft doc §5.
   *
   * Q2 is third-person by design. Plain majority stands (ruling 2026-08-14):
   * when the two first-person questions agree they already form the majority;
   * when they split 1-1, Q2 decides — and the explanation copy must present
   * that mixed pattern as mixed rather than as a clean pole.
   */
  agency: {
    topic: "agency",
    poleNames: { negative: "made", positive: "makes himself" },
    questions: [
      {
        prompt:
          "Think of a big decision you've made, a job, a move, a relationship. Looking back, could you have done otherwise?",
        options: [
          o(
            "a",
            "negative",
            "made · circumstance",
            "Not really. By the time I got to it, the real options had already been narrowed for me.",
          ),
          o(
            "b",
            "negative",
            "made · causes",
            "I chose it, but I didn't choose to want it. That part was already set.",
          ),
          o(
            "c",
            "positive",
            "makes himself · radical",
            "Yes, and that's the uncomfortable part. It was genuinely open.",
          ),
          o(
            "d",
            "positive",
            "makes himself · self-governance",
            "Yes, I could have overruled what I wanted. That's what made it mine.",
          ),
        ],
      },
      {
        prompt:
          "Think of someone who did something clearly wrong. Could they have done otherwise?",
        options: [
          o(
            "a",
            "negative",
            "made · causes",
            "No. People act on the strongest thing pulling at them, and nobody chooses what that is.",
          ),
          o(
            "b",
            "positive",
            "makes himself · self-governance",
            "Yes. Holding yourself back is something you can get better at, and they hadn't.",
          ),
          o(
            "c",
            "negative",
            "made · circumstance",
            "No. Nobody gets out from under how they were raised and what's around them.",
          ),
          o(
            "d",
            "positive",
            "makes himself · radical",
            "Yes. People are completely free in the way they act; they chose wrongly, and they should take responsibility for it.",
          ),
        ],
      },
      {
        prompt:
          "Think about something about yourself you've tried to change and haven't, always running late, losing your temper, putting things off. Why hasn't it shifted?",
        options: [
          o(
            "a",
            "positive",
            "makes himself · radical",
            "Ultimately I choose it again every time. Nothing's forcing me to do it.",
          ),
          o(
            "b",
            "negative",
            "made · circumstance",
            "Because my environment hasn't changed, and that's what actually keeps it going.",
          ),
          o(
            "c",
            "positive",
            "makes himself · self-governance",
            "I just haven't developed the discipline to stop it.",
          ),
          o(
            "d",
            "negative",
            "made · causes",
            "Because I want it more than I want to stop. That's not something I get to decide.",
          ),
        ],
      },
    ],
  },

  /* 6 · Why we accept the rules we're handed — draft doc §6 */
  legitimacy: {
    topic: "legitimacy",
    poleNames: { negative: "conditioning", positive: "consent" },
    questions: [
      {
        prompt:
          "Think of a rule you follow without really thinking about it. Why do you follow it?",
        options: [
          o(
            "a",
            "negative",
            "conditioning · anonymous",
            "If I try to say why, I can't. It's just what's done.",
          ),
          o(
            "b",
            "negative",
            "conditioning · formed",
            "I can trace it back to what I was rewarded for.",
          ),
          o(
            "c",
            "positive",
            "consent · reasons",
            "I've looked into why it's there, and it held up.",
          ),
          o(
            "d",
            "positive",
            "consent · order",
            "I've never examined it, but I can see what it's holding together.",
          ),
        ],
      },
      {
        prompt:
          "Someone new asks you why one of your rules is the way it is. If you're being completely honest about what you believe, what do you tell them?",
        options: [
          o(
            "a",
            "negative",
            "conditioning · formed",
            "I'd catch myself repeating what was said to me, almost word for word.",
          ),
          o(
            "b",
            "positive",
            "consent · order",
            "I'd point at what it holds together. Watch how things run here for a week and the rule explains itself.",
          ),
          o(
            "c",
            "negative",
            "conditioning · anonymous",
            "Some version of \"that's just how we do it.\" And honestly, that's the whole answer; I don't have a reason underneath it.",
          ),
          o(
            "d",
            "positive",
            "consent · reasons",
            "The actual reason for it. And if that reason ever stopped being true, I'd drop the rule.",
          ),
        ],
      },
      {
        prompt:
          "Think of a rule you follow even though you think it's wrong or pointless, a dress code, a report nobody reads. Why do you keep following it?",
        options: [
          o(
            "a",
            "positive",
            "consent · reasons",
            "Honestly, it's easier to just go along with it. I could push back, and I keep not doing it; that one's on me, not the rule.",
          ),
          o(
            "b",
            "negative",
            "conditioning · anonymous",
            "Following it isn't really a decision I make. It's just what everyone does here, and the moment to step out of line never actually comes.",
          ),
          o(
            "c",
            "positive",
            "consent · order",
            "Because it isn't only mine to drop. Even a pointless rule is holding something up, and other people are counting on it being kept.",
          ),
          o(
            "d",
            "negative",
            "conditioning · formed",
            "When I ask who the rule actually works for, it isn't me. It stays because it suits the people it suits.",
          ),
        ],
      },
    ],
  },

  /* 7 · What's actually real — draft doc §7 */
  depth: {
    topic: "depth",
    poleNames: { negative: "nothing behind", positive: "something behind" },
    questions: [
      {
        prompt:
          "Think about the world you deal with every day, objects, people, money. Is that the real thing, or a surface over something else?",
        options: [
          o(
            "a",
            "positive",
            "behind · structure",
            "A surface. Once you see how something actually works, it's nothing like how it looked.",
          ),
          o(
            "b",
            "positive",
            "behind · beyond",
            "A surface. The things I'd call most solid aren't physical at all.",
          ),
          o("c", "negative", "nothing behind", "The real thing. This is what there is."),
          o(
            "d",
            "negative",
            "nothing behind · dissolve",
            "That question has never made sense to me. Real as opposed to what?",
          ),
        ],
      },
      {
        prompt:
          "Think of a time you saw through something everyone around you treated as just how things are, a price, a job title, a way of living. What did seeing through it show you?",
        options: [
          o(
            "a",
            "positive",
            "behind · beyond",
            "That some things shift with opinion and some don't. The price turned out to be arbitrary, but what I was judging it against isn't.",
          ),
          o(
            "b",
            "negative",
            "nothing behind · dissolve",
            "I'm not sure I saw through anything. I found another way of describing it, and the new description can trick you just as much as the old one.",
          ),
          o(
            "c",
            "positive",
            "behind · structure",
            "That it was built. It had been sitting there looking like a fact of nature, but it has a history, and that means it could be different.",
          ),
          o(
            "d",
            "negative",
            "nothing behind",
            "That it works. Most \"just how things are\" is an arrangement people keep because it does something for them, and seeing that isn't seeing through it, it's seeing it clearly for the first time.",
          ),
        ],
      },
      {
        prompt:
          "Think about something that would stay true no matter what happened to the world, two and two making four, say. What kind of real is that?",
        options: [
          o(
            "a",
            "negative",
            "nothing behind",
            "It's a truth about ordinary things. Two rocks and two rocks make four rocks; you don't need a second world to make that true.",
          ),
          o(
            "b",
            "positive",
            "behind · structure",
            "It's the order the world itself runs on. The same necessities sit under every surface, no matter what the surface looks like.",
          ),
          o(
            "c",
            "negative",
            "nothing behind · dissolve",
            "It lives in how we use it. The certainty comes from the practice of mathematics itself, no ghostly realm behind it, and nothing missing because of that.",
          ),
          o(
            "d",
            "positive",
            "behind · beyond",
            "It isn't anywhere in the world, and that's the point. Some things are real without being things, and those are the steadiest real there is.",
          ),
        ],
      },
    ],
  },

  /* 8 · How do we know anything — draft doc §8 (absorbs the merged §9) */
  standpoint: {
    topic: "standpoint",
    poleNames: { negative: "perspectival", positive: "objective" },
    questions: [
      {
        prompt:
          "Think of something you're sure about that someone you respect disagrees with. What's going on there?",
        options: [
          o(
            "a",
            "positive",
            "objective · the world decides",
            "One of us is wrong, and it could be settled if we both looked properly.",
          ),
          o(
            "b",
            "positive",
            "objective · self-evidence",
            "I can't argue them into it, but I can see that it's true, and I don't think that's just my opinion.",
          ),
          o(
            "c",
            "negative",
            "perspectival · historical",
            "We grew up in different worlds. What counts as obvious isn't the same in each of them.",
          ),
          o(
            "d",
            "negative",
            "perspectival · practice",
            "If I'm honest, I couldn't justify mine either. I picked it up.",
          ),
        ],
      },
      {
        prompt:
          "Someone tells you about something they've lived through that you never have, and it doesn't fit how you thought the world worked. What do you do with what they tell you?",
        options: [
          o(
            "a",
            "positive",
            "objective · self-evidence",
            "I listen, but there are some things I can see clearly enough myself that another person's experience isn't going to overturn them.",
          ),
          o(
            "b",
            "negative",
            "perspectival · practice",
            "I'd believe them, and see how it fits with the rest of what I know. That's the only test anything I believe has ever had.",
          ),
          o(
            "c",
            "positive",
            "objective · the world decides",
            "I'd want to know more before I let it change much. What they went through is evidence, and evidence can be weighed against the rest.",
          ),
          o(
            "d",
            "negative",
            "perspectival · historical",
            "They can see something from where they've stood that I can't get to from here. It isn't that I need more information; I'd have had to live it.",
          ),
        ],
      },
      {
        prompt:
          "Take something you're really sure about. What would actually have to happen for you to change your mind?",
        options: [
          o(
            "a",
            "negative",
            "perspectival · historical",
            "Honestly, my life would have to change. You don't get argued out of something your whole world treats as obvious.",
          ),
          o(
            "b",
            "positive",
            "objective · the world decides",
            "Show me something that doesn't fit. Facts that don't line up would do it, and not much else would.",
          ),
          o(
            "c",
            "negative",
            "perspectival · practice",
            "It would have to stop working. When holding something keeps leading me wrong, that's when it goes.",
          ),
          o(
            "d",
            "positive",
            "objective · self-evidence",
            "Nothing anyone said could do it. But I could come to see it better than I do now; that has happened before, and it changed things.",
          ),
        ],
      },
    ],
  },

  /* 10 · Other people — Q1 from the design doc, Q2–Q3 from draft doc §10 */
  sociality: {
    topic: "sociality",
    poleNames: {
      negative: "others cost you yourself",
      positive: "others complete you",
    },
    questions: [
      {
        prompt: "Think about the people you actually spend your life with.",
        options: [
          o(
            "a",
            "positive",
            "complete · formation",
            "A few particular people made me who I am.",
          ),
          o(
            "b",
            "positive",
            "complete · the good",
            "The best things in my life have been people.",
          ),
          o(
            "c",
            "negative",
            "cost · anonymous",
            "When I'm in a group I tend to go along with whatever's already happening, without really deciding to.",
          ),
          o(
            "d",
            "negative",
            "cost · the gaze",
            "I notice that around other people I do what I think they'll approve of, rather than what I'd actually do.",
          ),
        ],
      },
      {
        prompt: "You get a real stretch of time entirely to yourself. What actually happens?",
        options: [
          o(
            "a",
            "positive",
            "complete · the good",
            "It's good for a while, then it goes flat. Good things don't fully count for me until I've shared them with someone.",
          ),
          o(
            "b",
            "negative",
            "cost · the gaze",
            "I can relax, and don't have to keep putting on a performance for other people.",
          ),
          o(
            "c",
            "positive",
            "complete · formation",
            "Without anyone to interact with, I stop feeling like myself. Being around other people is when I most feel like myself.",
          ),
          o(
            "d",
            "negative",
            "cost · anonymous",
            "It takes a while to stop hearing what everyone else thinks. Then I'm actually with myself, and I do my clearest thinking there.",
          ),
        ],
      },
      {
        prompt:
          "Think of someone you know and genuinely admire. What has knowing them done to you?",
        options: [
          o(
            "a",
            "negative",
            "cost · anonymous",
            "I've noticed I hold a lot of their opinions naturally, and I can't really say I consciously accepted them; they mostly came because I admire the person.",
          ),
          o(
            "b",
            "positive",
            "complete · formation",
            "They raised my standard for myself. Wanting to be worth being with that person changed what I want from life.",
          ),
          o(
            "c",
            "negative",
            "cost · the gaze",
            "Around them I edit myself. Some part of me is always managing what they see, and I can't tell what that costs me.",
          ),
          o(
            "d",
            "positive",
            "complete · the good",
            "Knowing them is simply one of the best things I have. The friendship itself is the point.",
          ),
        ],
      },
    ],
  },

  /*
   * 11 · Is there a God — Q1 from the design doc, Q2–Q3 from draft doc §11.
   *
   * Copy guard, carried from the design doc: Q1's "higher power" reads
   * personal, while the axis is `transcendence` (a divine order ↔ nothing
   * beyond nature). Plato's Good and Spinoza's one substance are impersonal
   * and both sit in this pool, so the phrase must never be echoed back in
   * group copy or explanations as though the shelf were about a deity.
   */
  transcendence: {
    topic: "transcendence",
    poleNames: {
      negative: "nothing beyond nature",
      positive: "a divine order",
    },
    questions: [
      {
        prompt:
          "Set aside what you'd say to someone else. Do you believe that there's a higher power?",
        options: [
          o(
            "a",
            "positive",
            "transcendent · reasoned",
            "There's something behind all this. It doesn't make sense to me otherwise.",
          ),
          o(
            "b",
            "positive",
            "transcendent · experienced",
            "I've had moments where I was certain of it, whatever \"it\" is.",
          ),
          o(
            "c",
            "negative",
            "not · explained",
            "The feeling that there's a higher power is something we make, not something we find.",
          ),
          o(
            "d",
            "negative",
            "not · lived without",
            "I don't think there's anything there, and I don't think that's good news.",
          ),
        ],
      },
      {
        prompt:
          "Think about the fact that there's a world at all, and that it hangs together the way it does. What do you make of that?",
        options: [
          o(
            "a",
            "positive",
            "transcendent · experienced",
            "Sometimes it stops me, and in those moments it doesn't feel like an accident. I couldn't defend that, and I don't try to.",
          ),
          o(
            "b",
            "negative",
            "not · lived without",
            "It's extraordinary and it doesn't mean anything. I'd rather hold both of those than give up either one.",
          ),
          o(
            "c",
            "positive",
            "transcendent · reasoned",
            "It doesn't explain itself. Something has to account for there being an order here at all, and that's where I end up.",
          ),
          o(
            "d",
            "negative",
            "not · explained",
            "It hangs together because that's what a world that lasts looks like. The purposes are ours; we read them in, and then find them there.",
          ),
        ],
      },
      {
        prompt:
          "Have you ever found yourself praying, or doing something like it, even once, even without believing? What was that?",
        options: [
          o(
            "a",
            "negative",
            "not · explained",
            "Yes, when I was frightened. I think that's something people do, and it tells you about us rather than about the universe.",
          ),
          o(
            "b",
            "positive",
            "transcendent · reasoned",
            "Maybe, but I don't put weight on moments like that either way. Either there's something there or there isn't, and how I felt in a bad hour doesn't settle it.",
          ),
          o(
            "c",
            "negative",
            "not · lived without",
            "No, or not for a long time. There's no one to ask, and I'd rather face that straight than talk myself into company.",
          ),
          o(
            "d",
            "positive",
            "transcendent · experienced",
            "Yes, and whatever that was, it wasn't nothing. It's the closest I've come to knowing anything about it.",
          ),
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * The tally — stage 2, and the last deterministic step before the fill
 * ---------------------------------------------------------------------- */

/** One question's answer: the option index clicked, plus the optional text. */
export interface BranchAnswer {
  /** Index into the question's four options. */
  option: number;
  /** What the user typed, if anything. Never leaves here unfiltered — see
   *  diagnosticSafety.disposeFreeText. */
  text?: string;
}

/**
 * Majority of the branch's option clicks fixes the pole (design doc D7).
 *
 * Deterministic by construction, which is the point: the pole is the one thing
 * the model is never allowed to move (D13). An odd question count cannot tie;
 * the even-count branch (`selfhood`) declares which question is authoritative.
 * The final fallback is `positive`, and it is unreachable with a well-formed
 * branch — it exists so a malformed one degrades to a shelf rather than a
 * crash.
 */
export function tallyPole(branch: Branch, answers: BranchAnswer[]): Pole {
  let negative = 0;
  let positive = 0;

  branch.questions.forEach((question, index) => {
    const answer = answers[index];
    const option = answer && question.options[answer.option];
    if (!option) return;
    if (option.pole === "negative") negative += 1;
    else positive += 1;
  });

  if (negative !== positive) return negative > positive ? "negative" : "positive";

  const decider = branch.questions[branch.tiebreakQuestion ?? 0];
  const deciding = decider?.options[answers[branch.tiebreakQuestion ?? 0]?.option ?? -1];
  return deciding?.pole ?? "positive";
}

/**
 * True when the clicks did not agree — a 2-1 or a broken tie rather than a
 * clean sweep. The design requires the explanation copy to present a mixed
 * pattern as mixed (D7's `agency` ruling), so the results screen needs to know.
 */
export function isMixedPattern(branch: Branch, answers: BranchAnswer[]): boolean {
  const poles = branch.questions
    .map((question, index) => question.options[answers[index]?.option ?? -1]?.pole)
    .filter(Boolean);
  return new Set(poles).size > 1;
}

/** The route names clicked, in question order. Stage 3's route-pattern input. */
export function routePattern(branch: Branch, answers: BranchAnswer[]): string[] {
  return branch.questions
    .map((question, index) => question.options[answers[index]?.option ?? -1]?.route)
    .filter((route): route is string => Boolean(route));
}

/* -------------------------------------------------------------------------
 * Screen 5 — what persuades you
 * ---------------------------------------------------------------------- */

/**
 * Supplies `approach`. Asks what persuades rather than what appeals —
 * conviction is a stance, appeal is a pose (design doc, question 5).
 *
 * This answer orders a group; it does not change membership. The diversity cap
 * is a property of the candidate set and needs no user input.
 */
export const PERSUASION_QUESTION: {
  prompt: string;
  options: { key: "a" | "b" | "c" | "d"; text: string; approach: Approach }[];
} = {
  prompt:
    "Someone's trying to change your mind about something that matters. What actually moves you?",
  options: [
    {
      key: "a",
      text: "A tight argument where each step follows from the last",
      approach: "rational",
    },
    {
      key: "b",
      text: "Evidence from how things actually go, examples, track record",
      approach: "empirical",
    },
    {
      key: "c",
      text: "Something that names an experience I've had but never had words for",
      approach: "experiential",
    },
    { key: "d", text: "A story or image that sticks with me", approach: "literary" },
  ],
};

/* -------------------------------------------------------------------------
 * Screen 6 — intent
 * ---------------------------------------------------------------------- */

/** Which group the results screen leads with. Never changes membership. */
export type ResultsEmphasis = "home" | "challenge";

export interface IntentChoice {
  key: "a" | "b" | "c" | "d";
  text: string;
  level: AnswerLevel;
  leadWith: ResultsEmphasis;
  /** Shown on the results screen as the register the conversation will take. */
  note: string;
}

/**
 * The only question that shapes what happens *after* the pick. It changes
 * ordering, emphasis, and the seeded conversation's register, but never the
 * four-plus-four membership contract — both groups are always present, so
 * emphasis shifts without building a filter bubble (design doc, question 6).
 *
 * (c) is the one option the design leaves without an explicit `AnswerLevel`;
 * `advanced` is the reading taken here — "push my thinking" is the level's own
 * description ("assumes familiarity; full conceptual depth") — and it is
 * flagged in docs/diagnostic_routing_design.md for an author ruling.
 */
export const INTENT_QUESTION: { prompt: string; options: IntentChoice[] } = {
  prompt: "What are you looking to get out of this?",
  options: [
    {
      key: "a",
      text: "Something specific is on my mind and I want to think it through.",
      level: "beginner",
      leadWith: "home",
      note: "Applied, starting from your situation, in plain language.",
    },
    {
      key: "b",
      text: "I want to understand what these people actually said.",
      level: "intermediate",
      leadWith: "home",
      note: "Both groups, equal weight, with the terms explained as they come up.",
    },
    {
      key: "c",
      text: "I want my own thinking pushed on; tell me where I'm wrong.",
      level: "advanced",
      leadWith: "challenge",
      note: "Leads with the people most likely to argue back.",
    },
    {
      key: "d",
      text: "I want to read the real thing and I need somewhere to start.",
      level: "primary-text",
      leadWith: "home",
      note: "In the register of the philosopher's own writing, with a way in.",
    },
  ],
};
