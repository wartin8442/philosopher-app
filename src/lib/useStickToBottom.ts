"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps a scrollable transcript pinned to its newest content — but only while
 * the user is already at the bottom. Scrolling up releases the pin so they can
 * read at their own pace; scrolling back near the bottom re-engages it.
 */
export function useStickToBottom<T extends HTMLElement>(
  deps: readonly unknown[],
) {
  const scrollRef = useRef<T | null>(null);
  const pinnedRef = useRef(true);

  /** Attach to the scroll container's onScroll. */
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  /** Re-engage following, e.g. when the user submits something new. */
  const pin = useCallback(() => {
    pinnedRef.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Jump instantly rather than smooth-scrolling: streamed fragments arrive
  // faster than an animation finishes, and the animation's own scroll events
  // would falsely release the pin.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  /**
   * Follow content that grows *after* it was rendered.
   *
   * The effect above pins on the render that added something, which is right
   * for text but too early for pictures: an image occupies no height until it
   * has loaded, so a transcript full of them goes on growing for a second
   * afterwards and pushes the thing that was pinned back up off the screen.
   * The student is then left reading the middle of the transcript instead of
   * looking at the lecture. Watching the container's own children catches
   * that, and every other late change of height with it.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const follow = new ResizeObserver(() => {
      if (pinnedRef.current) el.scrollTop = el.scrollHeight;
    });
    const watch = () => {
      follow.disconnect();
      for (const child of el.children) follow.observe(child);
    };
    watch();
    // Children come and go — the transcript appears once there is one — so
    // the set being watched is rebuilt whenever the container's own list
    // changes, rather than being fixed at mount.
    const structure = new MutationObserver(watch);
    structure.observe(el, { childList: true });
    return () => {
      follow.disconnect();
      structure.disconnect();
    };
  }, []);

  return { scrollRef, onScroll, pin };
}
