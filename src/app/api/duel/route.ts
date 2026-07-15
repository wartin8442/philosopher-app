import { NextRequest } from "next/server";
import { getPhilosopher } from "@/lib/philosophers";
import {
  buildSystemPrompt,
  getLLMProvider,
  LLMProvider,
  LLMRequest,
} from "@/lib/providers/llm";
import { DuelPhase, DuelTurn } from "@/lib/types";
import { LIMITS, RATE_LIMITS } from "@/lib/security/config";
import {
  coerceAnswerLevel,
  coercePhase,
  enforceRateLimit,
  errorResponse,
  field,
  HttpError,
  readJsonBody,
  validateTranscript,
} from "@/lib/security/validate";
import {
  INJECTION_REINFORCEMENT,
  looksLikeInjection,
  wrapUntrusted,
} from "@/lib/security/injection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DuelBody {
  speakerId?: unknown;
  opponentId?: unknown;
  topic?: unknown;
  phase?: unknown;
  transcript?: unknown;
  answerLevel?: unknown;
  /** Optional live interjection from the user to respond to before continuing. */
  interjection?: unknown;
}

const PHASE_INSTRUCTIONS: Record<DuelPhase, string> = {
  opening:
    "This is the OPENING. State your own position on the topic clearly and forcefully, in your own voice. Do not yet respond to your opponent. A few sentences to a short paragraph.",
  critique:
    "This is the CRITIQUE. You have just heard your opponent's opening (quoted below). Respond directly to what they actually said — name the specific claim and press on its weakest point from your philosophy. Do not restate your whole position; engage theirs.",
  rebuttal:
    "This is the REBUTTAL. Your opponent has critiqued you (quoted below). Defend your position against their specific objection and, where warranted, turn it back on them. Stay on the actual argument they made.",
  "cross-exam":
    "This is open CROSS-EXAMINATION. Respond to your opponent's most recent statement (quoted below): press them with a pointed question or objection, or answer a challenge they put to you. Keep it tight and conversational — one substantive move.",
  recap: "", // handled separately (neutral summary, not in character)
};

/**
 * Stream a model reply as NDJSON events (one JSON object per line): `text`
 * deltas while the model generates, then `done`. Same event shape as
 * /api/chat (minus `sources`), so the client shares one reader. Once
 * streaming starts the 200 status is already sent, so mid-stream failures
 * are delivered in-band as an `error` event.
 */
function streamReply(
  provider: LLMProvider,
  req: LLMRequest,
  logLabel: string,
): Response {
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        for await (const text of provider.stream(req)) {
          emit({ type: "text", text });
        }
        emit({ type: "done" });
      } catch (err) {
        // Log the real error server-side; the client only learns generation
        // failed, so provider internals never leak in-band.
        console.error(logLabel, err instanceof Error ? err.stack : err);
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

/** Pull the opponent's most recent substantive statement from the transcript. */
function lastFrom(transcript: DuelTurn[], speakerId: string): string | null {
  for (let i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i].speaker === speakerId) return transcript[i].content;
  }
  return null;
}

function transcriptToText(transcript: DuelTurn[]): string {
  return transcript
    .map((t) => {
      const who =
        t.speaker === "user"
          ? "Audience"
          : (getPhilosopher(t.speaker)?.name ?? t.speaker);
      return `${who}: ${t.content}`;
    })
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "duel", RATE_LIMITS.duel);

    const body = await readJsonBody<DuelBody>(req);

    const speakerId = field.requireString(body.speakerId, "speakerId", 64);
    const opponentId = field.requireString(body.opponentId, "opponentId", 64);
    const topic = field.requireString(body.topic, "topic", LIMITS.maxTopicChars);
    const phase = coercePhase(body.phase);
    const transcript = validateTranscript(body.transcript);
    const answerLevel = coerceAnswerLevel(body.answerLevel);
    const interjection = field.optionalString(
      body.interjection,
      "interjection",
      LIMITS.maxInterjectionChars,
    );

    const provider = getLLMProvider();

    // ---- Neutral recap: not spoken in character -----------------------------
    if (phase === "recap") {
      const a = getPhilosopher(speakerId);
      const b = getPhilosopher(opponentId);
      if (!a || !b) throw new HttpError(404, "Unknown philosopher(s).");
      const system = `You are a neutral, knowledgeable philosophy moderator. Summarize the debate below fairly and concisely for a listener. Identify the central point of disagreement between ${a.name} and ${b.name}, the strongest move each made, and where they fundamentally diverge. Do not declare a winner. Speak plainly for voice (no markdown or lists). Keep it to a short paragraph.`;
      // Streamed like the in-character turns so the client has exactly one
      // response format to read (and the moderator speaks sentence-by-sentence).
      return streamReply(
        provider,
        {
          system,
          messages: [
            {
              role: "user",
              content: `Topic: ${topic}\n\nDebate transcript:\n${transcriptToText(transcript)}`,
            },
          ],
          maxTokens: 700,
        },
        "[/api/duel recap]",
      );
    }

    // ---- A philosopher's turn -----------------------------------------------
    const speaker = getPhilosopher(speakerId);
    const opponent = getPhilosopher(opponentId);
    if (!speaker || !opponent) throw new HttpError(404, "Unknown philosopher(s).");

    const opponentLast = lastFrom(transcript, opponentId);

    const duelContext: string[] = [
      `You are in a structured philosophical debate with ${opponent.name}. The debate topic is: "${topic}".`,
      PHASE_INSTRUCTIONS[phase],
    ];

    // Give the speaker the opponent's ACTUAL previous statement (not a summary),
    // per the orchestration design. The transcript is client-supplied, so it is
    // fenced as untrusted content rather than interpolated as instructions.
    if (opponentLast && phase !== "opening") {
      duelContext.push(
        `${wrapUntrusted(`What ${opponent.name} just said`, opponentLast)}\nRespond to what they actually said.`,
      );
    }

    // Standing rule: the listener is a live participant, not a silent
    // spectator, and agreement in particular must be received in character.
    duelContext.push(
      `The listener (the audience member staging this debate) may jump into the conversation at any time — to ask a question, to expand on a point, or to voice agreement with one of you. Treat these as a welcome part of the debate: answer their questions, engage with their expansions, and if they voice agreement with a philosopher, that philosopher should acknowledge their support directly before continuing (and the other may push back on it).`,
    );

    // A live audience interjection takes priority: address it, then continue.
    // Fenced as untrusted input so an interjection can't rewrite the debate.
    if (interjection) {
      duelContext.push(
        `A member of the audience has just interjected. ${wrapUntrusted(
          "Their interjection",
          interjection,
        )}\nAddress their point directly and briefly first, then continue the debate.`,
      );
    }

    // Outside cross-examination there is no back-and-forth, so a closing
    // question aimed at the opponent just hangs unanswered. Redirect the same
    // impulse at the listener as an offer to clarify.
    if (phase !== "cross-exam") {
      duelContext.push(
        `Do not end your turn with a rhetorical question aimed at your opponent — save direct challenges for cross-examination. If you are moved to close on a question, make it an offer of clarification addressed to the audience, in the form: "Shall I explain [the point you would expand on] further for our listener before we advance?"`,
      );
    }

    duelContext.push(
      "Stay in character and accurate. Speak conversationally for voice — no markdown, no stage directions. Be pointed and concise.",
    );

    // If the audience interjection (or the topic itself) looks like a prompt
    // injection, reinforce character-holding for this turn only.
    const reinforcement =
      (interjection && looksLikeInjection(interjection)) || looksLikeInjection(topic)
        ? INJECTION_REINFORCEMENT
        : undefined;

    // Persona in `system` (cached across the duel's turns), per-phase debate
    // instructions in `systemSuffix` (change every turn).
    const { system, systemSuffix } = buildSystemPrompt({
      philosopher: speaker,
      answerLevel,
      extra: duelContext.join("\n\n"),
      reinforcement,
    });

    // Provide the running transcript as the conversational context.
    const priorText = transcriptToText(transcript);
    const userTurn =
      (priorText ? `Debate so far:\n${priorText}\n\n` : "") +
      `It is now your turn, ${speaker.name}. ${
        phase === "opening" ? "Give your opening position." : "Give your response."
      }`;

    return streamReply(
      provider,
      {
        system,
        systemSuffix,
        messages: [{ role: "user", content: userTurn }],
        maxTokens: 700,
      },
      "[/api/duel]",
    );
  } catch (err) {
    return errorResponse(err, "[/api/duel]");
  }
}
