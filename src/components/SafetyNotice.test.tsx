import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SafetyNotice from "./SafetyNotice";

describe("SafetyNotice", () => {
  it("offers help conditionally rather than asserting something about the reader", () => {
    render(<SafetyNotice />);
    // The conditional opener is the whole design: it must not diagnose.
    expect(
      screen.getByText(/if any of this is about right now/i),
    ).toBeTruthy();
  });

  it("says plainly that the app cannot help with this", () => {
    render(<SafetyNotice />);
    expect(screen.getByText(/philosophy app/i)).toBeTruthy();
  });

  it("links an international directory, not one country's hotline", () => {
    // The app has no geolocation; a single national number is wrong for most
    // readers. A locale-specific line may be added, never substituted.
    render(<SafetyNotice />);
    const link = screen.getByRole("link", { name: /findahelpline/i });
    expect(link.getAttribute("href")).toBe("https://findahelpline.com");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("tells the reader their text is not leaving the device", () => {
    render(<SafetyNotice />);
    expect(screen.getByText(/stays on this device/i)).toBeTruthy();
  });

  it("announces politely so it cannot interrupt typing", () => {
    const { container } = render(<SafetyNotice />);
    const aside = container.querySelector("aside");
    expect(aside?.getAttribute("aria-live")).toBe("polite");
  });
});
