import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
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
function conversationProps(id = "nietzsche") {
  const philosopher = getDemoPhilosopher(id)!;
  return {
    philosopher: toPhilosopherDisplay(philosopher),
    initialWork: null,
    contextualPrompt:
      id === "nietzsche"
        ? getContextualPrompt("peterson-nietzsche-death-of-god", "nietzsche")
        : null,
    starters: Object.fromEntries(
      ANSWER_LEVELS.map(({ id: level }) => [
        level,
        getConversationStarters(id, level),
      ]),
    ) as Record<AnswerLevel, string[]>,
  };
}

const settingsState = vi.hoisted(() => ({
  philosopherLevels: {
    nietzsche: "beginner",
  } as Record<string, AnswerLevel>,
  levelPromptVersions: {} as Record<string, number>,
}));

vi.mock("@/lib/settings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/settings")>();
  return {
    ...actual,
    useSettings: () => ({
      settings: {
        answerLevel: "beginner",
        philosopherLevels: settingsState.philosopherLevels,
        levelPromptVersions: settingsState.levelPromptVersions,
        voiceEnabled: false,
        showSources: false,
      },
      update: vi.fn(),
      loaded: true,
    }),
  };
});

/**
 * Hoisted so the mock factory below can close over it, and mutable so a test
 * can say he is mid-reply: the voice controls only exist while `speaking`,
 * and that belongs to the hook rather than to this component.
 */
const speech = vi.hoisted(() => ({
  speaking: false,
  stop: vi.fn(),
  hold: vi.fn(),
  release: vi.fn(),
  startSpeechStream: vi.fn(),
  analyserRef: { current: null },
}));

vi.mock("@/lib/useSpeech", () => ({
  useSpeech: () => speech,
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

beforeEach(() => {
  settingsState.philosopherLevels = { nietzsche: "beginner" };
  settingsState.levelPromptVersions = {};
  speech.speaking = false;
  speech.stop.mockClear();
  speech.hold.mockClear();
  speech.release.mockClear();
});

afterEach(cleanup);
afterAll(() => vi.unstubAllGlobals());

describe("first-visit level selection", () => {
  it("shows Girard's level picker when only a stale pre-release level exists", () => {
    settingsState.philosopherLevels = {
      nietzsche: "beginner",
      girard: "intermediate",
    };
    render(<Conversation {...conversationProps("girard")} />);

    expect(
      screen.getByRole("dialog", {
        name: "At what level should René Girard speak?",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Beginner/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Intermediate/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Advanced/ })).toBeTruthy();
  });
});

/** Press something and let the state updates it kicked off settle. */
async function click(element: Element) {
  await act(async () => {
    fireEvent.click(element);
  });
}

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

describe("the voice controls that appear while he is speaking", () => {
  it("pauses and resumes without abandoning the reply, and ends it separately", async () => {
    speech.speaking = true;
    render(<Conversation {...conversationProps()} />);

    const pause = screen.getByRole("button", { name: "Pause speaking" });
    // Drawn, not typed. This was a literal U+23F9 character, which phones
    // substitute their color emoji font for — so the control looked like it
    // came from a different app on the half of the traffic that is mobile.
    expect(pause.querySelector("svg")).not.toBeNull();
    expect(pause.textContent).toBe("");

    // A pause freezes the audio clock; it must not reach `stop`, which throws
    // the synthesized clips away and makes resuming impossible.
    await click(pause);
    expect(speech.hold).toHaveBeenCalledTimes(1);
    expect(speech.stop).not.toHaveBeenCalled();

    await click(screen.getByRole("button", { name: "Resume speaking" }));
    expect(speech.release).toHaveBeenCalledTimes(1);
    expect(speech.stop).not.toHaveBeenCalled();

    // The X beside it is the old behavior, kept intact.
    await click(screen.getByRole("button", { name: "Stop speaking" }));
    expect(speech.stop).toHaveBeenCalledTimes(1);
  });

  it("hides both controls when there is nothing being said", () => {
    render(<Conversation {...conversationProps()} />);

    expect(screen.queryByRole("button", { name: "Pause speaking" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Stop speaking" })).toBeNull();
  });
});
