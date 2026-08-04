import { cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import ConversationPage from "./page";

vi.mock("@/components/VoiceVisualizer", () => ({
  default: () => null,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "nietzsche" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams("prompt=peterson-nietzsche-death-of-god"),
}));

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
    render(<ConversationPage />);

    const panel = document.querySelector<HTMLElement>("[data-chat-panel]");
    const contextualPrompt = screen.getByRole("button", {
      name: /What did you mean by ‘God is dead,’/i,
    });
    const levelStarter = screen.getByRole("button", {
      name: "Tell me who you are.",
    });
    const composer = screen.getByPlaceholderText("Type a question…");

    expect(panel).not.toBeNull();
    expect(panel?.firstElementChild?.className).toContain("h-[42dvh]");
    expect(panel?.firstElementChild?.className).toContain("min-h-[340px]");
    expect(panel?.contains(contextualPrompt)).toBe(true);
    expect(panel?.contains(levelStarter)).toBe(true);
    expect(panel?.contains(composer)).toBe(true);
  });
});
