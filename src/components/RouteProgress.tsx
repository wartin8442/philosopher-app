"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Event a component can dispatch to start the bar for a navigation that
 * doesn't go through an <a> — i.e. anything using router.push (the
 * carousel, the duel setup). Firing it for a navigation that never happens
 * is harmless: the bar times out on its own.
 */
export const ROUTE_START_EVENT = "philosophers:route-start";

/** Announce a programmatic navigation to the progress bar. */
export function startRouteProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ROUTE_START_EVENT));
  }
}

// Navigations that resolve faster than this never show a bar — a flash of
// progress on an already-prefetched page reads as noise, not feedback.
const SHOW_DELAY_MS = 90;
// A route that never resolves (blocked, failed) must not leave the bar
// creeping forever.
const GIVE_UP_MS = 15000;

type Phase = "idle" | "loading" | "done";

/**
 * Thin accent bar across the top of the viewport while a route transition is
 * in flight.
 *
 * Next.js App Router navigations are asynchronous: the click is handled
 * immediately but nothing repaints until the new route's server components
 * arrive. On the heavier pages here (the philosopher profile with its
 * full-bleed hero, the carousel) that gap is long enough to read as a dead
 * CTA. This closes the loop within a frame of the click.
 *
 * Start is detected from a capture-phase click on any in-app link (so it
 * runs before Next's own handler and before React re-renders), plus
 * popstate for back/forward and an explicit event for router.push callers.
 * Completion is the pathname/search actually changing.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");

  // The route we were on when the current navigation started. Used to ignore
  // "navigations" to the page we are already on, which never re-render and
  // would otherwise strand the bar until the give-up timer.
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const giveUpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const doneTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimers = useCallback(() => {
    clearTimeout(showTimer.current);
    clearTimeout(giveUpTimer.current);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    clearTimeout(doneTimer.current);
    showTimer.current = setTimeout(() => setPhase("loading"), SHOW_DELAY_MS);
    giveUpTimer.current = setTimeout(() => setPhase("idle"), GIVE_UP_MS);
  }, [clearTimers]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Only plain left-clicks navigate; everything else opens a new tab or
      // is handled by the browser.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href) return;

      const url = new URL(href, window.location.href);
      // External links leave the app entirely; in-page anchors just scroll.
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      start();
    };

    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", start);
    window.addEventListener(ROUTE_START_EVENT, start);
    return () => {
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", start);
      window.removeEventListener(ROUTE_START_EVENT, start);
    };
  }, [start]);

  // The route changed: finish the bar (or drop it silently if it never
  // became visible).
  useEffect(() => {
    clearTimers();
    setPhase((current) => (current === "loading" ? "done" : "idle"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Clear the completed bar once its fade-out has played.
  useEffect(() => {
    if (phase !== "done") return;
    doneTimer.current = setTimeout(() => setPhase("idle"), 450);
    return () => clearTimeout(doneTimer.current);
  }, [phase]);

  useEffect(() => () => {
    clearTimeout(showTimer.current);
    clearTimeout(giveUpTimer.current);
    clearTimeout(doneTimer.current);
  }, []);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]"
    >
      <div
        // Keying by phase restarts the creep animation from zero on each new
        // navigation instead of resuming a half-finished one.
        key={phase}
        className={`h-full w-full ${
          phase === "loading" ? "route-progress-creep" : "route-progress-done"
        }`}
        style={{
          background:
            "linear-gradient(to right, rgba(201,162,75,0.35), #c9a24b)",
          boxShadow: "0 0 12px rgba(201,162,75,0.55)",
        }}
      />
    </div>
  );
}
