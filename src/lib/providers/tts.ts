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

export interface TTSOptions {
  /**
   * Speaking rate, where 1 is the voice's own pace. Callers that want a slower
   * delivery than conversation (the scripted courses) pass it per request.
   */
  speed?: number;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(
    text: string,
    philosopherId: string,
    options?: TTSOptions,
  ): Promise<TTSResult>;
}

/** The rate range ElevenLabs accepts in `voice_settings.speed`. */
export const SPEED_RANGE = { min: 0.7, max: 1.2 } as const;

/**
 * `voice_settings.speed` is honoured by the turbo/flash/multilingual models but
 * not by the tag-aware v3 model, which is what any accented voice resolves to.
 * Sending it there would be silently ignored at best, so it is dropped.
 */
function supportsSpeed(model: string): boolean {
  return !model.startsWith("eleven_v3");
}

interface ElevenLabsVoiceConfig {
  voiceId: string;
  /**
   * Overrides the model for this voice. Rarely needed: an entry carrying a
   * `textPrefix` already resolves to ACCENT_MODEL automatically.
   */
  model?: string;
  /**
   * Prepended to every synthesized text. Used for eleven_v3 audio tags
   * (e.g. "[French accent] ") — designed voices lose their accent under the
   * fast models, so any entry with a prefix is synthesized on ACCENT_MODEL.
   */
  textPrefix?: string;
}

/**
 * Sentinels marking an entry nobody has filled in yet.
 *
 * They are never sent to ElevenLabs: an unfilled `voiceId` resolves to
 * FALLBACK_VOICE and an unfilled `textPrefix` is dropped, so a half-populated
 * map still speaks rather than 404ing on a bogus voice or reading the literal
 * word "TODO" aloud. Replace the sentinel to activate an entry; delete the
 * `textPrefix` line entirely for philosophers who should have no accent tag.
 */
const TODO_VOICE_ID = "TODO_ELEVENLABS_VOICE_ID";
const TODO_ACCENT = "[TODO accent] ";

/** Model used whenever an accent tag is in play; the fast models flatten it. */
const ACCENT_MODEL = "eleven_v3";

/**
 * ElevenLabs voice per philosopher, keyed by `Philosopher.id`. These are custom
 * voices chosen to match each philosopher's manner; override per-philosopher
 * via the `elevenLabsVoiceId` field, or globally by editing this map.
 *
 * Every id on DEMO_ROSTER_IDS appears here so the set of voices still to be
 * cast is visible in one place. Entries below the divider are placeholders —
 * see the sentinels above. Trailing comments suggest the historically apt
 * accent; they are only suggestions, and "none" is a legitimate answer
 * (an English-language voice with no tag is often the better rendering for
 * the ancients).
 */
const DEFAULT_ELEVENLABS_VOICES: Record<string, ElevenLabsVoiceConfig> = {
  aquinas: { voiceId: "TTHZ6GFvCu6nDuRVAmfv" }, // Custom Aquinas-Inspired Voice
  nietzsche: {
    voiceId: "MjGLm924faVBjg7frvv7", // Custom Nietzsche-Inspired Voice
    textPrefix: "[German accent] ",
  },
  kierkegaard: { voiceId: "1yR3srTudun0BFqjXvHb" }, // Custom Kierkegaard-Inspired Voice
  sartre: {
    voiceId: "VGcOFI1K1K2Sd7xGarn5", // Sartre-Inspired Voice (French Prompt)
    textPrefix: "[French accent] ",
  },
  camus: { voiceId: "nFCbzv5sq7dVXDCkUWTe" }, // Custom Camus-Inspired Voice

  // ---- Not yet cast --------------------------------------------------------
  hume: { voiceId: "y6QUBnQ4I5J64y5FMpFu", textPrefix: "[Scottish accent] " }, // Scottish
  plato: { voiceId: "n4FoLdMLxhQNedMPVqzD", textPrefix: "[Greek accent] " }, // Greek, or none
  aristotle: { voiceId: "uenZORZ7buzqpUw66ypx", textPrefix: "[Greek accent] " }, // Greek, or none
  epicurus: { voiceId: "cc3SBG8zHz83gza0Itr5", textPrefix: "[Greek accent] " }, // Greek, or none
  "marcus-aurelius": { voiceId: "FAKqi770RP22085OkScn"}, // Roman; likely none
  augustine: { voiceId: "n4IoFOaZg7gJiJAOa8E9"}, // North African Latin; likely none
  spinoza: { voiceId: "MCX8QjrBTD9z9cJPiVSY", textPrefix: "[Dutch accent] " }, // Dutch
  james: { voiceId: "2lFXWEWC4JT1kI3wzDqB", textPrefix: "[American accent] " }, // American (New England); likely none
  beauvoir: { voiceId: "ZxtDoKASwmbwh4YPpXPt", textPrefix: "[French accent] " }, // French — female voice
  foucault: { voiceId: "6QDzztm8rJU5Flckuk0U", textPrefix: "[French accent] " }, // French
  descartes: { voiceId: "KThPewQbxhHSXOKNDkAO", textPrefix: "[French accent] " }, // French
  locke: { voiceId: "vFQFOC28amdtW3qOZBac", textPrefix: "[British accent] " }, // English
  kant: { voiceId: "IbjS4SCZTkxaEoCgVwvL", textPrefix: "[German accent] " }, // German
  hegel: { voiceId: "3aSzYW1cFoQkW6bzdvDe", textPrefix: "[German accent] " }, // German (Swabian)
  mill: { voiceId: "fd6OOO3bRCLHcNLGsu5f", textPrefix: "[English accent] "}, // English
  marx: { voiceId: "FOD74UlGEdxyivdRKchT", textPrefix: "[German accent] " }, // German
  heidegger: { voiceId: "eKiF8c1XfXDqScXH0UV5", textPrefix: "[German accent] " }, // German
  wittgenstein: { voiceId: "zbnH968Mdmkh82dn0apE", textPrefix: "[Austrian accent] " }, // Austrian German
};

/** Used when a philosopher has no cast voice yet. */
const FALLBACK_VOICE = "onwK4e9ZLuTAKqWW03F9";

/** One warning per philosopher per process, so the log stays readable. */
const placeholderWarned = new Set<string>();

/**
 * The voice, model, and text actually sent for a philosopher, with unfilled
 * placeholders stripped. Exported for tests and for scripts that audit which
 * philosophers still share the fallback voice.
 */
export function resolveVoice(
  philosopherId: string,
  text: string,
  defaultModel: string,
  overrideVoiceId?: string,
): { voiceId: string; model: string; text: string } {
  const config = DEFAULT_ELEVENLABS_VOICES[philosopherId];
  const castVoiceId =
    config?.voiceId && config.voiceId !== TODO_VOICE_ID ? config.voiceId : undefined;
  const prefix =
    config?.textPrefix && config.textPrefix !== TODO_ACCENT
      ? config.textPrefix
      : undefined;

  if (!overrideVoiceId && !castVoiceId && !placeholderWarned.has(philosopherId)) {
    placeholderWarned.add(philosopherId);
    console.warn(
      `[tts] no ElevenLabs voice cast for "${philosopherId}"; using the shared ` +
        "fallback voice. Fill its entry in DEFAULT_ELEVENLABS_VOICES.",
    );
  }

  return {
    voiceId: overrideVoiceId || castVoiceId || FALLBACK_VOICE,
    // An accent tag only survives on the slower, tag-aware model, so a filled-in
    // prefix selects it without the author having to remember to set `model`.
    model: config?.model || (prefix ? ACCENT_MODEL : defaultModel),
    text: prefix ? prefix + text : text,
  };
}

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

  async synthesize(
    text: string,
    philosopherId: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    const philosopher = getPhilosopher(philosopherId);
    const { voiceId, model, text: fullText } = resolveVoice(
      philosopherId,
      text,
      this.model,
      philosopher?.elevenLabsVoiceId,
    );
    const speed =
      options?.speed !== undefined && supportsSpeed(model)
        ? Math.min(SPEED_RANGE.max, Math.max(SPEED_RANGE.min, options.speed))
        : undefined;

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
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            ...(speed !== undefined ? { speed } : {}),
          },
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
