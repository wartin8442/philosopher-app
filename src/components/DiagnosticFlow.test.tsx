import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DiagnosticFlow, { type ShelfGroups } from "@/components/DiagnosticFlow";
import { BRANCHES, TOPIC_LABELS } from "@/lib/diagnostic";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";
import { shelfFor } from "@/lib/routing";
import { getDuelTopics } from "@/lib/starters";
import { DIAGNOSTIC_TOPICS } from "@/lib/types";

/**
 * Drives the six screens end to end, the way a user does.
 *
 * The unit tests around this one prove the tally, the fill, and the safety
 * propagation in isolation. What none of them can catch is the flow simply
 * failing to render — a screen that throws, a Next button that never enables,
 * a results screen that shows four cards instead of eight. This file clicks.
 */

/** Exactly what app/start/page.tsx builds, so the prop under test is the real one. */
const GROUPS = Object.fromEntries(
  DIAGNOSTIC_TOPICS.map((topic) => [
    topic,
    {
      negative: shelfFor(topic, "negative").map((p) => ({
        ...toPhilosopherDisplay(p),
        blurb: p.blurb,
      })),
      positive: shelfFor(topic, "positive").map((p) => ({
        ...toPhilosopherDisplay(p),
        blurb: p.blurb,
      })),
    },
  ]),
) as ShelfGroups;

afterEach(cleanup);

/**
 * Render and get past the intro. Every test below starts here, because the
 * intro is what a visitor arriving from the landing page actually sees first.
 */
function openQuiz() {
  render(<DiagnosticFlow groups={GROUPS} />);
  fireEvent.click(screen.getByRole("button", { name: /Take the Quiz/ }));
}

function clickText(text: string | RegExp) {
  fireEvent.click(screen.getByText(text));
}

/**
 * The ids on the results screen, read off the card links in render order.
 * Ids rather than names because the cards show full names ("Thomas Aquinas"),
 * and because the id is what the rest of the app routes on.
 */
function shelfIds(): string[] {
  return screen
    .getAllByRole("link")
    .map((a) => a.getAttribute("href") ?? "")
    .filter((href) => href.startsWith("/philosopher/"))
    .map((href) => href.replace("/philosopher/", ""));
}

// jest-dom is not installed in this repo, so `disabled` is read off the
// element rather than asserted with `toBeDisabled`.
function nextButton(label: string | RegExp = /^Next$/) {
  return screen.getByRole("button", { name: label }) as HTMLButtonElement;
}

function clickNext(label: string | RegExp = /^Next$/) {
  const button = nextButton(label);
  expect(button.disabled, `"${label}" is disabled`).toBe(false);
  fireEvent.click(button);
}

/** Pick option `letter` on the branch question currently on screen. */
function pickOption(topic: keyof typeof BRANCHES, question: number, letter: string) {
  const option = BRANCHES[topic].questions[question].options["abcd".indexOf(letter)];
  clickText(option.text);
  return option;
}

describe("the six screens", () => {
  it("opens on the intro, not on a question", () => {
    render(<DiagnosticFlow groups={GROUPS} />);

    expect(screen.getByText(/It costs nothing to complete/)).toBeTruthy();
    // No step counter yet — nothing has been committed to.
    expect(screen.queryByText(/^Step \d+ of \d+$/)).toBeNull();
    // And no topic list until the visitor opts in (D11, offered not forced).
    expect(screen.queryByText(TOPIC_LABELS.sufficiency)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Take the Quiz/ }));

    expect(screen.getByText("Step 1 of 6")).toBeTruthy();
    expect(screen.getByText(TOPIC_LABELS.sufficiency)).toBeTruthy();
  });

  it("states the question count the flow actually asks", () => {
    render(<DiagnosticFlow groups={GROUPS} />);
    // The longest branch is topic + 3 questions + 2 universal = 6. The intro
    // must not undersell that; see the drop-off note on IntroScreen.
    expect(screen.getByText(/six-question quiz/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Take the Quiz/ }));
    clickText(TOPIC_LABELS.sufficiency);
    expect(screen.getByText("Step 2 of 6")).toBeTruthy();
  });

  it("returns to the intro when the user starts again", () => {
    openQuiz();
    clickText(TOPIC_LABELS.selfhood);
    pickOption("selfhood", 0, "a");
    clickNext();
    pickOption("selfhood", 1, "a");
    clickNext(/Nearly there/);
    clickText(/A story or image that sticks with me/);
    clickNext();
    clickText(/Something specific is on my mind/);
    clickNext(/Show me/);

    fireEvent.click(screen.getByRole("button", { name: /Start again/ }));

    expect(screen.getByText(/It costs nothing to complete/)).toBeTruthy();
    expect(screen.queryByText(/Eight philosophers we think/)).toBeNull();
  });

  it("walks a three-question branch from topic to shelf", () => {
    openQuiz();

    // 1 — topic.
    expect(screen.getByText("Step 1 of 6")).toBeTruthy();
    clickText(TOPIC_LABELS.transcendence);

    // 2–4 — the branch. "acb" is a clean sweep onto the divine-order pole.
    "acb".split("").forEach((letter, question) => {
      expect(screen.getByText(`Step ${question + 2} of 6`)).toBeTruthy();
      expect(
        screen.getByText(BRANCHES.transcendence.questions[question].prompt),
      ).toBeTruthy();
      pickOption("transcendence", question, letter);
      clickNext(question === 2 ? /Nearly there/ : /^Next$/);
    });

    // 5 — what persuades you.
    expect(screen.getByText("Step 5 of 6")).toBeTruthy();
    clickText(/A tight argument where each step follows/);
    clickNext();

    // 6 — intent.
    expect(screen.getByText("Step 6 of 6")).toBeTruthy();
    clickText(/I want to understand what these people actually said/);
    clickNext(/Show me/);

    // Results: eight cards, four and four, both headers, in home-first order.
    expect(screen.getByText(/Eight philosophers we think/)).toBeTruthy();
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "Start with these",
      "Try a different angle",
      "Or watch them argue",
    ]);

    // Four and four, home group first, in the order the fill produced.
    expect(shelfIds()).toEqual([
      "aquinas",
      "kierkegaard",
      "augustine",
      "descartes",
      "nietzsche",
      "camus",
      "sartre",
      "hume",
    ]);
  });

  it("runs selfhood's two-question branch in five screens", () => {
    openQuiz();

    clickText(TOPIC_LABELS.selfhood);
    expect(screen.getByText("Step 2 of 5")).toBeTruthy();

    // "ab" ties 1-1; Q1 is authoritative, so this lands on *core*.
    pickOption("selfhood", 0, "a");
    clickNext();
    pickOption("selfhood", 1, "b");
    clickNext(/Nearly there/);

    clickText(/A story or image that sticks with me/);
    clickNext();
    clickText(/Something specific is on my mind/);
    clickNext(/Show me/);

    // The authored display order for `selfhood · core` puts Descartes first.
    expect(shelfIds().slice(0, 4)).toEqual([
      "descartes",
      "augustine",
      "kierkegaard",
      "plato",
    ]);
  });

  it("leads with the challenge group when the user asks to be pushed on", () => {
    openQuiz();

    clickText(TOPIC_LABELS.transcendence);
    "acb".split("").forEach((letter, question) => {
      pickOption("transcendence", question, letter);
      clickNext(question === 2 ? /Nearly there/ : /^Next$/);
    });
    clickText(/A tight argument where each step follows/);
    clickNext();
    clickText(/I want my own thinking pushed on/);
    clickNext(/Show me/);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "Try a different angle",
      "Start with these",
      "Or watch them argue",
    ]);
    // Membership is untouched by the emphasis flip: the same eight people,
    // with the challenge group simply read first.
    expect(shelfIds()).toEqual([
      "nietzsche",
      "camus",
      "sartre",
      "hume",
      "aquinas",
      "kierkegaard",
      "augustine",
      "descartes",
    ]);
  });

  /**
   * The option click is the whole of a branch question's input (D13).
   *
   * The free-text box this flow used to offer is gone, and with it the
   * flow-level crisis-notice test that drove it. The safety layer itself is
   * still built and still covered — `diagnosticSafety.test.ts` and
   * `SafetyNotice.test.tsx` — so this assertion is what pins the box actually
   * being absent from the screen rather than merely unused.
   */
  it("takes an option click and nothing else", () => {
    openQuiz();
    clickText(TOPIC_LABELS.depth);

    expect(nextButton().disabled).toBe(true);
    expect(screen.queryByPlaceholderText("In your own words…")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();

    pickOption("depth", 0, "c");
    expect(nextButton().disabled).toBe(false);
  });

  it("proposes only cross-group duels, and links each to its pairing", () => {
    openQuiz();

    clickText(TOPIC_LABELS.transcendence);
    "acb".split("").forEach((letter, question) => {
      pickOption("transcendence", question, letter);
      clickNext(question === 2 ? /Nearly there/ : /^Next$/);
    });
    clickText(/A tight argument where each step follows/);
    clickNext();
    clickText(/I want to understand what these people actually said/);
    clickNext(/Show me/);

    const duelLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("/duel?"));
    expect(duelLinks.length).toBeGreaterThanOrEqual(2);
    expect(duelLinks.length).toBeLessThanOrEqual(3);

    const home = new Set(GROUPS.transcendence.positive.map((p) => p.id));
    const challenge = new Set(GROUPS.transcendence.negative.map((p) => p.id));
    const seen = new Set<string>();

    for (const link of duelLinks) {
      const params = new URLSearchParams(link.getAttribute("href")!.split("?")[1]);
      const a = params.get("a")!;
      const b = params.get("b")!;
      expect(home.has(a), `${a} is not in the home group`).toBe(true);
      expect(challenge.has(b), `${b} is not in the challenge group`).toBe(true);
      // Each philosopher appears in at most one duel, so three duels show six
      // faces rather than the same lead three times.
      expect(seen.has(a)).toBe(false);
      expect(seen.has(b)).toBe(false);
      seen.add(a);
      seen.add(b);
      // The question on the card is exactly what `/duel` will pre-load into
      // the debate box — both sides call `getDuelTopics(a, b)[0]`, and this is
      // the assertion that stops them drifting apart. See Duel.test.tsx.
      expect(within(link).getByText(getDuelTopics(a, b)[0])).toBeTruthy();
    }
  });

  it("goes back without losing an answer, and starts over cleanly", () => {
    openQuiz();

    clickText(TOPIC_LABELS.agency);
    const chosen = pickOption("agency", 0, "c");
    clickNext();
    expect(screen.getByText("Step 3 of 6")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByText("Step 2 of 6")).toBeTruthy();
    expect(screen.getByText(chosen.text).getAttribute("aria-pressed")).toBe("true");
  });
});
