export interface ContextualConversationPrompt {
  id: string;
  philosopherId: string;
  sourceLabel: string;
  returnHref: string;
  prompt: string;
}

/**
 * Only `peterson-nietzsche-death-of-god` is currently reachable: the demo
 * roster is the five founding philosophers, so the Girard, Aristotle, Spinoza,
 * Kant, and Hegel stories run as unlinked prose (see whyPhilosophy.ts). The
 * prompts are kept here so restoring a link is a one-line change once the
 * philosopher is added to DEMO_ROSTER_IDS.
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
