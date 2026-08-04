"use client";

import { useEffect, useState } from "react";
import { AnswerLevel } from "@/lib/types";

interface LevelSelectOverlayProps {
  /** Heading, e.g. "At what level should Friedrich Nietzsche speak?" */
  title: string;
  /**
   * Possessive for the advanced option's description — "Friedrich
   * Nietzsche's" for a conversation, "their" for a duel.
   */
  advancedPossessive: string;
  accent: string;
  onSelect: (level: AnswerLevel) => void;
  /** Leave without choosing — back to the profile card / duel setup. */
  onBack?: () => void;
  /** Accessible label for the back button, e.g. "Back to Seneca's profile". */
  backLabel?: string;
}

/**
 * Level prompt shown as a full-screen takeover before a conversation or duel.
 * Conversations show it once per philosopher (the choice is remembered);
 * duels ask every time. Styled to match the ListeningOverlay (dimmed,
 * blurred backdrop with an accent glow).
 *
 * The descriptions mirror the falsifiable definitions the answer-level
 * prompts use (see ANSWER_LEVEL_INSTRUCTIONS in providers/llm.ts), so what a
 * user selects here is what the model actually does.
 */
export default function LevelSelectOverlay({
  title,
  advancedPossessive,
  accent,
  onSelect,
  onBack,
  backLabel,
}: LevelSelectOverlayProps) {
  // Same double-rAF entrance fade as ListeningOverlay: paint once at
  // opacity 0 so the transition to 1 can animate.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const options: { id: AnswerLevel; label: string; description: string }[] = [
    {
      id: "beginner",
      label: "Beginner",
      description: "New to philosophy — everything explained in plain language.",
    },
    {
      id: "intermediate",
      label: "Intermediate",
      description:
        "You know the basics from videos, podcasts, or an intro course.",
    },
    {
      id: "advanced",
      label: "Advanced",
      description: `You've read ${advancedPossessive} primary texts and want to dig into specific ideas.`,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 transition-opacity duration-300"
      style={{
        opacity: shown ? 1 : 0,
        background: "rgba(11, 11, 13, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Ambient accent glow, matching the listening overlay. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 45% at 50% 100%, ${accent}1f, transparent 70%)`,
        }}
      />

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel ?? "Back"}
          title={backLabel ?? "Back"}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-xl text-muted transition hover:text-parchment sm:left-6 sm:top-5"
        >
          ←
        </button>
      )}

      <h2 className="relative max-w-xl text-center font-serif text-2xl text-parchment sm:text-3xl">
        {title}
      </h2>

      <div className="relative mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="rounded-2xl border p-5 text-left transition duration-150 hover:-translate-y-0.5 hover:brightness-125 active:translate-y-0 active:scale-[0.98]"
            style={{
              borderColor: `${accent}55`,
              background: `${accent}11`,
            }}
          >
            <span className="block font-serif text-lg text-parchment">
              {option.label}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <p className="relative mt-8 max-w-md text-center text-sm text-parchment/75">
        You can always change the level in Settings — in the top right-hand
        corner of this screen.
      </p>
    </div>
  );
}
