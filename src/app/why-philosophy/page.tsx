import Link from "next/link";
import WhyPhilosophyPeople from "@/components/WhyPhilosophyPeople";
import {
  WHY_PHILOSOPHY_INTRO,
  WHY_PHILOSOPHY_PEOPLE,
} from "@/lib/whyPhilosophy";

export const metadata = {
  title: "Why Should I Care About Philosophy? — The Philosophers",
  description:
    "See how philosophical questions shape people influencing the modern world.",
};

export default function WhyPhilosophyPage() {
  return (
    <main>
      <section className="relative flex min-h-[100svh] flex-col px-6 py-5 sm:h-[100svh] sm:min-h-0 sm:overflow-hidden sm:px-10 sm:py-6">
        <Link
          href="/"
          className="self-start rounded-full border border-ink-700 bg-ink-950/70 px-4 py-2 text-sm text-muted transition duration-150 hover:border-parchment hover:text-parchment active:scale-95"
        >
          ← Home
        </Link>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-start pt-8 text-center sm:pt-3">
          <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#c9a24b]">
            A place to begin
          </p>
          <h1 className="font-serif text-4xl font-normal leading-[1.05] text-parchment text-balance sm:text-6xl">
            Why Should I Care About Philosophy?
          </h1>
          <div className="mx-auto mt-6 max-w-3xl text-[15px] leading-[1.65] text-parchment/75 sm:text-base sm:leading-[1.7]">
            <p>{WHY_PHILOSOPHY_INTRO.join(" ")}</p>
          </div>
        </div>

        <a
          href="#people"
          className="group mx-auto flex max-w-2xl flex-col items-center pb-1 text-center"
        >
          <span className="font-serif text-lg leading-snug text-parchment sm:text-xl">
            See how philosophical questions are guiding some of the most
            impactful people in the world
          </span>
          <span className="mt-2 text-xl text-[#c9a24b] transition-transform group-hover:translate-y-1">
            ↓
          </span>
        </a>
      </section>

      <WhyPhilosophyPeople people={WHY_PHILOSOPHY_PEOPLE} />

      {/* One combined credit for the three portraits above — the CC licences
          require attribution wherever the photos appear, and the gateway shows
          all three at once. */}
      <p className="px-6 pb-8 text-center text-[11px] leading-relaxed text-muted">
        Portraits from Wikimedia Commons:{" "}
        {WHY_PHILOSOPHY_PEOPLE.filter((p) => p.imageCredit).map(
          (person, index, list) => (
            <span key={person.id}>
              {person.name} —{" "}
              <a
                href={person.imageCredit!.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition hover:text-parchment"
              >
                {person.imageCredit!.author}
              </a>{" "}
              /{" "}
              <a
                href={person.imageCredit!.licenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 transition hover:text-parchment"
              >
                {person.imageCredit!.licence}
              </a>
              {index < list.length - 1 ? "; " : "."}
            </span>
          ),
        )}
      </p>
    </main>
  );
}
