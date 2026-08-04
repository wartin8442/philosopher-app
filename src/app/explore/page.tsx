import Link from "next/link";
import PhilosopherCarousel from "@/components/PhilosopherCarousel";
import { DEMO_PHILOSOPHERS } from "@/lib/philosophers";

/**
 * The philosopher carousel — scroll through and pick who to talk to. This was
 * the app's original landing; it now lives behind the "Explore the
 * Philosophers" CTA on the new split landing (src/app/page.tsx). Selecting a
 * card here is the only path into a philosopher's page.
 */
export default function ExplorePage() {
  return (
    <main className="mx-auto max-w-6xl px-0 py-14 sm:px-6">
      <Link
        href="/"
        className="mx-6 mb-8 inline-flex rounded-full border border-ink-700 bg-ink-950/70 px-4 py-2 text-sm text-muted transition duration-150 hover:border-parchment hover:text-parchment active:scale-95 sm:mx-0"
      >
        ← Home
      </Link>

      <header className="mb-12 px-6 text-center sm:px-0">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-muted">
          A voice-first dialogue
        </p>
        <h1 className="font-serif text-5xl text-parchment sm:text-6xl">
          The Philosophers
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Sit down with a philosopher and think aloud together — or set two of
          them against each other over a question that matters to you.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/duel"
            className="rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-parchment transition duration-150 hover:border-parchment hover:bg-ink-700 active:scale-95"
          >
            Stage a Duel →
          </Link>
        </div>
      </header>

      <section>
        <h2 className="mb-5 px-6 text-sm uppercase tracking-[0.25em] text-muted sm:px-0">
          Choose a philosopher
        </h2>
        <PhilosopherCarousel philosophers={DEMO_PHILOSOPHERS} />
      </section>

      <footer className="mx-6 mt-14 max-w-3xl rounded-xl border border-ink-800 bg-ink-900/40 p-4 text-center text-xs text-muted sm:mx-auto">
        These profiles are AI simulations inspired by historical philosophers —
        not the philosophers themselves, and not a substitute for their actual
        writings. They aim for accuracy but can be wrong. For study, read the
        primary texts.
      </footer>
    </main>
  );
}
