import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPERIMENT_CONDITION,
  parseExperimentCondition,
  usesCorpusRetrieval,
  usesPromptHardening,
} from "./experiment-conditions";

describe("experiment conditions", () => {
  it("keeps A as the request default", () => {
    expect(DEFAULT_EXPERIMENT_CONDITION).toBe("A");
    expect(parseExperimentCondition(undefined)).toBe("A");
    expect(parseExperimentCondition(null)).toBe("A");
    expect(parseExperimentCondition("")).toBe("A");
  });

  it("assigns corpus retrieval only to B and prompt hardening only to C", () => {
    expect(usesCorpusRetrieval("A")).toBe(false);
    expect(usesCorpusRetrieval("B")).toBe(true);
    expect(usesCorpusRetrieval("C")).toBe(false);
    expect(usesPromptHardening("A")).toBe(false);
    expect(usesPromptHardening("B")).toBe(false);
    expect(usesPromptHardening("C")).toBe(true);
  });

  it("normalizes valid labels and rejects unknown conditions", () => {
    expect(parseExperimentCondition("b")).toBe("B");
    expect(parseExperimentCondition("c")).toBe("C");
    expect(() => parseExperimentCondition("D")).toThrow("condition must be A, B, or C");
  });
});
