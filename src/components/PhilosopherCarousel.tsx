"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Portrait from "@/components/Portrait";
import { startRouteProgress } from "@/components/RouteProgress";
import { Philosopher } from "@/lib/types";
import {
  getLastPhilosopherId,
  LAST_PHILOSOPHER_STORAGE_KEY,
} from "@/lib/lastPhilosopher";

interface PhilosopherCarouselProps {
  philosophers: Philosopher[];
}

// useLayoutEffect on the client (so the initial centering happens before
// paint), useEffect during SSR (where useLayoutEffect would warn).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Distance (px) beyond which a card is fully dimmed/shrunk.
const FALLOFF_RANGE = 260;

// How long the scroller must be quiet before the silent re-centre onto a
// real card runs. Long enough not to fire between two frames of the same
// gesture, short enough that a user who stops on a clone is moved back
// before they try to scroll again.
const SETTLE_MS = 150;

// Cards visible to either side of the centred one at the widest layout
// (cards are 27% of the scroller, so ~2 peek in on each side).
const VISIBLE_HALF = 2;

/**
 * Horizontal, scroll-snapped carousel showing three philosophers at a time.
 * Cards outside the center dim and shrink slightly, hinting at more to
 * either side. Clicking anywhere on a card (centered or not) opens that
 * philosopher's profile page; dragging still just scrolls.
 *
 * Navigation is circular: the last N philosophers are cloned and prepended,
 * and the first N are cloned and appended, so the first and last real cards
 * always have real (not blank) neighbors on both sides. Once a clone settles
 * into the center, we silently (no animation) re-center on its real
 * counterpart — since both sides render the same neighbor cards, this
 * re-centering is visually invisible, so the loop continues seamlessly in
 * either direction with no dead end and no visible pop.
 */
export default function PhilosopherCarousel({
  philosophers,
}: PhilosopherCarouselProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = philosophers.length;
  const wraps = count > 1;
  // The clone buffer has to be deeper than the number of cards that peek in
  // at the edges of the viewport, for two separate reasons:
  //
  //  - A clone resting in the center must look exactly like its real
  //    counterpart, which means every card the viewport can see beside it
  //    has to exist. With only VISIBLE_HALF clones the outermost one runs
  //    out of neighbors and the far peek slot renders blank.
  //  - Scrolling *through* the buffer must not reach the scroller's own hard
  //    edge before the re-centre has had a chance to happen, or the carousel
  //    stops dead under the user's hand.
  //
  // VISIBLE_HALF + 2 leaves a card of slack for each.
  const cloneCount = wraps ? Math.min(VISIBLE_HALF + 2, count - 1) : 0;

  // Extended, render-order list:
  // [...clones of the last N, ...real, ...clones of the first N].
  // Rendering clones (instead of blank spacer) is what makes the last
  // philosopher visibly sit next to the first, and vice versa.
  const extended = useMemo(() => {
    if (!wraps) return philosophers;
    const leftClones = Array.from(
      { length: cloneCount },
      (_, k) => philosophers[(count - cloneCount + k + count) % count]
    );
    const rightClones = Array.from(
      { length: cloneCount },
      (_, k) => philosophers[k % count]
    );
    return [...leftClones, ...philosophers, ...rightClones];
  }, [philosophers, count, wraps, cloneCount]);

  // Maps an index into `extended` back to the real index in `philosophers`.
  const toReal = useCallback(
    (extIndex: number) =>
      wraps ? (extIndex - cloneCount + count) % count : extIndex,
    [wraps, count, cloneCount]
  );

  const isCloneIndex = useCallback(
    (extIndex: number) =>
      wraps &&
      (extIndex < cloneCount || extIndex > extended.length - 1 - cloneCount),
    [wraps, cloneCount, extended.length]
  );

  const initialActiveExt = wraps ? cloneCount : 0;
  const [activeExt, setActiveExt] = useState(initialActiveExt);
  const [preloadAll, setPreloadAll] = useState(false);
  const activeExtRef = useRef(activeExt);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  // Extended index of the card the mouse went down on. Activation for
  // mouse input happens in endDrag (not the cards' onClick):
  // setPointerCapture on the scroller makes the browser retarget the
  // ensuing `click` event to the scroller, so the cards' own onClick never
  // fires for captured (mouse) pointers. Tracked by extended index (not
  // philosopher id) because clones share ids, and centering a clicked
  // flank card needs to target that specific card element.
  const pressedCardExt = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const activeReal = toReal(activeExt);

  // Programmatic navigation does not get Link's automatic prefetching. Fetch
  // only the profile currently in focus so activating it feels immediate
  // without downloading every philosopher profile up front.
  useEffect(() => {
    const activePhilosopher = philosophers[activeReal];
    if (activePhilosopher) {
      router.prefetch?.(`/philosopher/${activePhilosopher.id}`);
    }
  }, [activeReal, philosophers, router]);

  // Every portrait has to be in the browser cache before it can be scrolled
  // to. The wraparound re-centre moves the viewport a whole roster-length in
  // a single frame, so a card from the far end of the list can arrive on
  // screen with no warning at all; left to lazy-load it shows up blank and
  // pops in a beat later (this is what made Marx and Mill "take a second"
  // after wrapping backwards past Aquinas). Deferred to idle so the fetches
  // never compete with the first paint of the cards already on screen.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (!w.requestIdleCallback) {
      const timer = setTimeout(() => setPreloadAll(true), 300);
      return () => clearTimeout(timer);
    }
    const handle = w.requestIdleCallback(() => setPreloadAll(true), {
      timeout: 1500,
    });
    return () => w.cancelIdleCallback?.(handle);
  }, []);

  // Centers the given card by scrolling the scroller itself — never
  // `scrollIntoView`, which also scrolls the *page* vertically to bring the
  // carousel into view (on first load that yanked the page down from the
  // top to the carousel). "auto" uses a direct scrollLeft write rather than
  // `scrollTo(behavior: "auto")` because some browsers soften "auto"
  // scrolls into a brief animation when combined with CSS
  // `scroll-snap-type: mandatory`, which would make the "invisible" clone
  // snap visible.
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      const card = cardRefs.current[index];
      if (!scroller || !card) return;
      const scrollerRect = scroller.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const left =
        scroller.scrollLeft +
        cardRect.left +
        cardRect.width / 2 -
        (scrollerRect.left + scrollerRect.width / 2);
      if (behavior === "smooth") {
        scroller.scrollTo({ left, behavior });
        return;
      }
      // An instant reposition during a drag has to move the drag's origin
      // with it. onPointerMove derives scrollLeft from the baseline captured
      // at pointerdown, so leaving that baseline behind makes the very next
      // move event yank the scroller back to the pre-jump position — the
      // carousel then oscillates between clone and real card for the rest of
      // the gesture, which reads as it refusing to scroll at all.
      if (isDragging.current) {
        dragStartScroll.current += left - scroller.scrollLeft;
      }
      scroller.scrollLeft = left;
    },
    []
  );

  // Recompute every card's distance from the center and apply its
  // scale/opacity. Returns the index of the card nearest the center, or -1
  // if there is nothing to measure.
  //
  // The styling is written straight to the DOM rather than held in React
  // state: this runs on every scroll frame, and re-rendering every card
  // (each with a next/image portrait) sixty times a second was the source
  // of the carousel's stutter. Only `activeExt` — which changes at most
  // once per card, not once per frame — stays in state, because the border,
  // background and "View profile →" hint are genuinely React-rendered.
  //
  // For the same reason the cards carry no CSS transition on transform or
  // opacity. A 200ms transition on a value that is itself updated every
  // frame just makes the scaling lag the scroll, which is what made the
  // motion feel rubbery; driven per frame, the scroll position *is* the
  // animation.
  const applyFalloff = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return -1;
    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    const cards = cardRefs.current;

    // Measure everything before writing anything: interleaving
    // getBoundingClientRect with style writes would force a synchronous
    // layout per card.
    let closestIndex = 0;
    let closestDist = Infinity;
    const distances: number[] = new Array(cards.length);
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) {
        distances[i] = 0;
        continue;
      }
      const rect = card.getBoundingClientRect();
      // A scaled card's box shrinks around its own center, so the center
      // stays where the layout put it — safe to measure mid-transform.
      const dist = Math.abs(rect.left + rect.width / 2 - scrollerCenter);
      distances[i] = dist;
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) continue;
      const falloff = Math.min(distances[i] / FALLOFF_RANGE, 1);
      card.style.transform = `scale(${(1 - falloff * 0.22).toFixed(4)})`;
      card.style.opacity = (1 - falloff * 0.65).toFixed(4);
    }

    return closestIndex;
  }, []);

  // Jump — instantly, no animation — from a clone onto the real card it
  // stands for. Because both sides render `cloneCount` clones, the clone and
  // its real counterpart always have matching neighbor cards, so this jump
  // is invisible; it just means the next drag/scroll continues into more
  // real cards instead of running out of content. Re-measures afterwards
  // because every card has effectively moved a whole roster-length, which
  // would otherwise leave the previous frame's falloff on the wrong cards
  // until the next scroll event — a visible flash of a dimmed centre card.
  const recenterOnReal = useCallback(
    (extIndex: number) => {
      const realExt = toReal(extIndex) + cloneCount;
      clearTimeout(settleTimer.current);
      scrollToIndex(realExt, "auto");
      activeExtRef.current = realExt;
      setActiveExt(realExt);
      applyFalloff();
      return realExt;
    },
    [toReal, cloneCount, scrollToIndex, applyFalloff]
  );

  // If we've settled on a clone, re-centre on the real card.
  const checkAndSnapToReal = useCallback(() => {
    if (!isCloneIndex(activeExtRef.current)) return;
    recenterOnReal(activeExtRef.current);
  }, [isCloneIndex, recenterOnReal]);

  const updateActive = useCallback(() => {
    const closest = applyFalloff();
    if (closest < 0) return;

    if (closest !== activeExtRef.current) {
      activeExtRef.current = closest;
      setActiveExt(closest);
    }

    clearTimeout(settleTimer.current);

    // Normally the re-centre waits for the scroller to go quiet, so it can
    // never interrupt a gesture in progress. Two situations cannot wait:
    //
    //  - A pointer drag. Waiting means the drag keeps travelling into the
    //    clone buffer and eventually reaches the scroller's hard edge, where
    //    the carousel simply stops moving under the user's hand.
    //  - Arriving within one card of either end of the extended list, which
    //    a fast wheel or touch fling can do between two frames. There is no
    //    runway left to wait with.
    //
    // Both are safe to do mid-gesture now that scrollToIndex carries the
    // drag baseline along with the jump.
    if (isCloneIndex(closest)) {
      const atEdge = closest <= 0 || closest >= extended.length - 1;
      if (isDragging.current || atEdge) {
        recenterOnReal(closest);
        return;
      }
    }

    settleTimer.current = setTimeout(checkAndSnapToReal, SETTLE_MS);
  }, [
    applyFalloff,
    isCloneIndex,
    extended.length,
    recenterOnReal,
    checkAndSnapToReal,
  ]);

  useIsomorphicLayoutEffect(() => {
    // Center the initial card on mount, before the browser paints (layout
    // effect): the philosopher the user last visited if one is remembered,
    // otherwise the first. On first load the inline script below has already
    // positioned the scroller during HTML parsing, so this is a no-op;
    // on client-side navigations (e.g. backing out of a conversation) this
    // is what centers the card and prevents a one-frame flash of the
    // leftmost clone.
    const lastId = getLastPhilosopherId();
    const lastReal = lastId
      ? philosophers.findIndex((p) => p.id === lastId)
      : -1;
    const initialReal = lastReal >= 0 ? lastReal : 0;
    scrollToIndex(wraps ? initialReal + cloneCount : initialReal, "auto");
    updateActive();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // Now that the scroller is centered, reveal it (see the style prop on
    // the scroller). Direct DOM write, before paint.
    scroller.style.visibility = "visible";

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActive);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(settleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateActive]);

  // Resolves the current position to a "real" (non-clone) extended index,
  // so prev/next always step from real content even if called right after
  // landing on a clone, before the silent snap-back has run. Critically,
  // if we're still on a clone, this also performs that snap-back *now*
  // (synchronously, no animation) rather than just computing where it
  // would land — otherwise the caller's next smooth scroll would animate
  // all the way from the clone's actual on-screen position to the target,
  // producing a long, visible slide instead of a single-card hop.
  const resolveCanonical = useCallback(() => {
    const extIdx = activeExtRef.current;
    if (!isCloneIndex(extIdx)) return extIdx;
    return recenterOnReal(extIdx);
  }, [isCloneIndex, recenterOnReal]);

  const goPrev = () => scrollToIndex(resolveCanonical() - 1);
  const goNext = () => scrollToIndex(resolveCanonical() + 1);

  // Activating the centered card opens its profile page; activating a
  // flanking card just slides the carousel to it (same as the arrows) —
  // you can only "enter" the philosopher you're looking at.
  const activateCard = useCallback(
    (extIndex: number) => {
      if (extIndex === activeExtRef.current) {
        // router.push gets none of Link's built-in affordances, so tell the
        // progress bar ourselves — otherwise the profile page's hero image
        // leaves the click looking unanswered.
        startRouteProgress();
        router.push(`/philosopher/${extended[extIndex].id}`);
      } else {
        scrollToIndex(extIndex);
      }
    },
    [extended, router, scrollToIndex]
  );

  const handleCardClick = useCallback(
    (extIndex: number) => {
      if (didDrag.current) return;
      activateCard(extIndex);
    },
    [activateCard]
  );

  // Stable across renders, so a memoised card never detaches and re-attaches
  // its ref just because a sibling became active.
  const registerCardRef = useCallback(
    (extIndex: number, el: HTMLDivElement | null) => {
      cardRefs.current[extIndex] = el;
    },
    []
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller || e.pointerType === "touch") return;
    // If the carousel is resting on a clone, re-centre on the real card
    // before the drag baseline is captured, so the gesture begins on real
    // content with a full clone buffer on both sides. Ordering matters: the
    // baseline below has to be read *after* this jump.
    resolveCanonical();
    isDragging.current = true;
    didDrag.current = false;
    const extAttr = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-ext-index]"
    )?.dataset.extIndex;
    pressedCardExt.current = extAttr !== undefined ? Number(extAttr) : null;
    dragStartX.current = e.clientX;
    dragStartScroll.current = scroller.scrollLeft;
    scroller.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller || !isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 4) didDrag.current = true;
    scroller.scrollLeft = dragStartScroll.current - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const scroller = scrollerRef.current;
    // A mouse press that never moved past the drag threshold and ended with
    // pointerup (not pointerleave) is a click on the pressed card.
    const clickedExt =
      isDragging.current && !didDrag.current && e.type === "pointerup"
        ? pressedCardExt.current
        : null;
    pressedCardExt.current = null;
    isDragging.current = false;
    if (scroller?.hasPointerCapture(e.pointerId)) {
      scroller.releasePointerCapture(e.pointerId);
    }
    if (didDrag.current) {
      requestAnimationFrame(() => scrollToIndex(activeExtRef.current));
    } else if (clickedExt !== null) {
      // Swallow any `click` event a browser may still deliver to the cards,
      // so handleCardClick (kept for touch and keyboard) can't double-fire.
      didDrag.current = true;
      activateCard(clickedExt);
    }
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-ink-950 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ink-950 to-transparent sm:w-24" />

      <button
        onClick={goPrev}
        aria-label="Previous philosopher"
        className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ink-700 bg-ink-900/80 p-2 text-parchment backdrop-blur transition duration-150 hover:border-parchment active:scale-90 active:bg-ink-800 sm:left-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={goNext}
        aria-label="Next philosopher"
        className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ink-700 bg-ink-900/80 p-2 text-parchment backdrop-blur transition duration-150 hover:border-parchment active:scale-90 active:bg-ink-800 sm:right-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        // A drag across the cards would otherwise sweep up a text selection
        // (the names and blurbs). The selection itself is invisible enough,
        // but pressing on it to drag again starts a *native* HTML5 drag of
        // the selected text, and the resulting `dragstart` makes the browser
        // fire `pointercancel` — so every drag after the first one died on
        // the spot. `select-none` stops the selection ever forming;
        // preventing dragstart also covers the portraits, which are natively
        // draggable images.
        onDragStart={(e) => e.preventDefault()}
        className="no-scrollbar flex cursor-grab touch-pan-x select-none snap-x snap-mandatory gap-4 overflow-x-auto py-8 active:cursor-grabbing sm:gap-6"
        // Hidden until centered on the first real card, so the browser can
        // never paint the scroller at scrollLeft 0 (which would center the
        // leftmost clone — the *last* philosopher). The inline script after
        // the scroller reveals it on first load; the mount layout effect
        // reveals it on client-side navigations. Never toggled via React
        // state, so re-renders leave the DOM value alone.
        style={{ visibility: "hidden" }}
        // The inline script flips visibility on the live DOM before React
        // hydrates, so the server HTML ("visible" by then) intentionally
        // differs from this JSX ("hidden"). Suppress the mismatch warning;
        // React keeps the DOM value, which is exactly what we want.
        suppressHydrationWarning
      >
        <div className="w-[13%] shrink-0 sm:w-[36.5%]" aria-hidden />
        {extended.map((p, i) => (
          <CarouselCard
            key={`${p.id}-${i}`}
            philosopher={p}
            extIndex={i}
            isActive={i === activeExt}
            // First-paint values only: at rest every non-centered card sits
            // beyond FALLOFF_RANGE, so the server HTML already shows them
            // dimmed and shrunk. These stay constant across renders, which
            // is what lets applyFalloff's direct DOM writes survive
            // re-renders — React only touches style properties whose JSX
            // value changed.
            atRest={i !== initialActiveExt}
            // Deliberately keyed off the *initial* centre rather than the
            // current one: a window that tracked activeExt would rewrite
            // `loading` on a third of the cards every time the centre moved,
            // and would still be starting a portrait's fetch at the moment
            // it scrolled into view. This window covers the first paint;
            // `preloadAll` picks up everything else once the page is idle.
            eager={preloadAll || Math.abs(i - initialActiveExt) <= VISIBLE_HALF}
            onActivate={handleCardClick}
            registerRef={registerCardRef}
          />
        ))}
        <div className="w-[13%] shrink-0 sm:w-[36.5%]" aria-hidden />
      </div>

      {/* Centers the initial card and reveals the scroller while the HTML
          is still being parsed — before React hydrates. The initial card is
          the last-visited philosopher when sessionStorage remembers one
          (matched by data-card-id among the real, non-clone cards),
          otherwise the first real card. The scroller ships with
          visibility:hidden, so no intermediate frame can ever paint it at
          scrollLeft 0 (Sartre centered); it becomes visible only here,
          already centered. document.currentScript is null when React
          re-executes this on a client-side mount, so it no-ops there and
          the layout effect above takes over. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var t=document.currentScript,s=t&&t.previousElementSibling;if(!s)return;var f=${
            (wraps ? cloneCount : 0) + 1
          },n=${count},k=s.children,i=f;try{var d=sessionStorage.getItem(${JSON.stringify(
            LAST_PHILOSOPHER_STORAGE_KEY
          )});if(d)for(var j=f;j<f+n;j++){if(k[j]&&k[j].getAttribute("data-card-id")===d){i=j;break;}}}catch(e){}var c=k[i];if(c){var a=s.getBoundingClientRect(),b=c.getBoundingClientRect();s.scrollLeft+=b.left+b.width/2-(a.left+a.width/2);}s.style.visibility="visible";})();`,
        }}
      />

      {/* The dots themselves are 6px tall; the buttons around them are padded
          out to a real tap target so they can actually be hit. */}
      <div className="flex justify-center">
        {philosophers.map((p, i) => (
          <button
            key={p.id}
            aria-label={`Go to ${p.name}`}
            aria-current={i === activeReal}
            onClick={() => scrollToIndex(wraps ? i + cloneCount : i)}
            className="group flex h-8 items-center justify-center px-1"
          >
            <span
              className="block h-1.5 rounded-full transition-[width,background-color,transform] duration-200 ease-out group-hover:scale-y-125 group-active:scale-y-150"
              style={{
                width: i === activeReal ? 20 : 6,
                background: i === activeReal ? p.accent : "#33333d",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface CarouselCardProps {
  philosopher: Philosopher;
  extIndex: number;
  isActive: boolean;
  atRest: boolean;
  eager: boolean;
  onActivate: (extIndex: number) => void;
  registerRef: (extIndex: number, el: HTMLDivElement | null) => void;
}

/**
 * One card in the extended list. Memoised because `activeExt` lives in React
 * state on the carousel: without this, moving one card to the centre
 * re-renders every card in the strip (31 of them at full roster, each with a
 * next/image portrait) when only two have actually changed appearance.
 *
 * Nothing here reads the scroll position — scale and opacity are written
 * straight to the DOM by applyFalloff, and the JSX values below are the
 * constant at-rest ones, so a re-render never fights the per-frame styling.
 */
const CarouselCard = memo(function CarouselCard({
  philosopher: p,
  extIndex,
  isActive,
  atRest,
  eager,
  onActivate,
  registerRef,
}: CarouselCardProps) {
  const setRef = useCallback(
    (el: HTMLDivElement | null) => registerRef(extIndex, el),
    [registerRef, extIndex]
  );
  const activate = useCallback(
    () => onActivate(extIndex),
    [onActivate, extIndex]
  );
  const scale = atRest ? 1 - 0.22 : 1;
  const opacity = atRest ? 1 - 0.65 : 1;

  return (
    <div
      ref={setRef}
      data-card-id={p.id}
      data-ext-index={extIndex}
      onClick={activate}
      role="button"
      tabIndex={0}
      aria-label={isActive ? `View ${p.name}'s profile` : `Go to ${p.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      // Only the colors transition. Scale and opacity are driven
      // frame-by-frame from the scroll position (see applyFalloff), so a
      // transition on them would only add lag.
      className="relative flex w-[74%] shrink-0 cursor-pointer snap-center flex-col items-center rounded-2xl border p-6 text-center transition-[background-color,border-color] duration-200 ease-out sm:w-[27%]"
      style={{
        transform: `scale(${scale})`,
        opacity,
        borderColor: isActive ? p.accent : "#26262e",
        background: isActive ? `${p.accent}14` : "rgba(19,19,23,0.5)",
      }}
    >
      {/* Real content. Present from first render (so the card sizes
          correctly and nothing reflows on reveal). */}
      <div className="flex flex-col items-center">
        <Portrait
          initials={p.initials}
          accent={p.accent}
          imageSrc={p.image}
          crop={p.imageCrop}
          size={148}
          eager={eager}
        />
        <h3 className="mt-4 font-serif text-2xl text-parchment">{p.name}</h3>
        <span className="mt-1 text-xs text-muted">{p.dates}</span>
        <p className="mt-3 text-sm text-muted">{p.blurb}</p>
        <p className="mt-4 min-h-[1.5em] text-xs" style={{ color: p.accent }}>
          {p.voiceNote}
          <span
            data-profile-prompt
            aria-hidden={!isActive}
            className={`ml-2 text-muted ${isActive ? "visible" : "invisible"}`}
          >
            View profile →
          </span>
        </p>
      </div>
    </div>
  );
});
