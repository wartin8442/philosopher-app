import Link from "next/link";

export default function PhilosopherNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted">
        Not in the library
      </p>
      <h1 className="mt-4 font-serif text-4xl text-parchment">
        Unknown philosopher
      </h1>
      <p className="mt-4 text-muted">
        No thinker by that name has a seat here yet.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full border border-ink-600 bg-ink-800 px-6 py-3 text-parchment transition hover:border-parchment"
      >
        ← Browse the philosophers
      </Link>
    </main>
  );
}
