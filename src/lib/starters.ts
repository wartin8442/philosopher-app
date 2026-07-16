import { AnswerLevel } from "./types";
import { PHILOSOPHERS } from "./philosophers";

/**
 * Hand-curated conversation starters.
 *
 * - `CONVERSATION_STARTERS`: three fixed openers per philosopher *per answer
 *   level*, phrased as the user's first question. Each level matches the
 *   assumed background of its answer-level prompt (see
 *   ANSWER_LEVEL_INSTRUCTIONS in providers/llm.ts): beginner starters orient
 *   a newcomer (the first is always a self-introduction), intermediate
 *   starters name the signature ideas, advanced starters open textual and
 *   interpretive questions.
 * - `getDuelTopics`: three debate topics per philosopher *pair*, chosen for
 *   where those two actually collide (Nietzsche vs Aquinas is a different
 *   fight than Nietzsche vs Sartre).
 */

export type StarterLevel = "beginner" | "intermediate" | "advanced";

export const STARTER_LEVELS: StarterLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export const CONVERSATION_STARTERS: Record<
  string,
  Record<StarterLevel, string[]>
> = {
  aquinas: {
    beginner: [
      "Tell me who you are.",
      "Why do you believe God exists?",
      "How can faith and reason work together instead of against each other?",
    ],
    intermediate: [
      "What are the Five Ways — your five proofs for God?",
      "What makes a law unjust — and may I disobey it?",
      "If God is good, why is there evil?",
    ],
    advanced: [
      "How does the essence–existence distinction ground your proofs of God?",
      "What is the analogy of being, and why does univocal talk about God fail?",
      "How do you reconcile divine providence with human free will?",
    ],
  },
  nietzsche: {
    beginner: [
      "Tell me who you are.",
      "What does it mean that God is dead?",
      "Why are you so suspicious of morality?",
    ],
    intermediate: [
      "What is the difference between master and slave morality?",
      "Who — or what — is the Übermensch?",
      "If I had to relive this exact life forever, how should that change how I live?",
    ],
    advanced: [
      "How does ressentiment create values?",
      "Is the will to power psychology, metaphysics, or both?",
      "Why does the ascetic ideal turn the will to truth against itself?",
    ],
  },
  kierkegaard: {
    beginner: [
      "Tell me who you are.",
      "What is existentialism?",
      "Why do I feel anxious when nothing is actually wrong?",
    ],
    intermediate: [
      "What is the leap of faith — and how is it different from wishful thinking?",
      "What are the aesthetic, ethical, and religious stages of life?",
      "Why did you write under so many pseudonyms?",
    ],
    advanced: [
      "How does one cure anxiety?",
      "What does it mean that truth is subjectivity?",
      "Why is despair the sickness unto death — and how is it healed?",
    ],
  },
  sartre: {
    beginner: [
      "Tell me who you are.",
      "What is existentialism?",
      "Am I really free to choose who I am?",
    ],
    intermediate: [
      "What is bad faith? Am I in it right now?",
      "What does “existence precedes essence” mean for how I live my life?",
      "Why do you say we are condemned to be free?",
    ],
    advanced: [
      "What distinguishes being-in-itself from being-for-itself?",
      "Why does the Other's look objectify me — and is conflict inescapable?",
      "How does your later Marxism square with radical freedom?",
    ],
  },
  camus: {
    beginner: [
      "Tell me who you are.",
      "Is life absurd — and if so, why keep going?",
      "Why must we imagine Sisyphus happy?",
    ],
    intermediate: [
      "Why do you call suicide the one truly serious philosophical problem?",
      "What is revolt, and how does it answer the absurd?",
      "Are you an existentialist, or something else?",
    ],
    advanced: [
      "What is your diagnosis of the absurd?",
      "How does rebellion set limits — and when does it become murder?",
      "Where exactly do you and Sartre part ways?",
    ],
  },
};

/**
 * Starters for one philosopher at the user's answer level. "Reading a
 * Primary Text" has no curated set of its own; it reads at the advanced
 * level, so those starters fit best.
 */
export function getConversationStarters(
  philosopherId: string,
  level: AnswerLevel,
): string[] {
  const byLevel = CONVERSATION_STARTERS[philosopherId];
  if (!byLevel) return [];
  return byLevel[level === "primary-text" ? "advanced" : level] ?? [];
}

/** Canonical key for an unordered pair. */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

const DUEL_TOPICS: Record<string, string[]> = {
  [pairKey("aquinas", "nietzsche")]: [
    "Does morality need God, or is it the herd's invention?",
    "Is Christian humility a virtue or weakness in disguise?",
    "Is human life ordered toward a divine end, or must we create our own values?",
  ],
  [pairKey("aquinas", "kierkegaard")]: [
    "Can God's existence be proven, or must faith leap beyond reason?",
    "Is comfortable, respectable religion real faith?",
    "Does anyone come to God by argument — or only through crisis?",
  ],
  [pairKey("aquinas", "sartre")]: [
    "Do humans have a fixed nature, or do we invent ourselves?",
    "Without God, is everything permitted?",
    "Is freedom fulfilled by our given purpose, or betrayed by any script at all?",
  ],
  [pairKey("aquinas", "camus")]: [
    "Is the universe silent, or does it speak of its Maker?",
    "Is hope in heaven wisdom, or an escape from the absurd?",
    "Can suffering have meaning?",
  ],
  [pairKey("kierkegaard", "nietzsche")]: [
    "Is faith the highest passion or the deepest sickness?",
    "When the crowd is untruth, should the individual leap to God or create new values?",
    "Was Christianity Europe's great cure or its great catastrophe?",
  ],
  [pairKey("nietzsche", "sartre")]: [
    "After the death of God, are all of us free — or only the strong few?",
    "Is universal responsibility a noble ideal or a herd value?",
    "Is bad faith just slave morality by another name?",
  ],
  [pairKey("camus", "nietzsche")]: [
    "Is loving one's fate the same as imagining Sisyphus happy?",
    "Does overcoming nihilism require new values, or lucid revolt?",
    "Is pity a weakness or the root of solidarity?",
  ],
  [pairKey("kierkegaard", "sartre")]: [
    "Is anxiety the dizziness of freedom before God, or before nothing at all?",
    "Does authenticity require a leap of faith, or the refusal of every escape?",
    "Can the self ground itself, or only rest in the power that established it?",
  ],
  [pairKey("camus", "kierkegaard")]: [
    "Is the leap of faith courage or philosophical suicide?",
    "Can there be meaning without appeal to God?",
    "Is despair cured by faith or endured by revolt?",
  ],
  [pairKey("camus", "sartre")]: [
    "Can political violence ever be justified for a better future?",
    "Does rebellion need limits, or do the ends justify the means?",
    "Which comes first: freedom or solidarity?",
  ],
};

// Should never be hit with the current roster (every pair above is covered);
// keeps the UI sensible if a philosopher is added before their pairings are.
const FALLBACK_TOPICS = [
  "Does life have a meaning we discover, or one we create?",
  "What makes an action good?",
  "Is death something to fear?",
];

export function getDuelTopics(aId: string, bId: string): string[] {
  return DUEL_TOPICS[pairKey(aId, bId)] ?? FALLBACK_TOPICS;
}

/** Exported for tests: every philosopher pair should have curated topics. */
export function allPairKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < PHILOSOPHERS.length; i++) {
    for (let j = i + 1; j < PHILOSOPHERS.length; j++) {
      keys.push(pairKey(PHILOSOPHERS[i].id, PHILOSOPHERS[j].id));
    }
  }
  return keys;
}

export function hasCuratedTopics(key: string): boolean {
  return key in DUEL_TOPICS;
}
