import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WhyPhilosophyPeople from "./WhyPhilosophyPeople";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const people = [
  {
    id: "sample-person",
    name: "Sample Person",
    image: "/sample.jpg",
    imageFocus: "50% 30%",
  },
];

beforeEach(() => {
  push.mockReset();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("why-philosophy-transition");
  document.querySelectorAll("[data-why-person-hero]").forEach((node) => {
    node.remove();
  });
  Reflect.deleteProperty(document, "startViewTransition");
});

describe("WhyPhilosophyPeople", () => {
  it("scales only the name on hover and keeps the portrait overlay static", () => {
    const { container } = render(<WhyPhilosophyPeople people={people} />);

    expect(
      container.querySelector("[data-card-copy]")?.className,
    ).toContain("group-hover:scale-[1.025]");
    expect(container.querySelector("[aria-hidden='true']")?.className).not.toContain(
      "group-hover:",
    );
  });

  it("shares the selected portrait with the full-page story transition", async () => {
    push.mockImplementation(() => {
      const hero = document.createElement("div");
      hero.dataset.whyPersonHero = "sample-person";
      document.body.append(hero);
    });
    const startViewTransition = vi.fn(
      (update: () => void | Promise<void>) => {
        void update();
        return { finished: Promise.resolve() };
      },
    );
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });

    const { container } = render(<WhyPhilosophyPeople people={people} />);
    fireEvent.click(screen.getByRole("link", { name: /Sample Person/ }));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(
      container.querySelector<HTMLElement>("[data-card-portrait]")?.style
        .viewTransitionName,
    ).toBe("why-person-portrait");
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/why-philosophy/sample-person");
      expect(document.documentElement.className).not.toContain(
        "why-philosophy-transition",
      );
    });
  });
});
