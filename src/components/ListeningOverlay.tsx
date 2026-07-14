"use client";

import { useEffect, useRef, useState } from "react";

interface ListeningOverlayProps {
  /** Show the overlay (mic requested or actively capturing). */
  active: boolean;
  /** Mic requested but not yet capturing — speech is still being dropped. */
  preparing?: boolean;
  /** Live interim transcript. */
  transcript: string;
  accent: string;
  /** Small caption above the transcript, e.g. "Speaking to Seneca". */
  speakerLabel?: string;
  /** Stop listening and submit what was said. */
  onDone: () => void;
  /** Stop listening and throw the words away. */
  onCancel: () => void;
}

const FADE_MS = 350;

/**
 * Full-screen immersive voice-capture surface. While the mic is open it
 * takes over the page: dimmed backdrop, a breathing accent orb, and the
 * live transcript rendered large enough to read at a glance, with new
 * words drifting in as they are recognized.
 */
export default function ListeningOverlay({
  active,
  preparing = false,
  transcript,
  accent,
  speakerLabel,
  onDone,
  onCancel,
}: ListeningOverlayProps) {
  // Stay mounted through the exit fade so the overlay dissolves rather
  // than vanishing the instant recognition ends.
  const [mounted, setMounted] = useState(active);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (active) {
      setMounted(true);
      // Double rAF: the element must paint at opacity 0 once before the
      // transition to opacity 1 can animate.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  // Long transcripts scroll; keep the newest words in view.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  // Escape discards, matching what the X button does.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!mounted) return null;

  const words = transcript.trim() ? transcript.trim().split(/\s+/) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice input"
      className="fixed inset-0 z-50 flex flex-col items-center transition-opacity duration-300"
      style={{
        opacity: shown ? 1 : 0,
        background: "rgba(11, 11, 13, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Ambient accent glow rising from the bottom of the screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 45% at 50% 100%, ${accent}1f, transparent 70%)`,
        }}
      />

      {speakerLabel && (
        <p className="relative mt-10 px-6 text-center text-xs uppercase tracking-[0.25em] text-muted">
          {speakerLabel}
        </p>
      )}

      {/* Transcript: large, centered, newest words always in view. The mask
          fades the top edge so overflowing text dissolves instead of
          clipping against a hard line. */}
      <div
        ref={scrollRef}
        className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center overflow-y-auto px-8 py-12 no-scrollbar"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 12%, black 90%, transparent)",
        }}
      >
        {words.length > 0 ? (
          <p
            aria-live="polite"
            className="text-center font-serif text-2xl leading-relaxed text-parchment sm:text-3xl sm:leading-relaxed"
          >
            {words.map((word, i) => (
              // Keyed by position: a new word mounts a new span and runs the
              // entrance animation; earlier words the recognizer revises just
              // swap their text without re-animating.
              <span key={i} className="word-in inline-block">
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
            <span
              aria-hidden
              className="ml-2 inline-block h-6 w-[3px] translate-y-0.5 animate-pulse rounded-full sm:h-7"
              style={{ background: accent }}
            />
          </p>
        ) : (
          <p className="text-center font-serif text-2xl italic text-muted sm:text-3xl">
            {preparing ? "Waking the microphone…" : "Listening…"}
          </p>
        )}
      </div>

      {/* Breathing orb: the "I can hear you" heartbeat of the screen. */}
      <div aria-hidden className="relative flex h-20 items-center justify-center">
        <span
          className="orb-breathe block rounded-full"
          style={{
            width: 44,
            height: 44,
            background: `radial-gradient(circle at 35% 35%, ${accent}, ${accent}55 70%)`,
            boxShadow: `0 0 48px 12px ${accent}44`,
            animationPlayState: preparing ? "paused" : "running",
            opacity: preparing ? 0.4 : 1,
          }}
        />
      </div>

      <p className="relative px-6 text-center text-xs text-muted">
        {preparing
          ? "One moment — don't speak just yet"
          : "Pause, and your words will be sent"}
      </p>

      {/* Controls: discard on the left, finish-and-send on the right. */}
      <div className="relative mb-10 mt-6 flex items-center gap-8">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel and discard"
          title="Cancel (Esc)"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-ink-700 text-muted transition hover:border-ink-600 hover:text-parchment"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={words.length === 0}
          aria-label="Finish and send"
          title="Finish and send"
          className="flex h-16 w-16 items-center justify-center rounded-full border transition disabled:opacity-40"
          style={{
            borderColor: accent,
            background: `${accent}22`,
            boxShadow: words.length > 0 ? `0 0 24px ${accent}44` : "none",
            color: accent,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
