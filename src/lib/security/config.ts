/**
 * Central security limits. Everything tunable about abuse protection lives
 * here so the numbers are auditable in one place and can be moved to
 * environment variables later without touching route logic.
 *
 * The rate-limit numbers are per client identity (see clientId.ts) within a
 * fixed window. They are deliberately generous enough for real use — a voice
 * conversation fires one /api/chat per turn and many /api/tts per spoken reply
 * (one request per sentence) — but low enough that a script cannot run up the
 * Anthropic / ElevenLabs bill or exhaust compute.
 */

export interface RateRule {
  /** Max requests allowed within the window for one client. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

export const RATE_LIMITS = {
  /** LLM chat turns. One per user message; retries are rare. */
  chat: { limit: 20, windowSec: 60 } as RateRule,
  /** Duel turns auto-advance and fire in quick succession (~9 per debate). */
  duel: { limit: 40, windowSec: 60 } as RateRule,
  /** TTS is called once per sentence, so a single reply can be a burst. */
  tts: { limit: 120, windowSec: 60 } as RateRule,
  /** Retrieval prefetch fires on interim transcripts while the user talks. */
  retrieve: { limit: 90, windowSec: 60 } as RateRule,
  /**
   * Coarse backstop applied in middleware across ALL /api/* routes, to catch a
   * flood that spreads itself thin across endpoints. Sized above the sum of a
   * legitimate session's per-route bursts.
   */
  global: { limit: 240, windowSec: 60 } as RateRule,
} as const;

/**
 * Payload / field size caps. Enforced before anything reaches a model, so an
 * attacker cannot inflate an LLM context (cost) or an ElevenLabs synthesis
 * (per-character cost) with a giant body.
 */
export const LIMITS = {
  /** Hard cap on the raw request body, checked via Content-Length and on read. */
  maxBodyBytes: 64 * 1024, // 64 KB
  /** Max messages in a chat history. A long session stays well under this. */
  maxMessages: 40,
  /** Max characters in any single chat/duel message. */
  maxMessageChars: 8_000,
  /** Max characters summed across the whole chat history. */
  maxTotalChars: 24_000,
  /** Max characters accepted for TTS synthesis in one request (one sentence). */
  maxTtsChars: 1_200,
  /** Max characters for a retrieval query (interim speech transcript). */
  maxQueryChars: 2_000,
  /** Max characters for a duel topic. */
  maxTopicChars: 500,
  /** Max characters for a live audience interjection. */
  maxInterjectionChars: 1_000,
  /** Max turns kept from a duel transcript. */
  maxTranscriptTurns: 60,
} as const;
