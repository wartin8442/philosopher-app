import { describe, expect, it } from "vitest";
import {
  DEMO_PHILOSOPHERS,
  DEMO_ROSTER_IDS,
  getDemoPhilosopher,
  getPhilosopher,
  PHILOSOPHERS,
} from "./philosophers";
import { WRITTEN_PHILOSOPHER_IDS } from "./demoRoster";
import { getProfile } from "./profiles";

describe("demo roster", () => {
  it("serves only the three existentialists, in declaration order", () => {
    expect(DEMO_PHILOSOPHERS.map((p) => p.id)).toEqual([
      "kierkegaard",
      "sartre",
      "camus",
    ]);
  });

  it("keeps all twenty-three written personas, released or held back", () => {
    // Narrowing the roster hides philosophers; it must never delete them.
    expect(PHILOSOPHERS.map((p) => p.id)).toEqual([
      "aquinas",
      "nietzsche",
      "kierkegaard",
      "sartre",
      "camus",
      "hume",
      "plato",
      "aristotle",
      "epicurus",
      "marcus-aurelius",
      "augustine",
      "spinoza",
      "girard",
      "beauvoir",
      "foucault",
      "descartes",
      "locke",
      "kant",
      "hegel",
      "mill",
      "marx",
      "heidegger",
      "wittgenstein",
    ]);
    expect(WRITTEN_PHILOSOPHER_IDS).toEqual(PHILOSOPHERS.map((p) => p.id));
    for (const p of PHILOSOPHERS) {
      expect(getProfile(p.id)?.heroImage, p.id).toBeTruthy();
    }
  });

  it("holds back a written philosopher from the demo lookup only", () => {
    expect(getPhilosopher("aristotle")).toBeDefined();
    expect(getDemoPhilosopher("aristotle")).toBeUndefined();
  });

  it("replaces William James with Girard among the written personas", () => {
    expect(getPhilosopher("girard")).toBeDefined();
    expect(getPhilosopher("james")).toBeUndefined();
    expect(DEMO_ROSTER_IDS).not.toContain("james");
  });

  it("gives every released philosopher a profile, a hero image, and a card blurb", () => {
    for (const id of DEMO_ROSTER_IDS) {
      const philosopher = getDemoPhilosopher(id);
      expect(philosopher, id).toBeDefined();

      const profile = getProfile(id);
      expect(profile?.heroImage, id).toMatch(/^\/philosophers\/heroes\/.+\.webp$/);
      expect(profile?.intro.length, id).toBeGreaterThan(0);

      // The card blurb is a single sentence or two; the long-form description
      // belongs to the profile page intro, not the carousel card.
      expect(philosopher!.blurb.length, id).toBeLessThan(400);
      expect(philosopher!.blurb, id).not.toContain("\n");
    }
  });

  it("returns undefined for an unknown id from both lookups", () => {
    expect(getPhilosopher("zeno-of-citium")).toBeUndefined();
    expect(getDemoPhilosopher("zeno-of-citium")).toBeUndefined();
  });
});
