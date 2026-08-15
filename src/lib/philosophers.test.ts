import { describe, expect, it } from "vitest";
import {
  DEMO_PHILOSOPHERS,
  DEMO_ROSTER_IDS,
  getDemoPhilosopher,
  getPhilosopher,
  PHILOSOPHERS,
} from "./philosophers";
import { getProfile } from "./profiles";

describe("demo roster", () => {
  it("serves every written persona, in declaration order", () => {
    // The five founding philosophers still lead the roster; the expansion
    // eighteen follow in the order they are declared in philosophers.ts.
    expect(DEMO_PHILOSOPHERS.map((p) => p.id)).toEqual(
      PHILOSOPHERS.map((p) => p.id),
    );
    expect(DEMO_PHILOSOPHERS.slice(0, 5).map((p) => p.id)).toEqual([
      "aquinas",
      "nietzsche",
      "kierkegaard",
      "sartre",
      "camus",
    ]);
    expect(DEMO_PHILOSOPHERS).toHaveLength(23);
  });

  it("resolves an expansion philosopher through both lookups", () => {
    expect(getPhilosopher("aristotle")).toBeDefined();
    expect(getDemoPhilosopher("aristotle")).toBeDefined();
  });

  it("keeps Girard out of the demo until his story link is restored", () => {
    expect(getPhilosopher("girard")).toBeDefined();
    expect(getDemoPhilosopher("girard")).toBeUndefined();
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
