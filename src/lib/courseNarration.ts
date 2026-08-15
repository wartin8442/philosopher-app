"use client";

import type {
  SpeechStream,
  SpeechStreamCallbacks,
  SpeechStreamOptions,
} from "./useSpeech";

/**
 * Plays a fixed list of written lines as speech, reporting which line is
 * currently being spoken so the UI can put the matching subtitle up.
 *
 * This is the scripted counterpart to the conversation's streaming speech. The
 * conversation pushes LLM tokens into `useSpeech` and lets its chunker discover
 * sentences; a lecture already knows its sentences, so the lines are pushed
 * whole (each terminated by a newline, which the chunker treats as a hard
 * break) and played in order. `useSpeech` caps how many syntheses are in flight
 * at once, so handing it a whole section up front costs nothing but does let
 * the next few clips be ready before the current one ends.
 *
 * With the voice muted there is no audio clock to pace against, so the lines
 * advance on a reading-speed timer instead and the subtitles still march.
 *
 * Either way a lecture runs slower than a conversation. A reply is someone
 * talking back and can move at the pace of speech; a lecture is someone
 * teaching material the student has never met, and every sentence is one they
 * have to take in before the next arrives. `LECTURE_SPEECH` slows the voice
 * itself and widens the gap between sentences; the silent path below matches
 * it, so muting the lecture does not speed it up.
 */

/**
 * Lecture delivery. `speed` is the rate asked of the speech provider (1 is the
 * voice's own pace) and `sentencePause` is the silence left between one
 * sentence and the next — the beat a teacher leaves for a point to land.
 */
export const LECTURE_SPEECH: SpeechStreamOptions = {
  speed: 0.88,
  sentencePause: 0.7,
};

/** Reading pace for the silent path: ~140 words per minute. */
const MS_PER_WORD = 430;
/** Even a four-word line should stay up long enough to read. */
const MIN_LINE_MS = 1800;
/** The silent counterpart to LECTURE_SPEECH.sentencePause. */
const LINE_GAP_MS = 700;

export interface NarrationOptions {
  /** The lines to speak, in order. Each must be a single sentence. */
  lines: string[];
  philosopherId: string;
  /** False when the student has muted the voice: subtitles only. */
  voice: boolean;
  /** `startSpeechStream` from the caller's `useSpeech()` instance. */
  startSpeechStream: (
    philosopherId: string,
    callbacks?: SpeechStreamCallbacks,
    options?: SpeechStreamOptions,
  ) => SpeechStream;
  /** Fires as each line begins, with its index into `lines`. */
  onLineStart: (index: number) => void;
}

export interface Narration {
  /** Resolves true if every line was delivered, false if it was interrupted. */
  readonly done: Promise<boolean>;
  /** Interrupt playback. `done` then resolves false. */
  stop(): void;
}

/** Whitespace-insensitive length, for comparing spoken text to written text. */
function compactLength(text: string): number {
  return text.replace(/\s+/g, "").length;
}

/**
 * How long a line stays up when there is no voice to pace it, the gap after it
 * included. Exported so tests can step the lecture line by line instead of
 * guessing at the clock.
 */
export function readingTime(line: string): number {
  return (
    Math.max(MIN_LINE_MS, line.trim().split(/\s+/).length * MS_PER_WORD) +
    LINE_GAP_MS
  );
}

/** A sleep that can be cut short. Resolves false if it was cancelled. */
function sleep(
  ms: number,
  register: (cancel: () => void) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), ms);
    register(() => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

export function narrateLines({
  lines,
  philosopherId,
  voice,
  startSpeechStream,
  onLineStart,
}: NarrationOptions): Narration {
  let stopped = false;
  let cancelSleep: (() => void) | null = null;
  let stream: SpeechStream | null = null;

  const stop = () => {
    stopped = true;
    cancelSleep?.();
    stream?.cancel();
  };

  const spoken = async (): Promise<boolean> => {
    // The speech engine reports sentences, not lines. A line is normally one
    // sentence (courses.test.ts enforces it), but if one were ever cut in two
    // the subtitle must not jump a line ahead — so a line is only finished once
    // as much text has been spoken as it contains.
    let index = 0;
    let heard = "";

    stream = startSpeechStream(
      philosopherId,
      {
        onSentenceStart: (sentence) => {
          if (index >= lines.length) return;
          onLineStart(index);
          heard = heard ? `${heard} ${sentence}` : sentence;
          if (compactLength(heard) >= compactLength(lines[index])) {
            index++;
            heard = "";
          }
        },
      },
      LECTURE_SPEECH,
    );

    for (const line of lines) stream.push(`${line}\n`);
    await stream.end();
    return !stopped && !stream.cancelled;
  };

  const silent = async (): Promise<boolean> => {
    for (let i = 0; i < lines.length; i++) {
      if (stopped) return false;
      onLineStart(i);
      const ranOut = await sleep(readingTime(lines[i]), (cancel) => {
        cancelSleep = cancel;
      });
      if (!ranOut || stopped) return false;
    }
    return true;
  };

  return { done: voice ? spoken() : silent(), stop };
}
