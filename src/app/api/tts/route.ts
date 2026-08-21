import { NextRequest, NextResponse } from "next/server";
import { getTTSProvider, TTSProviderError } from "@/lib/providers/tts";
import { getDemoPhilosopher } from "@/lib/philosophers";
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

interface TTSBody {
  text?: unknown;
  philosopherId?: unknown;
  speed?: unknown;
}

/**
 * Synthesizes speech with the configured provider (ElevenLabs by default).
 *
 * When no provider is configured, returns 501 so the client knows to fall back
 * to the browser's Web Speech API. This keeps voice output working with no
 * setup, and high-quality with a key.
 *
 * Security note: ElevenLabs bills per character, so this is the app's most
 * cost-sensitive endpoint. It is guarded by a per-client rate limit and a hard
 * per-request character cap (a single spoken sentence is well within it). The
 * residual risk — someone using it as a free TTS service for arbitrary
 * philosopher-voiced text — is bounded by those two limits; see docs/SECURITY.md.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate-limit before checking provider config so the limiter still absorbs
    // floods even when TTS is unconfigured (and the client is meant to stop
    // retrying on 501, but must not be trusted to).
    await enforceRateLimit(req, "tts", RATE_LIMITS.tts);

    const provider = getTTSProvider();
    if (!provider) {
      return NextResponse.json(
        { error: "TTS provider not configured; use browser speech fallback." },
        { status: 501 },
      );
    }

    const body = await readJsonBody<TTSBody>(req);
    const text = field.requireString(body.text, "text", LIMITS.maxTtsChars);
    const philosopherId = field.requireString(
      body.philosopherId,
      "philosopherId",
      64,
    );
    // Only synthesize for a known philosopher — don't let arbitrary ids drive
    // the provider or fall through to the default voice for abuse.
    if (!getDemoPhilosopher(philosopherId)) {
      throw new HttpError(404, "Unknown philosopher.");
    }
    // Delivery pace, not a cost lever: it cannot change how much text is
    // billed, and the provider clamps it to the range the model accepts.
    const speed = field.optionalNumber(body.speed, "speed");

    const { audio, contentType } = await provider.synthesize(text, philosopherId, {
      speed,
    });
    return new NextResponse(audio, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(err, "[/api/tts]");
    // A provider failure. Log it server-side and tell the client *which kind*
    // it was, because the client's alternative is the browser's synthetic
    // voice and the three answers are different: wait and ask again, give up
    // on this sentence, or give up on the provider for this reply.
    console.error("[/api/tts]", err instanceof Error ? err.stack : err);
    if (err instanceof TTSProviderError) {
      if (err.retryable) {
        return NextResponse.json(
          { error: "Speech provider busy." },
          { status: 503, headers: { "Retry-After": "1" } },
        );
      }
      // Bad key, exhausted quota, or a plan that cannot reach the model: the
      // provider is configured but unusable, which for the client is the same
      // situation as no provider at all. 501 stops it retrying per sentence.
      if (err.status === 401 || err.status === 402 || err.status === 403) {
        return NextResponse.json(
          { error: "Speech provider unavailable; use browser speech fallback." },
          { status: 501 },
        );
      }
    }
    return NextResponse.json(
      { error: "Speech synthesis unavailable." },
      { status: 502 },
    );
  }
}
