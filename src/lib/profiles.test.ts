import { describe, expect, it } from "vitest";
import { PHILOSOPHERS } from "./philosophers";
import { getProfile, getWorkBySlug, PROFILES, workSlug } from "./profiles";

describe("profile roster", () => {
  it("gives every philosopher exactly one matching profile", () => {
    expect(PROFILES.map((profile) => profile.id)).toEqual(
      PHILOSOPHERS.map((philosopher) => philosopher.id),
    );
  });

  it("includes Girard's complete released profile", () => {
    expect(getProfile("girard")?.shortName).toBe("Girard");
    expect(PROFILES.some((profile) => profile.id === "girard")).toBe(true);
    expect(getProfile("james")).toBeUndefined();
  });
});

describe("workSlug", () => {
  it("slugifies simple titles", () => {
    expect(workSlug("Thus Spoke Zarathustra")).toBe("thus-spoke-zarathustra");
  });

  it("collapses punctuation runs to single hyphens", () => {
    expect(workSlug("Either/Or")).toBe("either-or");
    expect(workSlug("Summa contra Gentiles")).toBe("summa-contra-gentiles");
    expect(workSlug("No Exit and Three Other Plays")).toBe(
      "no-exit-and-three-other-plays",
    );
  });

  it("produces a unique, non-empty slug for every work of every philosopher", () => {
    for (const profile of PROFILES) {
      const slugs = profile.works.map((w) => workSlug(w.title));
      expect(slugs.every((s) => s.length > 0)).toBe(true);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("getWorkBySlug", () => {
  it("resolves a work by philosopher id and slug", () => {
    const work = getWorkBySlug("nietzsche", "beyond-good-and-evil");
    expect(work?.title).toBe("Beyond Good and Evil");
  });

  it("returns undefined for a slug belonging to another philosopher", () => {
    expect(getWorkBySlug("camus", "beyond-good-and-evil")).toBeUndefined();
  });

  it("returns undefined for unknown philosophers and slugs", () => {
    expect(getWorkBySlug("nietzsche", "the-stranger-things")).toBeUndefined();
    expect(getWorkBySlug("zeno-of-citium", "republic")).toBeUndefined();
  });

  it("round-trips every work through its own slug", () => {
    for (const profile of PROFILES) {
      for (const work of profile.works) {
        expect(getWorkBySlug(profile.id, workSlug(work.title))).toBe(work);
      }
    }
  });
});
