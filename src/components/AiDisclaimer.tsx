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
 *
 * The "full" variant also carries the privacy link, for the same reason it
 * carries the AI notice: it is the one piece of furniture on every scrollable
 * screen. The "inline" variant deliberately does not — those screens are
 * measured to the viewport, and a second line there costs the conversation
 * space it cannot spare.
 */

import PrivacyNotice from "@/components/PrivacyNotice";

export default function AiDisclaimer({
  variant = "full",
  name,
  detail,
  className = "",
}: {
  variant?: "full" | "inline";
  /** Who is being simulated; named explicitly on the inline variant. */
  name?: string;
  /**
   * Replaces the inline wording where the default would be misleading. The
   * course, for one, is a written script read by a synthetic voice, so "an AI
   * simulation" alone would misdescribe what the student is hearing — but the
   * notice still has to be here, in the same place, on every screen.
   */
  detail?: string;
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <p
        className={`text-center text-[11px] leading-tight text-muted ${className}`}
      >
        {detail ?? (
          <>
            {name ? `An AI simulation of ${name}` : "An AI simulation"} — not
            the real philosopher, and it can be wrong.
          </>
        )}
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
      {/* Privacy sits with the AI notice rather than in a menu, and inherits
          this footer's type so it reads as the next line of the same
          disclosure. It opens an overlay instead of navigating: this footer
          also renders under a live conversation, and leaving the page would
          tear down the mic surface mid-sentence. */}
      <span className="mt-2 block">
        <PrivacyNotice />
      </span>
    </footer>
  );
}
