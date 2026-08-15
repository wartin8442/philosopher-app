import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import Conversation from "./Conversation";
import { getContextualPrompt } from "@/lib/contextualPrompts";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";
import { getConversationStarters } from "@/lib/starters";
import { ANSWER_LEVELS, type AnswerLevel } from "@/lib/types";

vi.mock("@/components/VoiceVisualizer", () => ({
  default: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// The route's server component resolves these and passes them down; build them
// from the same real data here so the test still exercises actual content
// rather than a fixture that can drift from it.
function conversationProps() {
  const philosopher = getDemoPhilosopher("nietzsche")!;
  return {
    philosopher: toPhilosopherDisplay(philosopher),
    initialWork: null,
    contextualPrompt: getContextualPrompt(
      "peterson-nietzsche-death-of-god",
      "nietzsche",
    ),
    starters: Object.fromEntries(
      ANSWER_LEVELS.map(({ id: level }) => [
        level,
        getConversationStarters("nietzsche", level),
      ]),
    ) as Record<AnswerLevel, string[]>,
  };
}

vi.mock("@/lib/settings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/settings")>();
  return {
    ...actual,
    useSettings: () => ({
      settings: {
        answerLevel: "beginner",
        philosopherLevels: { nietzsche: "beginner" },
        voiceEnabled: false,
        showSources: false,
      },
      update: vi.fn(),
      loaded: true,
    }),
  };
});

vi.mock("@/lib/useSpeech", () => ({
  useSpeech: () => ({
    stop: vi.fn(),
    speaking: false,
    startSpeechStream: vi.fn(),
    analyserRef: { current: null },
  }),
}));

vi.mock("@/lib/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    listening: false,
    preparing: false,
    interim: "",
    supported: false,
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  }),
}));

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(cleanup);
afterAll(() => vi.unstubAllGlobals());

describe("contextual conversation layout", () => {
  it("keeps the contextual prompt, level starters, and composer in the expanded chat panel", () => {
    render(<Conversation {...conversationProps()} />);

    const panel = document.querySelector<HTMLElement>("[data-chat-panel]");
    const contextualPrompt = screen.getByRole("button", {
      name: /What did you mean by ‘God is dead,’/i,
    });
    const levelStarter = screen.getByRole("button", {
      name: "Explain your philosophy.",
    });
    const composer = screen.getByPlaceholderText("Type a question…");

    expect(panel).not.toBeNull();
    const sizing = panel?.firstElementChild?.className ?? "";
    // A share of the window, with a floor under it so the whole first turn
    // fits…
    expect(sizing).toContain("h-[38dvh]");
    expect(sizing).toContain("min-h-[min(296px,");
    // …and both bounds yielding on a short window, so the panel can never
    // squeeze the stage into the header. See the comment beside them.
    expect(sizing).toContain("min-h-[min(296px,calc(100dvh_-_400px))]");
    expect(sizing).toContain("max-h-[min(430px,calc(100dvh_-_400px))]");
    expect(panel?.contains(contextualPrompt)).toBe(true);
    expect(panel?.contains(levelStarter)).toBe(true);
    expect(panel?.contains(composer)).toBe(true);
  });
});
