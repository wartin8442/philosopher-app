import { NextRequest, NextResponse } from "next/server";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { retrieveSources } from "@/lib/retrieval";
import { LIMITS, RATE_LIMITS } from "@/lib/security/config";
import {
  enforceRateLimit,
  errorResponse,
  field,
  HttpError,
  readJsonBody,
} from "@/lib/security/validate";
import { parseExperimentCondition } from "@/lib/experiment-conditions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RetrieveBody {
  philosopherId?: unknown;
  query?: unknown;
  condition?: unknown;
}

/**
 * Prefetch endpoint: the client calls this with the *interim* speech
 * transcript while the user is still talking. The real work is the side
 * effect — retrieveSources() scores and caches the results — so that the
 * /api/chat request for the final transcript finds them already cached and
 * pays zero retrieval latency.
 */
export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "retrieve", RATE_LIMITS.retrieve);

    const body = await readJsonBody<RetrieveBody>(req);
    const philosopherId = field.requireString(
      body.philosopherId,
      "philosopherId",
      64,
    );
    const query = field.requireString(body.query, "query", LIMITS.maxQueryChars);
    let condition;
    try {
      condition = parseExperimentCondition(body.condition);
    } catch {
      throw new HttpError(400, "condition must be A, B, or C.");
    }

    const philosopher = getDemoPhilosopher(philosopherId);
    if (!philosopher) throw new HttpError(404, "Unknown philosopher.");

    const started = performance.now();
    const sources = await retrieveSources(philosopher, query, { condition });
    return NextResponse.json({
      condition,
      retrieval_ms: Number((performance.now() - started).toFixed(3)),
      sources,
    });
  } catch (err) {
    return errorResponse(err, "[/api/retrieve]");
  }
}
