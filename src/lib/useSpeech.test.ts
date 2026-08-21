import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeech } from "./useSpeech";

/**
 * How a streamed reply survives a bad TTS request.
 *
 * The provider voice is the product; the browser's synthetic voice is the
 * safety net, and it is jarring enough that it should be reached for only as
 * often as the failures actually warrant. What these cover is the difference
 * between "a request dropped" and "there is no provider": the first costs one
 * sentence and the next one asks again, the second moves the whole reply over
 * at once.
 */

interface FakeSource {
  buffer: unknown;
  onended: (() => void) | null;
  connect: (node: unknown) => void;
  start: (at: number) => void;
  stop: () => void;
}

/**
 * Enough of an AudioContext for the streaming path to schedule clips against.
 * `currentTime` never advances, which keeps the lookahead gate open and every
 * subtitle reveal pending — these tests care about which voice was chosen, not
 * about playback timing.
 */
function installAudioContext(): void {
  class FakeAudioContext {
    state = "running";
    currentTime = 0;
    destination = {};
    createAnalyser() {
      return { fftSize: 0, smoothingTimeConstant: 0, connect: () => {} };
    }
    createBufferSource(): FakeSource {
      const source: FakeSource = {
        buffer: null,
        onended: null,
        connect: () => {},
        start: () => {
          // Report the clip finished immediately so `end()` can resolve.
          setTimeout(() => source.onended?.(), 0);
        },
        stop: () => {},
      };
      return source;
    }
    decodeAudioData() {
      return Promise.resolve({ duration: 0 });
    }
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
}

/** Records what the browser fallback was asked to say. */
function installSpeechSynthesis(): string[] {
  const spoken: string[] = [];
  class FakeUtterance {
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    rate = 1;
    pitch = 1;
    constructor(readonly text: string) {}
  }
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("speechSynthesis", {
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speak: (u: FakeUtterance) => {
      spoken.push(u.text);
      u.onstart?.();
      u.onend?.();
    },
  });
  return spoken;
}

/** An /api/tts response carrying playable audio. */
function audioResponse(): Response {
  return new Response(new ArrayBuffer(8), { status: 200 });
}

/** Sentences long enough that the chunker emits them one at a time. */
const LINES = [
  "Consider the first.",
  "Consider the second.",
  "Consider the third.",
  "Consider the fourth.",
  "Consider the fifth.",
  "Consider the sixth.",
];

describe("useSpeech streaming fallback", () => {
  let spoken: string[];

  beforeEach(() => {
    installAudioContext();
    spoken = installSpeechSynthesis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /**
   * Speak `lines` through the streaming path with `respond` standing in for
   * /api/tts, and report how many requests it received.
   */
  async function speakLines(
    lines: string[],
    respond: (text: string) => Response,
  ): Promise<number> {
    const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { text: string };
      return respond(body.text);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSpeech());
    await act(async () => {
      const stream = result.current.startSpeechStream("nietzsche");
      // A newline is a hard sentence break, which is how a lecture feeds its
      // script in — see courseNarration.
      for (const line of lines) stream.push(`${line}\n`);
      await stream.end();
    });
    return fetchMock.mock.calls.length;
  }

  it("keeps asking the provider after one sentence fails", async () => {
    // The first sentence 502s on every attempt, the rest are fine. Only that
    // one sentence should reach the browser voice.
    await speakLines(LINES.slice(0, 4), (text) =>
      text === LINES[0] ? new Response("nope", { status: 502 }) : audioResponse(),
    );

    expect(spoken).toEqual([LINES[0]]);
  }, 20_000);

  it("moves the whole reply over when no provider is configured", async () => {
    // 501 is "there is no provider": every later sentence goes straight to the
    // browser voice without another request.
    const calls = await speakLines(
      LINES.slice(0, 4),
      () => new Response("unconfigured", { status: 501 }),
    );

    expect(spoken).toEqual(LINES.slice(0, 4));
    // Only the sentences already in flight when the answer came back paid for
    // a request — so at most the concurrency cap, not one per sentence.
    expect(calls).toBeLessThanOrEqual(2);
  });

  it("stops asking once the failures stop looking like a hiccup", async () => {
    // A provider that is down for good. 413 is deterministic, so each sentence
    // costs exactly one request — and after a few in a row the stream should
    // give up rather than stall in front of every remaining sentence.
    const calls = await speakLines(
      LINES,
      () => new Response("too long", { status: 413 }),
    );

    expect(spoken).toEqual(LINES);
    // It takes a few failures to conclude the provider is down, but well short
    // of asking once per sentence.
    expect(calls).toBeLessThanOrEqual(4);
  });

  it("waits out a busy provider instead of changing voice", async () => {
    // 503 means "ask again". The retry succeeds, so nothing is spoken by the
    // browser at all.
    let attempts = 0;
    await speakLines(LINES.slice(0, 2), (text) => {
      if (text === LINES[0] && attempts++ < 2) {
        return new Response("busy", {
          status: 503,
          headers: { "Retry-After": "0" },
        });
      }
      return audioResponse();
    });

    expect(spoken).toEqual([]);
  }, 20_000);

  it("does not retry a request the provider will reject again", async () => {
    // One request for the rejected sentence, one for the good one, and no
    // backoff in between.
    const calls = await speakLines(LINES.slice(0, 2), (text) =>
      text === LINES[0]
        ? new Response("too long", { status: 413 })
        : audioResponse(),
    );

    expect(spoken).toEqual([LINES[0]]);
    expect(calls).toBe(2);
  });
});
