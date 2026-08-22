import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import WhyPhilosophyPersonPage from "./page";
import {
  getWhyPhilosophyPerson,
  WHY_PHILOSOPHY_PEOPLE,
} from "@/lib/whyPhilosophy";

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

  it("links the Girard mention to his released profile and prompt", async () => {
    const { container } = await renderPerson("peter-thiel");

    const links = screen.getAllByRole("link", { name: "René Girard" });
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(
      "/philosopher/girard?prompt=thiel-girard-mimetic-theory",
    );

    // Thiel is the one story whose summary also names its philosopher. The
    // link belongs on the body mention, where the story has just explained
    // mimetic theory — not on the standfirst that only asserts it.
    const story = container.querySelector<HTMLElement>("[data-person-story]");
    expect(story?.contains(links[0])).toBe(true);
  });

  it("carries each Hassabis mention to that philosopher with its question", async () => {
    await renderPerson("demis-hassabis");

    const expected: [RegExp, string][] = [
      [/^Aristotle$/, "/philosopher/aristotle?prompt=demis-aristotle-metaphysics"],
      [/^Baruch Spinoza$/, "/philosopher/spinoza?prompt=demis-spinoza-nature"],
      [/^Immanuel Kant$/, "/philosopher/kant?prompt=demis-kant-mind-and-reality"],
    ];

    for (const [name, href] of expected) {
      const links = screen.getAllByRole("link", { name });
      // One link per philosopher: the first mention only, so the prose does
      // not turn into a thicket of repeats to the same destination.
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute("href")).toBe(href);
    }

    expect(getWhyPhilosophyPerson("demis-hassabis")?.image).toBe(
      "/images/why-philosophy/demis-hassabis.jpg"
    );
  });

  // Every philosopher named in the prose is linked there, so the card list
  // below the story stays empty rather than repeating the same three offers.
  it("drops connection cards that the prose already linked", async () => {
    await renderPerson("demis-hassabis");

    expect(screen.queryByText("Follow the philosophical question")).toBeNull();
  });

  // The portraits of living people are Creative Commons works, and both BY and
  // BY-SA make attribution a licence condition. Assert the credit exists in
  // data and reaches the page, so a portrait can never ship uncredited.
  it("credits every contemporary portrait on the page", async () => {
    for (const person of WHY_PHILOSOPHY_PEOPLE) {
      if (!person.image) continue;

      const credit = person.imageCredit;
      expect(credit, `${person.name} has an image but no imageCredit`).toBeDefined();
      expect(credit!.author).not.toHaveLength(0);
      expect(credit!.licence).not.toHaveLength(0);
      expect(credit!.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(credit!.licenceUrl).toMatch(/^https:\/\/creativecommons\.org\//);

      cleanup();
      await renderPerson(person.id);
      expect(
        screen.getByRole("link", { name: credit!.author }).getAttribute("href"),
      ).toBe(credit!.sourceUrl);
      expect(
        screen
          .getByRole("link", { name: credit!.licence })
          .getAttribute("href"),
      ).toBe(credit!.licenceUrl);
    }
  });
});
