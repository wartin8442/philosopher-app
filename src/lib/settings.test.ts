import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  completedLevelPromptVersions,
  needsAnswerLevelChoice,
} from "./settings";

describe("first-visit answer-level prompts", () => {
  it("asks for Girard's level when a stale pre-release level is present", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      philosopherLevels: { girard: "intermediate" as const },
    };

    expect(needsAnswerLevelChoice(settings, "girard")).toBe(true);
  });

  it("remembers Girard's choice after the released prompt is completed", () => {
    const before = {
      ...DEFAULT_SETTINGS,
      philosopherLevels: { girard: "beginner" as const },
    };
    const after = {
      ...before,
      levelPromptVersions: completedLevelPromptVersions(before, "girard"),
    };

    expect(needsAnswerLevelChoice(after, "girard")).toBe(false);
  });

  it("keeps the existing first-visit behavior for other philosophers", () => {
    expect(needsAnswerLevelChoice(DEFAULT_SETTINGS, "nietzsche")).toBe(true);
    expect(
      needsAnswerLevelChoice(
        {
          ...DEFAULT_SETTINGS,
          philosopherLevels: { nietzsche: "advanced" },
        },
        "nietzsche",
      ),
    ).toBe(false);
  });
});
