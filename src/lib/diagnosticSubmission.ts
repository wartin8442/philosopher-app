import {
  isMixedPattern,
  routePattern,
  tallyPole,
  type Branch,
  type BranchAnswer,
  type IntentChoice,
} from "@/lib/diagnostic";
import {
  disposeFreeText,
  type FreeTextDisposition,
} from "@/lib/diagnosticSafety";
import type { Pole } from "@/lib/routing";
import type { AnswerLevel, Approach, DiagnosticTopic } from "@/lib/types";

/**
 * Everything the diagnostic produces from a completed branch, assembled in one
 * place.
 *
 * This module exists for the rule in docs/diagnostic_safety_design.md §11:
 * *every* path that moves free text — to the model, into a conversation seed,
 * into analytics — goes through `disposeFreeText()`, and the conditions are
 * never re-derived at the call site. Three consumers have to agree about one
 * answer, so they read one object rather than each asking the matcher again.
 *
 * The consequence worth stating plainly: if a question flagged, its text is
 * absent from `textForModel` and cannot reach `conversationSeed`. That is
 * structural here, not a check someone remembered to write.
 */
export interface DiagnosticSubmission {
  topic: DiagnosticTopic;
  /** The side of the axis the clicks fixed. The model never moves this (D13). */
  pole: Pole;
  /**
   * True when the clicks did not agree. The design requires the explanation
   * copy to present a mixed pattern as mixed rather than as a clean pole.
   */
  mixed: boolean;
  /** Route names in question order — stage 3's route-pattern input. */
  routes: string[];
  approach: Approach;
  level: AnswerLevel;
  /** Which group the results screen leads with. Never changes membership. */
  leadWith: IntentChoice["leadWith"];
  /**
   * Free text cleared for the bounded rerank, tagged with the question it came
   * from. Empty when the user typed nothing, or when everything they typed was
   * withheld.
   */
  textForModel: { question: number; text: string }[];
  /**
   * The text a selected card may seed a conversation with, if any. Currently
   * unused by the results screen: there is no seed channel that satisfies the
   * safety design's "never written to storage, a cookie, or a log line" rule
   * (a query parameter is a log line). It is computed here so that when one
   * exists, the gate is already in the right place.
   */
  conversationSeed?: string;
  /** True once any answer on this branch has flagged (safety §11, ruling B). */
  branchFlagged: boolean;
  /**
   * The only record permitted to leave the browser about these answers.
   * Deliberately not the text: test #8 needs click distributions, not prose.
   */
  analytics: {
    topic: DiagnosticTopic;
    pole: Pole;
    mixed: boolean;
    /** Which option index was clicked, per question. */
    options: number[];
    /** Per-answer disposition summaries — `hadText`, `flagged`, `category`. */
    answers: FreeTextDisposition["analytics"][];
  };
}

export function buildSubmission(
  branch: Branch,
  answers: BranchAnswer[],
  approach: Approach,
  intent: IntentChoice,
): DiagnosticSubmission {
  const dispositions = branch.questions.map((_, index) =>
    disposeFreeText(answers[index]?.text),
  );

  const permitted = dispositions
    .map((disposition, index) => ({ disposition, index }))
    .filter(({ disposition }) => disposition.sendToModel)
    .map(({ index }) => ({
      question: index,
      text: (answers[index]?.text ?? "").trim(),
    }));

  // The longest permitted answer is the one a seeded conversation would open
  // on — most said, most to work with. `seedConversation` is the gate, not
  // `sendToModel`: they agree today and are separate rules on purpose.
  const seedable = dispositions
    .map((disposition, index) => ({ disposition, index }))
    .filter(({ disposition }) => disposition.seedConversation)
    .map(({ index }) => (answers[index]?.text ?? "").trim())
    .sort((a, b) => b.length - a.length);

  return {
    topic: branch.topic,
    pole: tallyPole(branch, answers),
    mixed: isMixedPattern(branch, answers),
    routes: routePattern(branch, answers),
    approach,
    level: intent.level,
    leadWith: intent.leadWith,
    textForModel: permitted,
    conversationSeed: seedable[0],
    branchFlagged: dispositions.some((disposition) => disposition.showNotice),
    analytics: {
      topic: branch.topic,
      pole: tallyPole(branch, answers),
      mixed: isMixedPattern(branch, answers),
      options: branch.questions.map((_, index) => answers[index]?.option ?? -1),
      answers: dispositions.map((disposition) => disposition.analytics),
    },
  };
}
