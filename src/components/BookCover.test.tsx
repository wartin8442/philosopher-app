import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookCover from "./BookCover";

describe("BookCover", () => {
  it("renders an original cover without a third-party image", () => {
    const { container } = render(
      <BookCover
        title="Fear and Trembling"
        author="Søren Kierkegaard"
        accent="#6f8fb0"
        year="1843"
      />,
    );

    const cover = screen.getByRole("img", {
      name: "Original cover design for Fear and Trembling by Søren Kierkegaard",
    });
    expect(cover.getAttribute("data-cover-origin")).toBe("original-cc0");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Fear and Trembling")).toBeTruthy();
    expect(screen.getByText("Søren Kierkegaard")).toBeTruthy();
    expect(screen.getByText("1843")).toBeTruthy();
  });

  it("derives a stable visual variation from the work", () => {
    const firstRender = render(
      <BookCover title="Either/Or" author="Søren Kierkegaard" accent="#6f8fb0" />,
    );
    const first = firstRender.getByRole("img");
    const firstBackground = first.style.background;
    firstRender.unmount();

    const second = render(
      <BookCover
        title="The Sickness Unto Death"
        author="Søren Kierkegaard"
        accent="#6f8fb0"
      />,
    ).getByRole("img");

    expect(firstBackground).not.toBe("");
    expect(second.style.background).not.toBe(firstBackground);
  });
});
