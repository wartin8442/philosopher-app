import { getPhilosopher } from "../philosophers";

/**
 * Text-to-speech provider abstraction.
 *
 * Default: ElevenLabs (high quality, distinct voices). Swappable via env.
 * When no provider/key is configured, the /api/tts route reports "unavailable"
 * and the client falls back to the browser's free Web Speech API — so the app
 * always has working voice output with zero configuration.
 */

export interface TTSResult {
  audio: ArrayBuffer;
  contentType: string;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(text: string, philosopherId: string): Promise<TTSResult>;
}

/**
 * Default ElevenLabs voice ids per philosopher. These are stock voices chosen
 * to loosely match each philosopher's manner; override per-philosopher via the
 * `elevenLabsVoiceId` field, or globally by editing this map. (Ids are
 * ElevenLabs' public prebuilt voices.)
 */
const DEFAULT_ELEVENLABS_VOICES: Record<string, string> = {
  aquinas: "TTHZ6GFvCu6nDuRVAmfv", // Custom Aquinas-Inspired Voice
  nietzsche: "MjGLm924faVBjg7frvv7", // Custom Nietzsche-Inspired Voice
  kierkegaard: "1yR3srTudun0BFqjXvHb", // Custom Kierkegaard-Inspired Voice
  sartre: "M1373Cx33m7T1TjfpLeg", // Custom Sartre-Inspired Voice
  camus: "nFCbzv5sq7dVXDCkUWTe", // Custom Camus-Inspired Voice
};
const FALLBACK_VOICE = "onwK4e9ZLuTAKqWW03F9";
const DEFAULT_ELEVENLABS_MODEL = "eleven_flash_v2_5";
const DEFAULT_ELEVENLABS_OUTPUT_FORMAT = "mp3_22050_32";

class ElevenLabsProvider implements TTSProvider {
  readonly name = "elevenlabs";
  private apiKey: string;
  private model: string;
  private outputFormat: string;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set for TTS_PROVIDER=elevenlabs.");
    }
    this.apiKey = apiKey;
    this.model = process.env.ELEVENLABS_MODEL || DEFAULT_ELEVENLABS_MODEL;
    this.outputFormat =
      process.env.ELEVENLABS_OUTPUT_FORMAT || DEFAULT_ELEVENLABS_OUTPUT_FORMAT;
  }

  async synthesize(text: string, philosopherId: string): Promise<TTSResult> {
    const philosopher = getPhilosopher(philosopherId);
    const voiceId =
      philosopher?.elevenLabsVoiceId ||
      DEFAULT_ELEVENLABS_VOICES[philosopherId] ||
      FALLBACK_VOICE;

    const url = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
    url.searchParams.set("output_format", this.outputFormat);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: this.model,
        // speed < 1 slows delivery to a measured, unhurried pace; the
        // higher stability keeps pacing consistent, letting commas and
        // other punctuation register as natural pauses.
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          speed: 0.9,
        },
      }),
    });
    if (!res.ok) {
      throw new Error(
        `ElevenLabs error ${res.status}: ${await res.text()}`,
      );
    }
    return {
      audio: await res.arrayBuffer(),
      contentType: res.headers.get("content-type") || "audio/mpeg",
    };
  }
}

/**
 * Returns the configured provider, or null when TTS is disabled/unconfigured
 * (in which case the client should use the Web Speech API fallback).
 */
export function getTTSProvider(): TTSProvider | null {
  const provider = (process.env.TTS_PROVIDER || "elevenlabs").toLowerCase();
  if (provider === "none") return null;
  if (provider === "elevenlabs") {
    if (!process.env.ELEVENLABS_API_KEY) return null;
    return new ElevenLabsProvider();
  }
  return null;
}
