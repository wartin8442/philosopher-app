import { PHILOSOPHERS } from "./philosophers";

/**
 * Hand-curated conversation starters.
 *
 * - `CONVERSATION_STARTERS`: three fixed openers per philosopher, phrased as
 *   the user's first question. Each targets a signature idea but is asked the
 *   way a curious newcomer would ask it.
 * - `getDuelTopics`: three debate topics per philosopher *pair*, chosen for
 *   where those two actually collide (Nietzsche vs Aquinas is a different
 *   fight than Nietzsche vs Sartre).
 */

export const CONVERSATION_STARTERS: Record<string, string[]> = {
  aquinas: [
    "Can you prove God exists using reason alone?",
    "What makes a law unjust — and may I disobey it?",
    "How can faith and reason work together instead of against each other?",
  ],
  nietzsche: [
    "What did you really mean by “God is dead”?",
    "Is my morality just herd instinct? How would I know?",
    "If I had to relive this exact life forever, how should that change how I live?",
  ],
  kierkegaard: [
    "Why do I feel anxious when nothing is actually wrong?",
    "What is the leap of faith — and how is it different from wishful thinking?",
    "You said “the crowd is untruth.” What does it mean to live as a single individual?",
  ],
  sartre: [
    "What does “existence precedes essence” mean for how I live my life?",
    "Am I in bad faith right now? How would I tell?",
    "If I am truly free, why does freedom feel like a burden?",
  ],
  camus: [
    "Is life absurd — and if so, why keep going?",
    "Why must we imagine Sisyphus happy?",
    "How do I fight injustice without becoming the thing I am fighting?",
  ],
};

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
