import { describe, expect, it } from "vitest";
import { PHILOSOPHERS } from "./philosophers";
import {
  allPairKeys,
  CONVERSATION_STARTERS,
  getDuelTopics,
  hasCuratedTopics,
} from "./starters";

describe("conversation starters", () => {
  it("gives every philosopher exactly three non-empty starters", () => {
    for (const p of PHILOSOPHERS) {
      const starters = CONVERSATION_STARTERS[p.id];
      expect(starters, `missing starters for ${p.id}`).toBeDefined();
      expect(starters).toHaveLength(3);
      for (const s of starters) expect(s.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("duel topics", () => {
  it("covers every philosopher pair with curated topics", () => {
    for (const key of allPairKeys()) {
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
