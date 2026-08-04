import Link from "next/link";

/**
 * Placeholder for the guided "find your philosopher" flow (see
 * docs/onboarding_philosopher_matching.md). Not yet built — the matching
 * mechanism, question-loop bound, and crisis-disclosure safety handling are
 * still open design questions there. This route exists so the homescreen CTA
 * has somewhere to land instead of 404ing.
 */
export default function GuidedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm uppercase tracking-[0.3em] text-muted">
        Coming soon
      </p>
      <h1 className="font-serif text-4xl text-parchment">
        Guided philosopher matching
      </h1>
      <p className="mt-4 max-w-md text-muted">
        This is where we&apos;ll ask a few questions about what you&apos;re
        curious about and point you to a philosopher — or a duel — worth
        starting with. For now, browse the philosophers directly.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-parchment transition duration-150 hover:border-parchment hover:bg-ink-700 active:scale-95"
      >
        ← Back to the philosophers
      </Link>
    </main>
  );
}
