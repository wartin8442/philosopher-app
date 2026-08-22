import type { DiagnosticTopic } from "@/lib/types";
import type { Pole } from "@/lib/routing";

/**
 * Results-screen copy for the diagnostic router: the per-topic group subtitles
 * and the per-philosopher, per-topic card hooks.
 *
 * Transcribed from docs/diagnostic_shelf_copy.md, **draft 1, awaiting the
 * author's review**. That is why it is a separate module from
 * `diagnostic.ts`: the thirty branch questions there are post-review and must
 * not be touched for style, while everything here is expected to change once
 * Will reads it. Keep the two files in that relationship.
 *
 * Three conventions from the copy doc that the code depends on:
 *
 *   1. The headers "Start with these" / "Try a different angle" are fixed
 *      (D12). What is authored per topic is the italic subtitle beneath them.
 *   2. Either group can land in either role depending on the user's tally, so
 *      every group carries a **pair** of lines — `home` when it is the user's
 *      own side, `challenge` when it is the other one.
 *   3. Subtitles describe the *group*, never the user. A majority can be 2-1
 *      or mixed, and the design's personalization rule forbids turning an
 *      inference into a declaration about the user's beliefs.
 *
 * Hooks are one sentence per card, third person, no invented quotations —
 * every quoted phrase appears in `philosophers.ts` (prompt or sources).
 */

export interface GroupLabels {
  /** Shown when this group is the user's own side of the axis. */
  home: string;
  /** Shown when it is the other side. */
  challenge: string;
}

/**
 * Twenty pairs: ten topics × two poles. Keyed by pole rather than by the
 * pole's name so a copy edit can never silently move a subtitle to the wrong
 * side of an axis — `TOPIC_POLES` in types.ts stays the single authority on
 * which pole is which.
 */
export const GROUP_LABELS: Record<DiagnosticTopic, Record<Pole, GroupLabels>> = {
  /* enough ↔ more */
  sufficiency: {
    negative: {
      home: "These four think a good life is nearer than it looks: remove the fear, the empty desires, and the judgments that poison the present, and what is left is enough.",
      challenge:
        "The case against needing more: for these thinkers, \"more\" is the trap — clear away fear and empty desire, and enough was the goal all along.",
    },
    positive: {
      home: "These four agree a life can be squandered on comfort: living well here means growth, work, self-overcoming — something built, not settled into.",
      challenge:
        "The case against settling: contentment can be a way of hiding, and a life is measured by what it becomes, not by how quietly it rests.",
    },
  },

  /* made ↔ found */
  moral_source: {
    negative: {
      home: "These four agree that moral values carry human fingerprints — a history, a psychology, an agreement — and that honesty about this is where real ethics begins.",
      challenge:
        "These thinkers ask who benefits from the morality we inherit. If values were made, they can be examined — and remade.",
    },
    positive: {
      home: "All four hold that right and wrong are real, not invented — and they disagree hard about why: Kant grounds morality in reason's own law, Mill in the happiness of everyone affected, Aristotle in human flourishing, Aquinas in natural law. One conviction, four rival foundations.",
      challenge:
        "These four answer the makers: morality is found, not made — though watch them fight over where. Kant's law of reason against Mill's arithmetic of happiness is one of the great quarrels in ethics.",
    },
  },

  /* face ↔ reframe */
  consolation: {
    negative: {
      home: "No appeal, no cushion: these four start from loss as it actually is, and ask what honesty — even affirmation — looks like from there.",
      challenge:
        "These thinkers suspect every consolation smuggles in a false hope — and that something important only becomes visible when you stop reaching for one.",
    },
    positive: {
      home: "These four believe suffering looks different when it is understood: much of its power comes from judgments, fears, and expectations that can be examined and changed.",
      challenge:
        "Understanding is not the same as softening: some of what crushes us is confusion, these thinkers argue, and clearing it away is no consolation prize.",
    },
  },

  /* no core ↔ core */
  selfhood: {
    negative: {
      home: "These four went looking for the fixed inner self and reported back: there isn't one — there are habits, choices, histories, and the ongoing work of becoming someone.",
      challenge:
        "These thinkers argue that the \"true self\" waiting to be found is the one thing you will never find — and that this is better news than it sounds.",
    },
    positive: {
      home: "These four think there is a real you to find — a soul, a thinking thing, a self you can succeed or fail at being — and that the search inward is the oldest work of philosophy.",
      challenge:
        "The pushback: if the self is assembled, something is doing the assembling — and each of these four has a different account of what that is.",
    },
  },

  /* made ↔ makes himself */
  agency: {
    negative: {
      home: "These four take seriously how much of you was settled before you got a vote — and none of them stops there: each finds a real freedom on the far side of understanding what made you.",
      challenge:
        "These thinkers don't deny freedom — they relocate it: understanding what actually moves you, they argue, is the only freedom worth the name.",
    },
    positive: {
      home: "These four put the choice back in your hands — anxiously, in Kierkegaard's case; absolutely, in Sartre's. Freedom here is not a feeling but a responsibility.",
      challenge:
        "Shaped, yes — but these thinkers insist something in you still answers for what happens next, and nothing can carry the weight of that choice for you.",
    },
  },

  /* conditioning ↔ consent */
  legitimacy: {
    negative: {
      home: "These four study how obedience gets built — by discipline, by ideology, by the anonymous \"everyone,\" by inherited morality — long before anyone asks for your agreement.",
      challenge:
        "An uncomfortable question about the rules that feel reasonable: who trained you to find them reasonable?",
    },
    positive: {
      home: "These four think rules can be answerable to something — consent, harm, justice, a freedom held in common — and that the interesting question is which rules fail the test.",
      challenge:
        "Grant that much obedience is trained — these thinkers still ask what a rule would have to be like for a clear-eyed person to accept it anyway.",
    },
  },

  /* nothing beyond nature ↔ a divine order */
  transcendence: {
    negative: {
      home: "These four live after the question: two who examine what belief rests on, and two who ask what a life without appeal can still affirm — including one who thinks we haven't begun to feel what we lost.",
      challenge:
        "These thinkers won't debate proofs politely. They ask what believing does, where it came from — and what remains standing when it goes.",
    },
    positive: {
      home: "Four believers, two roads: Aquinas and Descartes argue their way to God; Augustine and Kierkegaard live their way there — inward search and the leap of faith. Part of the question is which road is yours.",
      challenge:
        "The strongest case you will meet that a serious mind can conclude there is a God — by proof, and by paths that were never meant to be proofs.",
    },
  },

  /* nothing behind ↔ something behind */
  depth: {
    negative: {
      home: "These four suspect the \"hidden reality\" is a trick of grammar, habit, or wishful thinking — and that the surface, honestly described, is deeper than it looks.",
      challenge:
        "Why so sure something is behind the curtain? These thinkers ask what that search has cost — and what honest description finds instead.",
    },
    positive: {
      home: "These four agree the world you see is not the whole story — and disagree completely about what the rest is: Forms, one infinite substance, atoms and void, a truth known by inner light.",
      challenge:
        "Even \"what you see is what there is\" needs an account of why appearances hold together — and each of these four claims to have found it underneath.",
    },
  },

  /* perspectival ↔ objective */
  standpoint: {
    negative: {
      home: "These four start from knowers as they actually are — creatures of habit, practice, purpose, and situation — and rebuild knowledge from there, without pretending to a view from nowhere.",
      challenge:
        "These thinkers don't attack truth; they ask what reaching it from inside a human life is actually like — and what \"objectivity\" quietly assumes.",
    },
    positive: {
      home: "These four think knowledge can outgrow opinion — by rigorous doubt, careful observation, or a light the mind does not supply — and that the standard is not ours to bend.",
      challenge:
        "Some claims — in geometry, in logic, perhaps in ethics — don't seem to care where you're standing. These thinkers built philosophy on that.",
    },
  },

  /* others cost you yourself ↔ others complete you */
  sociality: {
    negative: {
      home: "These four take the difficulty of other people seriously — being defined by them, watched by them, absorbed into them — and none of them thinks the answer is escape.",
      challenge:
        "What the warm view leaves out: the gaze that fixes you, the crowd that swallows you, the resentment that passes for virtue.",
    },
    positive: {
      home: "These four think you cannot become yourself alone: friendship, recognition, love, and shared life are not additions to a self but ingredients of one.",
      challenge:
        "The price of other people runs both ways, these thinkers answer: without them, there is no one to be.",
    },
  },
};

/**
 * The topic-specific reason a philosopher is on *this* shelf, keyed
 * topic → philosopher id.
 *
 * Two binding constraints from the 2026-08-14 rulings are carried in the
 * wordings and must survive editing: Nietzsche and Augustine carry a
 * *different* hook on every shelf they appear on (the concentration ruling —
 * nine and seven shelves respectively), and Spinoza's `transcendence` hook
 * never calls him an atheist. A missing entry is not fatal — the card falls
 * back to the philosopher's own `blurb` — but it is a copy hole.
 */
export const CARD_HOOKS: Record<
  DiagnosticTopic,
  Record<string, string>
> = {
  sufficiency: {
    epicurus:
      "Taught that pleasure reaches its limit once pain is gone — after that it can only be varied, not increased — so a life of bread, friends, and an untroubled mind is not a compromise.",
    "marcus-aurelius":
      "Wrote reminders to himself that distress comes from treating what is not ours to command as if it were — and that nowhere is quieter than one's own soul.",
    spinoza:
      "Held that blessedness is not the reward of virtue but virtue itself: joy comes from understanding, not from acquiring.",
    camus:
      "Concluded that even a universe that answers nothing leaves enough to live for: \"one must imagine Sisyphus happy.\"",
    nietzsche:
      "His test for a life: would you will it, in every detail, again and again eternally? Anything you could not affirm that way still has work to do.",
    sartre:
      "For him a life is a project, not a possession: you exist first, and what your existence amounts to is decided by what you make of it.",
    aristotle:
      "Defined the human good as activity — the exercise of your best capacities over a complete life — not a feeling you could have while idle.",
    hegel:
      "Thought a life, like an idea, grows by running into its own contradictions and building something larger out of them.",
  },

  moral_source: {
    aquinas:
      "Grounds morality in natural law: good is to be done and pursued, and the precepts follow from what human beings, by nature, are for.",
    aristotle:
      "Finds right and wrong in character: virtue is a cultivated disposition, lying in a mean that practical wisdom locates case by case.",
    kant: "Grounds it in reason itself: act only on principles you could will as universal law, and treat every person as an end, never merely as a means.",
    mill: "Grounds it in happiness: actions are right as they promote well-being for everyone affected, with pleasures differing in quality, not just amount.",
    nietzsche:
      "Traced our \"good and evil\" to a slave revolt in morality: values born of ressentiment, whose origin their inheritors were never told.",
    sartre:
      "In choosing, you \"choose an image of man\": there is no table of values behind you, only the ones your choices write.",
    epicurus:
      "Called justice a compact of mutual advantage: no justice in itself, only agreements not to harm or be harmed — and what is useful can change.",
    camus:
      "Found value born in revolt — \"I rebel, therefore we are\" — and insisted rebellion betrays itself the moment it justifies murder.",
  },

  consolation: {
    epicurus:
      "\"Death is nothing to us\": where we are, death is not, and where death is, we are not — a fear that poisons a life it cannot touch.",
    "marcus-aurelius":
      "Held that events do not disturb us — our judgments about them do, and a judgment can be revoked.",
    aquinas:
      "Reads suffering against the largest possible frame: the ultimate human end is beatitude, and no loss along the way is the last word.",
    augustine:
      "Argued evil is not a thing but a lack — a corruption of something good — so what harms us is real, but it is not a rival power.",
    camus:
      "Refused both suicide and false hope: hold the absurd open, revolt lucidly, and fight suffering as a matter of common decency.",
    heidegger:
      "Argued that being-toward-death is not morbid: owning your finitude is what frees a life from anonymous drift.",
    hume: "Practiced what he argued: dying in 1776, he said that not existing after death troubled him no more than not having existed before birth.",
    nietzsche:
      "Preached amor fati, love of fate: the test is not enduring your life but affirming it.",
  },

  selfhood: {
    descartes:
      "Whatever else can be doubted, the doubter cannot be: you are, at minimum, a thinking thing — and that is a place to build.",
    augustine:
      "Searched memory — a vast interior country holding not just images but the self — and found that the way inward is where the search begins.",
    kierkegaard:
      "Explored the self as a process, and despair as the failure to become oneself. Becoming a self is the task.",
    plato:
      "Mapped the soul into reason, spirit, and appetite: the real you is an order among them, and justice is that order kept.",
    sartre:
      "No fixed essence precedes you: his waiter, over-playing \"being a waiter,\" is the warning about pretending to be a thing instead of a freedom.",
    hume: "Looked inside for a simple, unchanging self and found only perceptions — while insisting that ordinary persons, character, and responsibility survive the discovery.",
    foucault:
      "Asked where \"kinds of people\" come from — and showed how institutions produce the selves they claim merely to describe.",
    nietzsche:
      "Saw the self as something to be given form — a work of self-overcoming, not an heirloom to be located.",
  },

  agency: {
    kierkegaard:
      "Called anxiety \"the dizziness of freedom\": the vertigo before possibility that proves the choice is really yours.",
    kant: "Freedom is not doing what you want; it is autonomy — a will giving law to itself, which no inclination can do for you.",
    sartre:
      "\"Condemned to be free\": even refusing to choose is a choice, and the excuses are the part he will not let you keep.",
    nietzsche:
      "Freedom here is creative: values are not found but made, and making them is the highest exercise of strength.",
    spinoza:
      "Nothing is contingent — and yet freedom is real: acting from the necessity of your own nature, which means understanding it. Freedom is comprehension, not exemption.",
    marx: "We make our history, but under inherited conditions — so freeing anyone means changing the conditions, together, not just the mind.",
    augustine:
      "Located the problem inside the will itself: we do not wholly want what we want, and a divided will cannot heal itself alone.",
    hume: "Dissolved the puzzle: liberty means acting on your own will without constraint — compatible with a causal order, which responsibility in fact requires.",
    girard:
      "Asked how free a desire can be when its model came first: we borrow what to want from others, then mistake the borrowed desire for something entirely our own.",
  },

  legitimacy: {
    locke:
      "Political power is legitimate only by consent, and only to secure life, liberty, and property — and a government that breaks that trust can rightly be resisted.",
    hegel:
      "His test of an institution: can the people living under it recognize its laws as expressions of their own freedom — or only as constraints?",
    mill: "One rule for rules: coercing a competent adult is justified only to prevent harm to others — never merely for that person's own good.",
    plato:
      "Distrusted both tradition and the crowd: rule belongs to those who actually know what justice is — a standard he thought most cities fail.",
    foucault:
      "Studied timetables, examinations, and the Panopticon to show how discipline gets inside you — until the watched take over the watching.",
    heidegger:
      "Most of what \"one does\" was never chosen: the anonymous \"they\" supplies your possibilities before you notice — and authenticity begins in noticing.",
    marx: "Social arrangements generate the ideas that make them look natural — so the rules feel obvious precisely where the power is best hidden.",
    nietzsche:
      "Called it herd morality: values that reward comfort and punish deviation — and warned of the \"last man,\" too comfortable to ask for anything more.",
    girard:
      "Traced social order beneath consent to a more violent unanimity: a divided community can reunite by blaming and expelling one victim.",
  },

  transcendence: {
    aquinas:
      "Argued five ways from the world you can see — motion, causes, contingency, gradation, order — to what \"all call God.\"",
    kierkegaard:
      "Faith is not the end of an argument but a leap over objective uncertainty: Abraham, held in fear and trembling, is his picture of it.",
    augustine:
      "His greatest work is addressed to God, not to a reader: for him the search leads inward, and then upward.",
    descartes:
      "Even his rigorous doubt rests on God: without a perfect, non-deceiving God, he argues, clear and distinct knowledge has no guarantee.",
    nietzsche:
      "\"God is dead\" was a diagnosis, not a boast: the belief has lost its grip on us, and we have not yet faced what that costs.",
    camus:
      "Rejected the leap to faith as \"philosophical suicide\": the honest task is living without appeal, holding the question open.",
    sartre:
      "Begins where the blueprint ends: with no God to author a human nature, existence precedes essence and the responsibility is all yours.",
    hume: "Brought religious claims before the ordinary court of evidence and testimony — neither a dogmatic atheist nor a believer, and unsettling to both.",
    // Copy guard (rulings log, 2026-08-14): never presented as an atheist.
    spinoza:
      "Identified God with Nature itself: one infinite substance, nothing beyond it. He was expelled for saying so — but he never called it atheism; he called the one substance God.",
    girard:
      "Read the Bible as a revelation of human violence: its decisive turn is to show the persecuted victim as innocent and the accusing crowd as wrong.",
  },

  depth: {
    plato:
      "The Cave: what we see are shadows of unchanging Forms — the many beautiful things borrow from Beauty itself.",
    spinoza:
      "One substance under everything — call it God or Nature — of which every thing, and every mind, is a mode.",
    epicurus:
      "Underneath everything: atoms and void, nothing else — a hidden order that dissolves the gods' threats instead of issuing them.",
    augustine:
      "The mind knows unchanging truths by a light that is not its own: for him the world points past itself at every turn.",
    wittgenstein:
      "Suspected the \"hidden essence\" is language on holiday: look at how words are actually used, and the mystery often dissolves.",
    hume: "Looked for the necessary connection behind cause and effect and found none — only constant conjunction, and a habit of expectation in us.",
    heidegger:
      "The world's meaning is not behind things but in our involvement with them: the hammer matters in use, not under inspection.",
    nietzsche:
      "There are no \"immaculate\" facts waiting behind interpretation — and honesty about that, he thought, is a virtue most philosophy lacks.",
    girard:
      "Read behind myths of a guilty monster or sacred victim to the concealed event: a community's violence against the scapegoat whose death restored peace.",
  },

  standpoint: {
    plato:
      "Split knowledge from opinion: knowledge is stable and can give an account of itself — opinion may be true, but it cannot say why.",
    descartes:
      "Doubted everything he could precisely to find what survives: doubt as an instrument for building knowledge, not a place to live.",
    aristotle:
      "Starts from what people say and what nature shows, and works toward science: knowledge of causes, of what cannot be otherwise.",
    augustine:
      "Words are only signs; the inner teacher is what actually instructs — truth is met, not manufactured.",
    hume: "Proportion confidence to evidence and expect no more certainty than experience gives: mitigated skepticism keeps the dogmatists honest.",
    wittgenstein:
      "Meaning — and knowing — live inside shared practices, our language-games; step outside them and the words stop working.",
    beauvoir:
      "Starts from the situated knower: body, history, and dependence set the terms on which anyone sees anything — abstraction without the case is worthless.",
    hegel:
      "Knowledge is historical rather than a view from nowhere: each standpoint exposes its own limits and is transformed through the conflict it cannot resolve.",
  },

  sociality: {
    aristotle:
      "\"A political animal\": the city exists not merely for living but for living well — flourishing is not something you can do alone.",
    hegel:
      "Self-consciousness needs recognition by another self-consciousness: even the master–servant struggle shows a self cannot confirm itself alone.",
    plato:
      "In the Symposium, desire rightly educated climbs from one beautiful person toward Beauty itself: other people are the first rungs of the ascent.",
    augustine:
      "Two cities, formed by two loves: what a community loves in common is what it is — and what its members become.",
    beauvoir:
      "\"One is not born, but rather becomes, a woman\": her account of being made the Other — defined relative to someone else — is the deepest study of what other people can cost.",
    nietzsche:
      "Unmasked ressentiment: the way resentment of others can invert into \"virtue\" — and poison the one who carries it.",
    foucault:
      "Being seen is never neutral: normalizing judgment measures everyone against \"normal,\" and other people are its instrument.",
    kierkegaard:
      "\"The crowd is untruth\": what matters most can only be done as a single individual — responsibility cannot be delegated to the public.",
    girard:
      "Made desire triangular: another person models what is worth wanting, then becomes the rival who seems to stand between us and it.",
  },
};

/** The hook for a card, or undefined when the copy has a hole. */
export function cardHook(
  topic: DiagnosticTopic,
  philosopherId: string,
): string | undefined {
  return CARD_HOOKS[topic]?.[philosopherId];
}
