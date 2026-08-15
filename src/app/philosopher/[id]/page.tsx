import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AiDisclaimer from "@/components/AiDisclaimer";
import BookCover from "@/components/BookCover";
import RememberVisit from "@/components/RememberVisit";
import { getContextualPrompt } from "@/lib/contextualPrompts";
import { getCourse } from "@/lib/courses";
import { commonsPageUrl, getPortraitCredit } from "@/lib/imageCredits";
import { DEMO_ROSTER_IDS, getDemoPhilosopher } from "@/lib/philosophers";
import { getProfile, workSlug } from "@/lib/profiles";

/**
 * Philosopher profile page: hero portrait fading into the philosopher's
 * theme color, a short introduction, a full-width CTA into the existing chat,
 * and a Major Works shelf. One template, driven entirely by
 * lib/philosophers.ts + lib/profiles.ts.
 *
 * Flow: philosopher card → this page → /conversation/[id].
 */

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ prompt?: string }>;
}

export function generateStaticParams() {
  return DEMO_ROSTER_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const philosopher = getDemoPhilosopher(id);
  if (!philosopher) return { title: "Unknown philosopher" };
  return {
    title: `${philosopher.name} — The Philosophers`,
    description: philosopher.blurb,
  };
}

/** "#b5563e" at `keep` brightness (0–1) with `alpha`, as an rgba() string. */
function shade(hex: string, keep: number, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * keep);
  const g = Math.round(((n >> 8) & 0xff) * keep);
  const b = Math.round((n & 0xff) * keep);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default async function PhilosopherProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { prompt: promptId } = searchParams ? await searchParams : {};
  const philosopher = getDemoPhilosopher(id);
  const profile = getProfile(id);
  if (!philosopher || !profile) notFound();

  const { accent, name, dates } = philosopher;
  const course = getCourse(id);
  const portraitCredit = profile.heroImage ? getPortraitCredit(id) : undefined;
  const contextualPrompt = getContextualPrompt(promptId ?? null, id);
  const conversationHref = contextualPrompt
    ? `/conversation/${philosopher.id}?prompt=${contextualPrompt.id}`
    : `/conversation/${philosopher.id}`;

  return (
    <main>
      <RememberVisit id={philosopher.id} />

      {/* ── Hero: portrait fading down into the theme color ─────────────── */}
      <section className="relative">
        <Link
          href="/explore"
          aria-label="Back to the philosopher carousel"
          className="absolute left-4 top-4 z-20 rounded-full border border-ink-700/70 bg-ink-950/60 px-4 py-2 text-sm text-parchment backdrop-blur transition duration-150 hover:border-parchment hover:bg-ink-900/70 active:scale-95 sm:left-6 sm:top-6"
        >
          ← Philosopher carousel
        </Link>

        <div className="relative h-[72svh] min-h-[440px] w-full overflow-hidden sm:h-[78svh] sm:max-h-[860px]">
          {profile.heroImage ? (
            <Image
              src={profile.heroImage}
              alt={`Portrait of ${name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: profile.heroFocus ?? "50% 15%" }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${accent}55, ${shade(accent, 0.2, 0.9)} 48%, #0b0b0d 82%)`,
              }}
            >
              <div
                className="flex h-56 w-56 items-center justify-center rounded-full border font-serif text-7xl sm:h-72 sm:w-72 sm:text-8xl"
                style={{
                  borderColor: accent,
                  color: accent,
                  background: `radial-gradient(circle at 35% 25%, ${accent}33, #131317 72%)`,
                  boxShadow: `0 0 80px ${accent}33`,
                }}
                aria-label={`${name} portrait artwork coming soon`}
              >
                {philosopher.initials}
              </div>
            </div>
          )}
          {/* Face stays clear up top; the lower half sinks smoothly through
              the philosopher's accent into the page background, dark enough
              for the name and intro to sit on. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom,
                rgba(11, 11, 13, 0.15) 0%,
                rgba(11, 11, 13, 0) 18%,
                transparent 34%,
                ${shade(accent, 0.38, 0.45)} 58%,
                ${shade(accent, 0.24, 0.85)} 76%,
                ${shade(accent, 0.12, 0.97)} 88%,
                #0b0b0d 100%)`,
            }}
          />

          {/* Portrait credit. Several of these portraits are CC BY or CC BY-SA,
              which make attribution a condition of the licence — so it has to
              be visible beside the image, not filed away in a doc. The
              public-domain ones are credited the same way; it costs a line and
              keeps the provenance checkable. Sits top-right because the name
              block owns the bottom of the hero.

              It reads "Portrait:" rather than "Photo:" deliberately. For the
              five philosophers whose hero is our own artwork, the Commons
              author made the carousel portrait, not the picture filling this
              screen — and crediting them for it would be a false attribution.
              Wording it the same way for everyone keeps it true in both
              cases. */}
          {portraitCredit && (
            <p className="absolute right-3 top-16 z-20 max-w-[60%] text-right text-[10px] leading-snug text-parchment/45 sm:top-20">
              Portrait:{" "}
              <a
                href={commonsPageUrl(portraitCredit)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-parchment"
              >
                {portraitCredit.author}
              </a>{" "}
              /{" "}
              {portraitCredit.licenceUrl ? (
                <a
                  href={portraitCredit.licenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-parchment"
                >
                  {portraitCredit.licence}
                </a>
              ) : (
                portraitCredit.licence
              )}
            </p>
          )}

          {/* Name block, inside the darkened base of the portrait */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6 sm:pb-10">
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-2 text-xs uppercase tracking-[0.3em] sm:text-sm"
                style={{ color: accent, textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
              >
                {dates} · {philosopher.voiceNote}
              </p>
              <h1
                className="font-serif text-5xl text-parchment sm:text-7xl"
                style={{ textShadow: "0 2px 18px rgba(0,0,0,0.75)" }}
              >
                {name}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Introduction, beginning in the hero's shadow ─────────────────── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-2 sm:pt-4">
        {profile.intro.map((paragraph, i) => (
          <p
            key={i}
            className="mt-5 text-base leading-relaxed text-parchment/90 sm:text-lg"
          >
            {paragraph}
          </p>
        ))}
      </section>

      {/* Chat CTA */}
      <section className="mx-auto max-w-5xl px-6 pt-12 sm:pt-14">
        <Link
          href={conversationHref}
          className="group relative block overflow-hidden rounded-2xl border px-6 py-12 text-center transition duration-200 active:scale-[0.995] active:brightness-110 sm:py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{
            borderColor: `${accent}66`,
            outlineColor: accent,
            background: `linear-gradient(135deg, ${shade(accent, 0.5, 0.25)}, rgba(19,19,23,0.9) 45%, ${shade(accent, 0.5, 0.15)})`,
          }}
        >
          {/* Soft accent bloom on hover */}
          <span
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(60% 120% at 50% 100%, ${accent}2e, transparent 70%)`,
            }}
          />
          <span className="relative block text-xs uppercase tracking-[0.35em] text-muted">
            The conversation is waiting
          </span>
          <span className="relative mt-4 block font-serif text-4xl text-parchment sm:text-6xl">
            Chat with {profile.shortName}
            <span
              aria-hidden
              className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-2"
              style={{ color: accent }}
            >
              →
            </span>
          </span>
          <span className="relative mt-4 block text-sm text-muted">
            {contextualPrompt
              ? `Suggested question: ${contextualPrompt.prompt}`
              : "A voice-first dialogue — ask anything, or simply begin."}
          </span>
        </Link>

        {/* Course CTA. Deliberately quieter than the chat block above it: the
            conversation is what this page is for, and the course is the second
            door, not a rival to the first. Only shown for philosophers who
            actually have one. */}
        {course && (
          <Link
            href={`/course/${philosopher.id}`}
            className="group mt-4 flex items-center gap-5 rounded-2xl border px-6 py-6 transition duration-200 hover:bg-ink-900/60 active:scale-[0.995] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:px-8"
            style={{
              borderColor: `${accent}44`,
              outlineColor: accent,
              background: `${accent}0d`,
            }}
          >
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-2xl text-parchment sm:text-3xl">
                Take the course on {name}
              </span>
            </span>
            <span
              aria-hidden
              className="shrink-0 text-2xl transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: accent }}
            >
              →
            </span>
          </Link>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-10 text-center sm:pt-12">
        <p className="font-serif text-4xl leading-tight text-parchment sm:text-6xl">
          Focus the conversation on a work by {name}
        </p>
      </section>

      {/* ── Major Works ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="major-works"
        className="mx-auto max-w-3xl px-6 pt-10 sm:pt-12"
      >
        <div className="flex items-baseline justify-between">
          <h2
            id="major-works"
            className="text-sm uppercase tracking-[0.25em] text-muted"
          >
            Major Works
          </h2>
          <span
            aria-hidden
            className="ml-6 h-px flex-1"
            style={{ background: `linear-gradient(to right, ${accent}55, transparent)` }}
          />
        </div>

        <div className="mt-2 divide-y divide-ink-800">
          {profile.works.map((work) => (
            <article
              key={work.title}
              className="flex flex-col gap-6 py-10 sm:flex-row sm:gap-8"
            >
              <div className="w-36 shrink-0 sm:w-40">
                <BookCover
                  title={work.title}
                  author={name}
                  accent={accent}
                  year={work.year}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-2xl text-parchment sm:text-3xl">
                  {work.title}
                </h3>
                <p className="mt-1 text-xs tracking-wide text-muted">{work.year}</p>
                <p className="mt-4 leading-relaxed text-parchment/80">
                  {work.description}
                </p>
                {/* Opens the chat focused on this work (dismissable there). */}
                <Link
                  href={`/conversation/${philosopher.id}?work=${workSlug(work.title)}`}
                  className="group mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition duration-150 hover:bg-ink-900 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ borderColor: `${accent}66`, color: accent, outlineColor: accent }}
                >
                  Explore this work
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-[10px] leading-snug text-parchment/40">
          Original public-domain cover designs. No publisher cover art is used.
        </p>
      </section>

      <AiDisclaimer />
    </main>
  );
}
