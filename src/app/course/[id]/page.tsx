import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AiDisclaimer from "@/components/AiDisclaimer";
import {
  COURSE_PHILOSOPHER_IDS,
  courseParts,
  estimateMinutes,
  getCourse,
} from "@/lib/courses";
import { getDemoPhilosopher } from "@/lib/philosophers";

/**
 * A course's table of contents: the philosopher's name, centered, over a
 * numbered list of its modules.
 *
 * Deliberately the quietest page in the app. It is the moment between deciding
 * to study someone and starting, and there is nothing to do here but pick a
 * number — so there is nothing else on it.
 *
 * Flow: philosopher card → this page → /course/[id]/[moduleId].
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [...COURSE_PHILOSOPHER_IDS].map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) return { title: "Unknown course" };
  return {
    title: `A course on ${course.title} — The Philosophers`,
    description: course.standfirst,
  };
}

export default async function CourseContentsPage({ params }: PageProps) {
  const { id } = await params;
  const course = getCourse(id);
  const philosopher = getDemoPhilosopher(id);
  if (!course || !philosopher) notFound();

  const { accent } = philosopher;

  return (
    <main className="relative flex min-h-dvh flex-col px-6 py-6">
      <Link
        href={`/philosopher/${id}`}
        aria-label={`Back to ${philosopher.name}'s profile`}
        className="self-start rounded-full border border-ink-700/70 bg-ink-950/60 px-4 py-2 text-sm text-parchment backdrop-blur transition duration-150 hover:border-parchment hover:bg-ink-900/70 active:scale-95"
      >
        ← {philosopher.name}
      </Link>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-14 text-center">
        <p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: accent }}
        >
          A course on
        </p>
        <h1 className="mt-4 font-serif text-5xl text-parchment sm:text-7xl">
          {course.title}
        </h1>
        <span
          aria-hidden
          className="mx-auto mt-8 h-px w-24"
          style={{
            background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
          }}
        />

        <h2 className="mt-8 text-xs uppercase tracking-[0.3em] text-muted">
          Contents
        </h2>

        <ol className="mt-6 space-y-3">
          {course.modules.map((module, i) => (
            <li key={module.id}>
              <Link
                href={`/course/${id}/${module.id}`}
                className="group block rounded-2xl border px-6 py-6 text-left transition duration-200 hover:bg-ink-900/60 active:scale-[0.995] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:px-8"
                style={{
                  borderColor: `${accent}44`,
                  outlineColor: accent,
                  background: `${accent}0d`,
                }}
              >
                <span className="flex items-baseline gap-4">
                  <span
                    className="font-serif text-2xl tabular-nums sm:text-3xl"
                    style={{ color: accent }}
                  >
                    {i + 1}.
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-2xl text-parchment sm:text-3xl">
                      {module.title}
                    </span>
                    {module.preparedBy && (
                      <span className="mt-2 block font-serif text-sm italic text-parchment/70">
                        Prepared by {module.preparedBy}
                      </span>
                    )}
                    {/* Counted the way the lesson counts itself: a part, not
                        a section, since the paragraphs of a life are one
                        entry on its contents. See `courseParts`. */}
                    <span className="mt-3 block text-xs uppercase tracking-[0.2em] text-muted">
                      {courseParts(module.sections).length} sections ·{" "}
                      {estimateMinutes(module)} min
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 self-center text-2xl transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: accent }}
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* The course's standing notice. The lesson screen itself gives its
          height to the board and says this on its opening card instead, so
          this is where a reader who is choosing a lesson meets it. */}
      <AiDisclaimer
        variant="inline"
        detail={`The lectures are written; ${philosopher.name}'s voice, and his answers to your questions, are an AI simulation — not the real philosopher, and they can be wrong.`}
        className="mx-auto max-w-xl pb-2 text-xs leading-relaxed"
      />
    </main>
  );
}
