export interface ContextualConversationPrompt {
  id: string;
  philosopherId: string;
  sourceLabel: string;
  returnHref: string;
  prompt: string;
}

/**
 * Reachable today: `peterson-nietzsche-death-of-god`, the three
 * `demis-*` prompts linked from the names Hassabis's story mentions, and the
 * `course-kierkegaard-*` prompts linked from the course's Impact board — three
 * ideas written on it, and the four heirs dealt out above them.
 *
 * One is written but unreachable, on purpose.
 * `demis-hegel-dialectical-metaphysics` has no anchor: the Hassabis story
 * never names Hegel, and inventing a mention to hang it on is an editorial
 * decision, not a wiring one. `thiel-girard-mimetic-theory` is linked from
 * the Peter Thiel story now that Girard is on the released roster.
 */
const CONTEXTUAL_PROMPTS: ContextualConversationPrompt[] = [
  {
    id: "thiel-girard-mimetic-theory",
    philosopherId: "girard",
    sourceLabel: "From the Peter Thiel story",
    returnHref: "/why-philosophy/peter-thiel",
    prompt:
      "Explain to me mimetic theory and how it plays into societal dynamics.",
  },
  {
    id: "demis-aristotle-metaphysics",
    philosopherId: "aristotle",
    sourceLabel: "From the Demis Hassabis story",
    returnHref: "/why-philosophy/demis-hassabis",
    prompt:
      "Can you summarize your metaphysics and explain how it helps us understand the fundamental principles of reality?",
  },
  {
    id: "demis-hegel-dialectical-metaphysics",
    philosopherId: "hegel",
    sourceLabel: "From the Demis Hassabis story",
    returnHref: "/why-philosophy/demis-hassabis",
    prompt: "Explain your theory of dialectical metaphysics.",
  },
  {
    id: "demis-spinoza-nature",
    philosopherId: "spinoza",
    sourceLabel: "From the Demis Hassabis story",
    returnHref: "/why-philosophy/demis-hassabis",
    prompt:
      "How can understanding nature help us understand our place within it?",
  },
  {
    id: "demis-kant-mind-and-reality",
    philosopherId: "kant",
    sourceLabel: "From the Demis Hassabis story",
    returnHref: "/why-philosophy/demis-hassabis",
    prompt: "In what sense does the mind shape the reality we experience?",
  },
  // The three ideas written on the Impact board of the Kierkegaard course.
  // A lecture is fixed text, so the only way to push on one of its ideas is to
  // leave it and ask him — these carry the question over for the student.
  {
    id: "course-kierkegaard-anxiety",
    philosopherId: "kierkegaard",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "Tell me about anxiety as the dizziness of freedom.",
  },
  {
    id: "course-kierkegaard-individual",
    philosopherId: "kierkegaard",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt:
      "Tell me about becoming a genuine individual rather than losing yourself in the crowd.",
  },
  {
    id: "course-kierkegaard-leap-of-faith",
    philosopherId: "kierkegaard",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "Tell me about the leap of faith.",
  },
  // The four heirs dealt out on the same board. He names each of them and what
  // they took from him; the card is the door to asking them about it directly,
  // so the question the lecture raises is the question waiting on their page.
  {
    id: "course-kierkegaard-heir-heidegger",
    philosopherId: "heidegger",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "What ideas from Søren Kierkegaard influenced you?",
  },
  {
    id: "course-kierkegaard-heir-sartre",
    philosopherId: "sartre",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "What ideas from Søren Kierkegaard influenced you?",
  },
  {
    id: "course-kierkegaard-heir-beauvoir",
    philosopherId: "beauvoir",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "What ideas from Søren Kierkegaard influenced you?",
  },
  {
    id: "course-kierkegaard-heir-camus",
    philosopherId: "camus",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "What ideas from Søren Kierkegaard influenced you?",
  },
  // The two books stood up on the Hegel board of the biography. These are
  // linked with a `work` as well, so the student lands in the conversation
  // already focused on the book, with the question the lecture raised about
  // it waiting to be asked.
  {
    id: "course-kierkegaard-either-or",
    philosopherId: "kierkegaard",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt:
      "Explain why a choice between two ways of living cannot be mediated into something higher.",
  },
  {
    id: "course-kierkegaard-abraham",
    philosopherId: "kierkegaard",
    sourceLabel: "From the Kierkegaard course",
    returnHref: "/course/kierkegaard/introduction",
    prompt: "Explain why Abraham's faith cannot be explained rationally.",
  },
  {
    id: "peterson-nietzsche-death-of-god",
    philosopherId: "nietzsche",
    sourceLabel: "From the Jordan Peterson story",
    returnHref: "/why-philosophy/jordan-peterson",
    prompt:
      "What did you mean by ‘God is dead,’ and why did you believe nihilism would follow?",
  },
];

export function getContextualPrompt(
  id: string | null,
  philosopherId: string,
): ContextualConversationPrompt | null {
  if (!id) return null;
  return (
    CONTEXTUAL_PROMPTS.find(
      (prompt) => prompt.id === id && prompt.philosopherId === philosopherId,
    ) ?? null
  );
}
