"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSentenceChunker } from "./sentences";
import {
  createFirstAudioCapture,
  type FirstAudioMeasurement,
  watchWebAudioOnset,
} from "./first-audio";

/**
 * Voice output. Tries the server TTS provider (ElevenLabs) first; if it is not
 * configured or fails, falls back to the browser's free Web Speech synthesis.
 *
 * Two modes:
 * - `speak(text)` — synthesizes a finished string in one request. Kept for
 *   callers with the whole reply in hand (duel mode).
 * - `startSpeechStream()` — accepts text fragments as they stream from the
 *   LLM, cuts them into sentences, synthesizes each sentence as soon as it is
 *   complete, and plays the clips gaplessly via a Web Audio queue (each clip
 *   scheduled at the previous clip's exact end time on the audio clock).
 */

export interface SpeechStream {
  /** Feed a raw text fragment as it arrives from the LLM stream. */
  push(fragment: string): void;
  /** Signal end of text. Resolves when all queued audio finishes playing. */
  end(): Promise<void>;
  /** Abort synthesis and playback immediately. */
  cancel(): void;
  /** True once cancel() has been called. */
  readonly cancelled: boolean;
  /**
   * Stop the pending `onSentenceStart` reveals while the audio clock is
   * suspended, and start them again when it is running. Called by the hook's
   * `hold`/`release`, which suspend the clock — see there for why.
   */
  hold(): void;
  release(): void;
}

export interface SpeechStreamCallbacks {
  /** Fires once, the moment sound actually starts (either audio path). */
  onFirstAudio?: (measurement: FirstAudioMeasurement) => void;
  /**
   * Fires when a sentence's audio actually starts playing, in speaking
   * order. Lets the UI reveal the transcript in step with the voice.
   */
  onSentenceStart?: (sentence: string) => void;
}

/**
 * How this stream should be delivered. A conversation and a lecture want
 * different pacing out of the same voice: a reply is a person talking back,
 * a lecture is a person teaching, and a teacher is slower.
 */
export interface SpeechStreamOptions {
  /** Silence between sentence clips, in seconds. Defaults to SENTENCE_PAUSE_S. */
  sentencePause?: number;
  /**
   * Speaking rate asked of the provider, where 1 is the voice's own pace.
   * Clamped server-side; ignored by the browser-speech fallback path, which
   * has its own fixed rate.
   */
  speed?: number;
}

/** A synthesized segment: decoded audio, or text for the browser fallback. */
type Segment =
  | { buffer: AudioBuffer; sentence: string }
  | { fallbackText: string }
  | null;

// Breathing room between sentence clips. The text is cut at sentence
// boundaries and each clip is synthesized separately, so without this gap the
// next sentence starts the instant the previous one ends and the delivery
// sounds rushed — the period never "lands."
const SENTENCE_PAUSE_S = 0.35;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<SpeechStream | null>(null);
  // All streamed TTS clips route through this analyser, so the UI can render
  // an audio-reactive visualizer. Null until the first clip plays, and always
  // null on the browser speechSynthesis fallback (which has no audio graph).
  const analyserRef = useRef<AnalyserNode | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.cancel();
    streamRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  /**
   * Freeze playback where it stands, without throwing it away.
   *
   * `stop` abandons the clips, so picking the voice back up afterwards means
   * synthesizing the sentence again: a second of silence while the request
   * goes out, and then the sentence starting over from its first word. That is
   * what a pause used to sound like. Suspending the audio clock instead holds
   * the whole graph exactly where it is, mid-word, and `release` carries on
   * from the same sample with nothing to fetch.
   *
   * The pending subtitle reveals are held with it, because they are timed
   * against that same clock; see `Reveal`.
   */
  const hold = useCallback(() => {
    streamRef.current?.hold();
    audioRef.current?.pause();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
  }, []);

  const release = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
    void audioRef.current?.play().catch(() => {});
    const ctx = audioCtxRef.current;
    // The reveals are re-armed only once the clock is running again, or they
    // would each be measured against a currentTime that is still frozen.
    if (!ctx || ctx.state !== "suspended") {
      streamRef.current?.release();
      return;
    }
    void ctx
      .resume()
      .catch(() => {})
      .finally(() => streamRef.current?.release());
  }, []);

  /**
   * Lazily create (and reuse) the AudioContext. Browsers start contexts
   * "suspended" until a user gesture; resume() here so playback can begin.
   */
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new Ctor();
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      analyser.connect(audioCtxRef.current.destination);
      analyserRef.current = analyser;
    }
    void audioCtxRef.current.resume().catch(() => {});
    return audioCtxRef.current;
  }, []);

  const speakWithBrowser = useCallback((text: string, onStart?: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.onstart = () => onStart?.();
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const startSpeechStream = useCallback(
    (
      philosopherId: string,
      callbacks?: SpeechStreamCallbacks,
      options?: SpeechStreamOptions,
    ): SpeechStream => {
      const { onFirstAudio, onSentenceStart } = callbacks ?? {};
      const sentencePause = options?.sentencePause ?? SENTENCE_PAUSE_S;
      const speed = options?.speed;
      stop();
      setSpeaking(true);

      // Fires once when the Web Audio clock reaches the scheduled onset or
      // Web Speech emits its actual onstart event.
      let firstAudioFired = false;
      const onsetWatchers = new Set<() => void>();
      const captureFirstAudio = createFirstAudioCapture(performance.now(), onFirstAudio);
      const markFirstAudio = (path: "web-audio" | "web-speech") => {
        if (firstAudioFired) return;
        firstAudioFired = true;
        captureFirstAudio(path);
        for (const cancel of onsetWatchers) cancel();
        onsetWatchers.clear();
      };

      const ctx = getAudioContext();
      const chunker = createSentenceChunker();
      const abort = new AbortController();
      const activeSources = new Set<AudioBufferSourceNode>();

      let cancelled = false;
      let inputDone = false;
      // No Web Audio at all (very old browser): browser speech from the start.
      let useBrowserFallback = ctx === null;
      // Where on the audio clock the next clip should begin.
      let nextStartTime = 0;
      // Resolves when the most recently scheduled clip finishes playing.
      let lastScheduledDone: Promise<void> = Promise.resolve();
      // Lets enqueue() wake the playback loop when it is waiting for input.
      let wake: (() => void) | null = null;

      // Ordered queue: requests are fired the moment a sentence is ready
      // (overlapping in flight), but played strictly in this order.
      const segments: Promise<Segment>[] = [];

      // Cap in-flight synthesis requests. Long replies produce many sentences
      // at once, and firing them all in parallel trips the TTS provider's
      // concurrency limit — which used to flip the whole reply to the browser
      // voice midway through.
      const MAX_CONCURRENT_TTS = 2;
      let inFlight = 0;
      const slotWaiters: (() => void)[] = [];
      const acquireSlot = async () => {
        while (inFlight >= MAX_CONCURRENT_TTS && !cancelled) {
          await new Promise<void>((resolve) => slotWaiters.push(resolve));
        }
        inFlight++;
      };
      const releaseSlot = () => {
        inFlight--;
        slotWaiters.shift()?.();
      };

      // Sleeps a cancel can cut short, so an abandoned stream does not sit in a
      // backoff before its segment promises settle.
      const sleepers = new Set<() => void>();
      const delay = (ms: number) =>
        new Promise<void>((resolve) => {
          let timer: ReturnType<typeof setTimeout>;
          const done = () => {
            clearTimeout(timer);
            sleepers.delete(done);
            resolve();
          };
          timer = setTimeout(done, ms);
          sleepers.add(done);
        });

      /**
       * How far ahead of the audio clock synthesis is allowed to run, in
       * seconds.
       *
       * Concurrency alone does not bound the request *rate*. A lecture section
       * hands over its whole script at once, so two-at-a-time still finishes
       * forty syntheses inside the time the first few clips take to play — and
       * that burst is what draws the provider's 429 to begin with. Waiting
       * until the scheduled audio runs low keeps a cushion far longer than the
       * "no dead air" rule needs while spacing the requests out at roughly the
       * pace they are consumed.
       */
      const LOOKAHEAD_S = 12;
      const waitForRoomAhead = async () => {
        if (!ctx) return;
        // A held lecture suspends the clock and this idles with it, which is
        // right: nothing is being listened to.
        while (!cancelled && nextStartTime - ctx.currentTime > LOOKAHEAD_S) {
          await delay(400);
        }
      };

      // Attempts per sentence and the pauses between them — about four seconds
      // in the worst case. Long, but the cushion above normally covers it, and
      // what the listener hears otherwise is the browser's synthetic voice.
      const TTS_ATTEMPTS = 4;
      const TTS_BACKOFF_MS = [300, 800, 1800];
      /**
       * Consecutive sentences that had to use the browser voice before the
       * stream stops asking the provider at all. One dropped request is a
       * hiccup and should cost one sentence; several in a row means the
       * provider is genuinely down, and asking again only buys a stall in
       * front of every remaining sentence.
       */
      const MAX_CONSECUTIVE_FAILURES = 3;
      let consecutiveFailures = 0;

      /** Honour a Retry-After, but never wait longer than a sentence is worth. */
      const retryAfterMs = (header: string | null): number | null => {
        if (!header) return null;
        const seconds = Number(header);
        if (!Number.isFinite(seconds) || seconds < 0) return null;
        return Math.min(seconds * 1000, 2_000);
      };

      const synthesize = async (sentence: string): Promise<Segment> => {
        if (useBrowserFallback) return { fallbackText: sentence };
        await waitForRoomAhead();
        if (cancelled) return null;
        if (useBrowserFallback) return { fallbackText: sentence };
        await acquireSlot();
        try {
          // A sentence can wait a while for its slot, and the answer may have
          // arrived in the meantime: sentences queued behind the one that
          // discovered there is no provider must not each go and ask again.
          if (cancelled) return null;
          if (useBrowserFallback) return { fallbackText: sentence };
          for (let attempt = 0; attempt < TTS_ATTEMPTS; attempt++) {
            if (cancelled) return null;
            let wait: number | null = null;
            try {
              const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: sentence, philosopherId, speed }),
                signal: abort.signal,
              });
              if (res.ok) {
                const data = await res.arrayBuffer();
                const buffer = await ctx!.decodeAudioData(data);
                consecutiveFailures = 0;
                return { buffer, sentence };
              }
              // No usable provider: unconfigured, or configured with a key it
              // cannot use. Nothing will come back for any sentence, so move
              // the whole stream over rather than paying a failed request per
              // sentence to learn the same thing again.
              if (res.status === 501) {
                useBrowserFallback = true;
                return { fallbackText: sentence };
              }
              // 503 is the route saying the provider was busy. Every other
              // client-range status is deterministic — text too long, unknown
              // philosopher — and asking again only adds silence.
              if (res.status !== 503 && res.status < 500) break;
              wait = retryAfterMs(res.headers.get("retry-after"));
            } catch {
              // Aborted, offline, or audio that would not decode.
              if (cancelled) return null;
            }
            if (attempt === TTS_ATTEMPTS - 1) break;
            await delay(wait ?? TTS_BACKOFF_MS[attempt]);
          }
          if (cancelled) return null;
          // This one sentence goes out in the browser voice — and the next one
          // asks the provider again. A single dropped request used to hand the
          // whole rest of the reply to the fallback voice, which is what made
          // an occasional hiccup sound like the voice itself had changed.
          if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            useBrowserFallback = true;
          }
          return { fallbackText: sentence };
        } finally {
          releaseSlot();
        }
      };

      /**
       * A subtitle waiting for its clip to start, held against the *audio*
       * clock rather than the wall clock.
       *
       * The two only agree while the context is running. A held lecture
       * suspends the audio clock, and a reveal still counting down on wall
       * time would light up the subtitle for a sentence nobody is hearing —
       * and would be a sentence ahead of the voice for the rest of the
       * section. So a hold disarms every pending reveal and a release re-arms
       * each one against however much audio time is actually left in front of
       * it, which is the same number it was armed with in the first place.
       */
      interface Reveal {
        /** When the clip starts, on the audio clock. */
        at: number;
        sentence: string;
        timer: ReturnType<typeof setTimeout> | null;
      }
      const reveals = new Set<Reveal>();
      let held = false;

      const arm = (reveal: Reveal) => {
        if (held || !onSentenceStart) return;
        const delayMs = Math.max(0, (reveal.at - ctx!.currentTime) * 1000);
        reveal.timer = setTimeout(() => {
          reveals.delete(reveal);
          if (!cancelled) onSentenceStart(reveal.sentence);
        }, delayMs);
      };

      const disarm = (reveal: Reveal) => {
        if (reveal.timer) clearTimeout(reveal.timer);
        reveal.timer = null;
      };

      /** Schedule a clip to start exactly when the previous one ends. */
      const schedule = (buffer: AudioBuffer, sentence: string) => {
        const source = ctx!.createBufferSource();
        source.buffer = buffer;
        source.connect(analyserRef.current ?? ctx!.destination);
        const at = Math.max(ctx!.currentTime, nextStartTime);
        source.start(at);
        if (!firstAudioFired) {
          const cancelOnset = watchWebAudioOnset(
            () => ({ state: ctx!.state, currentTime: ctx!.currentTime }),
            at,
            () => markFirstAudio("web-audio"),
          );
          if (!firstAudioFired) onsetWatchers.add(cancelOnset);
        }
        if (onSentenceStart) {
          const reveal: Reveal = { at, sentence, timer: null };
          reveals.add(reveal);
          arm(reveal);
        }
        nextStartTime = at + buffer.duration + sentencePause;
        activeSources.add(source);
        lastScheduledDone = new Promise<void>((resolve) => {
          source.onended = () => {
            activeSources.delete(source);
            resolve();
          };
        });
      };

      const playback = (async () => {
        let index = 0;
        while (!cancelled) {
          if (index >= segments.length) {
            if (inputDone) break;
            await new Promise<void>((resolve) => (wake = resolve));
            continue;
          }
          const segment = await segments[index++];
          if (cancelled || !segment) continue;
          if ("buffer" in segment) {
            schedule(segment.buffer, segment.sentence);
          } else {
            // Web Speech has no schedulable clock: let any scheduled audio
            // drain first, then speak this sentence and wait for it.
            await lastScheduledDone;
            if (!cancelled) {
              await speakWithBrowser(segment.fallbackText, () => {
                markFirstAudio("web-speech");
                onSentenceStart?.(segment.fallbackText);
              });
            }
          }
        }
        await lastScheduledDone;
      })();

      const enqueue = (sentence: string) => {
        segments.push(synthesize(sentence));
        wake?.();
        wake = null;
      };

      const finish = () => {
        if (streamRef.current === handle) {
          streamRef.current = null;
          setSpeaking(false);
        }
      };

      const handle: SpeechStream = {
        push(fragment) {
          if (cancelled || inputDone) return;
          for (const sentence of chunker.push(fragment)) enqueue(sentence);
        },
        async end() {
          if (!cancelled && !inputDone) {
            for (const sentence of chunker.flush()) enqueue(sentence);
          }
          inputDone = true;
          wake?.();
          wake = null;
          await playback;
          finish();
        },
        get cancelled() {
          return cancelled;
        },
        hold() {
          held = true;
          for (const reveal of reveals) disarm(reveal);
        },
        release() {
          held = false;
          for (const reveal of reveals) arm(reveal);
        },
        cancel() {
          if (cancelled) return;
          cancelled = true;
          abort.abort();
          for (const reveal of reveals) disarm(reveal);
          reveals.clear();
          for (const cancelOnset of onsetWatchers) cancelOnset();
          onsetWatchers.clear();
          // Wake anything queued for a synthesis slot, or sitting in a retry
          // backoff, so its segment promise settles and the playback loop can
          // exit.
          while (slotWaiters.length) slotWaiters.shift()?.();
          for (const wake of [...sleepers]) wake();
          for (const source of activeSources) {
            try {
              source.stop();
            } catch {
              // Source may already have ended.
            }
          }
          activeSources.clear();
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          wake?.();
          wake = null;
          finish();
        },
      };

      streamRef.current = handle;
      return handle;
    },
    [stop, getAudioContext, speakWithBrowser],
  );

  const speak = useCallback(
    async (text: string, philosopherId: string): Promise<void> => {
      stop();
      if (!text.trim()) return;
      setSpeaking(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, philosopherId }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          await new Promise<void>((resolve) => {
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.play().catch(() => resolve());
          });
        } else {
          // Provider not configured (501) or failed (502): browser fallback.
          await speakWithBrowser(text);
        }
      } catch {
        await speakWithBrowser(text);
      } finally {
        setSpeaking(false);
      }
    },
    [stop, speakWithBrowser],
  );

  return { speak, stop, hold, release, speaking, startSpeechStream, analyserRef };
}
