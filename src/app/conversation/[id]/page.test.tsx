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
  // Mutable because muting changes the whole layout, not just one button.
  voiceEnabled: true,
  showSources: false,
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
        voiceEnabled: settingsState.voiceEnabled,
        showSources: settingsState.showSources,
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
  settingsState.voiceEnabled = true;
  settingsState.showSources = false;
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
  it("keeps the contextual prompt, level starters, and composer in the bar under the stage", () => {
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
    expect(panel?.contains(contextualPrompt)).toBe(true);
    expect(panel?.contains(levelStarter)).toBe(true);
    expect(panel?.contains(composer)).toBe(true);
  });
});

describe("the voiced layout, as in the course lesson", () => {
  it("keeps the composer on a shelf that opens from the control bar", async () => {
    render(<Conversation {...conversationProps()} />);

    const toggle = screen.getByRole("button", { name: "Type a question" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await click(toggle);
    expect(
      screen
        .getByRole("button", { name: "Hide the question box" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });
});

describe("show sources", () => {
  it("gives each citation a grey chevron that opens the excerpt", async () => {
    settingsState.showSources = true;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/sources") {
        return new Response(
          JSON.stringify({
            sources: [
              { id: "s1", kind: "curated_excerpt", label: "The Gay Science §125", text: "God is dead.", status: "curated" },
            ],
          }),
        );
      }
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ type: "text", text: "We have killed him." }) +
                "\n" +
                JSON.stringify({ type: "done" }) +
                "\n",
            ),
          );
          controller.close();
        },
      });
      return new Response(body);
    });
    vi.stubGlobal("fetch", fetchMock);
    settingsState.voiceEnabled = false;
    render(<Conversation {...conversationProps()} />);

    await click(screen.getByRole("button", { name: "Explain your philosophy." }));
    const label = await screen.findByText("The Gay Science §125");
    const summary = label.closest("summary");
    expect(summary).not.toBeNull();
    // The browser's own marker is hidden in favor of a drawn chevron on the
    // right, which turns over when the citation is open.
    expect(summary?.className).toContain("list-none");
    const chevron = summary?.querySelector("svg");
    expect(chevron?.getAttribute("class")).toContain("group-open:rotate-180");
    expect(summary?.lastElementChild).toBe(chevron);
  });
});

describe("the muted (text-only) layout", () => {
  it("gives the chat panel the whole page and drops the fixed height budget", () => {
    settingsState.voiceEnabled = false;
    render(<Conversation {...conversationProps()} />);

    const panel = document.querySelector<HTMLElement>("[data-chat-panel]");
    expect(panel?.className).toContain("flex-1");
    const sizing = panel?.firstElementChild?.className ?? "";
    expect(sizing).not.toContain("h-[38dvh]");
    expect(screen.getByText("Voice off · replies in text")).toBeTruthy();
  });

  it("moves the unmute control into the composer row", () => {
    settingsState.voiceEnabled = false;
    render(<Conversation {...conversationProps()} />);

    const composer = screen.getByPlaceholderText("Type a question…");
    const unmute = screen.getByRole("button", { name: "Unmute voice" });
    // One control, not two: the stage's copy goes with the stage.
    expect(screen.getAllByRole("button", { name: "Unmute voice" })).toHaveLength(1);
    expect(composer.closest("form")?.contains(unmute)).toBe(true);
  });

  it("keeps the mute control on the stage, not in the composer, while voiced", () => {
    render(<Conversation {...conversationProps()} />);

    const composer = screen.getByPlaceholderText("Type a question…");
    const mute = screen.getByRole("button", { name: "Mute voice" });
    expect(composer.closest("form")?.contains(mute)).toBe(false);
    expect(screen.queryByText("Voice off · replies in text")).toBeNull();
  });
});

describe("the pause and stop controls in the bar", () => {
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

  it("keeps both controls in place but disabled when there is nothing being said", () => {
    render(<Conversation {...conversationProps()} />);

    // Disabled, never removed: the control bar keeps its shape, as the
    // course lesson's does, so nothing moves under the hand mid-reply.
    const pause = screen.getByRole("button", { name: "Pause speaking" });
    const stop = screen.getByRole("button", { name: "Stop speaking" });
    expect((pause as HTMLButtonElement).disabled).toBe(true);
    expect((stop as HTMLButtonElement).disabled).toBe(true);
  });
});
