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

interface ElevenLabsVoiceConfig {
  voiceId: string;
  /** Overrides ELEVENLABS_MODEL for voices that need a specific model. */
  model?: string;
  /**
   * Prepended to every synthesized text. Used for eleven_v3 audio tags
   * (e.g. "[French accent] ") — designed voices lose their accent under the
   * fast models, so accented philosophers render on v3 with an accent tag.
   */
  textPrefix?: string;
}

/**
 * Default ElevenLabs voices per philosopher. These are custom voices chosen
 * to match each philosopher's manner; override the voice per-philosopher via
 * the `elevenLabsVoiceId` field, or globally by editing this map.
 */
const DEFAULT_ELEVENLABS_VOICES: Record<string, ElevenLabsVoiceConfig> = {
  aquinas: { voiceId: "TTHZ6GFvCu6nDuRVAmfv" }, // Custom Aquinas-Inspired Voice
  nietzsche: {
    voiceId: "MjGLm924faVBjg7frvv7", // Custom Nietzsche-Inspired Voice
    model: "eleven_v3", // fast models flatten the accent; v3 honors the tag
    textPrefix: "[German accent] ",
  },
  kierkegaard: { voiceId: "1yR3srTudun0BFqjXvHb" }, // Custom Kierkegaard-Inspired Voice
  sartre: {
    voiceId: "VGcOFI1K1K2Sd7xGarn5", // Sartre-Inspired Voice (French Prompt)
    model: "eleven_v3", // fast models flatten the accent; v3 honors the tag
    textPrefix: "[French accent] ",
  },
  camus: { voiceId: "nFCbzv5sq7dVXDCkUWTe" }, // Custom Camus-Inspired Voice
};
const FALLBACK_VOICE = "onwK4e9ZLuTAKqWW03F9";

class ElevenLabsProvider implements TTSProvider {
  readonly name = "elevenlabs";
  private apiKey: string;
  private model: string;
  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set for TTS_PROVIDER=elevenlabs.");
    }
    this.apiKey = apiKey;
    this.model = process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";
  }

  async synthesize(text: string, philosopherId: string): Promise<TTSResult> {
    const philosopher = getPhilosopher(philosopherId);
    const config = DEFAULT_ELEVENLABS_VOICES[philosopherId];
    const voiceId =
      philosopher?.elevenLabsVoiceId || config?.voiceId || FALLBACK_VOICE;
    const model = config?.model || this.model;
    const fullText = config?.textPrefix ? config.textPrefix + text : text;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: fullText,
          model_id: model,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!res.ok) {
      throw new Error(
        `ElevenLabs error ${res.status}: ${await res.text()}`,
      );
    }
    return { audio: await res.arrayBuffer(), contentType: "audio/mpeg" };
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
