/**
 * The diagnostic router's crisis-disclosure notice.
 *
 * Design and rationale: docs/diagnostic_safety_design.md §4. Shown beneath a
 * free-text box when `checkForDistress` matches (see lib/diagnosticSafety.ts).
 *
 * Four things about this component are deliberate and should survive redesign:
 *
 *   1. It is not a modal and it does not block. A dialog would tell a user who
 *      is fine that the software has decided something about them, and tell a
 *      user who is not fine that disclosing gets the door shut. The quiz
 *      continues either way; nothing about the shelf changes.
 *   2. It makes no claim about the reader. "If any of this is about right now"
 *      is conditional on purpose — it costs a false positive two seconds and
 *      no dignity, and it lets the reader decide whether a past-tense
 *      disclosure applies to them, which is the distinction the matcher
 *      cannot draw and a person can.
 *   3. It says what this app is not. Same principle as AiDisclaimer: a product
 *      that speaks in a human voice has to say plainly what it is, on the
 *      surface where it speaks.
 *   4. It links an international directory rather than one country's number.
 *      The app has no geolocation and ships to whoever opens it. If a locale
 *      is ever known, show the local line IN ADDITION — never instead.
 *
 * Styled as a quiet aside, not an error: red borders and warning icons read as
 * "you did something wrong," which is the opposite of the intended message.
 */

export default function SafetyNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <aside
      // Polite, not assertive: this must not interrupt a screen reader
      // mid-sentence while someone is typing.
      aria-live="polite"
      className={`mt-3 rounded-xl border border-ink-800 bg-ink-900/40 p-4 text-sm leading-relaxed text-muted ${className}`}
    >
      <p className="text-ink-100">
        If any of this is about right now, please talk to someone.
      </p>
      <p className="mt-2">
        You can reach a free, confidential helpline at any hour.{" "}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-ink-100"
        >
          findahelpline.com
        </a>{" "}
        lists them by country. This is a philosophy app, and it isn&rsquo;t able
        to help with this.
      </p>
      <p className="mt-2 text-xs">Your answer stays on this device.</p>
    </aside>
  );
}
