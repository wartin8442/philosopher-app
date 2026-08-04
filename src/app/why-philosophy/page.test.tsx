import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WhyPhilosophyPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const INTRO =
  "Philosophy at its core is about asking the big questions about the world and life- does God exist, who am I as a person, how do I know what is true, what does it mean to live a good life? Philosophy is not something that solves all our problems or answers all of our questions, but is a way to get exposure to the deepest ideas of great people throughout history so that we can think intensely (and sometimes even be challenged by) their thoughts, take what we find to be impactful, create our own philosophies of living, and lead better, more aware lives.";

describe("WhyPhilosophyPage opening", () => {
  it("renders the signed-off introduction copy", () => {
    render(<WhyPhilosophyPage />);

    expect(screen.getByText(INTRO)).toBeTruthy();
  });

  it("keeps the people prompt and arrow inside the compact first viewport", () => {
    render(<WhyPhilosophyPage />);
    const heading = screen.getByRole("heading", {
      name: "Why Should I Care About Philosophy?",
    });
    const hero = heading.parentElement;
    const firstSection = hero?.parentElement;
    const peoplePrompt = screen.getByRole("link", {
      name: /See how philosophical questions are guiding.*↓/,
    });

    expect(firstSection?.className).toContain("sm:h-[100svh]");
    expect(firstSection?.className).toContain("sm:overflow-hidden");
    expect(hero?.className).toContain("justify-start");
    expect(hero?.className).toContain("sm:pt-3");
    expect(peoplePrompt.getAttribute("href")).toBe("#people");
  });
});
