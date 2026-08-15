import { describe, expect, it } from "vitest";
import { PHILOSOPHERS } from "./philosophers";
import {
  allPairKeys,
  CONVERSATION_STARTERS,
  getConversationStarters,
  getDuelTopics,
  hasCuratedTopics,
  STARTER_LEVELS,
} from "./starters";

describe("conversation starters", () => {
  it("gives every philosopher exactly three non-empty starters per level", () => {
    for (const p of PHILOSOPHERS) {
      const byLevel = CONVERSATION_STARTERS[p.id];
      expect(byLevel, `missing starters for ${p.id}`).toBeDefined();
      for (const level of STARTER_LEVELS) {
        const starters = byLevel[level];
        expect(starters, `missing ${level} starters for ${p.id}`).toBeDefined();
        expect(starters).toHaveLength(3);
        for (const s of starters) expect(s.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("opens every beginner set with the philosophy overview the UI highlights", () => {
    for (const p of PHILOSOPHERS) {
      expect(CONVERSATION_STARTERS[p.id].beginner[0]).toBe(
        "Explain your philosophy.",
      );
    }
  });

  it("serves advanced starters to the primary-text level", () => {
    for (const p of PHILOSOPHERS) {
      expect(getConversationStarters(p.id, "primary-text")).toEqual(
        CONVERSATION_STARTERS[p.id].advanced,
      );
    }
  });

  it("returns no starters for an unknown philosopher", () => {
    expect(getConversationStarters("not-a-philosopher", "beginner")).toEqual(
      [],
    );
  });
});

describe("duel topics", () => {
  it("covers every philosopher pair with curated topics", () => {
    for (const key of allPairKeys(PHILOSOPHERS.map((p) => p.id))) {
      expect(hasCuratedTopics(key), `missing duel topics for ${key}`).toBe(
        true,
      );
    }
  });

  it("returns exactly three non-empty topics regardless of argument order", () => {
    for (let i = 0; i < PHILOSOPHERS.length; i++) {
      for (let j = i + 1; j < PHILOSOPHERS.length; j++) {
        const aId = PHILOSOPHERS[i].id;
        const bId = PHILOSOPHERS[j].id;
        const topics = getDuelTopics(aId, bId);
        expect(topics).toHaveLength(3);
        expect(getDuelTopics(bId, aId)).toEqual(topics);
        for (const t of topics) expect(t.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to generic topics for an unknown pairing", () => {
    const topics = getDuelTopics("aquinas", "not-a-philosopher");
    expect(topics).toHaveLength(3);
  });
});
