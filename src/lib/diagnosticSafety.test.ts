import { describe, expect, it } from "vitest";
import { checkForDistress, disposeFreeText } from "./diagnosticSafety";

/**
 * The first suite is the important one. Every string in it is a plausible,
 * healthy answer to a question the diagnostic actually asks — several are
 * near-quotations of the philosophers on the shelf. A matcher that fires on
 * these is worse than no matcher, because it would train users to stop writing
 * about the subject the product exists to discuss.
 *
 * Source questions are noted so a future edit can tell how real these are.
 */
describe("the Camus set — correct philosophical answers must not flag", () => {
  const philosophical = [
    // Suffering Q1: "what helped, if anything?"
    "I thought about death constantly after my father died, and it changed what I take seriously.",
    "Nothing anyone said was true, and I stopped expecting it to be.",
    // Suffering Q3: "every so often it really hits you that you are going to die"
    "I've wondered whether life is worth living, and decided it is.",
    "It's just true. I don't reach for anything comforting.",
    "I zoom out. My ending is as natural as my beginning.",
    // What's real / how do we know
    "Sometimes it all feels pointless, and I think that's the honest starting point.",
    "The absurd is the only real question, as Camus put it.",
    "Camus says suicide is the one serious philosophical problem.",
    "Life is meaningless in the sense that no meaning was handed to us.",
    // Worth living Q2: the twenty-year plateau
    "Twenty more years like this would kill me, honestly.",
    // Suffering Q2 is third person by design.
    "He wanted to die at the end, and I finally understood why.",
    "She couldn't go on and nobody around her noticed.",
    // Ordinary hyperbole, past tense.
    "I wanted to die of embarrassment.",
  ];

  for (const text of philosophical) {
    it(`does not flag: ${text.slice(0, 48)}…`, () => {
      expect(checkForDistress(text).flagged).toBe(false);
    });
  }
});

describe("the intent set — present-tense disclosures must flag", () => {
  const cases: Array<[string, string]> = [
    ["I want to die", "intent"],
    ["i dont want to be here anymore", "intent"],
    ["I've been thinking about killing myself", "intent"],
    ["I'm going to end it", "intent"],
    ["Everyone would be better off without me", "intent"],
    ["I'm suicidal and I don't know who to tell", "intent"],
    ["I can't go on", "inability"],
    ["I can't do this anymore", "inability"],
    ["There's no reason to go on", "inability"],
    ["I have nothing left to live for", "inability"],
    ["I've been cutting myself again", "harm"],
    ["I'm not safe at home", "harm"],
    ["my husband hits me", "harm"],
  ];

  for (const [text, category] of cases) {
    it(`flags as ${category}: ${text}`, () => {
      const result = checkForDistress(text);
      expect(result.flagged).toBe(true);
      expect(result.category).toBe(category);
    });
  }
});

describe("normalization", () => {
  it("matches through typographic apostrophes", () => {
    // Phones substitute these automatically.
    expect(checkForDistress("I can’t go on").flagged).toBe(true);
  });

  it("matches through line breaks inside a phrase", () => {
    expect(checkForDistress("i want\nto die").flagged).toBe(true);
  });

  it("ignores case", () => {
    expect(checkForDistress("I WANT TO DIE").flagged).toBe(true);
  });

  it("treats empty and whitespace-only text as unflagged", () => {
    expect(checkForDistress("").flagged).toBe(false);
    expect(checkForDistress("   ").flagged).toBe(false);
    expect(checkForDistress(undefined).flagged).toBe(false);
    expect(checkForDistress(null).flagged).toBe(false);
  });
});

/**
 * The propagation contract. These assertions are the reason disposeFreeText
 * exists as a function rather than as prose in a design doc: the routing code,
 * the classifier call, and the results screen all have to agree, and this is
 * where that agreement is enforced.
 */
describe("free-text disposition", () => {
  it("lets ordinary text through to the model and the conversation seed", () => {
    const d = disposeFreeText("I'd stopped needing something to happen.");
    expect(d.sendToModel).toBe(true);
    expect(d.seedConversation).toBe(true);
    expect(d.showNotice).toBe(false);
    expect(d.analytics).toEqual({ hadText: true, flagged: false });
  });

  it("stops flagged text reaching the model", () => {
    expect(disposeFreeText("I want to die").sendToModel).toBe(false);
  });

  it("never seeds a persona conversation with flagged text", () => {
    // The sharpest hazard in the feature: personas are hardened never to break
    // character, so a seeded disclosure would be answered in voice.
    expect(disposeFreeText("I want to die").seedConversation).toBe(false);
  });

  it("shows the notice only when flagged", () => {
    expect(disposeFreeText("I want to die").showNotice).toBe(true);
    expect(disposeFreeText("Friends, mostly.").showNotice).toBe(false);
  });

  it("records that text existed and whether it flagged, but never the text", () => {
    const d = disposeFreeText("I can't go on");
    expect(d.analytics).toEqual({
      hadText: true,
      flagged: true,
      category: "inability",
    });
    // Guard against a future edit quietly adding the prose back in.
    expect(JSON.stringify(d.analytics)).not.toContain("go on");
  });

  it("treats an empty box as no text at all", () => {
    const d = disposeFreeText("   ");
    expect(d.sendToModel).toBe(false);
    expect(d.seedConversation).toBe(false);
    expect(d.analytics.hadText).toBe(false);
  });
});
