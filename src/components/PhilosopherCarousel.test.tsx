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

// Mirrors the component: VISIBLE_HALF + 2, capped at count - 1.
const CLONE_COUNT = 4;
// [4 left clones, 5 real, 4 right clones]
const EXT_LEN = PHILOSOPHERS.length + CLONE_COUNT * 2;
// Real philosopher index -> index into the extended (rendered) list.
const ext = (realIndex: number) => realIndex + CLONE_COUNT;
// The component's silent-recentre settle delay.
const SETTLE_MS = 150;

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
// ...and back again, for asserting on absolute scroll positions.
function scrollLeftOf(cardIndex: number) {
  return cardIndex * CARD_WIDTH - VIEWPORT_WIDTH / 2 + CARD_WIDTH / 2;
}

function cardsOf(scroller: Element) {
  return Array.from(scroller.querySelectorAll('[role="button"]'));
}

function scrollerOf(container: HTMLElement) {
  return container.querySelector(SCROLLER_SELECTOR) as HTMLElement;
}

// The one card the carousel currently treats as centered — it is the only
// one labelled "View <name>'s profile".
function centered() {
  const el = screen.getByLabelText(/^View /);
  return {
    id: el.getAttribute("data-card-id")!,
    ext: Number(el.getAttribute("data-ext-index")),
  };
}

// Clicks a nav button, then advances fake timers just enough to flush the
// component's `requestAnimationFrame(updateActive)` (~16ms) — but well
// short of the settle-timer, so tests can reproduce clicking again before
// that timer fires.
function clickAndSettleFrame(button: HTMLElement) {
  act(() => {
    fireEvent.click(button);
    vi.advanceTimersByTime(20);
  });
}

// One step of a mouse drag. The scrollLeft the component writes in
// onPointerMove does not itself emit a scroll event in jsdom, so dispatch
// one to drive updateActive the way a real scroller would, then advance
// past the settle timer — under the pre-fix code that timer firing
// mid-drag is exactly what yanked the scroller back to where the gesture
// started.
function dragStep(scroller: HTMLElement, clientX: number, advanceMs = SETTLE_MS + 50) {
  act(() => {
    fireEvent.pointerMove(scroller, { clientX, pointerId: 1, pointerType: "mouse" });
    scroller.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(advanceMs);
  });
}

// A drag fast enough that the settle timer never gets a quiet 150ms to fire
// in — only a frame passes between moves. This is the case that used to run
// out of clone buffer and hit the end of the scroller.
function fastDragStep(scroller: HTMLElement, clientX: number) {
  dragStep(scroller, clientX, 20);
}

beforeEach(() => {
  scrollLefts = new WeakMap();
  calls = [];
  pushMock.mockClear();
  sessionStorage.clear();

  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"],
  });

  // Keep the portrait-preload path deterministic: with no requestIdleCallback
  // the component falls back to a plain timeout, which fake timers control.
  // (jsdom has none, but assert the shape rather than relying on that.)
  Reflect.deleteProperty(window, "requestIdleCallback");
  Reflect.deleteProperty(window, "cancelIdleCallback");

  // jsdom does not implement pointer capture; the component calls these on
  // every mouse drag.
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);

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
    // Kierkegaard is real index 2 → extended index 6 (after 4 left clones).
    expect(calls[0]).toMatchObject({ cardIndex: ext(2), behavior: "auto" });
    // The centered card is the enterable one.
    expect(screen.getByLabelText("View Kierkegaard's profile")).toBeTruthy();
  });

  it("falls back to the first philosopher when the remembered id is unknown", () => {
    sessionStorage.setItem("lastPhilosopherId", "socrates");
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    expect(calls[0]).toMatchObject({ cardIndex: ext(0), behavior: "auto" });
    expect(screen.getByLabelText("View Aquinas's profile")).toBeTruthy();
  });

  it("centers the first philosopher when nothing is remembered", () => {
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    expect(calls[0]).toMatchObject({ cardIndex: ext(0), behavior: "auto" });
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
    const scroller = scrollerOf(container);

    // Augustine is real index 5 → extended index 9. Initial positioning is a
    // direct, non-animated write performed before the carousel is revealed.
    expect(calls[0]).toMatchObject({ cardIndex: ext(5), behavior: "auto" });
    expect(calls.some((call) => call.behavior === "smooth")).toBe(false);
    expect(scroller.style.visibility).toBe("visible");
    expect(screen.getByLabelText("View Augustine's profile")).toBeTruthy();
  });
});

describe("PhilosopherCarousel wraparound navigation", () => {
  it("renders clones so the extended list wraps Camus back to Aquinas", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const labels = cardsOf(scrollerOf(container)).map((c) =>
      c.getAttribute("aria-label")
    );
    // Only the centered card (real Aquinas, extended index 4) is enterable;
    // every other card's activation just centers it.
    expect(labels).toEqual([
      "Go to Nietzsche",
      "Go to Kierkegaard",
      "Go to Sartre",
      "Go to Camus",
      "View Aquinas's profile",
      "Go to Nietzsche",
      "Go to Kierkegaard",
      "Go to Sartre",
      "Go to Camus",
      "Go to Aquinas",
      "Go to Nietzsche",
      "Go to Kierkegaard",
      "Go to Sartre",
    ]);
  });

  it("clones deeply enough that a clone at rest shows the same neighbours as its real card", () => {
    // This is the invariant that makes the silent re-centre invisible, and
    // the reason the buffer is deeper than the number of cards on screen: a
    // clone the carousel can come to rest on must be able to render a full
    // viewport either side of itself. With too shallow a buffer the outermost
    // peek slot has no card to put in it and renders blank.
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const ids = cardsOf(scrollerOf(container)).map((c) =>
      c.getAttribute("data-card-id")
    );
    const VISIBLE_HALF = 2;

    // The deepest clone reachable at rest on the left, and its real twin.
    const deepestLeftClone = CLONE_COUNT - 1;
    const realTwin = ext(
      (deepestLeftClone - CLONE_COUNT + PHILOSOPHERS.length) % PHILOSOPHERS.length
    );
    const window = (centre: number) =>
      ids.slice(centre - VISIBLE_HALF, centre + VISIBLE_HALF + 1);

    expect(window(deepestLeftClone)).toHaveLength(VISIBLE_HALF * 2 + 1);
    expect(window(deepestLeftClone)).toEqual(window(realTwin));

    // ...and symmetrically on the right.
    const deepestRightClone = EXT_LEN - CLONE_COUNT;
    const rightTwin = ext(
      (deepestRightClone - CLONE_COUNT + PHILOSOPHERS.length) % PHILOSOPHERS.length
    );
    expect(window(deepestRightClone)).toHaveLength(VISIBLE_HALF * 2 + 1);
    expect(window(deepestRightClone)).toEqual(window(rightTwin));
  });

  it("reserves the active profile prompt in every card so carousel height stays stable", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const prompts = Array.from(
      scrollerOf(container).querySelectorAll<HTMLElement>("[data-profile-prompt]")
    );

    expect(prompts).toHaveLength(EXT_LEN);
    expect(prompts.filter((p) => p.classList.contains("visible"))).toHaveLength(1);
    expect(prompts.filter((p) => p.classList.contains("invisible"))).toHaveLength(
      EXT_LEN - 1
    );
  });

  it("centers a clicked flank card instead of entering it, and only enters the centered card", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    calls = [];

    // Click the right flank card (real Nietzsche): the carousel should scroll
    // it to center, not navigate.
    const cards = cardsOf(scroller);
    clickAndSettleFrame(cards[ext(1)] as HTMLElement);
    expect(calls[calls.length - 1]).toMatchObject({
      cardIndex: ext(1),
      behavior: "smooth",
    });
    expect(pushMock).not.toHaveBeenCalled();

    // Now that Nietzsche is centered, clicking it opens its profile page.
    act(() => {
      fireEvent.click(cards[ext(1)] as HTMLElement);
    });
    expect(pushMock).toHaveBeenCalledWith("/philosopher/nietzsche");
  });

  it("takes a short one-card hop from Aquinas to Nietzsche after wrapping past Camus, instead of a long slide from the clone", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    // Mount effect already centered real Aquinas.
    calls = [];

    const nextButton = screen.getByLabelText("Next philosopher");

    // Walk right: Aquinas -> Nietzsche -> Kierkegaard -> Sartre -> Camus.
    for (let step = 0; step < 4; step++) {
      clickAndSettleFrame(nextButton);
    }
    expect(calls[calls.length - 1].cardIndex).toBe(ext(4));

    // One more step wraps onto the cloned Aquinas, *without* letting the
    // silent settle-timer fire yet — this reproduces clicking Next again
    // before the invisible snap-back runs.
    clickAndSettleFrame(nextButton);
    const cloneExt = ext(4) + 1;
    expect(calls[calls.length - 1].cardIndex).toBe(cloneExt); // Aquinas clone
    expect(scroller.scrollLeft).toBe(scrollLeftOf(cloneExt));

    // Click Next again immediately, simulating the user continuing right
    // "towards Nietzsche" right after the wrap — before the async settle
    // timer has silently snapped the clone back to the real card.
    act(() => {
      fireEvent.click(nextButton);
    });

    const finalCall = calls[calls.length - 1];
    expect(finalCall.cardIndex).toBe(ext(1)); // Nietzsche (real)
    expect(finalCall.behavior).toBe("smooth");

    // The critical assertion: the smooth scroll to Nietzsche must start
    // from real Aquinas's position — a one-card hop — not from the clone's
    // position, which would be a five-card slide.
    expect(finalCall.startScrollLeft).toBe(scrollLeftOf(ext(0)));
    expect(finalCall.startScrollLeft).not.toBe(scrollLeftOf(cloneExt));
  });

  it("takes a short one-card hop from Camus to Sartre after wrapping past Aquinas going left, instead of a long slide from the clone", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    calls = [];

    const prevButton = screen.getByLabelText("Previous philosopher");

    // From Aquinas, going left wraps onto the cloned Camus, before the
    // settle timer has snapped it back to real Camus.
    clickAndSettleFrame(prevButton);
    const cloneExt = ext(0) - 1;
    expect(calls[calls.length - 1].cardIndex).toBe(cloneExt); // Camus clone
    expect(scroller.scrollLeft).toBe(scrollLeftOf(cloneExt));

    // Continue left again immediately, towards Sartre.
    act(() => {
      fireEvent.click(prevButton);
    });

    const finalCall = calls[calls.length - 1];
    expect(finalCall.cardIndex).toBe(ext(3)); // Sartre (real)
    expect(finalCall.behavior).toBe("smooth");

    expect(finalCall.startScrollLeft).toBe(scrollLeftOf(ext(4)));
    expect(finalCall.startScrollLeft).not.toBe(scrollLeftOf(cloneExt));
  });

  it("walks the whole roster in both directions and comes back to where it started", () => {
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const nextButton = screen.getByLabelText("Next philosopher");
    const prevButton = screen.getByLabelText("Previous philosopher");

    const seenForward: string[] = [];
    for (let step = 0; step < PHILOSOPHERS.length; step++) {
      clickAndSettleFrame(nextButton);
      act(() => vi.advanceTimersByTime(SETTLE_MS + 50));
      seenForward.push(centered().id);
    }
    // A full lap forward visits every philosopher once and lands home again.
    expect(seenForward).toEqual([
      "nietzsche",
      "kierkegaard",
      "sartre",
      "camus",
      "aquinas",
    ]);

    const seenBack: string[] = [];
    for (let step = 0; step < PHILOSOPHERS.length; step++) {
      clickAndSettleFrame(prevButton);
      act(() => vi.advanceTimersByTime(SETTLE_MS + 50));
      seenBack.push(centered().id);
    }
    expect(seenBack).toEqual([
      "camus",
      "sartre",
      "kierkegaard",
      "nietzsche",
      "aquinas",
    ]);
  });
});

describe("PhilosopherCarousel dragging", () => {
  it("keeps scrolling in one direction across the wrap instead of oscillating between clone and real card", () => {
    // The regression this exists for: the silent re-centre used to fire from
    // a timer in the middle of a drag, writing scrollLeft while the drag's
    // origin still pointed at the pre-jump position. The next pointermove
    // recomputed scrollLeft from that stale origin and yanked the scroller
    // straight back, so the carousel ping-ponged between the clone and the
    // real card and never went anywhere.
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);

    act(() => {
      fireEvent.pointerDown(scroller, { clientX: 0, pointerId: 1, pointerType: "mouse" });
    });

    // Drag rightwards a card at a time, which walks the carousel backwards
    // through the roster and straight across the Aquinas/Camus seam.
    const seen: string[] = [];
    for (let step = 1; step <= 8; step++) {
      dragStep(scroller, step * CARD_WIDTH);
      seen.push(centered().id);
    }

    act(() => {
      fireEvent.pointerUp(scroller, { clientX: 8 * CARD_WIDTH, pointerId: 1, pointerType: "mouse" });
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });

    // Each step moves exactly one philosopher backwards, wrapping cleanly —
    // no repeats, no reversals.
    expect(seen).toEqual([
      "camus",
      "sartre",
      "kierkegaard",
      "nietzsche",
      "aquinas",
      "camus",
      "sartre",
      "kierkegaard",
    ]);
  });

  it("never runs the drag into the end of the scroller", () => {
    // The "can't scroll" half of the bug: waiting for the settle timer let a
    // drag travel out of the clone buffer and hit the scroller's hard edge,
    // where it simply stopped moving under the user's hand.
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);

    act(() => {
      fireEvent.pointerDown(scroller, { clientX: 0, pointerId: 1, pointerType: "mouse" });
    });

    const seen: string[] = [];
    for (let step = 1; step <= 12; step++) {
      fastDragStep(scroller, step * CARD_WIDTH);
      const { id, ext: centreExt } = centered();
      seen.push(id);
      // Never parked on the outermost card in either direction, where there
      // is no content left to scroll into.
      expect(centreExt).toBeGreaterThan(0);
      expect(centreExt).toBeLessThan(EXT_LEN - 1);
      // And never pinned against the scroller's own start.
      expect(scroller.scrollLeft).toBeGreaterThan(scrollLeftOf(0));
    }

    // Twelve cards of drag really moved twelve cards, cycling backwards
    // through the roster rather than stalling against the end.
    const backwards = ["camus", "sartre", "kierkegaard", "nietzsche", "aquinas"];
    expect(seen).toEqual(
      Array.from({ length: 12 }, (_, i) => backwards[i % backwards.length])
    );

    act(() => {
      fireEvent.pointerUp(scroller, { clientX: 12 * CARD_WIDTH, pointerId: 1, pointerType: "mouse" });
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });
  });

  it("drags leftwards across the wrap too", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);

    act(() => {
      fireEvent.pointerDown(scroller, { clientX: 0, pointerId: 1, pointerType: "mouse" });
    });

    const seen: string[] = [];
    for (let step = 1; step <= 8; step++) {
      dragStep(scroller, -step * CARD_WIDTH);
      seen.push(centered().id);
    }

    act(() => {
      fireEvent.pointerUp(scroller, { clientX: -8 * CARD_WIDTH, pointerId: 1, pointerType: "mouse" });
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });

    expect(seen).toEqual([
      "nietzsche",
      "kierkegaard",
      "sartre",
      "camus",
      "aquinas",
      "nietzsche",
      "kierkegaard",
      "sartre",
    ]);
  });

  it("refuses the native drag that used to kill every stroke after the first", () => {
    // Dragging swept the card text into a selection; pressing on that
    // selection to drag again started an HTML5 drag of it, and the
    // `dragstart` made the browser fire `pointercancel` — so the second and
    // every later drag did nothing at all.
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);

    expect(scroller.className).toContain("select-none");

    const dragStart = new Event("dragstart", { bubbles: true, cancelable: true });
    act(() => {
      scroller.dispatchEvent(dragStart);
    });
    expect(dragStart.defaultPrevented).toBe(true);
  });

  it("recovers from a cancelled pointer and drags again", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);

    // A cancelled gesture must leave no drag state behind.
    act(() => {
      fireEvent.pointerDown(scroller, { clientX: 0, pointerId: 1, pointerType: "mouse" });
      fireEvent.pointerMove(scroller, { clientX: 120, pointerId: 1, pointerType: "mouse" });
      fireEvent.pointerCancel(scroller, { clientX: 120, pointerId: 1, pointerType: "mouse" });
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });

    // A fresh drag still works.
    act(() => {
      fireEvent.pointerDown(scroller, { clientX: 0, pointerId: 1, pointerType: "mouse" });
    });
    const seen: string[] = [];
    for (let step = 1; step <= 3; step++) {
      dragStep(scroller, step * CARD_WIDTH);
      seen.push(centered().id);
    }
    act(() => {
      fireEvent.pointerUp(scroller, { clientX: 3 * CARD_WIDTH, pointerId: 1, pointerType: "mouse" });
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });

    expect(seen).toEqual(["camus", "sartre", "kierkegaard"]);
  });

  it("treats a press that never moved as a click, not a drag", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    const centreCard = cardsOf(scroller)[ext(0)] as HTMLElement;

    act(() => {
      fireEvent.pointerDown(centreCard, { clientX: 100, pointerId: 1, pointerType: "mouse" });
      fireEvent.pointerUp(centreCard, { clientX: 100, pointerId: 1, pointerType: "mouse" });
    });

    expect(pushMock).toHaveBeenCalledWith("/philosopher/aquinas");
  });

  it("does not enter a philosopher when the press moved", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    const centreCard = cardsOf(scroller)[ext(0)] as HTMLElement;

    act(() => {
      fireEvent.pointerDown(centreCard, { clientX: 100, pointerId: 1, pointerType: "mouse" });
      fireEvent.pointerMove(scroller, { clientX: 160, pointerId: 1, pointerType: "mouse" });
      fireEvent.pointerUp(scroller, { clientX: 160, pointerId: 1, pointerType: "mouse" });
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("leaves touch pointers to the browser's own scrolling", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    const before = scroller.scrollLeft;

    act(() => {
      fireEvent.pointerDown(scroller, { clientX: 0, pointerId: 2, pointerType: "touch" });
      fireEvent.pointerMove(scroller, { clientX: 300, pointerId: 2, pointerType: "touch" });
    });

    // No JS-driven scrolling for touch — native scroll-snap handles it.
    expect(scroller.scrollLeft).toBe(before);
  });
});

describe("PhilosopherCarousel portrait loading", () => {
  it("eager-loads the first-paint window immediately", () => {
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const imgs = Array.from(scrollerOf(container).querySelectorAll("img"));
    expect(imgs).toHaveLength(EXT_LEN);
    // The centred card plus two either side are fetched with the page.
    expect(imgs.filter((i) => i.getAttribute("loading") === "eager")).toHaveLength(5);
  });

  it("preloads every portrait once the page goes idle, so a wrap never reveals a blank card", () => {
    // The reported symptom: wrapping backwards past Aquinas put Marx and Mill
    // on screen in a single frame, and their portraits — never fetched,
    // because the eager window only tracked the current centre — arrived a
    // beat later as empty circles.
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    const imgs = Array.from(scroller.querySelectorAll("img"));
    expect(imgs).toHaveLength(EXT_LEN);
    expect(imgs.every((i) => i.getAttribute("loading") === "eager")).toBe(true);
  });

  it("keeps every portrait eager while the carousel moves", () => {
    // A window that tracked the active card would flip `loading` back to
    // lazy on cards it had moved away from, undoing the preload.
    const { container } = render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const scroller = scrollerOf(container);
    const nextButton = screen.getByLabelText("Next philosopher");

    act(() => {
      vi.advanceTimersByTime(400);
    });
    for (let step = 0; step < 3; step++) {
      clickAndSettleFrame(nextButton);
      act(() => vi.advanceTimersByTime(SETTLE_MS + 50));
    }

    const imgs = Array.from(scroller.querySelectorAll("img"));
    expect(imgs.every((i) => i.getAttribute("loading") === "eager")).toBe(true);
  });
});

describe("PhilosopherCarousel dots", () => {
  it("jumps to the philosopher whose dot is clicked and marks it current", () => {
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    calls = [];

    // The dots are the second control labelled "Go to Sartre" (the first is
    // the card itself), so address them by their shared parent row.
    const dotRow = screen.getAllByLabelText("Go to Sartre").find(
      (el) => el.tagName === "BUTTON"
    )!;
    act(() => {
      fireEvent.click(dotRow);
      vi.advanceTimersByTime(SETTLE_MS + 50);
    });

    expect(calls[calls.length - 1]).toMatchObject({
      cardIndex: ext(3),
      behavior: "smooth",
    });
    expect(centered().id).toBe("sartre");
    expect(dotRow.getAttribute("aria-current")).toBe("true");
  });

  it("follows the carousel after a wrap, tracking the real philosopher not the clone", () => {
    render(<PhilosopherCarousel philosophers={PHILOSOPHERS} />);
    const prevButton = screen.getByLabelText("Previous philosopher");

    // Aquinas -> (clone of) Camus -> settle onto real Camus.
    clickAndSettleFrame(prevButton);
    act(() => vi.advanceTimersByTime(SETTLE_MS + 50));

    expect(centered().id).toBe("camus");
    const camusDot = screen
      .getAllByLabelText("Go to Camus")
      .find((el) => el.tagName === "BUTTON")!;
    expect(camusDot.getAttribute("aria-current")).toBe("true");
  });
});

describe("PhilosopherCarousel degenerate rosters", () => {
  it("renders a single philosopher with no clones and no wrap", () => {
    const { container } = render(
      <PhilosopherCarousel philosophers={[PHILOSOPHERS[0]]} />
    );
    const cards = cardsOf(scrollerOf(container));
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("aria-label")).toBe("View Aquinas's profile");

    // The arrows must not throw or navigate off the end.
    expect(() => {
      clickAndSettleFrame(screen.getByLabelText("Next philosopher"));
      clickAndSettleFrame(screen.getByLabelText("Previous philosopher"));
      act(() => vi.advanceTimersByTime(SETTLE_MS + 50));
    }).not.toThrow();
    expect(centered().id).toBe("aquinas");
  });

  it("clamps the clone buffer for a two-philosopher roster", () => {
    const { container } = render(
      <PhilosopherCarousel philosophers={PHILOSOPHERS.slice(0, 2)} />
    );
    // cloneCount is capped at count - 1, so 1 clone each side.
    expect(cardsOf(scrollerOf(container))).toHaveLength(2 + 1 * 2);

    expect(() => {
      clickAndSettleFrame(screen.getByLabelText("Next philosopher"));
      act(() => vi.advanceTimersByTime(SETTLE_MS + 50));
    }).not.toThrow();
    expect(centered().id).toBe("nietzsche");
  });
});
