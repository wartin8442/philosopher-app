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

  return { scrollRef, onScroll, pin };
}
