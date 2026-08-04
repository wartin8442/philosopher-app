"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContemporaryPortrait from "@/components/ContemporaryPortrait";
import type { WhyPhilosophyPerson } from "@/lib/whyPhilosophy";

const PORTRAIT_TRANSITION_NAME = "why-person-portrait";

type PersonCard = Pick<
  WhyPhilosophyPerson,
  "id" | "name" | "image" | "imageFocus"
>;

interface WhyPhilosophyPeopleProps {
  people: PersonCard[];
}

interface BrowserViewTransition {
  finished: Promise<void>;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (
    update: () => void | Promise<void>,
  ) => BrowserViewTransition;
};

function waitForPersonHero(personId: string) {
  const selector = `[data-why-person-hero="${personId}"]`;
  if (document.querySelector(selector)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return;
      observer.disconnect();
      window.clearTimeout(timeout);
      resolve();
    });
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 4000);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export default function WhyPhilosophyPeople({
  people,
}: WhyPhilosophyPeopleProps) {
  const router = useRouter();

  function openPerson(
    event: MouseEvent<HTMLAnchorElement>,
    personId: string,
  ) {
    const transitionDocument = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      prefersReducedMotion ||
      !transitionDocument.startViewTransition
    ) {
      return;
    }

    const portrait = event.currentTarget.querySelector<HTMLElement>(
      "[data-card-portrait]",
    );
    if (!portrait) return;

    event.preventDefault();
    portrait.style.setProperty(
      "view-transition-name",
      PORTRAIT_TRANSITION_NAME,
    );
    document.documentElement.classList.add("why-philosophy-transition");

    const transition = transitionDocument.startViewTransition(async () => {
      router.push(`/why-philosophy/${personId}`);
      await waitForPersonHero(personId);
    });

    void transition.finished
      .catch(() => undefined)
      .finally(() => {
        portrait.style.removeProperty("view-transition-name");
        document.documentElement.classList.remove(
          "why-philosophy-transition",
        );
      });
  }

  return (
    <section
      id="people"
      aria-label="People shaped by philosophical questions"
      className="grid min-h-[100svh] scroll-mt-0 grid-cols-1 md:grid-cols-3"
    >
      {people.map((person) => (
        <Link
          key={person.id}
          href={`/why-philosophy/${person.id}`}
          onClick={(event) => openPerson(event, person.id)}
          // No filter or transform on the card itself: it is the ancestor of
          // the portrait that carries view-transition-name during the
          // hand-off to the story page.
          className="group relative min-h-[76svh] overflow-hidden border-t border-ink-700 md:min-h-[100svh] md:border-l md:border-t-0 first:md:border-l-0"
        >
          <div data-card-portrait className="absolute inset-0">
            <ContemporaryPortrait
              name={person.name}
              image={person.image}
              focus={person.imageFocus}
              // Three across from md up, one across below it.
              sizes="(min-width: 768px) 34vw, 100vw"
              priority
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/90"
          />
          <div
            data-card-copy
            className="absolute inset-x-0 bottom-0 z-10 p-8 text-center transition-transform duration-300 ease-out group-hover:scale-[1.025] group-active:scale-100 group-active:duration-100 motion-reduce:transition-none sm:p-10"
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-parchment/60">
              See the philosophy behind
            </p>
            <h2
              className="font-serif text-4xl text-parchment sm:text-5xl"
              style={{ textShadow: "0 2px 18px rgba(0,0,0,0.9)" }}
            >
              {person.name}
            </h2>
            <span className="mt-5 inline-block text-xl text-[#c9a24b]">
              →
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
