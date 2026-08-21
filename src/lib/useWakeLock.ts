"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Hold the phone's screen awake while a voice exchange is under way.
 *
 * A voice-first app has a problem no typed one has: for minutes at a time
 * nobody touches the glass. The listener is listening and the speaker is
 * speaking, and as far as the operating system can tell the device is idle, so
 * it dims and then locks — mid-sentence, every time. The Screen Wake Lock API
 * is the only way to say otherwise.
 *
 * Two things about the lock are easy to get wrong:
 *
 * - **The browser takes it back the moment the tab is hidden**, and does not
 *   give it back on its own. Returning from the lock screen or another app
 *   therefore has to re-request it, which is what the `visibilitychange`
 *   listener is for.
 * - **A request only succeeds while the document is visible.** Asking from a
 *   hidden tab rejects, so `sync` simply does not ask, and leaves it to that
 *   same listener.
 *
 * Unsupported browsers (iOS Safari before 16.4) reject or lack the API
 * entirely; every failure is swallowed, because the fallback — the screen
 * behaving the way it did before — is not worth interrupting anyone over.
 */

/**
 * How long the lock is kept after the exchange goes quiet.
 *
 * Turns hand off through a gap of a second or two — the mic closes, the reply
 * is still being fetched, nothing is speaking yet — and releasing across every
 * one of those would mean a request per turn for no gain, since no phone dims
 * in two seconds anyway. Holding through the gap costs nothing and makes the
 * lock one continuous thing for the length of the conversation.
 */
const RELEASE_GRACE_MS = 30_000;

/**
 * @param active Whether something is happening that the user is watching or
 *   listening to rather than touching — speaking, listening, or waiting on a
 *   reply. False releases the lock (after a grace period) and lets the phone
 *   sleep normally.
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  // Whether the lock should be held right now — `active` plus whatever is left
  // of the grace period. Read inside async callbacks, so it is a ref.
  const wantRef = useRef(false);
  const pendingRef = useRef(false);
  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    if (!wantRef.current) {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      await sentinel?.release().catch(() => {});
      return;
    }

    if (sentinelRef.current || pendingRef.current) return;
    if (document.visibilityState !== "visible") return;

    pendingRef.current = true;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      // The exchange may have ended while the request was in flight.
      if (!wantRef.current) {
        void sentinel.release().catch(() => {});
        return;
      }
      sentinelRef.current = sentinel;
      // Fires both for our own release() and for the browser revoking the lock
      // when the tab is hidden; either way the sentinel is spent.
      sentinel.addEventListener("release", () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null;
      });
    } catch {
      // Unsupported, denied by policy, or the tab lost visibility mid-request.
    } finally {
      pendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (active) {
      if (graceRef.current) {
        clearTimeout(graceRef.current);
        graceRef.current = null;
      }
      wantRef.current = true;
      void sync();
      return;
    }
    if (!wantRef.current || graceRef.current) return;
    graceRef.current = setTimeout(() => {
      graceRef.current = null;
      wantRef.current = false;
      void sync();
    }, RELEASE_GRACE_MS);
  }, [active, sync]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => void sync();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (graceRef.current) {
        clearTimeout(graceRef.current);
        graceRef.current = null;
      }
      // Leaving the page ends the exchange, grace period or not.
      wantRef.current = false;
      void sync();
    };
  }, [sync]);
}
