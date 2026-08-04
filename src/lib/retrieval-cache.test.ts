import { beforeEach, describe, expect, it } from "vitest";
import {
  clearRetrievalCache,
  getCachedByText,
  getCachedByVector,
  putCached,
} from "./retrieval-cache";
import type { RetrievedSource } from "./retrieval";

const result: RetrievedSource = {
  id: "source:camus:1",
  type: "curated_excerpt",
  philosopher: "camus",
  label: "Fixture",
  text: "Fixture text",
  score: 0.9,
};

beforeEach(() => clearRetrievalCache());

describe("condition-scoped retrieval cache", () => {
  it("does not share exact-text results across conditions or philosophers", () => {
    putCached("camus", "What is the absurd?", [1, 0], [result], "A");

    expect(getCachedByText("camus", "what is the absurd", "A")).toEqual([result]);
    expect(getCachedByText("camus", "what is the absurd", "B")).toBeNull();
    expect(getCachedByText("camus", "what is the absurd", "C")).toBeNull();
    expect(getCachedByText("nietzsche", "what is the absurd", "A")).toBeNull();
  });

  it("does not share semantic-vector results across conditions", () => {
    putCached("camus", "interim transcript", [1, 0], [result], "B");

    expect(getCachedByVector("camus", [1, 0], "B")).toEqual([result]);
    expect(getCachedByVector("camus", [1, 0], "A")).toBeNull();
    expect(getCachedByVector("camus", [1, 0], "C")).toBeNull();
  });
});
