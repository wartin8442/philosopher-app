"use client";

import { useRef } from "react";

interface MicButtonProps {
  listening: boolean;
  /** Mic requested but not yet capturing — speech is still being dropped. */
  preparing?: boolean;
  disabled?: boolean;
  accent: string;
  /** Button diameter in px. */
  size?: number;
  onStart: () => void;
  onStop: () => void;
  /**
   * Called when a press looks imminent (hover, keyboard focus) so the
   * microphone can start opening before it happens. Must be cheap and silent —
   * it fires on hovers that never become presses.
   */
  onPrewarm?: () => void;
}

/** Large, obvious microphone control with a clear recording indicator. */
export default function MicButton({
  listening,
  preparing = false,
  disabled,
  accent,
  size = 64,
  onStart,
  onStop,
  onPrewarm,
}: MicButtonProps) {
  const pointerHandled = useRef(false);
  const active = listening || preparing;
  const toggle = () => (active ? onStop() : onStart());

  return (
    <button
      type="button"
      disabled={disabled}
      // Reaching for the button is the last warning before speech. On a mouse
      // it buys the moment between hover and press; on touch the two arrive
      // together and nothing is lost by asking anyway.
      onPointerEnter={() => {
        if (!disabled && !active) onPrewarm?.();
      }}
      onFocus={() => {
        if (!disabled && !active) onPrewarm?.();
      }}
      // Toggle on pointerdown so capture begins the instant the button is
      // pressed; click fires on release, which is late enough to clip the
      // user's first words.
      onPointerDown={() => {
        if (disabled) return;
        pointerHandled.current = true;
        toggle();
      }}
      onClick={() => {
        // Pointer presses were already handled above; this path is for
        // keyboard activation (Enter/Space), which emits click only.
        if (pointerHandled.current) {
          pointerHandled.current = false;
          return;
        }
        toggle();
      }}
      aria-pressed={active}
      aria-label={
        listening
          ? "Stop listening"
          : preparing
            ? "Starting microphone"
            : "Start speaking"
      }
      className="relative flex shrink-0 items-center justify-center rounded-full border transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
      style={{
        width: size,
        height: size,
        borderColor: active ? accent : "#33333d",
        background: listening
          ? `${accent}22`
          : preparing
            ? `${accent}11`
            : "#1c1c22",
        boxShadow: listening ? `0 0 20px ${accent}55` : "none",
      }}
    >
      {listening && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
      )}
      <svg
        className={preparing ? "animate-pulse" : undefined}
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? accent : "#e8e2d4"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </svg>
    </button>
  );
}
