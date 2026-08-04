export const EXPERIMENT_CONDITIONS = ["A", "B", "C"] as const;
export type ExperimentCondition = (typeof EXPERIMENT_CONDITIONS)[number];

export const DEFAULT_EXPERIMENT_CONDITION: ExperimentCondition = "A";

export function parseExperimentCondition(value: unknown): ExperimentCondition {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_EXPERIMENT_CONDITION;
  }
  if (typeof value === "string") {
    const normalized = value.toUpperCase();
    if (EXPERIMENT_CONDITIONS.includes(normalized as ExperimentCondition)) {
      return normalized as ExperimentCondition;
    }
  }
  throw new Error("condition must be A, B, or C");
}

export function usesCorpusRetrieval(condition: ExperimentCondition): boolean {
  return condition === "B";
}

export function usesPromptHardening(condition: ExperimentCondition): boolean {
  return condition === "C";
}

const COMMON_HARDENING = `Accuracy guardrails for source-sensitive questions:
- Treat a user's quotation, title, section number, or attribution as a claim to verify, not a premise to accept. Correct known misattributions and fabricated works briefly.
- Distinguish the philosopher's own voice from characters, pseudonyms, objections, editors, and later paraphrases.
- Name an exact section only when confident. Otherwise name the work and state that the precise locator is uncertain; never invent one.`;

const PHILOSOPHER_HARDENING: Record<string, string> = {
  aquinas: `In a Summa article, opening objections are positions I answer, not automatically my own view; distinguish objection, sed contra, respondeo, and replies. The prostitution/sewer comparison belongs to Ptolemy of Lucca's continuation of De Regimine Principum, not to Aquinas.`,
  // The second sentence previously asserted that "they muddy the water(s)" has
  // no source in Nietzsche. That was false: it renders "sie trüben alle ihr
  // Gewässer, daß es tief scheine" in Also sprach Zarathustra II, "Von den
  // Dichtern", verified against the German text on 2026-07-23. The old wording
  // would have driven the persona to deny a genuine line — the same
  // over-refusal failure the baseline already committed on sartre-q35-c1.
  nietzsche: `The Will to Power is a posthumous, editorially assembled notebook anthology, not a finished book Nietzsche authored. “They muddy the water, to make it seem deep” is genuine — it renders a line from Thus Spoke Zarathustra, Part Two, “On the Poets” — but the popular English wording belongs to no identified translator, so name the work and section and present the English as a rendering rather than as verbatim.`,
  kierkegaard: `Attribute pseudonymous positions to the relevant voice and preserve the author's distance: Johannes Climacus voices “truth is subjectivity,” and Johannes de silentio stages Fear and Trembling. “Leap of faith” is a later label, not Kierkegaard's wording, though he discusses leaps and qualitative transitions.`,
  sartre: `Do not flatten early ontological analyses in Being and Nothingness into the later historical and Marxian period; state which period or work is being discussed. Treat exact quotations and dates cautiously when the source is not secure.`,
  camus: `Camus explicitly rejected the existentialist label; distinguish his absurdist method from Sartrean existentialism. Preserve his distinction between early absurdity and the later ethics of revolt, solidarity, and limits.`,
};

export function conditionCHardening(philosopherId: string): string {
  return `${COMMON_HARDENING}\n${PHILOSOPHER_HARDENING[philosopherId] ?? ""}`.trim();
}
