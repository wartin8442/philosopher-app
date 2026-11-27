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

  it("discloses remote speech recognition and interim transcript processing", () => {
    open();
    expect(screen.getByText(/sending your audio to a speech recognition service/i)).toBeTruthy();
    expect(screen.getByText(/send partial transcripts.*while you are still speaking/i)).toBeTruthy();
  });

  it("names the model and voice providers that receive text", () => {
    open();
    expect(screen.getByText(/Anthropic/)).toBeTruthy();
    expect(screen.getByText(/ElevenLabs/)).toBeTruthy();
  });

  it("distinguishes saved chat history from temporary source lookup caching", () => {
    open();
    expect(screen.getByText(/no saved conversation history/i)).toBeTruthy();
    expect(screen.getByText(/reused for up to five minutes/i)).toBeTruthy();
  });

  it("explains cookieless analytics and PostHog's daily visitor IDs", () => {
    open();
    expect(screen.getByText(/Vercel Web Analytics measures site traffic/i)).toBeTruthy();
    expect(screen.getByText(/without setting analytics cookies/i)).toBeTruthy();
    expect(screen.getByText(/visitor ID changes daily/i)).toBeTruthy();
  });

  it("discloses PostHog feature events and the limits on collection", () => {
    open();
    expect(screen.getByText(/which philosopher you messaged/i)).toBeTruthy();
    expect(screen.getByText(/which lessons you started, finished, or asked a question in/i)).toBeTruthy();
    expect(screen.getByText(/debate topics are excluded from feature events/i)).toBeTruthy();
    expect(screen.getByText(/session replay is off/i)).toBeTruthy();
  });

  it("carries a contact route", () => {
    open();
    const mailto = screen
      .getByRole("link", { name: /@/ })
      .getAttribute("href");
    expect(mailto).toMatch(/^mailto:/);
  });
});
