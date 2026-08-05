/**
 * The app's AI-transparency notice.
 *
 * Every surface that shows generated speech has to say plainly that the
 * speaker is a simulation. This matters more here than in most LLM apps: the
 * personas are deliberately instructed never to describe themselves as an AI
 * (see INJECTION_HARDENING in lib/security/injection.ts), so if the interface
 * stays silent too, nothing on screen ever tells the visitor. Deep links from
 * outside the app land straight in a conversation, so "it's disclosed on the
 * explore page" is not good enough.
 *
 * Two variants for two kinds of layout:
 *   - "full"   — the block footer, for scrollable pages with room for it.
 *   - "inline" — a single quiet line, for the h-dvh voice/debate screens where
 *                a paragraph would cost space the conversation needs.
 */

export default function AiDisclaimer({
  variant = "full",
  name,
  className = "",
}: {
  variant?: "full" | "inline";
  /** Who is being simulated; named explicitly on the inline variant. */
  name?: string;
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <p
        className={`text-center text-[11px] leading-tight text-muted ${className}`}
      >
        {name ? `An AI simulation of ${name}` : "An AI simulation"} — not the
        real philosopher, and it can be wrong.
      </p>
    );
  }

  return (
    <footer
      className={`mx-6 mt-14 max-w-3xl rounded-xl border border-ink-800 bg-ink-900/40 p-4 text-center text-xs text-muted sm:mx-auto ${className}`}
    >
      These profiles are AI simulations inspired by historical philosophers —
      not the philosophers themselves, and not a substitute for their actual
      writings. They aim for accuracy but can be wrong. For study, read the
      primary texts.
    </footer>
  );
}
