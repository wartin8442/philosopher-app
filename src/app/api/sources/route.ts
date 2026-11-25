import { NextRequest, NextResponse } from "next/server";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { parsePickerReply, pickerCandidates } from "@/lib/panel-sources";
import {
  getSourcePickerProvider,
  sourcePickerSystemPrompt,
  sourcePickerUserMessage,
} from "@/lib/providers/llm";
import { LIMITS, RATE_LIMITS } from "@/lib/security/config";
import {
  enforceRateLimit,
  errorResponse,
  field,
  HttpError,
  readJsonBody,
} from "@/lib/security/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SourcesBody {
  philosopherId?: unknown;
  /** The student's message the reply answered. */
  question?: unknown;
  /** The philosopher's finished reply. */
  reply?: unknown;
}

/**
 * "Show sources" panel: after a reply has finished, choose which of this
 * philosopher's sources it actually drew on. Called by the client only when
 * the panel is switched on, so it never touches the voice path's latency and
 * costs nothing for students who don't use it. See src/lib/panel-sources.ts.
 *
 * A picker failure is not an error the student can act on, so it returns an
 * empty list (logged server-side) rather than a failure status: the panel
 * shows nothing, which is honest, instead of an error banner under every reply.
 */
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "sources", RATE_LIMITS.sources);

    const body = await readJsonBody<SourcesBody>(req);
    const philosopherId = field.requireString(body.philosopherId, "philosopherId", 64);
    const question = field.requireString(body.question, "question", LIMITS.maxMessageChars);
    const reply = field.requireString(body.reply, "reply", LIMITS.maxMessageChars);

    const philosopher = getDemoPhilosopher(philosopherId);
    if (!philosopher) throw new HttpError(404, "Unknown philosopher.");

    const candidates = pickerCandidates(philosopher);
    if (candidates.length === 0) return NextResponse.json({ sources: [] });

    let raw: string;
    try {
      raw = await getSourcePickerProvider().complete({
        system: sourcePickerSystemPrompt(philosopher.name, candidates),
        messages: [{ role: "user", content: sourcePickerUserMessage(question, reply) }],
        // Room for the model's own reasoning before a short JSON answer.
        maxTokens: 2048,
      });
    } catch (err) {
      console.error("[/api/sources] picker failed:", err instanceof Error ? err.message : err);
      return NextResponse.json({ sources: [] });
    }

    return NextResponse.json({ sources: parsePickerReply(raw, candidates) });
  } catch (err) {
    return errorResponse(err, "[/api/sources]");
  }
}
