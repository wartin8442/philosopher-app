import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "@/app/page";
import PhilosopherRail from "@/components/PhilosopherRail";
import { PHILOSOPHERS } from "@/lib/philosophers";

describe("PhilosopherRail locked landing design", () => {
  it("keeps Aquinas at the front of the nine-card angled rail", () => {
    const { container } = render(
      <PhilosopherRail philosophers={PHILOSOPHERS} lead="aquinas" />
    );
    const rail = container.querySelector<HTMLElement>("[data-philosopher-rail]");
    const cards = Array.from(container.querySelectorAll<HTMLElement>("article"));
    const leadCard = cards.find(
      (card) => card.style.getPropertyValue("--i") === "0"
    );

    expect(rail?.dataset.lead).toBe("aquinas");
    expect(rail?.getAttribute("aria-hidden")).not.toBeNull();
    expect(cards).toHaveLength(9);
    expect(cards[0].style.getPropertyValue("--i")).toBe("-2");
    expect(cards[8].style.getPropertyValue("--i")).toBe("6");
    expect(leadCard?.textContent).toContain("Thomas Aquinas");
  });

  it("keeps the Explore landing panel linked, dimmed, and backed by the rail", () => {
    const { container } = render(<LandingPage />);
    const exploreLink = screen.getByRole("link", {
      name: "Explore the Philosophers",
    });
    const preview = container.querySelector<HTMLElement>(
      "[data-explore-rail-preview]"
    );

    expect(exploreLink.getAttribute("href")).toBe("/explore");
    expect(exploreLink.className).toContain("overflow-hidden");
    expect(preview?.style.filter).toBe("brightness(0.35)");
    expect(
      preview?.querySelector<HTMLElement>("[data-philosopher-rail]")?.dataset
        .lead
    ).toBe("aquinas");
  });

  it("keeps the signed-off side-view geometry", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/components/PhilosopherRail.module.css"),
      "utf8"
    );

    expect(css).toContain("--angle: 24deg");
    expect(css).toContain("--tilt: 5deg");
    expect(css).toContain("--roll: 0deg");
    expect(css).toContain("--gap: 204px");
    expect(css).toContain("--relief: 34px");
    expect(css).toContain("perspective: 900px");
    expect(css).toContain("perspective-origin: 24% 44%");
    expect(css).toContain("width: 204px");
    expect(css).toContain("height: 296px");
  });
});
