import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PhilosopherCarousel from "./PhilosopherCarousel";
import { Philosopher } from "@/lib/types";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mirrors the real ordering: Aquinas, Nietzsche, Kierkegaard, Sartre, Camus.
const NAMES = ["Aquinas", "Nietzsche", "Kierkegaard", "Sartre", "Camus"];
const PHILOSOPHERS: Philosopher[] = NAMES.map((name) => ({
  id: name.toLowerCase(),
  name,
  dates: "",
  blurb: "",
  voiceNote: "",
  accent: "#ffffff",
  initials: name[0],
  image: `/philosophers/${name.toLowerCase()}.jpg`,
  systemPrompt: "",
  sources: [],
}));

// jsdom has no real layout engine, so we simulate one: every card is
// CARD_WIDTH wide and laid out contiguously in DOM (extended-list) order,
// and the scroller is VIEWPORT_WIDTH wide. `getBoundingClientRect` and
// `scrollLeft` are patched globally on HTMLElement.prototype (rather than
// on specific refs) so they behave correctly for cards the component
// scrolls to *during its own mount effect*, before a test can grab refs.
const CARD_WIDTH = 300;
const VIEWPORT_WIDTH = 900;
const SCROLLER_SELECTOR = ".overflow-x-auto";

type ScrollCall = { cardIndex: number; behavior: ScrollBehavior; startScrollLeft: number };

let scrollLefts: WeakMap<Element, number>;
let calls: ScrollCall[];
let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;
let originalScrollTo: typeof HTMLElement.prototype.scrollTo;
// Set while the scrollTo mock applies its own scrollLeft, so the scrollLeft
// setter doesn't record that internal write as a second call.
let inScrollTo = false;

// The component centers card i by putting its center at the scroller's
// center, so a target scrollLeft maps back to a card index.
function toCardIndex(left: number) {
  return (left - CARD_WIDTH / 2 + VIEWPORT_WIDTH / 2) / CARD_WIDTH;
}

function cardsOf(scroller: Element) {
  return Array.from(scroller.querySelectorAll('[role="button"]'));
}

// Clicks a nav button, then advances fake timers just enough to flush the
// component's `requestAnimationFrame(updateActive)` (~16ms) — but well
// short of the 150ms silent settle-timer, so tests can reproduce clicking
// again before that timer fires.
function clickAndSettleFrame(button: HTMLElement) {
  act(() => {
    fireEvent.click(button);
    vi.advanceTimersByTime(20);
  });
}

beforeEach(() => {
  scrollLefts = new WeakMap();
  calls = [];
  pushMock.mockClear();
  sessionStorage.clear();

  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
  });

  originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  originalScrollTo = HTMLElement.prototype.scrollTo;

  // Direct scrollLeft writes are the component's instant ("auto")
  // positioning path — record them as calls so tests can assert on the
  // mount-time centering and silent clone snap-backs.
  Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
    configurable: true,
    get(this: HTMLElement) {
      return scrollLefts.get(this) ?? 0;
    },
    set(this: HTMLElement, v: number) {
      if (!inScrollTo && this.classList.contains("overflow-x-auto")) {
        calls.push({
          cardIndex: toCardIndex(v),
          behavior: "auto",
          startScrollLeft: scrollLefts.get(this) ?? 0,
        });
      }
      scrollLefts.set(this, v);
    },
  });

  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const base = { top: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON() {} };
    if (this.classList.contains("overflow-x-auto")) {
      return { ...base, left: 0, width: VIEWPORT_WIDTH } as DOMRect;
    }
    if (this.getAttribute("role") === "button") {
      const scroller = this.closest(SCROLLER_SELECTOR) as HTMLElement;
      const i = cardsOf(scroller).indexOf(this);
      return {
        ...base,
        left: i * CARD_WIDTH - scroller.scrollLeft,
        width: CARD_WIDTH,
      } as DOMRect;
    }
    return { ...base, left: 0, width: 0 } as DOMRect;
  };

  // Smooth centering goes through the scroller's own scrollTo (never
  // scrollIntoView, which would scroll the page vertically too).
  HTMLElement.prototype.scrollTo = function (
    this: HTMLElement,
    ...args: [ScrollToOptions?] | [number, number]
  ) {
    const opts = args[0];
    if (
      !this.classList.contains("overflow-x-auto") ||
      typeof opts !== "object" ||
      !opts ||
      opts.left === undefined
    ) {
      return;
    }
    calls.push({
      cardIndex: toCardIndex(opts.left),
      behavior: opts.behavior ?? "auto",
      startScrollLeft: scrollLefts.get(this) ?? 0,
    });
    inScrollTo = true;
    this.scrollLeft = opts.left;
    inScrollTo = false;
    this.dispatchEvent(new Event("scroll"));
  };
});

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  HTMLElement.prototype.scrollTo = originalScrollTo;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("PhilosopherCarousel initial centering", () => {
  it("centers the last-visited philosopher on mount when sessionStorage remembers one", () => {
    sessionStorage.setItem("lastPhilosopherId", "kierkegaard");
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    // Kierkegaard is real index 2 → extended index 4 (after 2 left clones).
    expect(calls[0]).toMatchObject({ cardIndex: 4, behavior: "auto" });
    // The centered card is the enterable one.
    expect(
      screen.getByLabelText("View Kierkegaard's profile")
    ).toBeTruthy();
  });

  it("falls back to the first philosopher when the remembered id is unknown", () => {
    sessionStorage.setItem("lastPhilosopherId", "socrates");
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    expect(calls[0]).toMatchObject({ cardIndex: 2, behavior: "auto" });
    expect(screen.getByLabelText("View Aquinas's profile")).toBeTruthy();
  });

  it("centers the first philosopher when nothing is remembered", () => {
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    expect(calls[0]).toMatchObject({ cardIndex: 2, behavior: "auto" });
  });

  it("restores Augustine instantly without an animated jump from the first card", () => {
    const augustine: Philosopher = {
      ...PHILOSOPHERS[0],
      id: "augustine",
      name: "Augustine",
      initials: "AU",
      image: "/philosophers/augustine.jpg",
    };
    sessionStorage.setItem("lastPhilosopherId", "augustine");

    const { container } = render(
      <PhilosopherCarousel philosophers={[...PHILOSOPHERS, augustine]} />
    );
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;

    // Augustine is real index 5 → extended index 7. Initial positioning is a
    // direct, non-animated write performed before the carousel is revealed.
    expect(calls[0]).toMatchObject({ cardIndex: 7, behavior: "auto" });
    expect(calls.some((call) => call.behavior === "smooth")).toBe(false);
    expect(scroller.style.visibility).toBe("visible");
    expect(screen.getByLabelText("View Augustine's profile")).toBeTruthy();
  });
});

describe("PhilosopherCarousel wraparound navigation", () => {
  it("renders clones so the extended list wraps Camus back to Aquinas", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
    const labels = cardsOf(scroller).map((c) => c.getAttribute("aria-label"));
    // Only the centered card (real Aquinas, extended index 2) is enterable;
    // every other card's activation just centers it.
    expect(labels).toEqual([
      "Go to Sartre",
      "Go to Camus",
      "View Aquinas's profile",
      "Go to Nietzsche",
      "Go to Kierkegaard",
      "Go to Sartre",
      "Go to Camus",
      "Go to Aquinas",
      "Go to Nietzsche",
    ]);
  });

  it("reserves the active profile prompt in every card so carousel height stays stable", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
    const prompts = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-profile-prompt]")
    );

    expect(prompts).toHaveLength(9);
    expect(prompts.filter((prompt) => prompt.classList.contains("visible"))).toHaveLength(1);
    expect(prompts.filter((prompt) => prompt.classList.contains("invisible"))).toHaveLength(8);
  });

  it("eager-loads only the focused card and its immediate neighbors", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
    const imgs = Array.from(scroller.querySelectorAll("img"));
    // 5 real cards + 2 clones on each side, each with a portrait image.
    expect(imgs).toHaveLength(9);
    expect(imgs.filter((img) => img.getAttribute("loading") === "eager")).toHaveLength(5);
    expect(imgs.filter((img) => img.getAttribute("loading") === "lazy")).toHaveLength(4);
  });

  it("centers a clicked flank card instead of entering it, and only enters the centered card", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
    calls = [];

    // Click the right flank card (real Nietzsche, extended index 3): the
    // carousel should scroll it to center, not navigate.
    const cards = cardsOf(scroller);
    clickAndSettleFrame(cards[3] as HTMLElement);
    expect(calls[calls.length - 1]).toMatchObject({ cardIndex: 3, behavior: "smooth" });
    expect(pushMock).not.toHaveBeenCalled();

    // Now that Nietzsche is centered, clicking it opens its profile page.
    act(() => {
      fireEvent.click(cards[3] as HTMLElement);
    });
    expect(pushMock).toHaveBeenCalledWith("/philosopher/nietzsche");
  });

  it("takes a short one-card hop from Aquinas to Nietzsche after wrapping past Camus, instead of a long slide from the clone", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
    // Mount effect already centered index 2 (real Aquinas).
    calls = [];

    const nextButton = screen.getByLabelText("Next philosopher");

    // Walk right: Aquinas(2) -> Nietzsche(3) -> Kierkegaard(4) -> Sartre(5) -> Camus(6).
    for (let step = 0; step < 4; step++) {
      clickAndSettleFrame(nextButton);
    }
    expect(calls[calls.length - 1].cardIndex).toBe(6);

    // One more step wraps onto the cloned Aquinas at extended index 7,
    // *without* letting the 150ms silent settle-timer fire yet — this
    // reproduces clicking Next again before the invisible snap-back runs.
    clickAndSettleFrame(nextButton);
    const cloneCall = calls[calls.length - 1];
    expect(cloneCall.cardIndex).toBe(7); // landed on the Aquinas clone
    expect(scroller.scrollLeft).toBe(7 * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2);

    // Click Next again immediately, simulating the user continuing right
    // "towards Nietzsche" right after the wrap — before the async settle
    // timer has silently snapped the clone back to the real card.
    act(() => {
      fireEvent.click(nextButton);
    });

    const finalCall = calls[calls.length - 1];
    expect(finalCall.cardIndex).toBe(3); // Nietzsche (real)
    expect(finalCall.behavior).toBe("smooth");

    // The critical assertion: the smooth scroll to Nietzsche must start
    // from real Aquinas's position (index 2) — a one-card hop — not from
    // the clone's position (index 7), which would be a four-card slide.
    const aquinasRealStart = 2 * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2;
    const aquinasCloneStart = 7 * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2;
    expect(finalCall.startScrollLeft).toBe(aquinasRealStart);
    expect(finalCall.startScrollLeft).not.toBe(aquinasCloneStart);
  });

  it("takes a short one-card hop from Camus to Sartre after wrapping past Aquinas going left, instead of a long slide from the clone", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
    calls = [];

    const prevButton = screen.getByLabelText("Previous philosopher");

    // From Aquinas(2), going left wraps onto the cloned Camus at extended
    // index 1, before the settle timer has snapped it back to real Camus.
    clickAndSettleFrame(prevButton);
    const cloneCall = calls[calls.length - 1];
    expect(cloneCall.cardIndex).toBe(1); // Camus clone
    expect(scroller.scrollLeft).toBe(1 * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2);

    // Continue left again immediately, towards Sartre.
    act(() => {
      fireEvent.click(prevButton);
    });

    const finalCall = calls[calls.length - 1];
    expect(finalCall.cardIndex).toBe(5); // Sartre (real)
    expect(finalCall.behavior).toBe("smooth");

    const camusRealStart = 6 * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2;
    const camusCloneStart = 1 * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2;
    expect(finalCall.startScrollLeft).toBe(camusRealStart);
    expect(finalCall.startScrollLeft).not.toBe(camusCloneStart);
  });
});
