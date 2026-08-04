import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExplorePage from "./page";

vi.mock("@/components/PhilosopherCarousel", () => ({
  default: () => <div>Philosopher carousel</div>,
}));

describe("ExplorePage", () => {
  it("provides a way back to the home page", () => {
    render(<ExplorePage />);

    const homeLink = screen.getByRole("link", { name: "← Home" });
    expect(homeLink.getAttribute("href")).toBe("/");
  });
});
