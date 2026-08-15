import { NextRequest } from "next/server";
import { coursePosition, getCourseModule } from "@/lib/courses";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { getWorkBySlug } from "@/lib/profiles";
import {
  buildSystemPrompt,
  courseTeachingInstruction,
  getLLMProvider,
  workFocusInstruction,
} from "@/lib/providers/llm";
import { formatGrounding, retrieveSources } from "@/lib/retrieval";
import { RATE_LIMITS } from "@/lib/security/config";
import {
  coerceAnswerLevel,
  enforceRateLimit,
  errorResponse,
  field,
  HttpError,
  readJsonBody,
  validateMessages,
} from "@/lib/security/validate";
import {
  INJECTION_REINFORCEMENT,
  looksLikeInjection,
} from "@/lib/security/injection";
import {
  conditionCHardening,
  parseExperimentCondition,
  usesPromptHardening,
} from "@/lib/experiment-conditions";
import type { RetrievedSource } from "@/lib/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  philosopherId?: unknown;
  messages?: unknown;
  answerLevel?: unknown;
  /** Slug of one of the philosopher's works to focus the conversation on. */
  workSlug?: unknown;
  /**
   * Set when the question was asked during a scripted course, so the answer
   * can be held to what the lecture has actually covered. The script itself is
   * resolved server-side from these ids — the client sends only its position,
   * never lecture text to put in the prompt.
   */
  courseModuleId?: unknown;
  courseSectionId?: unknown;
  /** How many lines of the current section the student has heard. */
  courseDelivered?: unknown;
  /** Development/evaluation switch. Defaults to A (unchanged production behavior). */
  condition?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "chat", RATE_LIMITS.chat);

    const body = await readJsonBody<ChatBody>(req);

    const philosopherId = field.requireString(
      body.philosopherId,
      "philosopherId",
      64,
    );
    const messages = validateMessages(body.messages);
    const answerLevel = coerceAnswerLevel(body.answerLevel);
    const workSlug = field.optionalString(body.workSlug, "workSlug", 128);
    let condition;
    try {
      condition = parseExperimentCondition(body.condition);
    } catch {
      throw new HttpError(400, "condition must be A, B, or C.");
    }

    const philosopher = getDemoPhilosopher(philosopherId);
    if (!philosopher) {
      throw new HttpError(404, "Unknown philosopher.");
    }

    // Optional work focus ("Explore this work"): must name a real work of this
    // philosopher. The client only sends slugs it resolved itself, so a miss is
    // a bug or a tampered request — reject rather than silently going general.
    const work = workSlug ? getWorkBySlug(philosopherId, workSlug) : undefined;
    if (workSlug && !work) {
      throw new HttpError(400, "Unknown work for this philosopher.");
    }

    // Course position ("ask a question during the lesson"): same contract as
    // the work focus — the client resolved these ids from data we served it, so
    // a miss is a bug or a tampered request rather than something to shrug off.
    const position = resolveCoursePosition(philosopherId, body);

    // Lightweight retrieval on the latest user turn only (hybrid approach): used
    // to ground potentially risky/niche questions, not on every token.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const retrievalStarted = performance.now();
    const retrieved = lastUser
      ? await retrieveSources(philosopher, lastUser.content, { condition })
      : [];
    const retrievalMs = performance.now() - retrievalStarted;
    const grounding = formatGrounding(retrieved);

    // If the latest user turn looks like a prompt-injection / jailbreak attempt,
    // append a one-line reinforcement to the per-turn suffix (never the cached
    // prefix). We reinforce rather than block: the model refuses in character.
    const reinforcement =
      lastUser && looksLikeInjection(lastUser.content)
        ? INJECTION_REINFORCEMENT
        : undefined;

    // `system` is the stable, cacheable persona; the grounding and the
    // (dismissable) work focus ride in `systemSuffix` after the cache marker so
    // they can change every turn.
    const { system, systemSuffix } = buildSystemPrompt({
      philosopher,
      answerLevel,
      grounding,
      promptHardening: usesPromptHardening(condition)
        ? conditionCHardening(philosopher.id)
        : undefined,
      extra: position
        ? courseTeachingInstruction(position)
        : work
          ? workFocusInstruction(work.title)
          : undefined,
      reinforcement,
    });

    const provider = getLLMProvider();
    return streamChat(
      provider,
      { system, systemSuffix, messages },
      retrieved,
      condition,
      retrievalMs,
    );
  } catch (err) {
    return errorResponse(err, "[/api/chat]");
  }
}

/**
 * Resolve `courseModuleId` / `courseSectionId` / `courseDelivered` into the
 * slice of script the model may draw on. Returns undefined when the request is
 * not a course question at all.
 */
function resolveCoursePosition(philosopherId: string, body: ChatBody) {
  const moduleId = field.optionalString(
    body.courseModuleId,
    "courseModuleId",
    64,
  );
  if (!moduleId) return undefined;

  const module = getCourseModule(philosopherId, moduleId);
  if (!module) throw new HttpError(400, "Unknown course module.");

  const sectionId = field.requireString(
    body.courseSectionId,
    "courseSectionId",
    64,
  );
  const sectionIndex = module.sections.findIndex((s) => s.id === sectionId);
  if (sectionIndex < 0) throw new HttpError(400, "Unknown course section.");

  if (
    typeof body.courseDelivered !== "number" ||
    !Number.isInteger(body.courseDelivered) ||
    body.courseDelivered < 0
  ) {
    throw new HttpError(400, "courseDelivered must be a non-negative integer.");
  }

  return coursePosition(module, sectionIndex, body.courseDelivered);
}

function streamChat(
  provider: ReturnType<typeof getLLMProvider>,
  req: { system: string; systemSuffix?: string; messages: { role: "user" | "assistant"; content: string }[] },
  retrieved: RetrievedSource[],
  condition: "A" | "B" | "C",
  retrievalMs: number,
): Response {
  const { system, systemSuffix, messages } = req;

  // Stream the reply as NDJSON events (one JSON object per line) so the client
  // can render/speak the beginning of the answer while the rest generates.
  // Once streaming starts the 200 status is already sent, so mid-stream
  // failures are delivered in-band as an "error" event.
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      // Sources are known before generation begins — send them immediately so
      // the grounding panel never waits on the model. Never read aloud.
      emit({
        type: "sources",
        condition,
        retrieval_ms: Number(retrievalMs.toFixed(3)),
        sources: retrieved,
      });

      try {
        for await (const text of provider.stream({
          system,
          systemSuffix,
          messages,
          maxTokens: 1024,
        })) {
          emit({ type: "text", text });
        }
        emit({ type: "done" });
      } catch (err) {
        // Log the real error server-side; tell the client only that generation
        // failed, so provider internals never leak in-band.
        console.error("[/api/chat]", err instanceof Error ? err.stack : err);
        emit({ type: "error", error: "Generation failed. Please try again." });
      }
      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
