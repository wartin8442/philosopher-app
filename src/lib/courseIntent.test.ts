import { describe, expect, it } from "vitest";
import { meansContinue, meansNoQuestions } from "./courseIntent";

describe("meansContinue", () => {
  it("accepts the plain ways of saying yes", () => {
    for (const reply of [
      "yes",
      "Yes.",
      "yeah",
      "yep",
      "sure",
      "ok",
      "Okay, continue",
      "yes, continue to the next section",
      "continue",
      "go on",
      "keep going",
      "carry on",
      "next section please",
      "move on",
      "I'm ready",
      "makes sense, continue",
      "got it",
    ]) {
      expect(meansContinue(reply), `"${reply}" should continue`).toBe(true);
    }
  });

  it("treats anything with a question in it as a question", () => {
    for (const reply of [
      "yes but what is the infinite?",
      "ok, can you explain the daydreamer again",
      "sure, though I don't understand the finite",
      "yes — say more about Hegel",
      "continue but repeat the last part",
      "what do you mean by relate",
      "I have a question",
      "wait",
    ]) {
      expect(meansContinue(reply), `"${reply}" should not continue`).toBe(false);
    }
  });

  it("does not read a long reply as bare consent", () => {
    expect(
      meansContinue(
        "yes I think I follow you so far and would like to hear the rest now",
      ),
    ).toBe(false);
  });

  it("ignores empty input", () => {
    expect(meansContinue("")).toBe(false);
    expect(meansContinue("   ")).toBe(false);
  });
});

describe("meansNoQuestions", () => {
  it("accepts the plain ways of declining to ask", () => {
    for (const reply of ["no", "No.", "nope", "no questions", "nothing", "all good", "that's all"]) {
      expect(meansNoQuestions(reply), `"${reply}" should decline`).toBe(true);
    }
  });

  it("keeps a negative that carries a question", () => {
    for (const reply of ["no, what about despair?", "nothing except why the loop"]) {
      expect(meansNoQuestions(reply), `"${reply}" should not decline`).toBe(false);
    }
  });
});
