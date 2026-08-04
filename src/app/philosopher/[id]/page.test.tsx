import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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

  it("404s a philosopher who is not on the demo roster", async () => {
    await expect(renderProfile("augustine")).rejects.toThrow(
      /NEXT_HTTP_ERROR_FALLBACK;404/,
    );
    await expect(renderProfile("girard")).rejects.toThrow(
      /NEXT_HTTP_ERROR_FALLBACK;404/,
    );
  });
});
