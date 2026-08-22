import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getProfile } from "@/lib/profiles";
import PhilosopherProfilePage from "./page";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

async function renderProfile(id: string, prompt?: string) {
  const page = await PhilosopherProfilePage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(prompt ? { prompt } : {}),
  });
  return render(page);
}

describe("philosopher profile handoffs", () => {
  it("returns from Kierkegaard to the carousel while remembering his position", async () => {
    await renderProfile("kierkegaard");
    const backLink = screen.getByRole("link", {
      name: "Back to the philosopher carousel",
    });

    expect(backLink.getAttribute("href")).toBe("/explore");
    expect(sessionStorage.getItem("lastPhilosopherId")).toBe("kierkegaard");
  });

  it("carries the Peterson death-of-God prompt from profile into conversation", async () => {
    await renderProfile("nietzsche", "peterson-nietzsche-death-of-god");
    const chatLink = screen.getByRole("link", { name: /Chat with Nietzsche/ });

    expect(chatLink.getAttribute("href")).toBe(
      "/conversation/nietzsche?prompt=peterson-nietzsche-death-of-god"
    );
    expect(
      screen.getByText(
        /Suggested question: What did you mean by ‘God is dead,’/
      )
    ).toBeTruthy();
  });

  it("renders the long-form description as separate profile paragraphs", async () => {
    const { container } = await renderProfile("nietzsche");
    const paragraphs = [...container.querySelectorAll("section p")].filter((p) =>
      p.textContent?.startsWith("Friedrich Nietzsche was a German philosopher"),
    );

    // The description lives in profiles.ts `intro` as an array, so the page
    // renders one <p> per paragraph rather than one run-on block.
    expect(paragraphs).toHaveLength(1);
    expect(
      screen.getByText(/^Nietzsche believed that European civilization/),
    ).toBeTruthy();
    expect(
      screen.getByText(/^In response, Nietzsche called for a/),
    ).toBeTruthy();
  });

  it("renders an original public-domain cover for every major work", async () => {
    const { container } = await renderProfile("nietzsche");
    const expectedCovers = getProfile("nietzsche")!.works.length;

    expect(
      container.querySelectorAll('[data-cover-origin="original-cc0"]'),
    ).toHaveLength(expectedCovers);
    expect(
      screen.getByText(
        "Original public-domain cover designs. No publisher cover art is used.",
      ),
    ).toBeTruthy();
  });

  it("serves an expansion philosopher now that the full roster is released", async () => {
    await renderProfile("augustine");
    expect(screen.getByRole("link", { name: /Chat with Augustine/ })).toBeTruthy();
  });

  it("serves Girard with his interview linked after the introduction", async () => {
    await renderProfile("girard");

    expect(screen.getByRole("link", { name: /Chat with Girard/ })).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: "Check out an interview from Rene Girard at the Hoover Institute at Stanford University from 2009",
        })
        .getAttribute("href"),
    ).toBe("https://www.youtube.com/watch?v=BNkSBy5wWDk");
  });

  it("renders the portrait credit on the hero, linked to licence and source", async () => {
    // Sartre's carousel portrait is CC BY-SA, which makes attribution a
    // condition of the licence — so this credit appearing is a compliance
    // requirement, not a nicety. It must name the author and link out to both
    // the deed and the Commons file page.
    await renderProfile("sartre");

    const author = screen.getByRole("link", {
      name: "Moshe Milner / Government Press Office (Israel)",
    });
    expect(author.getAttribute("href")).toBe(
      "https://commons.wikimedia.org/wiki/File:Jean-Paul_Sartre_1967_(cropped).jpg",
    );

    const licence = screen.getByRole("link", { name: "CC BY-SA 3.0" });
    expect(licence.getAttribute("href")).toBe(
      "https://creativecommons.org/licenses/by-sa/3.0",
    );

    // Sartre's hero is our own artwork, so the credit must read as crediting
    // the portrait — naming Milner for a picture he did not make would be a
    // false attribution.
    expect(screen.getByText(/^Portrait:/)).toBeTruthy();
  });

  it("credits a public-domain portrait without inventing a licence link", async () => {
    await renderProfile("nietzsche");

    expect(
      screen.getByRole("link", { name: "Gustav-Adolf Schultze" }).getAttribute("href"),
    ).toBe("https://commons.wikimedia.org/wiki/File:Nietzsche1882.jpg");
    // No deed exists for the public domain, so the licence is plain text.
    expect(screen.queryByRole("link", { name: "Public domain" })).toBeNull();
    expect(screen.getByText(/Public domain/)).toBeTruthy();
  });

  it("404s an unknown philosopher", async () => {
    await expect(renderProfile("zeno-of-citium")).rejects.toThrow(
      /NEXT_HTTP_ERROR_FALLBACK;404/,
    );
  });
});
