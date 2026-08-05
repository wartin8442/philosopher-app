import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContemporaryPortrait from "@/components/ContemporaryPortrait";
import YouTubeClip from "@/components/YouTubeClip";
import {
  getWhyPhilosophyPerson,
  WhyPhilosophyReference,
  WHY_PHILOSOPHY_PEOPLE,
} from "@/lib/whyPhilosophy";

interface PageProps {
  params: Promise<{ person: string }>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkedPhilosopherNames(
  text: string,
  references: WhyPhilosophyReference[],
  linkedPhilosopherIds: Set<string>,
) {
  const labels = references
    .flatMap((reference) => reference.labels)
    .sort((a, b) => b.length - a.length);
  if (labels.length === 0) return text;

  const pattern = new RegExp(`(${labels.map(escapeRegExp).join("|")})`, "g");
  return text.split(pattern).map((part, index) => {
    const reference = references.find((candidate) =>
      candidate.labels.includes(part),
    );
    if (!reference || linkedPhilosopherIds.has(reference.philosopherId)) {
      return part;
    }
    linkedPhilosopherIds.add(reference.philosopherId);

    return (
      <Link
        key={`${part}-${index}`}
        href={`/philosopher/${reference.philosopherId}?prompt=${reference.promptId}`}
        className="font-medium text-[#d5b765] underline decoration-[#c9a24b]/45 underline-offset-4 transition hover:text-[#ead18e] hover:decoration-[#c9a24b]"
      >
        {part}
      </Link>
    );
  });
}

export function generateStaticParams() {
  return WHY_PHILOSOPHY_PEOPLE.map((person) => ({ person: person.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { person: id } = await params;
  const person = getWhyPhilosophyPerson(id);
  if (!person) return { title: "Story not found" };
  return {
    title: `${person.name} and Philosophy — The Philosophers`,
    description: person.summary,
  };
}

export default async function WhyPhilosophyPersonPage({ params }: PageProps) {
  const { person: id } = await params;
  const person = getWhyPhilosophyPerson(id);
  if (!person) notFound();

  // A philosopher is linked only on their first mention across the summary
  // and story. Later mentions remain readable prose instead of becoming a
  // thicket of repeated links to the same destination.
  const linkedPhilosopherIds = new Set<string>();
  const linkedSummary = linkedPhilosopherNames(
    person.summary,
    person.references,
    linkedPhilosopherIds,
  );
  const linkedStory = person.story.map((paragraph) => ({
    paragraph,
    content: linkedPhilosopherNames(
      paragraph,
      person.references,
      linkedPhilosopherIds,
    ),
  }));
  const additionalConnections = person.connections.filter(
    (connection) => !linkedPhilosopherIds.has(connection.philosopherId),
  );

  return (
    <main>
      <section
        data-why-person-hero={person.id}
        className="relative h-[100svh] min-h-[520px] overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{ viewTransitionName: "why-person-portrait" }}
        >
          <ContemporaryPortrait
            name={person.name}
            image={person.image}
            focus={person.imageFocus}
            priority
            fit="contain"
          />
        </div>
        <div
          aria-hidden
          className="why-person-hero-overlay absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/95"
        />
        {/* Attribution is a condition of the CC licences these portraits ship
            under, so it renders with the photo rather than living in a file
            nobody reads. Kept small and out of the way, but on the page. */}
        {person.imageCredit && (
          <p className="absolute bottom-2 right-3 z-20 text-[10px] text-parchment/45">
            Photo:{" "}
            <a
              href={person.imageCredit.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-parchment"
            >
              {person.imageCredit.author}
            </a>{" "}
            /{" "}
            <a
              href={person.imageCredit.licenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-parchment"
            >
              {person.imageCredit.licence}
            </a>
          </p>
        )}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ viewTransitionName: "why-person-copy" }}
        >
          <Link
            href="/why-philosophy#people"
            className="why-person-hero-copy pointer-events-auto absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm text-parchment backdrop-blur transition hover:border-parchment sm:left-6 sm:top-6"
          >
            ← All three stories
          </Link>
          <div className="why-person-hero-copy absolute inset-x-0 bottom-0 px-6 pb-10 sm:pb-14">
            <div className="mx-auto max-w-4xl">
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[#c9a24b]">
                Philosophy in the world
              </p>
              <h1
                className="font-serif text-6xl leading-none text-parchment sm:text-8xl"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.85)" }}
              >
                {person.name}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <p className="font-serif text-3xl leading-snug text-parchment sm:text-4xl">
          {linkedSummary}
        </p>

        <div
          data-person-story
          className="mt-12 space-y-6 text-base leading-[1.85] text-parchment/78 sm:text-lg"
        >
          {linkedStory.map(({ paragraph, content }) => (
            <p key={paragraph}>
              {content}
            </p>
          ))}
        </div>

        <YouTubeClip clip={person.videoClip} personName={person.name} />

        {additionalConnections.length > 0 && (
          <div className="mt-16 space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Follow the philosophical question
            </p>
            {additionalConnections.map((connection) => (
              <Link
                key={connection.promptId}
                href={`/conversation/${connection.philosopherId}?prompt=${connection.promptId}`}
                className="group block rounded-2xl border border-[#c9a24b]/35 bg-ink-900/70 p-7 transition hover:border-[#c9a24b]/75 sm:p-9"
              >
                <span className="text-xs uppercase tracking-[0.25em] text-[#c9a24b]">
                  Ask {connection.philosopherName}
                </span>
                <span className="mt-4 block font-serif text-3xl leading-tight text-parchment sm:text-4xl">
                  {connection.label}
                </span>
                <span className="mt-4 block leading-relaxed text-parchment/70">
                  {connection.description}
                </span>
                <span className="mt-6 inline-block text-[#c9a24b] transition-transform group-hover:translate-x-2">
                  Continue the question →
                </span>
              </Link>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}
