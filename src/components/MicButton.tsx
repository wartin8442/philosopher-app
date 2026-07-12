"use client";

import { useRef } from "react";

interface MicButtonProps {
  listening: boolean;
  disabled?: boolean;
  accent: string;
  /** Button diameter in px. */
  size?: number;
  onStart: () => void;
  onStop: () => void;
}

/** Large, obvious microphone control with a clear recording indicator. */
export default function MicButton({
  listening,
  disabled,
  accent,
  size = 64,
  onStart,
  onStop,
}: MicButtonProps) {
  const pointerHandled = useRef(false);
  const toggle = () => (listening ? onStop() : onStart());

  return (
    <button
      type="button"
      disabled={disabled}
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
      aria-pressed={listening}
      aria-label={listening ? "Stop listening" : "Start speaking"}
      className="relative flex items-center justify-center rounded-full border transition disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        width: size,
        height: size,
        borderColor: listening ? accent : "#33333d",
        background: listening ? `${accent}22` : "#1c1c22",
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
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 24 24"
        fill="none"
        stroke={listening ? accent : "#e8e2d4"}
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
