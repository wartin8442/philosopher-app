import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Duel from "./Duel";
import { DEMO_PHILOSOPHERS } from "@/lib/philosophers";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";
import { getDuelTopics } from "@/lib/starters";

/**
 * The `/duel?a=…&b=…` entry point, which the diagnostic's results screen uses
 * to hand over a proposed matchup.
 *
 * The contract worth pinning is that the question shown on the results card
 * and the question the debate box opens with are the *same* string. Both call
 * `getDuelTopics(a, b)[0]`, so they cannot drift — this asserts that they
 * actually do.
 */

const PHILOSOPHERS = DEMO_PHILOSOPHERS.map(toPhilosopherDisplay);

afterEach(cleanup);

function topicField() {
  return screen.getByPlaceholderText(/Does morality require God/) as HTMLInputElement;
}

describe("arriving from a proposed matchup", () => {
  it("opens on the proposed pair", () => {
    render(
      <Duel
        philosophers={PHILOSOPHERS}
        initialPair={{ aId: "aquinas", bId: "camus" }}
      />,
    );
    expect(screen.getByText(/Where Thomas Aquinas and Albert Camus collide/)).toBeTruthy();
  });

  it("pre-loads the proposed question into the debate box", () => {
    render(
      <Duel
        philosophers={PHILOSOPHERS}
        initialPair={{ aId: "aquinas", bId: "camus" }}
      />,
    );
    expect(topicField().value).toBe(getDuelTopics("aquinas", "camus")[0]);
    expect(topicField().value.length).toBeGreaterThan(0);
  });

  it("leaves the box empty when no pair was proposed", () => {
    render(<Duel philosophers={PHILOSOPHERS} />);
    expect(topicField().value).toBe("");
  });

  /**
   * The question is re-derived from the two ids rather than carried in the
   * URL, so there is no way to push an arbitrary string into a field that
   * reaches the model by hand-editing a link. This asserts the prefill only
   * ever comes from the curated table.
   */
  it("only ever pre-loads a curated question", () => {
    for (const [aId, bId] of [
      ["aquinas", "nietzsche"],
      ["kierkegaard", "hume"],
      ["plato", "wittgenstein"],
    ]) {
      cleanup();
      render(<Duel philosophers={PHILOSOPHERS} initialPair={{ aId, bId }} />);
      expect(getDuelTopics(aId, bId)).toContain(topicField().value);
    }
  });
});
