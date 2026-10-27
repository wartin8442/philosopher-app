import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AiUseNotice from "./AiUseNotice";

function open() {
  render(<AiUseNotice />);
  fireEvent.click(screen.getByRole("button", { name: /how ai was used/i }));
  return screen.getByRole("dialog");
}

describe("AiUseNotice", () => {
  it("opens in place and closes on Escape", () => {
    open();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // --- The authorship claims. A wording change is fine; dropping the
  // substance is not.

  it("names the model that speaks for the philosophers", () => {
    open();
    expect(screen.getByText(/Claude Opus 4\.8/)).toBeTruthy();
  });

  it("separates the human-written lecture from AI answers to interruptions", () => {
    open();
    expect(screen.getByText(/interrupt with a question/i)).toBeTruthy();
  });

  it("states that no voice was cloned", () => {
    open();
    expect(screen.getByText(/no voice was cloned/i)).toBeTruthy();
  });

  it("says which images are AI-generated", () => {
    open();
    expect(screen.getByText(/AI-generated/)).toBeTruthy();
  });
});
