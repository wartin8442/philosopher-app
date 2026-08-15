import { notFound } from "next/navigation";
import Conversation from "./Conversation";
import { getContextualPrompt } from "@/lib/contextualPrompts";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { toPhilosopherDisplay, type WorkFocus } from "@/lib/philosopherDisplay";
import { getWorkBySlug, workSlug } from "@/lib/profiles";
import { getConversationStarters } from "@/lib/starters";
import { ANSWER_LEVELS, type AnswerLevel } from "@/lib/types";

/**
 * Server half of the conversation route. It exists purely to keep the heavy,
 * server-only data modules out of the browser bundle.
 *
 * `lib/philosophers.ts` (~96KB, including all 24 curated system prompts),
 * `lib/profiles.ts` (~71KB) and `lib/starters.ts` (~30KB) used to be imported
 * directly by the `"use client"` page, so webpack bundled every byte of them
 * into the route chunk — 1.57MB in dev, with the system prompt text readable
 * in it. Resolving the four things the UI needs here and passing them as props
 * means the client downloads a few hundred bytes of data instead.
 *
 * Everything interactive lives in ./Conversation.tsx.
 */

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ prompt?: string; work?: string }>;
}

export default async function ConversationPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { prompt: promptId, work: workParam } = searchParams
    ? await searchParams
    : {};

  const philosopher = getDemoPhilosopher(id);
  // Unknown id, or a philosopher held back from the demo roster: both are
  // dead ends, so serve the shared not-found page rather than an empty chat.
  if (!philosopher) notFound();

  // An unknown slug resolves to null and the chat simply starts general.
  const work = workParam ? getWorkBySlug(id, workParam) : undefined;
  const initialWork: WorkFocus | null = work
    ? { title: work.title, slug: workSlug(work.title) }
    : null;

  // The answer level is client state, so send this philosopher's starters for
  // every level rather than making the client import the starters table.
  const starters = Object.fromEntries(
    ANSWER_LEVELS.map(({ id: level }) => [
      level,
      getConversationStarters(id, level),
    ]),
  ) as Record<AnswerLevel, string[]>;

  return (
    <Conversation
      philosopher={toPhilosopherDisplay(philosopher)}
      initialWork={initialWork}
      contextualPrompt={getContextualPrompt(promptId ?? null, id)}
      starters={starters}
    />
  );
}
