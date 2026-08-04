import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import WhyPhilosophyPersonPage from "./page";
import { getWhyPhilosophyPerson } from "@/lib/whyPhilosophy";

afterEach(cleanup);

async function renderPerson(id: string) {
  const page = await WhyPhilosophyPersonPage({
    params: Promise.resolve({ person: id }),
  });
  return render(page);
}

describe("modern-person philosophy story", () => {
  it("places the video after the complete written story", async () => {
    const { container } = await renderPerson("peter-thiel");
    const story = container.querySelector<HTMLElement>("[data-person-story]");
    const video = container.querySelector<HTMLElement>("[data-video-clip]");

    expect(story).not.toBeNull();
    expect(video).not.toBeNull();
    expect(
      story!.compareDocumentPosition(video!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("marks the full-page portrait and copy for the shared transition", async () => {
    const { container } = await renderPerson("peter-thiel");
    const hero = container.querySelector<HTMLElement>(
      '[data-why-person-hero="peter-thiel"]',
    );
    const portrait = hero?.querySelector<HTMLElement>(
      '[style*="view-transition-name"]',
    );

    expect(hero).not.toBeNull();
    expect(portrait?.style.viewTransitionName).toBe("why-person-portrait");
    expect(
      hero?.querySelector<HTMLElement>('[style*="why-person-copy"]')?.style
        .viewTransitionName,
    ).toBe("why-person-copy");
    expect(hero?.querySelectorAll(".why-person-hero-copy")).toHaveLength(2);
  });

  it("links a philosopher only when the demo roster can serve them", async () => {
    await renderPerson("jordan-peterson");
    const links = screen.getAllByRole("link", { name: "Friedrich Nietzsche" });

    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(
      "/philosopher/nietzsche?prompt=peterson-nietzsche-death-of-god"
    );
  });

  it("leaves Girard as prose while he is outside the demo roster", async () => {
    await renderPerson("peter-thiel");

    expect(screen.queryByRole("link", { name: /Girard/i })).toBeNull();
    // The name must still read normally in the story, just unlinked.
    expect(screen.getAllByText(/René Girard/).length).toBeGreaterThan(0);
  });

  it("leaves the Hassabis philosophers as prose while they are hidden", async () => {
    await renderPerson("demis-hassabis");

    for (const name of [/Aristotle/i, /Spinoza/i, /Kant/i, /Hegel/i]) {
      expect(screen.queryByRole("link", { name })).toBeNull();
    }

    expect(getWhyPhilosophyPerson("demis-hassabis")?.image).toBe(
      "/images/why-philosophy/demis-hassabis-fixed.png"
    );
  });
});
