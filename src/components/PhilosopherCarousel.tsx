"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Portrait from "@/components/Portrait";
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

/**
 * Horizontal, scroll-snapped carousel showing three philosophers at a time.
 * Cards outside the center dim and shrink slightly, hinting at more to
 * either side. Clicking anywhere on a card (centered or not) enters that
 * philosopher's conversation; dragging still just scrolls.
 *
 * Navigation is circular: the last two philosophers are cloned and
 * prepended, and the first two are cloned and appended, so the first and
 * last real cards always have real (not blank) neighbors on both sides.
 * Once a clone settles into the center, we silently (no animation) re-center
 * on its real counterpart — since both sides render the same neighbor
 * cards, this re-centering is visually invisible, so the loop continues
 * seamlessly in either direction with no dead end and no visible pop.
 */
export default function PhilosopherCarousel({
  philosophers,
}: PhilosopherCarouselProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = philosophers.length;
  const wraps = count > 1;
  // Two clones on each side (not one) so that whichever card is centered —
  // a clone or its real counterpart — the cards peeking in on either side
  // are the same, either way. That's what makes the later silent re-snap
  // (see checkAndSnapToReal) truly invisible instead of a visible "pop" in
  // the peripheral cards.
  const cloneCount = wraps ? Math.min(2, count - 1) : 0;

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

  const [activeExt, setActiveExt] = useState(wraps ? cloneCount : 0);
  const activeExtRef = useRef(activeExt);
  // Seed distances so the server-rendered HTML already shows non-active
  // cards dimmed/shrunk (at rest, every non-centered card sits beyond
  // FALLOFF_RANGE). Real pixel distances take over on mount.
  const [distances, setDistances] = useState<number[]>(() =>
    extended.map((_, i) =>
      i === (wraps ? cloneCount : 0) ? 0 : FALLOFF_RANGE * 2
    )
  );
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

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const card = cardRefs.current[index];
      card?.scrollIntoView({
        behavior,
        inline: "center",
        block: "nearest",
      });
    },
    []
  );

  // Instantly (synchronously) repositions the scroller so the given index
  // is centered, with no animation. Uses a direct scrollLeft delta rather
  // than `scrollIntoView(behavior: "auto")` because some browsers soften
  // "auto" scrolls into a brief animation when combined with CSS
  // `scroll-snap-type: mandatory`, which would make this "invisible" snap
  // visible.
  const snapInstantly = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    const card = cardRefs.current[index];
    if (!scroller || !card) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta =
      cardRect.left + cardRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2);
    scroller.scrollLeft += delta;
  }, []);

  // If we've settled on a clone, instantly snap to the equivalent real card
  // with no animation. Because both sides render `cloneCount` clones, the
  // clone and its real counterpart always have matching neighbor cards, so
  // this jump is invisible — it just means the next drag/scroll continues
  // into more real cards instead of running out of content.
  const checkAndSnapToReal = useCallback(() => {
    if (!wraps) return;
    const extIdx = activeExtRef.current;
    const isClone = extIdx < cloneCount || extIdx > extended.length - 1 - cloneCount;
    if (isClone) {
      const realExt = toReal(extIdx) + cloneCount;
      snapInstantly(realExt);
      activeExtRef.current = realExt;
      setActiveExt(realExt);
    }
  }, [wraps, cloneCount, extended.length, toReal, snapInstantly]);

  const updateActive = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;

    let closestIndex = 0;
    let closestDist = Infinity;
    const nextDistances = cardRefs.current.map((card, i) => {
      if (!card) return 0;
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(cardCenter - scrollerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
      return dist;
    });

    setDistances(nextDistances);
    setActiveExt(closestIndex);
    activeExtRef.current = closestIndex;

    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(checkAndSnapToReal, 150);
  }, [checkAndSnapToReal]);

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
  const resolveCanonical = () => {
    const extIdx = activeExtRef.current;
    if (!wraps) return extIdx;
    const isClone = extIdx < cloneCount || extIdx > extended.length - 1 - cloneCount;
    if (!isClone) return extIdx;
    const realExt = toReal(extIdx) + cloneCount;
    clearTimeout(settleTimer.current);
    snapInstantly(realExt);
    activeExtRef.current = realExt;
    setActiveExt(realExt);
    return realExt;
  };

  const goPrev = () => scrollToIndex(resolveCanonical() - 1);
  const goNext = () => scrollToIndex(resolveCanonical() + 1);

  // Activating the centered card enters its conversation; activating a
  // flanking card just slides the carousel to it (same as the arrows) —
  // you can only "enter" the philosopher you're looking at.
  const activateCard = (extIndex: number) => {
    if (extIndex === activeExtRef.current) {
      router.push(`/conversation/${extended[extIndex].id}`);
    } else {
      scrollToIndex(extIndex);
    }
  };

  const handleCardClick = (extIndex: number) => {
    if (didDrag.current) return;
    activateCard(extIndex);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller || e.pointerType === "touch") return;
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
        className="absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ink-700 bg-ink-900/80 p-2 text-parchment backdrop-blur transition hover:border-parchment sm:left-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={goNext}
        aria-label="Next philosopher"
        className="absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ink-700 bg-ink-900/80 p-2 text-parchment backdrop-blur transition hover:border-parchment sm:right-3"
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
        onPointerLeave={endDrag}
        className="no-scrollbar flex cursor-grab touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto py-8 active:cursor-grabbing sm:gap-6"
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
        {extended.map((p, i) => {
          const dist = distances[i] ?? 0;
          const falloff = Math.min(dist / FALLOFF_RANGE, 1);
          const scale = 1 - falloff * 0.22;
          const opacity = 1 - falloff * 0.65;
          const isActive = i === activeExt;
          return (
            <div
              key={`${p.id}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-card-id={p.id}
              data-ext-index={i}
              onClick={() => handleCardClick(i)}
              role="button"
              tabIndex={0}
              aria-label={
                isActive
                  ? `Enter conversation with ${p.name}`
                  : `Go to ${p.name}`
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(i);
                }
              }}
              className="flex w-[74%] shrink-0 snap-center flex-col items-center rounded-2xl border p-6 text-center transition-[transform,opacity,background-color,border-color] duration-200 ease-out sm:w-[27%]"
              style={{
                transform: `scale(${scale})`,
                opacity,
                borderColor: isActive ? p.accent : "#26262e",
                background: isActive ? `${p.accent}14` : "rgba(19,19,23,0.5)",
              }}
            >
              <Portrait
                initials={p.initials}
                accent={p.accent}
                imageSrc={p.image}
                crop={p.imageCrop}
                size={148}
                // Every card's portrait must be fetched up front: offscreen
                // cards (including the wraparound clones) would otherwise
                // lazy-load, popping in blank when scrolled to the ends.
                eager
              />
              <h3 className="mt-4 font-serif text-2xl text-parchment">
                {p.name}
              </h3>
              <span className="mt-1 text-xs text-muted">{p.dates}</span>
              <p className="mt-3 text-sm text-muted">{p.blurb}</p>
              <p className="mt-4 min-h-[1.5em] text-xs" style={{ color: p.accent }}>
                {p.voiceNote}
                {isActive && (
                  <span className="ml-2 text-muted">
                    Enter conversation →
                  </span>
                )}
              </p>
            </div>
          );
        })}
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

      <div className="mt-1 flex justify-center gap-2">
        {philosophers.map((p, i) => (
          <button
            key={p.id}
            aria-label={`Go to ${p.name}`}
            onClick={() => scrollToIndex(wraps ? i + cloneCount : i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === activeReal ? 20 : 6,
              background: i === activeReal ? p.accent : "#33333d",
            }}
          />
        ))}
      </div>
    </div>
  );
}
