import Link from "next/link";
import PhilosopherCarousel from "@/components/PhilosopherCarousel";
import { PHILOSOPHERS } from "@/lib/philosophers";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-0 py-14 sm:px-6">
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
            className="rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-parchment transition hover:border-parchment"
          >
            Stage a Duel →
          </Link>
        </div>
      </header>

      <section>
        <h2 className="mb-5 px-6 text-sm uppercase tracking-[0.25em] text-muted sm:px-0">
          Choose a philosopher
        </h2>
        <PhilosopherCarousel philosophers={PHILOSOPHERS} />
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
