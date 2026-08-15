import { NextResponse } from "next/server";
import { AnswerLevel, ANSWER_LEVELS, ChatMessage, DuelPhase, DUEL_PHASES } from "../types";
import { LIMITS, RateRule } from "./config";
import { getClientId } from "./clientId";
import { rateLimit } from "./rateLimit";

/**
 * Input validation, size enforcement, rate limiting, and error sanitization
 * shared by all API routes. The theme: reject anything malformed or oversized
 * *before* it can reach a paid model or the embedding runtime, and never let a
 * raw provider/internal error escape to the client.
 */

/** An error whose message is safe to show the client at the given status. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly clientMessage: string,
    /** Seconds to advertise in Retry-After (429s). */
    readonly retryAfter?: number,
  ) {
    super(clientMessage);
  }
}

const VALID_LEVELS = new Set<string>(ANSWER_LEVELS.map((l) => l.id));
const VALID_PHASES = new Set<string>(DUEL_PHASES.map((p) => p.id));

// ---- Body reading with a hard size cap --------------------------------------

/**
 * Read and parse a JSON body, rejecting anything over the byte cap first via
 * the Content-Length header (cheap) and then on the decoded text (covers
 * chunked/omitted-length requests). Prevents a giant payload from ever being
 * buffered into an LLM context or a TTS synthesis.
 */
export async function readJsonBody<T>(req: Request): Promise<T> {
  const declared = req.headers.get("content-length");
  if (declared && Number(declared) > LIMITS.maxBodyBytes) {
    throw new HttpError(413, "Request body too large.");
  }
  const text = await req.text();
  // Byte length, not char length — multibyte chars must count fully.
  if (Buffer.byteLength(text, "utf8") > LIMITS.maxBodyBytes) {
    throw new HttpError(413, "Request body too large.");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

// ---- Rate limiting ----------------------------------------------------------

/**
 * Enforce a per-client rate limit for `route`. Throws HttpError(429) with a
 * Retry-After when exceeded. Namespaced by route so limits don't cross-bleed.
 */
export async function enforceRateLimit(
  req: Request,
  route: string,
  rule: RateRule,
): Promise<void> {
  const id = getClientId(req);
  const result = await rateLimit(`${route}:${id}`, rule);
  if (!result.ok) {
    throw new HttpError(
      429,
      "Too many requests. Please slow down and try again shortly.",
      result.resetSeconds,
    );
  }
}

// ---- Field validators -------------------------------------------------------

function requireString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) throw new HttpError(400, `${field} is required.`);
  if (trimmed.length > max) {
    throw new HttpError(413, `${field} is too long.`);
  }
  return trimmed;
}

function optionalString(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max) throw new HttpError(413, `${field} is too long.`);
  return trimmed;
}

/** Coerce an answerLevel to a known value; unknown/absent falls back cleanly. */
export function coerceAnswerLevel(value: unknown): AnswerLevel {
  return typeof value === "string" && VALID_LEVELS.has(value)
    ? (value as AnswerLevel)
    : "intermediate";
}

export function coercePhase(value: unknown): DuelPhase {
  if (typeof value !== "string" || !VALID_PHASES.has(value)) {
    throw new HttpError(400, "Invalid debate phase.");
  }
  return value as DuelPhase;
}

/**
 * Validate a chat message history: correct roles, string content, and within
 * per-message / total / count caps. Returns a cleaned copy (unknown fields
 * dropped) so only role+content ever reach the model.
 */
export function validateMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, "messages must be a non-empty array.");
  }
  if (value.length > LIMITS.maxMessages) {
    throw new HttpError(413, "Conversation is too long.");
  }
  let total = 0;
  const clean: ChatMessage[] = value.map((m, i) => {
    if (!m || typeof m !== "object") {
      throw new HttpError(400, `Message ${i} is malformed.`);
    }
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") {
      throw new HttpError(400, `Message ${i} has an invalid role.`);
    }
    if (typeof content !== "string") {
      throw new HttpError(400, `Message ${i} content must be a string.`);
    }
    if (content.length > LIMITS.maxMessageChars) {
      throw new HttpError(413, `Message ${i} is too long.`);
    }
    total += content.length;
    return { role, content };
  });
  if (total > LIMITS.maxTotalChars) {
    throw new HttpError(413, "Conversation is too long.");
  }
  return clean;
}

/** Validate a duel transcript turn array (looser than chat; used as context). */
export function validateTranscript(
  value: unknown,
): { speaker: string; phase: DuelPhase; content: string }[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new HttpError(400, "transcript must be an array.");
  }
  if (value.length > LIMITS.maxTranscriptTurns) {
    throw new HttpError(413, "Debate transcript is too long.");
  }
  let total = 0;
  return value.map((t, i) => {
    if (!t || typeof t !== "object") {
      throw new HttpError(400, `Transcript turn ${i} is malformed.`);
    }
    const speaker = (t as { speaker?: unknown }).speaker;
    const content = (t as { content?: unknown }).content;
    const phase = (t as { phase?: unknown }).phase;
    if (typeof speaker !== "string" || speaker.length > 64) {
      throw new HttpError(400, `Transcript turn ${i} has an invalid speaker.`);
    }
    if (typeof content !== "string" || content.length > LIMITS.maxMessageChars) {
      throw new HttpError(400, `Transcript turn ${i} content is invalid.`);
    }
    total += content.length;
    if (total > LIMITS.maxTotalChars) {
      throw new HttpError(413, "Debate transcript is too long.");
    }
    return {
      speaker,
      phase: typeof phase === "string" && VALID_PHASES.has(phase) ? (phase as DuelPhase) : "opening",
      content,
    };
  });
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `${field} must be a number.`);
  }
  return value;
}

export const field = { requireString, optionalString, optionalNumber };

// ---- Error response ---------------------------------------------------------

/**
 * Convert any thrown value into a safe JSON response. Known HttpErrors surface
 * their (curated) message and status; anything else is logged server-side and
 * returned as a generic 500 — provider errors, stack traces, and internal
 * details never reach the client.
 */
export function errorResponse(err: unknown, logLabel: string): NextResponse {
  if (err instanceof HttpError) {
    const headers: Record<string, string> = {};
    if (err.retryAfter) headers["Retry-After"] = String(err.retryAfter);
    return NextResponse.json(
      { error: err.clientMessage },
      { status: err.status, headers },
    );
  }
  console.error(logLabel, err instanceof Error ? (err.stack ?? err.message) : err);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
