import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PrivacyNotice from "./PrivacyNotice";

function open() {
  render(<PrivacyNotice />);
  fireEvent.click(screen.getByRole("button", { name: /privacy/i }));
  return screen.getByRole("dialog");
}

describe("PrivacyNotice", () => {
  it("shows nothing until the link is pressed", () => {
    render(<PrivacyNotice />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the notice in place rather than navigating away", () => {
    // An overlay, not a link: this sits under live conversations, where
    // leaving the page would tear down the mic surface mid-sentence.
    const dialog = open();
    expect(dialog).toBeTruthy();
    expect(screen.queryByRole("link", { name: /^privacy/i })).toBeNull();
  });

  it("closes when the backdrop is clicked", () => {
    const dialog = open();
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays open when the document itself is clicked", () => {
    // The backdrop closes; the panel must not, or selecting text inside the
    // notice would dismiss it.
    open();
    fireEvent.click(screen.getByText(/what this app is/i));
    expect(screen.queryByRole("dialog")).toBeTruthy();
  });

  it("closes from the ✕", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: /close privacy/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape, like every other dismissable surface", () => {
    open();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("releases the page scroll it locked while open", () => {
    open();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  // --- The disclosures themselves. These are the load-bearing claims; a
  // wording change is fine, dropping the substance is not.

  it("discloses that the browser sends speech audio to its own vendor", () => {
    // The least obvious fact in the whole notice, and the one a reader is
    // least able to discover for themselves.
    open();
    expect(screen.getByText(/sending your audio to their own/i)).toBeTruthy();
  });

  it("names the model and voice providers that receive text", () => {
    open();
    expect(screen.getByText(/Anthropic/)).toBeTruthy();
    expect(screen.getByText(/ElevenLabs/)).toBeTruthy();
  });

  it("states that conversations are not stored or logged", () => {
    open();
    expect(screen.getByText(/never what you said/i)).toBeTruthy();
  });

  it("explains that analytics is cookieless and cannot follow the reader", () => {
    // True only while the app uses Vercel's rotating-hash analytics. A tool
    // with a persistent identifier makes this false and needs consent.
    open();
    expect(screen.getByText(/regenerated every day/i)).toBeTruthy();
  });

  it("carries a contact route", () => {
    open();
    const mailto = screen
      .getByRole("link", { name: /@/ })
      .getAttribute("href");
    expect(mailto).toMatch(/^mailto:/);
  });
});
