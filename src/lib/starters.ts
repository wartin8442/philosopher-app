import { AnswerLevel } from "./types";

/**
 * Hand-curated conversation starters.
 *
 * - `CONVERSATION_STARTERS`: three fixed openers per philosopher *per answer
 *   level*, phrased as the user's first question. Each level matches the
 *   assumed background of its answer-level prompt (see
 *   ANSWER_LEVEL_INSTRUCTIONS in providers/llm.ts): beginner starters orient
 *   a newcomer, intermediate starters name the signature ideas, advanced
 *   starters open textual and interpretive questions.
 *
 *   The first beginner starter is always "Explain your philosophy." — the
 *   broad overview of the must-knows, and the one opener that works for a
 *   visitor who knows nothing about this thinker. The UI leans on that
 *   position, rendering `beginner[0]` as the highlighted call to action, so
 *   it has to stay first.
 * - `getDuelTopics`: three debate topics per philosopher *pair*. Flagship
 *   collisions are hand-written; every other pairing is composed from
 *   philosopher-specific debate lenses rather than falling back to a generic
 *   topic.
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
      "Explain your philosophy.",
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
      "Explain your philosophy.",
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
      "Explain your philosophy.",
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
      "Explain your philosophy.",
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
      "Explain your philosophy.",
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
  hume: {
    beginner: [
      "Explain your philosophy.",
      "Can I trust what I believe if certainty is impossible?",
      "Do facts or feelings tell us what is right and wrong?",
    ],
    intermediate: [
      "Why does causation come from custom rather than reason?",
      "What do you mean when you say reason is the slave of the passions?",
      "How can justice be a convention without being arbitrary?",
    ],
    advanced: [
      "How does mitigated skepticism escape both dogmatism and Pyrrhonism?",
      "Can the general point of view make sentimentalist ethics genuinely impartial?",
      "Does your account of personal identity survive the appendix to the Treatise?",
    ],
  },
  plato: {
    beginner: [
      "Explain your philosophy.",
      "What is the allegory of the Cave actually about?",
      "Why do you think there is a world beyond the one I can see?",
    ],
    intermediate: [
      "What are the Forms, and why do we need them?",
      "Why should the philosophers rule the city?",
      "How are justice in a person and justice in a state the same thing?",
    ],
    advanced: [
      "Does the Third Man argument in the Parmenides destroy the theory of Forms?",
      "How does the Divided Line map degrees of reality onto degrees of knowledge?",
      "Since you never speak in the dialogues, whose views are they?",
    ],
  },
  aristotle: {
    beginner: [
      "Explain your philosophy.",
      "What does it take for a person to live well?",
      "Where do you think Plato went wrong?",
    ],
    intermediate: [
      "What are the four causes, and why do I need all of them?",
      "What does it mean that virtue is a mean?",
      "Why do you say human beings are political animals by nature?",
    ],
    advanced: [
      "How does hylomorphism avoid both Platonic separation and materialism?",
      "How can there be weakness of will if we always act toward a perceived good?",
      "What does it mean to call the unmoved mover thought thinking itself?",
    ],
  },
  epicurus: {
    beginner: [
      "Explain your philosophy.",
      "Should I be afraid of dying?",
      "Is your philosophy really about chasing pleasure?",
    ],
    intermediate: [
      "How do you sort desires into natural, unnecessary, and empty?",
      "If the gods exist, why should I not worry about them?",
      "What is ataraxia, and how would I recognise it?",
    ],
    advanced: [
      "Does the atomic swerve actually secure voluntary action, or just randomness?",
      "How does the limit of pleasure follow from the removal of pain?",
      "If justice is only a compact of advantage, what binds me when breaking it pays?",
    ],
  },
  "marcus-aurelius": {
    beginner: [
      "Explain your philosophy.",
      "How do you stay calm when everything is going wrong?",
      "What did you write these notes for, if not for readers?",
    ],
    intermediate: [
      "What is actually within my control, and what is not?",
      "Why do you say events do not harm us, only our judgments about them?",
      "How does thinking about death every day help rather than depress?",
    ],
    advanced: [
      "How does the discipline of assent work on an impression, step by step?",
      "If the cosmos is providentially ordered, in what sense is anything bad?",
      "Can Stoic cosmopolitanism be squared with commanding armies and holding slaves?",
    ],
  },
  augustine: {
    beginner: [
      "Explain your philosophy.",
      "If God is good, where does evil come from?",
      "Why did you write your life story as a prayer?",
    ],
    intermediate: [
      "What do you mean that evil is a privation rather than a thing?",
      "Why can I want to change and still fail to do it?",
      "What is time, if the past and future do not exist?",
    ],
    advanced: [
      "How does the divided will in Confessions VIII differ from Manichaean dualism?",
      "Can your late doctrine of predestination leave the will genuinely free?",
      "If we measure time as a distension of the soul, what are we measuring?",
    ],
  },
  spinoza: {
    beginner: [
      "Explain your philosophy.",
      "What do you mean when you say God is Nature?",
      "Do I have free will, on your account?",
    ],
    intermediate: [
      "Why is there only one substance rather than many?",
      "If everything is necessary, what could freedom possibly mean?",
      "How should I deal with an emotion I cannot shake?",
    ],
    advanced: [
      "How does the parallelism of Ethics II.7 avoid mind-body interaction?",
      "What is the third kind of knowledge, and how does it differ from reason?",
      "Why is blessedness virtue itself rather than its reward?",
    ],
  },
  girard: {
    beginner: [
      "Explain your philosophy.",
      "Why do we want what other people want?",
      "What is the scapegoat mechanism?",
    ],
    intermediate: [
      "How does a model of desire become a rival?",
      "Why can collective violence seem to restore social order?",
      "How does Christianity expose scapegoating?",
    ],
    advanced: [
      "How do external and internal mediation differ in Deceit, Desire and the Novel?",
      "Why must the scapegoat mechanism remain misrecognized in order to work?",
      "How can biblical revelation weaken sacrificial order without ending mimetic rivalry?",
    ],
  },
  beauvoir: {
    beginner: [
      "Explain your philosophy.",
      "What do you mean that one is not born but becomes a woman?",
      "Are you saying my situation is my own fault?",
    ],
    intermediate: [
      "What does it mean to be defined as the Other?",
      "How do immanence and transcendence differ in a life?",
      "Why does my freedom depend on other people being free?",
    ],
    advanced: [
      "How does your account of situation differ from Sartre's?",
      "Can the ambiguity of the human condition ground an ethics without a criterion?",
      "How far do the limits of The Second Sex on race and class damage its argument?",
    ],
  },
  foucault: {
    beginner: [
      "Explain your philosophy.",
      "What do you mean when you say power is everywhere?",
      "Why study prisons and asylums to do philosophy?",
    ],
    intermediate: [
      "How does the Panopticon explain modern institutions?",
      "What is the repressive hypothesis, and why do you reject it?",
      "What does it mean that power produces rather than only forbids?",
    ],
    advanced: [
      "How does genealogy differ methodologically from archaeology?",
      "If power and knowledge are inseparable, can any critique stand outside them?",
      "What does the late turn to care of the self add to the analysis of power?",
    ],
  },
  descartes: {
    beginner: [
      "Explain your philosophy.",
      "Why did you decide to doubt almost everything?",
      "What does “I think, therefore I am” actually prove?",
    ],
    intermediate: [
      "How do clear and distinct ideas give us knowledge?",
      "If mind and body are different substances, how can they affect each other?",
      "Are emotions obstacles to reason, or can they help us?",
    ],
    advanced: [
      "Does your appeal to a non-deceiving God escape the Cartesian Circle?",
      "How does the primitive notion of mind–body union answer Princess Elisabeth?",
      "Can your provisional morality be reconciled with radical methodological doubt?",
    ],
  },
  locke: {
    beginner: [
      "Explain your philosophy.",
      "Are we really born without any ideas already in our minds?",
      "What makes me the same person I was as a child?",
    ],
    intermediate: [
      "How do sensation and reflection supply all our ideas?",
      "What is the difference between primary and secondary qualities?",
      "When does a government lose its legitimate authority?",
    ],
    advanced: [
      "Can consciousness ground personal identity without circularly relying on memory?",
      "How do nominal essences constrain what we can know about substances?",
      "Can the enough-and-as-good proviso survive money, colonial appropriation, and wage labor?",
    ],
  },
  kant: {
    beginner: [
      "Explain your philosophy.",
      "Why can't my senses simply show me the world as it is?",
      "What does it mean to treat a person as an end?",
    ],
    intermediate: [
      "What was your Copernican revolution in philosophy?",
      "How do I test a choice with the categorical imperative?",
      "What is the difference between appearances and things in themselves?",
    ],
    advanced: [
      "How does transcendental idealism remain empirically realist?",
      "Are the universal-law and humanity formulations genuinely equivalent?",
      "How can freedom be practically necessary if theoretical reason cannot know it?",
    ],
  },
  hegel: {
    beginner: [
      "Explain your philosophy.",
      "What do you mean by dialectic?",
      "Why do I need other people in order to understand myself?",
    ],
    intermediate: [
      "What does the lord–bondsman struggle teach about recognition?",
      "How can freedom depend on institutions rather than freedom from them?",
      "Why is thesis–antithesis–synthesis a misleading summary of your method?",
    ],
    advanced: [
      "How does determinate negation preserve what it overcomes?",
      "Can ethical life reconcile subjective freedom with objective institutions?",
      "Does the claim that the rational is actual excuse existing injustice?",
    ],
  },
  mill: {
    beginner: [
      "Explain your philosophy.",
      "When should society leave people free to make their own choices?",
      "Are some kinds of happiness really better than others?",
    ],
    intermediate: [
      "How does the harm principle differ from simple anti-paternalism?",
      "Why is a false opinion still valuable in public debate?",
      "How can rights be grounded in utility without becoming expendable?",
    ],
    advanced: [
      "Can competent judges establish qualitative differences among pleasures without elitism?",
      "Where does social coercion fit if the harm principle addresses legal force?",
      "How do your feminist commitments sit with the imperial limits of your liberalism?",
    ],
  },
  marx: {
    beginner: [
      "Explain your philosophy.",
      "What is capitalism, and what is wrong with it?",
      "What do you mean when you say workers are alienated?",
    ],
    intermediate: [
      "How can exploitation occur if a worker freely agrees to a wage?",
      "What is commodity fetishism?",
      "Do material conditions determine everything people think and do?",
    ],
    advanced: [
      "How does the value of labor-power differ from the value labor creates?",
      "What changes between the early theory of alienation and the mature critique of capital?",
      "Does historical materialism imply a necessary sequence of social formations?",
    ],
  },
  heidegger: {
    beginner: [
      "Explain your philosophy.",
      "What is the difference between Being and a being?",
      "What does it mean to live authentically?",
    ],
    intermediate: [
      "Why is being-in-the-world more basic than a mind observing objects?",
      "What can anxiety reveal that ordinary fear cannot?",
      "Why is modern technology more than a collection of tools?",
    ],
    advanced: [
      "How does temporality ground the unity of care?",
      "Can authenticity avoid becoming an individualist ideal?",
      "How should your philosophy be read in light of your Nazism and antisemitism?",
    ],
  },
  wittgenstein: {
    beginner: [
      "Explain your philosophy.",
      "What does it mean to say that a word's meaning is its use?",
      "Can philosophy solve problems, or only make them disappear?",
    ],
    intermediate: [
      "What is a language-game?",
      "Why can't I create a language that only I could understand?",
      "How did your later philosophy reject the picture theory in the Tractatus?",
    ],
    advanced: [
      "How does rule-following avoid both rigid interpretation and communal conventionalism?",
      "Does the private-language argument deny first-person authority about sensation?",
      "What continuity remains between saying and showing in the Tractatus and the later method?",
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

interface DebateLens {
  name: string;
  coreClaim: string;
  signature: string;
  challenge: string;
  freedom: string;
}

/**
 * Compact intellectual "coordinates" used to compose meaningful topics for
 * the full roster. Maintaining O(n) lenses is much safer than maintaining
 * O(n²) pair records: adding one philosopher requires one lens, not three
 * topics against every existing philosopher.
 */
const DEBATE_LENSES: Record<string, DebateLens> = {
  aquinas: {
    name: "Aquinas",
    coreClaim: "reality has a divinely ordered structure reason can partly know",
    signature: "natural-law account of human ends",
    challenge: "whether created purposes constrain or fulfill a person",
    freedom: "perfecting rational nature by choosing the good",
  },
  nietzsche: {
    name: "Nietzsche",
    coreClaim: "inherited truths and values must be genealogically revalued",
    signature: "genealogy of morality",
    challenge: "whether an ideal conceals resentment and declining life",
    freedom: "self-overcoming and the creation of values",
  },
  kierkegaard: {
    name: "Kierkegaard",
    coreClaim: "truth about existence must be inwardly appropriated by the single individual",
    signature: "account of faith, anxiety, and despair",
    challenge: "whether a system can capture what it means to exist",
    freedom: "becoming a self transparently grounded before God",
  },
  sartre: {
    name: "Sartre",
    coreClaim: "existence precedes essence and no given nature excuses our choices",
    signature: "analysis of bad faith",
    challenge: "whether any fixed identity evades radical responsibility",
    freedom: "projecting oneself within a resistant situation",
  },
  camus: {
    name: "Camus",
    coreClaim: "lucid revolt answers an absurd world without appeal to transcendence",
    signature: "ethic of revolt and limits",
    challenge: "whether hope escapes the tension of the absurd",
    freedom: "living lucidly without appeal while preserving solidarity",
  },
  hume: {
    name: "Hume",
    coreClaim: "custom, sentiment, and experience guide life where reason cannot demonstrate",
    signature: "mitigated skepticism",
    challenge: "whether a claim outruns the evidence and habits supporting it",
    freedom: "acting from one's will within a regular causal order",
  },
  plato: {
    name: "Plato",
    coreClaim: "knowledge and justice depend on stable intelligible Forms",
    signature: "ascent from opinion toward the Good",
    challenge: "whether changing particulars can ground knowledge or virtue",
    freedom: "bringing appetite and spirit under the rule of reason",
  },
  aristotle: {
    name: "Aristotle",
    coreClaim: "forms and purposes are realized within concrete natural things",
    signature: "virtue ethics of habituation and practical wisdom",
    challenge: "whether an abstraction explains actual change and flourishing",
    freedom: "cultivating rational activity and virtuous character",
  },
  epicurus: {
    name: "Epicurus",
    coreClaim: "a good life requires modest pleasure and freedom from fear",
    signature: "therapy of desire",
    challenge: "whether an ambition cures disturbance or multiplies it",
    freedom: "escaping empty desire, superstition, and fear",
  },
  "marcus-aurelius": {
    name: "Marcus Aurelius",
    coreClaim: "virtue depends on governing judgment rather than controlling events",
    signature: "Stoic discipline of assent",
    challenge: "whether an external event can damage moral character",
    freedom: "assenting well to impressions within an ordered cosmos",
  },
  augustine: {
    name: "Augustine",
    coreClaim: "the restless will finds its good only through divine grace",
    signature: "analysis of the divided will",
    challenge: "whether a damaged will can heal itself",
    freedom: "rightly ordered love made possible by grace",
  },
  spinoza: {
    name: "Spinoza",
    coreClaim: "everything follows necessarily from the one substance, God or Nature",
    signature: "causal analysis of the affects",
    challenge: "whether contingency reflects only ignorance of causes",
    freedom: "acting from adequate understanding of necessity",
  },
  girard: {
    name: "Girard",
    coreClaim: "desire is learned through models and can escalate into rivalry and collective violence",
    signature: "mimetic analysis of desire and scapegoating",
    challenge: "which model taught a person or group what to want",
    freedom: "recognizing rivalry and choosing nonviolent models of imitation",
  },
  beauvoir: {
    name: "Beauvoir",
    coreClaim: "freedom is embodied, situated, and bound to the freedom of others",
    signature: "ethics of ambiguity",
    challenge: "whether an abstract freedom ignores oppression and dependence",
    freedom: "pursuing projects that open freedom for oneself and others",
  },
  foucault: {
    name: "Foucault",
    coreClaim: "power and knowledge historically produce subjects and norms",
    signature: "genealogy of apparently natural categories",
    challenge: "which practices made a truth seem necessary",
    freedom: "transforming how subjects are governed and govern themselves",
  },
  descartes: {
    name: "Descartes",
    coreClaim: "knowledge must be rebuilt from what survives methodical doubt",
    signature: "method of clear and distinct reasoning",
    challenge: "whether a belief has a foundation immune to serious doubt",
    freedom: "using the will firmly within the limits of clear judgment",
  },
  locke: {
    name: "Locke",
    coreClaim: "experience supplies the materials of knowledge and consent limits authority",
    signature: "empiricist account of ideas and persons",
    challenge: "whether a supposed essence or authority exceeds what experience warrants",
    freedom: "exercising natural rights under government by consent",
  },
  kant: {
    name: "Kant",
    coreClaim: "finite reason structures experience and gives itself universal moral law",
    signature: "critical philosophy of autonomy",
    challenge: "whether a maxim can be universally shared while respecting persons",
    freedom: "self-legislation under a categorical moral law",
  },
  hegel: {
    name: "Hegel",
    coreClaim: "truth and freedom become intelligible only through historical development",
    signature: "immanent dialectic of determinate negation",
    challenge: "which internal contradiction exposes a view as one-sided",
    freedom: "mutual recognition embodied in rational institutions",
  },
  mill: {
    name: "Mill",
    coreClaim: "liberty and institutions should promote the fullest human flourishing",
    signature: "harm principle and qualitative utilitarianism",
    challenge: "whether coercion prevents harm or merely enforces conformity",
    freedom: "developing individuality through experiments in living",
  },
  marx: {
    name: "Marx",
    coreClaim: "material production and class relations shape apparently natural social forms",
    signature: "critique of capital and commodity fetishism",
    challenge: "which labor and power relations an abstraction conceals",
    freedom: "collectively transforming alienating relations of production",
  },
  heidegger: {
    name: "Heidegger",
    coreClaim: "human existence is already involved in a meaningful world before detached thought",
    signature: "analysis of being-in-the-world and care",
    challenge: "which forgotten understanding of Being frames the question",
    freedom: "owning finite possibilities rather than fleeing into the anonymous they",
  },
  wittgenstein: {
    name: "Wittgenstein",
    coreClaim: "meaning lives in language-games and practices rather than hidden mental objects",
    signature: "therapeutic description of language use",
    challenge: "whether a philosophical puzzle comes from words torn from their use",
    freedom: "release from pictures that hold thought captive",
  },
};

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
  [pairKey("aquinas", "hume")]: [
    "Can experience support belief in God, or does natural theology outrun its evidence?",
    "Does morality rest on rational natural law or human sentiment?",
    "Do miracles ever deserve belief?",
  ],
  [pairKey("nietzsche", "hume")]: [
    "Are moral values products of sympathy or expressions of power?",
    "Does genealogy undermine morality, or merely explain how it arose?",
    "Is the self a useful bundle of perceptions or a project of self-overcoming?",
  ],
  [pairKey("kierkegaard", "hume")]: [
    "Can faith be justified when evidence runs out?",
    "Is religious passion a path to truth or a cause of credulity?",
    "Does the self require God, or only memory, character, and convention?",
  ],
  [pairKey("sartre", "hume")]: [
    "Are we radically free, or intelligible only within a regular causal order?",
    "Is the self a free project or a bundle joined by memory and imagination?",
    "Can moral responsibility arise from sentiment without universal rational law?",
  ],
  [pairKey("camus", "hume")]: [
    "Can ordinary life answer philosophical skepticism and the absurd?",
    "Should we live without metaphysical hope, and what follows if we do?",
    "Is solidarity grounded in moral sentiment or lucid revolt?",
  ],
};

function composedTopics(aId: string, bId: string): string[] | undefined {
  const [firstId, secondId] = [aId, bId].sort();
  const a = DEBATE_LENSES[firstId];
  const b = DEBATE_LENSES[secondId];
  if (!a || !b || firstId === secondId) return undefined;
  return [
    `Is ${a.coreClaim}, or is ${b.coreClaim}?`,
    `Does ${a.name}'s ${a.signature} survive ${b.name}'s challenge concerning ${b.challenge}?`,
    `Which better explains human freedom: ${a.freedom}, or ${b.freedom}?`,
  ];
}

// Keeps the UI sensible for an unknown or temporarily incomplete profile.
const FALLBACK_TOPICS = [
  "Does life have a meaning we discover, or one we create?",
  "What makes an action good?",
  "Is death something to fear?",
];

export function getDuelTopics(aId: string, bId: string): string[] {
  return (
    DUEL_TOPICS[pairKey(aId, bId)] ??
    composedTopics(aId, bId) ??
    FALLBACK_TOPICS
  );
}

/**
 * Exported for tests: every philosopher pair should have curated topics.
 *
 * Takes the ids rather than reading `PHILOSOPHERS` so this module — which the
 * duel page needs on the client, because the topic list depends on the pair
 * the user picks — does not drag the ~96KB persona module (every system
 * prompt and grounding excerpt) into the browser bundle with it. The caller
 * supplies the roster; the only caller is the test.
 */
export function allPairKeys(ids: readonly string[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      keys.push(pairKey(ids[i], ids[j]));
    }
  }
  return keys;
}

export function hasCuratedTopics(key: string): boolean {
  if (key in DUEL_TOPICS) return true;
  const [aId, bId, ...extra] = key.split("|");
  return extra.length === 0 && Boolean(composedTopics(aId, bId));
}

/**
 * Where a pair's duel topics come from: a hand-written `DUEL_TOPICS` entry, a
 * pair composed from `DEBATE_LENSES`, or neither.
 *
 * The diagnostic's results screen needs the distinction that
 * `hasCuratedTopics` deliberately flattens: D10 gates on a pair having *any*
 * topics, and then **prefers** the hand-written ones when choosing which two
 * or three of the sixteen cross-group pairs to show.
 */
export function duelTopicSource(
  aId: string,
  bId: string,
): "curated" | "composed" | "none" {
  if (pairKey(aId, bId) in DUEL_TOPICS) return "curated";
  return composedTopics(aId, bId) ? "composed" : "none";
}
