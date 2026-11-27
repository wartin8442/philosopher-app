import Link from "next/link";
import PhilosopherRail from "@/components/PhilosopherRail";
import { DEMO_PHILOSOPHERS } from "@/lib/philosophers";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col sm:h-dvh sm:overflow-hidden">
      <header className="shrink-0 px-10 pt-8 text-center">
        <p className="mb-2 text-[12px] uppercase leading-[normal] tracking-[0.3em] text-muted">
          A voice-first dialogue
        </p>
        <h1 className="font-serif text-[32px] font-normal leading-[normal] text-parchment">
          The Philosophers
        </h1>
      </header>

      <section className="relative mt-[30px] grid min-h-[520px] flex-1 grid-cols-1 grid-rows-[1fr_1fr] sm:min-h-0 sm:grid-cols-2 sm:grid-rows-[1fr]">
        {/* Center divider — desktop only, split screen has no rail on mobile */}
        <div className="pointer-events-none absolute inset-y-[6%] left-1/2 hidden w-px bg-ink-700 sm:block" />

        <Link
          href="/start"
          className="group flex flex-col items-center justify-center px-12 text-center transition-colors duration-200 hover:bg-ink-900/30 active:bg-ink-900/60 sm:justify-start sm:pb-10 sm:pt-[130px]"
        >
          {/* group-active dips back below the hover scale, so a press reads
              as a press even while the pointer is still hovering. */}
          <div className="transition-transform duration-[250ms] ease-out group-hover:scale-[1.06] group-active:scale-[1.01] group-active:duration-100">
            <h2 className="mb-[14px] font-serif text-[28px] font-normal leading-[normal] text-parchment text-balance">
              Don&apos;t know where to start?
            </h2>
            <p className="mx-auto max-w-[300px] text-[14px] leading-[1.65] text-muted">
              Answer a few questions about what you&apos;re hoping to find
              answers to, and be guided toward the right place to start.
            </p>
            <p className="mt-[22px] text-[12px] uppercase leading-[normal] tracking-[0.1em] text-[#c9a24b]/85">
              Answer a few questions →
            </p>
          </div>
        </Link>

        {/* The Explore panel previews the philosopher carousel from the side; the
            CTA opens the carousel itself (/explore), never a philosopher page. */}
        <Link
          href="/explore"
          className="group relative flex flex-col items-center justify-center overflow-hidden text-center sm:justify-start"
        >
          {/* Side view of the carousel as the panel background, dimmed to 65%.
              Leads on Aquinas so the preview foregrounds the same philosopher
              /explore opens on — no jump from one face to another across the
              click. */}
          <div
            data-explore-rail-preview
            className="absolute inset-0"
            style={{ filter: "brightness(0.35)" }}
          >
            <PhilosopherRail philosophers={DEMO_PHILOSOPHERS} lead="aquinas" />
          </div>
          <p
            className="relative z-20 px-8 sm:mt-[130px] font-serif text-[26px] font-normal leading-[normal] text-parchment text-balance transition-transform duration-[250ms] ease-out group-hover:scale-[1.06] group-active:scale-[1.01] group-active:duration-100"
            style={{
              textShadow:
                "0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.95)",
            }}
          >
            Explore the Philosophers
          </p>
        </Link>
      </section>

      <Link
        href="/why-philosophy"
        className="group flex shrink-0 items-center justify-center border-t border-ink-800 px-6 py-6 text-center transition-colors duration-200 hover:bg-ink-900/55 active:bg-ink-900 sm:py-5"
      >
        <span className="font-serif text-xl text-parchment transition-transform duration-[250ms] ease-out group-hover:scale-[1.035] group-active:scale-100 group-active:duration-100 sm:text-2xl">
          Why Should I Care About Philosophy?
          <span className="ml-3 text-[#c9a24b]">→</span>
        </span>
      </Link>
    </main>
  );
}
