import { describe, expect, it } from "vitest";
import { getContextualPrompt } from "./contextualPrompts";
import { getPhilosopher, PHILOSOPHERS } from "./philosophers";
import { WHY_PHILOSOPHY_PEOPLE } from "./whyPhilosophy";

describe("why-philosophy handoffs", () => {
  it("defines a valid, unique YouTube excerpt for every person", () => {
    const videoIds = WHY_PHILOSOPHY_PEOPLE.map(
      (person) => person.videoClip.youtubeId,
    );

    expect(new Set(videoIds).size).toBe(videoIds.length);
    for (const person of WHY_PHILOSOPHY_PEOPLE) {
      expect(person.videoClip.label.length).toBeGreaterThan(0);
      expect(person.videoClip.startSeconds).toBeGreaterThanOrEqual(0);
      expect(person.videoClip.endSeconds).toBeGreaterThan(
        person.videoClip.startSeconds,
      );
    }
  });

  it("resolves every inline reference to a philosopher and contextual prompt", () => {
    for (const person of WHY_PHILOSOPHY_PEOPLE) {
      const prose = [person.summary, ...person.story].join(" ");
      for (const reference of person.references) {
        expect(getPhilosopher(reference.philosopherId)).toBeDefined();
        expect(
          getContextualPrompt(reference.promptId, reference.philosopherId),
        ).not.toBeNull();
        expect(
          reference.labels.some((label) => prose.includes(label)),
        ).toBe(true);
      }
    }
  });

  it("resolves every connection card to a philosopher and contextual prompt", () => {
    for (const person of WHY_PHILOSOPHY_PEOPLE) {
      for (const connection of person.connections) {
        expect(getPhilosopher(connection.philosopherId)).toBeDefined();
        expect(
          getContextualPrompt(connection.promptId, connection.philosopherId),
        ).not.toBeNull();
      }
    }
  });

  it("releases Girard into the main Explore roster", () => {
    expect(getPhilosopher("girard")?.name).toBe("René Girard");
    expect(PHILOSOPHERS.some((philosopher) => philosopher.id === "girard")).toBe(
      true,
    );
    expect(PHILOSOPHERS.some((philosopher) => philosopher.id === "james")).toBe(
      false,
    );
  });
});
