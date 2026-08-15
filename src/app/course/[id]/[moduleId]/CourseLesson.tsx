"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AiDisclaimer from "@/components/AiDisclaimer";
import CourseBoard, { EXPLAIN_CTA } from "@/components/CourseBoard";
import ListeningOverlay from "@/components/ListeningOverlay";
import MicButton from "@/components/MicButton";
import Portrait from "@/components/Portrait";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import { meansContinue, meansNoQuestions } from "@/lib/courseIntent";
import {
  LECTURE_SPEECH,
  narrateLines,
  type Narration,
} from "@/lib/courseNarration";
import {
  carriedBoardPoints,
  courseParts,
  DEEP_DIVE_HANDOFF,
  deepDiveLines,
  findBoardPoint,
  revealedBoardPoints,
  sharedBoardId,
} from "@/lib/courses";
import type {
  CourseBeat,
  CourseBoardVisual,
  CourseFootnote,
  CourseImageVisual,
  CourseModule,
  CoursePart,
  CourseVisual,
} from "@/lib/courses";
import type { PhilosopherDisplay } from "@/lib/philosopherDisplay";
import { courseAnswerLevel, useSettings } from "@/lib/settings";
import { useSpeech, type SpeechStream } from "@/lib/useSpeech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useStickToBottom } from "@/lib/useStickToBottom";

/**
 * A scripted lesson.
 *
 * The difference from a conversation is what is in charge. Here the
 * philosopher is delivering written text — the same words, in the same order,
 * to every student — and the model is reached only when the student
 * interrupts. So the screen has two layers, and the whole component is about
 * keeping them in step:
 *
 *   the lecture   the script playing as speech, one sentence at a time, with
 *                 its subtitle under the portrait and its diagrams on stage
 *   the student   a question at any moment, which stops the lecture where it
 *                 stands and resumes it on exactly that line afterwards
 *
 * Everything already said stacks up as a transcript *above* the stage, in the
 * same scroll container — so "scroll up" is a real scroll, not a panel, and the
 * study notes for a section appear in it the moment that section ends.
 */

export interface CourseLessonProps {
  philosopher: PhilosopherDisplay;
  module: CourseModule;
  /** 1-based position in the course, for "Lesson 1". */
  number: number;
}

/**
 * Where the lesson is.
 *
 *   ready      nothing has been spoken yet; audio needs a gesture to start
 *   narrating  the script is playing
 *   paused     the microphone is open, so the lecture has stepped aside
 *   handoff    a section has ended and its question is waiting for an answer
 *   asking     a student question is being answered
 *   answered   the answer is finished; the lecture is waiting to resume
 *   complete   the last section has been delivered
 */
type Phase =
  | "ready"
  | "narrating"
  | "paused"
  | "handoff"
  | "asking"
  | "answered"
  | "complete";

/** A question asked mid-lesson, kept with the part of the script it followed. */
interface Aside {
  id: number;
  sectionIndex: number;
  question: string;
  answer: string;
  pending: boolean;
  failed?: boolean;
  /**
   * A written line opened out, rather than a question of the student's own.
   * It reaches no model, so it never fails and never streams — it is put into
   * the record whole, at the moment he starts saying it.
   */
  scripted?: boolean;
}

/**
 * Where the lecture goes when the student is finished asking: back to a
 * specific line, or back to the state it was in when they interrupted.
 */
type Resume = { line: number } | { phase: Phase };

/** How many past exchanges travel with a new question, oldest dropped first. */
const QUESTION_HISTORY = 6;

/**
 * The phases where he is talking and the question box folds itself away, so
 * the board has the screen.
 *
 * It is the only thing that moves the box on its own: it never opens itself.
 * A handoff is exactly when the student is reading what he has just written
 * up, and a box that let itself up there would cover the thing they were
 * asked to look at. Opening it is a decision, and the handle is always there.
 */
const ASK_FOLD_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  "narrating",
  "asking",
]);

const MIN_AURA = 96;

/**
 * How long a section opens on the speaker before its board is raised.
 *
 * Every section starts him alone on the stage, whichever beat happens to carry
 * its board. Without this, a section whose first sentence raises a board began
 * on the board — and moving between two of those was one board replacing
 * another between frames, with no moment of him in between. The pause is
 * shorter than the sentence it sits inside, so the board is still up while
 * the line that raises it is being spoken.
 */
const SECTION_OPENING_MS = 700;

/** Every spoken line of a section: its beats, then the handoff it ends on. */
function linesOf(section: CourseModule["sections"][number]): string[] {
  return [...section.beats.map((b) => b.text), section.handoff];
}

// ---- Transcript blocks ------------------------------------------------------

/**
 * Beats are single sentences because the voice needs them that way. Read back
 * as a transcript they would be a column of one-line paragraphs, so
 * consecutive plain sentences are set as prose and only the things that
 * genuinely stand apart — a quoted thesis, a diagram, a note on a word — break
 * the paragraph.
 */
type Block =
  | { kind: "heading"; text: string }
  | { kind: "prose"; text: string }
  | { kind: "quote"; text: string; cite?: string }
  | { kind: "figure"; id: string; visual: CourseImageVisual }
  | { kind: "note"; footnote: CourseFootnote };

function toBlocks(
  beats: CourseBeat[],
  visuals: Record<string, CourseVisual>,
): Block[] {
  const blocks: Block[] = [];
  let prose: string[] = [];
  const flush = () => {
    if (prose.length) {
      blocks.push({ kind: "prose", text: prose.join(" ") });
      prose = [];
    }
  };
  // A diagram can be brought back later in a section after a board has been
  // in front of it. On stage that is a return; in a transcript it would be the
  // same picture printed twice, so each visual is laid out once.
  const laidOut = new Set<string>();

  for (const beat of beats) {
    // A section that walks several things in turn says so in the read-back:
    // the run about each one starts under its own heading. Nothing is heard
    // here — the lecture is unbroken; see `transcriptHeading`.
    if (beat.transcriptHeading) {
      flush();
      blocks.push({ kind: "heading", text: beat.transcriptHeading });
    }
    if (beat.quote) {
      flush();
      // A quotation of more than one sentence is more than one beat, because
      // the voice needs them separately. Read back it is still one quotation,
      // so consecutive quoted beats close up into a single block.
      const last = blocks[blocks.length - 1];
      if (last?.kind === "quote") {
        last.text = `${last.text} ${beat.text}`;
        if (beat.cite) last.cite = beat.cite;
      } else {
        blocks.push({ kind: "quote", text: beat.text, cite: beat.cite });
      }
    } else {
      prose.push(beat.text);
    }
    const id = beat.visual;
    const visual = id ? visuals[id] : undefined;
    // Boards are not laid out here; they are gathered by `boardsOf` and set
    // below the section, where they read as what it came to rather than as an
    // interruption of it. Diagrams stay where they were raised.
    if (id && visual?.kind === "image" && !laidOut.has(id)) {
      laidOut.add(id);
      flush();
      blocks.push({ kind: "figure", id, visual });
    }
    if (beat.footnote) {
      flush();
      blocks.push({ kind: "note", footnote: beat.footnote });
    }
  }
  flush();
  return blocks;
}

/**
 * The boards a run of beats raised, in the order they went up.
 *
 * On stage a board is the thing being written on while he speaks, so it sits
 * in front of the student the whole time. Read back, it is the summary the
 * section arrived at — so it goes under his words, whole, rather than being
 * printed halfway through the paragraph that raised it.
 */
function boardsOf(
  beats: CourseBeat[],
  visuals: Record<string, CourseVisual>,
): [string, CourseBoardVisual][] {
  const boards: [string, CourseBoardVisual][] = [];
  const seen = new Set<string>();
  for (const beat of beats) {
    const id = beat.visual;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const visual = visuals[id];
    if (visual?.kind === "board") boards.push([id, visual]);
  }
  return boards;
}

/**
 * The ids of the contents entries a section is folded inside, outermost first.
 *
 * An entry that *is* the section contributes nothing: it is the destination,
 * not a fold over it. Everything above it has to be open for the student to
 * see where they are.
 */
function partTrail(parts: CoursePart[], sectionIndex: number): string[] {
  for (const part of parts) {
    if (!part.sectionIndexes.includes(sectionIndex)) continue;
    if (part.sectionIndexes.length === 1) return [];
    return [
      part.id,
      ...(part.parts ? partTrail(part.parts, sectionIndex) : []),
    ];
  }
  return [];
}

export default function CourseLesson({
  philosopher,
  module,
  number,
}: CourseLessonProps) {
  const { accent, id: philosopherId } = philosopher;
  const sections = module.sections;
  const totalLines = useMemo(
    () => sections.reduce((n, s) => n + s.beats.length + 1, 0),
    [sections],
  );

  const { settings, update, loaded } = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const {
    stop: stopSpeaking,
    hold: holdSpeech,
    release: releaseSpeech,
    speaking,
    startSpeechStream,
    analyserRef,
  } = useSpeech();

  // ---- Lesson position ------------------------------------------------------
  // The async narration and fetch callbacks all need to read the position they
  // were started from, so every piece of it is mirrored in a ref that is
  // written at the same moment as the state.

  const [phase, setPhaseState] = useState<Phase>("ready");
  const phaseRef = useRef<Phase>("ready");
  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const [sectionIndex, setSectionIndexState] = useState(0);
  const sectionIndexRef = useRef(0);
  const setSectionIndex = useCallback((next: number) => {
    sectionIndexRef.current = next;
    setSectionIndexState(next);
  }, []);

  /** Lines of the current section the student has heard the start of. */
  const [delivered, setDeliveredState] = useState(0);
  const deliveredRef = useRef(0);

  /**
   * The high-water mark for every section: the most lines of it the student
   * has ever heard.
   *
   * `delivered` is the playhead and belongs to the stage — it is what the live
   * board is written from, and it goes back to nought whenever a section is
   * started over. The transcript needs the other thing: a student who jumps
   * back to section one has not un-heard section three, and the record of it
   * must not be thrown away when they do.
   */
  const [linesHeard, setLinesHeard] = useState<number[]>(() =>
    sections.map(() => 0),
  );

  const setDelivered = useCallback((next: number) => {
    deliveredRef.current = next;
    setDeliveredState(next);
    const at = sectionIndexRef.current;
    setLinesHeard((prev) =>
      next <= (prev[at] ?? 0)
        ? prev
        : prev.map((lines, i) => (i === at ? next : lines)),
    );
  }, []);

  /** Index of the line being spoken right now — the resume point. */
  const lineRef = useRef(0);

  const [caption, setCaption] = useState("");
  const [asides, setAsides] = useState<Aside[]>([]);
  const asidesRef = useRef<Aside[]>([]);
  asidesRef.current = asides;
  const asideIdRef = useRef(0);

  const resumeRef = useRef<Resume | null>(null);
  const pauseSourceRef = useRef<"microphone" | "button" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const narrationRef = useRef<Narration | null>(null);
  const runIdRef = useRef(0);
  /**
   * True while the voice is suspended rather than abandoned — a pause that can
   * simply be let go of, instead of a run that has to be started again.
   */
  const heldRef = useRef(false);
  /**
   * The scripted aside now playing, and how far into it he has got.
   *
   * The lecture's own position is `sectionIndex` and `lineRef`, which an aside
   * deliberately leaves alone. So an aside needs its own record of where it is,
   * or muting halfway through one has nothing to start again from.
   */
  const asideRunRef = useRef<{ lines: string[]; then: () => void } | null>(null);
  const asideLineRef = useRef(0);

  const section = sections[sectionIndex];

  /** The visual on the stage as of the last render; see where it is set. */
  const activeVisualIdRef = useRef<string | undefined>(undefined);

  /**
   * True for the first moment of a section, while the stage is still his.
   *
   * See `SECTION_OPENING_MS`. It is raised by the three moves that enter a
   * section — beginning, continuing, and jumping — and never by a resume, so
   * picking the lecture back up after a question does not take the board the
   * student was looking at down and put it up again.
   *
   * Nor is it raised when the section being entered goes on writing on the
   * board already standing: there the board is the continuous thing and the
   * paragraph is what changed, so clearing the stage for a moment would put a
   * blink into the middle of one argument. See `keepsBoard`.
   */
  const [sectionOpening, setSectionOpening] = useState(false);
  const openingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSection = useCallback((keepStage = false) => {
    if (openingTimerRef.current) clearTimeout(openingTimerRef.current);
    if (keepStage) {
      setSectionOpening(false);
      return;
    }
    setSectionOpening(true);
    openingTimerRef.current = setTimeout(
      () => setSectionOpening(false),
      SECTION_OPENING_MS,
    );
  }, []);
  useEffect(
    () => () => {
      if (openingTimerRef.current) clearTimeout(openingTimerRef.current);
    },
    [],
  );

  // ---- Narration ------------------------------------------------------------

  /** Abandon whatever is playing. Any in-flight run is orphaned by its id. */
  const cutNarration = useCallback(() => {
    runIdRef.current += 1;
    narrationRef.current?.stop();
    narrationRef.current = null;
    // Nothing is left to let go of, and nothing is left to start again.
    heldRef.current = false;
    asideRunRef.current = null;
  }, []);

  // Leaving the lesson — the back arrow, or any other way off the page — must
  // take the lecture with it. `useSpeech` stops the audio on its own unmount,
  // but the run driving the lecture is this component's: muted, it is a chain
  // of reading timers that would go on firing `onLineStart` into a tree that no
  // longer exists, and with a voice its `done` handler still resolves and
  // stands the phase down. Cutting it here orphans the run by its id, so
  // nothing that was already in the air lands after the student has gone.
  useEffect(() => () => cutNarration(), [cutNarration]);

  const startNarration = useCallback(
    (index: number, from: number) => {
      const target = sections[index];
      const all = linesOf(target);
      const lines = all.slice(from);

      cutNarration();
      const runId = runIdRef.current;
      pauseSourceRef.current = null;
      setPhase("narrating");
      lineRef.current = from;

      if (!lines.length) {
        setPhase("handoff");
        return;
      }

      const run = narrateLines({
        lines,
        philosopherId,
        voice: settingsRef.current.voiceEnabled,
        startSpeechStream,
        onLineStart: (i) => {
          if (runIdRef.current !== runId) return;
          const at = from + i;
          lineRef.current = at;
          setCaption(all[at]);
          if (at + 1 > deliveredRef.current) setDelivered(at + 1);
        },
      });
      narrationRef.current = run;

      run.done.then((finished) => {
        if (runIdRef.current !== runId) return;
        narrationRef.current = null;
        if (!finished) {
          // The run ended without being replaced: the voice was taken away
          // under it — a synthesis that failed, or audio the browser stopped.
          // Left alone the lesson would sit in `narrating` with nothing
          // playing and no way on, so it is stood down where it stopped and
          // the pause button becomes the way to pick it back up.
          if (phaseRef.current === "narrating") {
            resumeRef.current = { line: lineRef.current };
            pauseSourceRef.current = "button";
            heldRef.current = false;
            setPhase("paused");
          }
          return;
        }
        setDelivered(all.length);
        setPhase("handoff");
      });
    },
    [
      cutNarration,
      philosopherId,
      sections,
      setDelivered,
      setPhase,
      startSpeechStream,
    ],
  );

  /**
   * Say a run of lines that is not part of the lecture, and hand back.
   *
   * The stage is deliberately left exactly as it was: no board goes up, no
   * point is written, the playhead does not move. The student pressed a line
   * on a board to hear more about it, and that board — with that line on it —
   * is what they are looking at while he answers.
   */
  const narrateAside = useCallback(
    (lines: string[], then: () => void) => {
      cutNarration();
      const runId = runIdRef.current;
      pauseSourceRef.current = null;
      asideRunRef.current = { lines, then };
      asideLineRef.current = 0;
      setPhase("narrating");

      const run = narrateLines({
        lines,
        philosopherId,
        voice: settingsRef.current.voiceEnabled,
        startSpeechStream,
        onLineStart: (i) => {
          if (runIdRef.current !== runId) return;
          asideLineRef.current = i;
          setCaption(lines[i]);
        },
      });
      narrationRef.current = run;

      run.done.then((finished) => {
        if (runIdRef.current !== runId) return;
        narrationRef.current = null;
        if (!finished) return;
        asideRunRef.current = null;
        then();
      });
    },
    [cutNarration, philosopherId, setPhase, startSpeechStream],
  );

  /**
   * Start whatever he is saying again, from the line he is on.
   *
   * Used when the voice is switched on or off mid-sentence: the lecture is
   * paced by whichever clock it began on — the audio clock when there is a
   * voice, a reading timer when there is not — so changing that setting means
   * the run pacing the lesson has to be replaced, not merely silenced.
   */
  const restartHere = useCallback(() => {
    const aside = asideRunRef.current;
    if (aside) {
      narrateAside(aside.lines.slice(asideLineRef.current), aside.then);
      return;
    }
    startNarration(sectionIndexRef.current, lineRef.current);
  }, [narrateAside, startNarration]);

  /**
   * True when entering `index` leaves the stage exactly as it is: the section
   * goes on writing on a board it shares with the one before it, and that
   * board is the one already up. Jumping in from somewhere else fails the
   * second half — a different board is showing, so it still has to change.
   */
  const keepsBoard = useCallback(
    (index: number) => {
      const board = sharedBoardId(sections, index, module.visuals);
      return !!board && board === activeVisualIdRef.current;
    },
    [module.visuals, sections],
  );

  const begin = useCallback(() => {
    setSectionIndex(0);
    setDelivered(0);
    openSection();
    startNarration(0, 0);
  }, [openSection, setDelivered, setSectionIndex, startNarration]);

  const advance = useCallback(() => {
    const next = sectionIndexRef.current + 1;
    resumeRef.current = null;
    pauseSourceRef.current = null;
    if (next >= sections.length) {
      cutNarration();
      stopSpeaking();
      setCaption("");
      setPhase("complete");
      return;
    }
    setSectionIndex(next);
    setDelivered(0);
    openSection(keepsBoard(next));
    startNarration(next, 0);
  }, [
    cutNarration,
    keepsBoard,
    openSection,
    sections.length,
    setDelivered,
    setPhase,
    setSectionIndex,
    startNarration,
    stopSpeaking,
  ]);

  /**
   * Start a named section from the top, wherever the lecture currently is.
   *
   * A jump is not a resume: it abandons whatever line was in the air and puts
   * the playhead at the beginning of the chosen section, so its board goes up
   * empty and is written on again from the first sentence. What the student
   * has already heard stays in the transcript either way; see `linesHeard`.
   *
   * Jumping to the next paragraph of a shared board is the one case that
   * changes nothing on the stage — the same board is up, with the same lines
   * on it — so it is not made to blink; see `keepsBoard`.
   */
  const jumpToSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) return;
      resumeRef.current = null;
      pauseSourceRef.current = null;
      setError(null);
      setCaption("");
      setSectionIndex(index);
      setDelivered(0);
      openSection(keepsBoard(index));
      startNarration(index, 0);
    },
    [
      keepsBoard,
      openSection,
      sections.length,
      setDelivered,
      setSectionIndex,
      startNarration,
    ],
  );

  /** Put the lecture back where the question interrupted it. */
  const resumeLecture = useCallback(() => {
    pauseSourceRef.current = null;
    setError(null);

    // A run that was only frozen is still standing there: letting it go picks
    // the sentence up in the middle of the word it stopped on, with no gap and
    // nothing said twice. Its resume target stays where it is — an aside that
    // was held still has a lecture to hand back to when it finishes.
    if (heldRef.current) {
      heldRef.current = false;
      releaseSpeech();
      setPhase("narrating");
      return;
    }

    // An aside that was cut rather than frozen still has lines left to say,
    // and it is not the lecture's turn until it has said them.
    if (asideRunRef.current) {
      restartHere();
      return;
    }

    const target = resumeRef.current;
    resumeRef.current = null;
    if (target && "line" in target) {
      startNarration(sectionIndexRef.current, target.line);
      return;
    }
    const restored = target?.phase ?? "handoff";
    setPhase(restored);
    setCaption(
      restored === "handoff" ? sections[sectionIndexRef.current].handoff : "",
    );
  }, [releaseSpeech, restartHere, sections, setPhase, startNarration]);

  /** Every written line in this module that has an explanation to give. */
  const explainable = useMemo(() => {
    const ids = new Set<string>();
    for (const visual of Object.values(module.visuals)) {
      if (visual.kind !== "board") continue;
      for (const point of visual.points) {
        if (point.deepDive?.length) ids.add(point.id);
      }
    }
    return ids;
  }, [module.visuals]);

  /**
   * Open out one written line: say the scripted explanation behind it, then
   * ask whether it raised anything.
   *
   * A point is two words, and this is what those two words stand for. It is an
   * interruption the same way a question is — the lecture remembers where it
   * was standing and is put back there afterwards — but it is the student's
   * interruption, so it behaves like one: the board they pressed stays exactly
   * as it is, and the explanation goes into the transcript beside their own
   * questions rather than into the lecture, which is not what he said.
   *
   * It ends where a question would: at `answered`, with the lecture still held
   * and the way on offered as a button. A student who pressed a bullet was
   * curious about it, and resuming over the top of that curiosity is the one
   * thing this moment should not do — so he asks, and waits.
   */
  const explainPoint = useCallback(
    (pointId: string) => {
      // An answer is streaming; cutting the lecture out from under it would
      // leave the student's own question half-said.
      if (phaseRef.current === "asking") return;
      const point = findBoardPoint(module.visuals, pointId);
      const lines = deepDiveLines(point);
      if (!lines.length) return;

      resumeRef.current =
        phaseRef.current === "narrating"
          ? { line: lineRef.current }
          : { phase: phaseRef.current };

      setError(null);
      setAsides((prev) => [
        ...prev,
        {
          id: ++asideIdRef.current,
          sectionIndex: sectionIndexRef.current,
          question: `${EXPLAIN_CTA}: “${point!.text}”`,
          answer: lines.join(" "),
          pending: false,
          scripted: true,
        },
      ]);

      // The invitation is spoken but is not part of the explanation, so it
      // stays out of the transcript — like a handoff, it is a live question
      // about what to do next rather than something he taught.
      narrateAside([...lines, DEEP_DIVE_HANDOFF], () => setPhase("answered"));
    },
    [module.visuals, narrateAside, setPhase],
  );

  /**
   * Stand the lecture down without abandoning it.
   *
   * With a voice there is something to freeze, and freezing it is what makes a
   * pause a pause: the clip stops mid-word and starts again from the same
   * sample. With the voice off there is only a reading timer, which has
   * nothing to suspend, so that run is cut and the line is begun again — which
   * costs nothing, since the line is silent and already on screen.
   *
   * `resumeRef` is set either way, because the student may not resume at all:
   * they may ask a question instead, and that has to know where to come back
   * to. An aside sets its own target and keeps it.
   */
  const holdLecture = useCallback(
    (source: "microphone" | "button") => {
      if (!asideRunRef.current) resumeRef.current = { line: lineRef.current };
      pauseSourceRef.current = source;
      if (settingsRef.current.voiceEnabled) {
        heldRef.current = true;
        holdSpeech();
      } else {
        cutNarration();
        stopSpeaking();
      }
      setPhase("paused");
    },
    [cutNarration, holdSpeech, setPhase, stopSpeaking],
  );

  /** Pause and resume the written lecture without losing the current line. */
  const togglePause = useCallback(() => {
    if (phaseRef.current === "narrating") {
      holdLecture("button");
      return;
    }
    if (
      phaseRef.current === "paused" &&
      pauseSourceRef.current === "button"
    ) {
      resumeLecture();
    }
  }, [holdLecture, resumeLecture]);

  // ---- Questions ------------------------------------------------------------

  const updateAside = useCallback(
    (id: number, patch: Partial<Aside>) =>
      setAsides((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      ),
    [],
  );

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      // Snapshotted once: everything below decides what to do about the state
      // the lesson was in when the student hit send.
      const asked = phaseRef.current;
      if (!question || asked === "asking") return;

      // At a handoff, "yes, go on" is an answer to the question he just asked,
      // not a new one — so it moves the lesson instead of reaching the model.
      // Only unmistakable replies qualify; see lib/courseIntent.ts.
      if (asked === "handoff") {
        const last = sectionIndexRef.current === sections.length - 1;
        if (meansContinue(question) || (last && meansNoQuestions(question))) {
          setInput("");
          advance();
          return;
        }
      }

      // He ends an opened-out line by asking whether it raised anything, so a
      // plain "no, carry on" there is an answer to *his* question and puts the
      // lecture back rather than being sent to the model as a new one.
      if (asked === "answered" && asidesRef.current.at(-1)?.scripted) {
        if (meansContinue(question) || meansNoQuestions(question)) {
          setInput("");
          resumeLecture();
          return;
        }
      }

      // Where to come back to. A question asked while he is speaking returns to
      // that line; one asked at a handoff returns to the handoff. A follow-up,
      // or one asked with the microphone (which already stood the lecture
      // down), keeps whatever target is already set.
      if (asked === "narrating") {
        resumeRef.current = { line: lineRef.current };
      } else if (asked !== "paused" && asked !== "answered") {
        resumeRef.current = { phase: asked };
      }

      cutNarration();
      stopSpeaking();
      setInput("");
      setError(null);
      setCaption("");
      setPhase("asking");

      const id = ++asideIdRef.current;
      const askedIn = sectionIndexRef.current;
      const askedAt = deliveredRef.current;
      setAsides((prev) => [
        ...prev,
        { id, sectionIndex: askedIn, question, answer: "", pending: true },
      ]);

      const history = asidesRef.current
        .filter((a) => !a.pending && a.answer)
        .slice(-QUESTION_HISTORY)
        .flatMap((a) => [
          { role: "user" as const, content: a.question },
          { role: "assistant" as const, content: a.answer },
        ]);

      let voice: SpeechStream | null = null;
      let full = "";
      let revealed = 0;

      try {
        if (settingsRef.current.voiceEnabled) {
          // Opened inside the click/keypress that submitted the question, so
          // the browser lets the AudioContext play.
          voice = startSpeechStream(
            philosopherId,
            {
              // Subtitles stay subtitles during an answer: one sentence on
              // screen, the whole reply accumulating in the transcript above.
              onSentenceStart: (sentence) => {
                const at = full.indexOf(sentence, revealed);
                revealed =
                  at >= 0
                    ? at + sentence.length
                    : Math.min(full.length, revealed + sentence.length);
                setCaption(sentence);
                updateAside(id, { answer: full.slice(0, revealed) });
              },
            },
            // The same pace as the lecture: his voice should not speed up
            // just because the student asked something.
            LECTURE_SPEECH,
          );
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            philosopherId,
            answerLevel: courseAnswerLevel(settingsRef.current, philosopherId),
            courseModuleId: module.id,
            courseSectionId: sections[askedIn].id,
            courseDelivered: askedAt,
            messages: [...history, { role: "user", content: question }],
          }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const rows = buffer.split("\n");
          buffer = rows.pop() ?? "";
          for (const row of rows) {
            if (!row.trim()) continue;
            const event = JSON.parse(row) as { type: string; text?: string; error?: string };
            if (event.type === "text") {
              full += event.text ?? "";
              voice?.push(event.text ?? "");
              // Muted, or the voice was cut mid-answer: nothing is pacing the
              // reveal, so show the text as it streams.
              if (!voice || voice.cancelled) {
                revealed = full.length;
                setCaption(full);
                updateAside(id, { answer: full });
              }
            } else if (event.type === "error") {
              throw new Error(event.error || "The answer was interrupted.");
            }
          }
        }

        if (voice) {
          await voice.end();
          if (full) updateAside(id, { answer: full });
        }
        updateAside(id, { answer: full, pending: false });
      } catch (err) {
        voice?.cancel();
        updateAside(id, {
          answer: full,
          pending: false,
          failed: !full,
        });
        setError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        if (phaseRef.current === "asking") setPhase("answered");
      }
    },
    [
      advance,
      cutNarration,
      module.id,
      philosopherId,
      resumeLecture,
      sections,
      setPhase,
      startSpeechStream,
      stopSpeaking,
      updateAside,
    ],
  );

  const askRef = useRef(ask);
  askRef.current = ask;

  const { listening, preparing, interim, supported, start, stop, cancel } =
    useSpeechRecognition((transcript) => askRef.current(transcript));

  /** Opening the microphone stands the lecture down rather than talking over it. */
  const openMic = useCallback(() => {
    if (phaseRef.current === "narrating") {
      // Held rather than cut, for the same reason as the pause: a student who
      // opens the microphone and then says nothing should get the sentence
      // back where they left it, not from its first word.
      holdLecture("microphone");
    } else if (phaseRef.current !== "paused") {
      // A lecture already standing down is left exactly as it is. Silencing
      // it here would throw away the frozen clip the pause is holding, and
      // then there would be nothing left for either the pause button or the
      // microphone closing to pick back up.
      stopSpeaking();
    }
    start();
  }, [holdLecture, start, stopSpeaking]);

  const openMicRef = useRef(openMic);
  openMicRef.current = openMic;

  // The microphone closing without a transcript (cancelled, or nothing said)
  // must not leave the lecture standing down forever. `ask` sets the phase
  // synchronously, so anything still "paused" a beat after the mic closes was
  // silence — pick the lecture back up.
  useEffect(() => {
    if (listening || preparing) return;
    if (phaseRef.current !== "paused") return;
    if (pauseSourceRef.current !== "microphone") return;
    const timer = setTimeout(() => {
      if (
        phaseRef.current === "paused" &&
        pauseSourceRef.current === "microphone"
      ) {
        resumeLecture();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [listening, preparing, resumeLecture]);

  // ---- Scroll surface -------------------------------------------------------

  const { scrollRef, onScroll: followNewContent, pin } = useStickToBottom<HTMLDivElement>([
    delivered,
    sectionIndex,
    asides,
    phase,
  ]);
  const [atBottom, setAtBottom] = useState(true);
  const sectionHeadingRefs = useRef<Record<number, HTMLElement | null>>({});

  const onScroll = useCallback(() => {
    followNewContent();
    const el = scrollRef.current;
    if (el) setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, [followNewContent, scrollRef]);

  const scrollToTranscript = useCallback(() => {
    const heading = sectionHeadingRefs.current[sectionIndexRef.current];
    if (heading) heading.scrollIntoView({ block: "start", behavior: "smooth" });
    else scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [scrollRef]);

  // The aura shrinks to whatever the window can spare, so a diagram and a
  // portrait never fight for the same pixels on a short screen.
  //
  // What is measured is the scroll *viewport*, never the stage inside it. The
  // stage grows with its own content, and its content includes an aura sized
  // from this number — measuring the stage makes the aura an input to its own
  // size, and every frame nudges it toward a fixed point through dozens of
  // re-layouts. The viewport is set by flex layout above, so it cannot be
  // pushed around by anything the aura does.
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setViewportHeight(entry.contentRect.height),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef]);

  // ---- Derived view ---------------------------------------------------------

  /**
   * What the stage is showing, read off the beats of *this* section that the
   * student has heard:
   *
   *   activeVisualId  the last visual raised — diagram or board — kept until
   *                   another one lands
   *   diagramId       the last *diagram*, which keeps the cross-fade box at
   *                   sensible proportions while a board is in front of it
   *   revealed        every board point written up, whichever board owns it
   *
   * Nothing carries across a section boundary. A visual stays up until it is
   * replaced *within* a section, but the section it belonged to ending takes
   * it down with it — otherwise the first moment of every section was the
   * finished board of the one before it, which is the wrong thing to open on
   * whether the student continued or jumped there from the contents.
   *
   * The exception is a board deliberately shared by several sections, which
   * keeps the lines already written on it; see `carriedBoardPoints`.
   */
  const { activeVisualId, diagramId, revealed } = useMemo(() => {
    // A board shared with the section before this one is already standing when
    // it opens, with what that section wrote still on it. The beat that raises
    // it below therefore raises the board that is already there, which is no
    // change at all — which is the point: the argument goes on over one board.
    let activeVisualId: string | undefined = sharedBoardId(
      sections,
      sectionIndex,
      module.visuals,
    );
    let diagramId: string | undefined;
    const revealed = carriedBoardPoints(
      sections,
      sectionIndex,
      module.visuals,
    );
    const beats = sections[sectionIndex].beats;
    const heard = Math.min(delivered, beats.length);
    for (let b = 0; b < heard; b++) {
      const { visual, boardPoint, clearVisual } = beats[b];
      if (clearVisual) activeVisualId = undefined;
      if (visual) {
        activeVisualId = visual;
        if (module.visuals[visual]?.kind === "image") diagramId = visual;
      }
      if (boardPoint) revealed.add(boardPoint);
    }
    return { activeVisualId, diagramId, revealed };
  }, [delivered, module.visuals, sectionIndex, sections]);

  // What is on the stage now, for the callbacks that have to decide whether
  // entering a section would change it. They run outside render, so they
  // cannot read the memo above.
  activeVisualIdRef.current = activeVisualId;

  // The board comes down when the lesson ends. It has served its purpose by
  // then — every board he wrote is in the transcript, finished — and the
  // closing card needs the stage it was holding. It also waits out the moment
  // a section opens on, so every section starts with him; see `openSection`.
  const activeVisual =
    activeVisualId && phase !== "complete" && !sectionOpening
      ? module.visuals[activeVisualId]
      : undefined;
  const activeBoard = activeVisual?.kind === "board" ? activeVisual : undefined;

  /** Every diagram, so all of them can be mounted and cross-faded on stage. */
  const diagrams = useMemo(
    () =>
      Object.entries(module.visuals).filter(
        (entry): entry is [string, CourseImageVisual] =>
          entry[1].kind === "image",
      ),
    [module.visuals],
  );
  const diagramShape =
    diagrams.find(([id]) => id === diagramId)?.[1] ?? diagrams[0]?.[1];

  /** A note on a word stays up for the rest of its section, not one sentence. */
  const activeFootnote = useMemo(() => {
    const heard = Math.min(delivered, section.beats.length);
    for (let i = heard - 1; i >= 0; i--) {
      const note = section.beats[i].footnote;
      if (note) return note;
    }
    return undefined;
  }, [delivered, section]);

  /**
   * The opening and closing screens put a block of prose on the stage — the
   * standing-start card, with the AI notice under it, and the closing card
   * with its links. Everything else on the stage stands aside for that much
   * text, or it is the text that gets pushed off the bottom.
   */
  const cardOnStage = phase === "ready" || phase === "complete";

  // The stage is exactly one viewport tall and everything on it is sized from
  // that. A board holds the stage on its own, so the sizes below are only ever
  // read when there is no board: a diagram stacks above the speaker and any
  // word note, and a bare stage gives the speaker nearly all of the height.
  const auraSize = activeVisual
    ? Math.max(MIN_AURA, Math.min(124, Math.floor(viewportHeight * 0.2)))
    : Math.max(
        MIN_AURA,
        Math.min(
          cardOnStage ? 200 : 300,
          Math.floor(viewportHeight * (cardOnStage ? 0.3 : 0.52)),
        ),
      );
  // Standing on a board that has nothing on it yet he is the whole stage, the
  // same as he is between sections — so he is the same size there as he is
  // everywhere else in the lecture. A smaller portrait for that one moment
  // read as him having stepped back, when nothing has changed but the heading
  // above him.
  const boardAuraSize = Math.max(
    MIN_AURA,
    Math.min(300, Math.floor(viewportHeight * 0.52)),
  );
  // A board carries the compact live explanation among its own points. The
  // longer footnote stays in the transcript; stacking it beneath the board
  // would push the board or portrait out of a short viewport. It comes down
  // with the board at the end, too — a note on one word of one sentence is
  // not what the closing screen is about.
  const stageFootnote = activeBoard || cardOnStage ? undefined : activeFootnote;

  // With the portrait moved to its left and the question box folded away over
  // it, a board can use nearly the whole stage height. A standalone diagram
  // still leaves room below for the speaker.
  // A picture without a board is the whole point of the moment it arrives in —
  // a map with place names on it, a portrait he is holding up — so it takes
  // what the stage can spare once the speaker below it has been paid for.
  const visualShare = activeBoard ? 0.95 : stageFootnote ? 0.4 : 0.64;
  const visualHeight = Math.max(96, Math.floor(viewportHeight * visualShare));

  /**
   * The standing invitation back to the transcript, offered only in the gaps
   * where he has stopped talking — at a handoff, after an answer, at the end.
   * Reading it over the top of a line being spoken is exactly the distraction
   * a lecture cannot afford. Scrolling up is never blocked; only the notice
   * waits its turn.
   */
  const offerTranscript =
    phase === "handoff" || phase === "answered" || phase === "complete";

  /**
   * The furthest into the lesson the student has got: where they are now, or
   * anywhere they have already been if they have since jumped back.
   */
  const reached = linesHeard.reduce(
    (furthest, lines, i) => (lines > 0 ? Math.max(furthest, i) : furthest),
    sectionIndex,
  );
  /**
   * How much of each section is behind the student.
   *
   * What was heard of it — except behind them, where it is the whole of it
   * whether they heard it or not. Jumping into the middle of the lesson from
   * the contents used to leave the notes starting at the section jumped to, so
   * a student who went straight to the self had nothing above it about the
   * human being it is a self of.
   */
  const printed = sections.map((sec, i) =>
    i < reached
      ? sec.beats.length + 1
      : Math.min(linesHeard[i] ?? 0, sec.beats.length + 1),
  );
  const hasTranscript = printed.some((lines) => lines > 0);

  // Progress is how far through the lesson the student is, measured the same
  // way the notes are: everything behind them, whether they sat through it or
  // skipped to it from the contents. Counting only what was actually spoken
  // left a student who had jumped to the last section and finished it looking
  // at a bar half full. Jumping *back* does not empty it either — section one
  // is not un-learning the rest — because what is behind them is a high-water
  // mark; see `reached`.
  const linesDone = printed.reduce((total, lines) => total + lines, 0);
  const progress = phase === "complete" ? 1 : linesDone / totalLines;
  const busy = phase === "asking";
  const manuallyPaused =
    phase === "paused" && pauseSourceRef.current === "button";

  const pendingAside = asides[asides.length - 1];
  const showingAnswer = phase === "asking" || phase === "answered";

  /**
   * True from the moment he *starts* asking the question a section ends on.
   *
   * The handoff is a spoken line like any other, so the lesson only reached
   * the `handoff` phase once it had finished saying it. For the length of the
   * question — several seconds with a voice, and longer while one is being
   * synthesised — the student was being asked whether to move on with nothing
   * on the screen to say yes with, and the way on appeared late and seemingly
   * at random. The button is the answer to that question, so it is up while
   * the question is being put.
   */
  const askingToMoveOn =
    phase === "handoff" ||
    (phase === "narrating" && delivered > section.beats.length);

  /**
   * The one move that carries the lesson on, when there is one. "Begin" is
   * not among them: nothing is on the board yet at that point, so it keeps
   * the full-width button it deserves.
   */
  const stepForward =
    askingToMoveOn
      ? { label: section.continueLabel, onClick: advance }
      : phase === "answered"
        ? {
            // After an opened-out line the student asked nothing, so calling it
            // an answered question would be describing something that did not
            // happen. He asked them a question; this is the reply to it.
            label: pendingAside?.scripted
              ? "No questions — carry on"
              : "Question answered — continue",
            onClick: resumeLecture,
          }
        : null;

  /**
   * Mute or unmute, and put the lecture back on the clock that matches.
   *
   * Muting cannot simply silence the sound. The lecture is *paced* by whatever
   * is delivering it — the audio clock while there is a voice, a reading timer
   * while there is not — so cancelling the voice cancels the thing moving the
   * lesson along, and the lecture stops dead on the line the student muted.
   * Unmuting has nothing to restart, so it stays stopped. The current line is
   * therefore begun again on the other clock.
   */
  const toggleMute = () => {
    const muting = settings.voiceEnabled;
    // The narration callbacks read this before React has re-rendered with the
    // new setting, so it is written here rather than waited for.
    settingsRef.current = { ...settingsRef.current, voiceEnabled: !muting };
    update({ voiceEnabled: !muting });

    // Whatever was frozen has just been cancelled, so there is nothing left to
    // let go of; a resume from here starts the line again instead.
    heldRef.current = false;
    if (muting) stopSpeaking();
    if (phaseRef.current === "narrating") restartHere();
  };

  const submit = () => {
    pin();
    void ask(input);
  };

  // Grow the composer with wrapped text, up to four lines.
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const styles = window.getComputedStyle(textarea);
    const chrome =
      Number.parseFloat(styles.borderTopWidth) +
      Number.parseFloat(styles.borderBottomWidth) +
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom);
    const max = Number.parseFloat(styles.lineHeight) * 4 + chrome;
    textarea.style.height = "auto";
    const content = textarea.scrollHeight;
    textarea.style.height = `${Math.min(content, max)}px`;
    textarea.style.overflowY = content > max ? "auto" : "hidden";
  }, [input]);

  // ---- The question box -----------------------------------------------------

  /**
   * Whether the composer is up. It rises *over* the bottom of the board rather
   * than shrinking it, so pulling it up mid-sentence costs a strip of the
   * writing and nothing else — he keeps talking, and the line he is on is
   * still subtitled underneath.
   */
  const [askOpen, setAskOpen] = useState(false);

  // The lesson folds it away when he starts talking, so a box left up over
  // one section does not carry into the next. Everywhere else it stays where
  // the student put it.
  useEffect(() => {
    if (ASK_FOLD_PHASES.has(phase)) setAskOpen(false);
  }, [phase]);

  // ---- The contents ---------------------------------------------------------

  /**
   * The lesson as it is offered, rather than as it is delivered: a part is one
   * entry on the contents, and a part made of several sections — the six
   * paragraphs of the life — opens into them rather than spilling them into
   * the top level. A module that groups nothing has one part per section, so
   * everything below reads the same for it as it always did.
   */
  const parts = useMemo(() => courseParts(sections), [sections]);

  /**
   * For each section: which part it belongs to, and the headings it sits
   * under there — "Biography", or "Biography: Hegel" for a section inside an
   * entry that is itself inside one.
   */
  const placement = useMemo(() => {
    const at: { partNumber: number; group?: string }[] = [];
    const walk = (list: CoursePart[], partNumber: number, above: string[]) => {
      for (const part of list) {
        // Only an entry holding more than one section is a heading over them;
        // anywhere else it would repeat the section's own title.
        const headings =
          part.sectionIndexes.length > 1 ? [...above, part.title] : above;
        if (part.parts) {
          walk(part.parts, partNumber, headings);
          continue;
        }
        for (const index of part.sectionIndexes) {
          at[index] = {
            partNumber,
            group: headings.length > 0 ? headings.join(": ") : undefined,
          };
        }
      }
    };
    parts.forEach((part, p) => walk([part], p + 1, []));
    return at;
  }, [parts]);

  const here = placement[sectionIndex];

  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  /**
   * The entries whose sub-lists are open. A set rather than a single id: an
   * entry inside an entry can only be reached with its parent still unfolded.
   */
  const [openParts, setOpenParts] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const togglePart = (id: string) =>
    setOpenParts((open) => {
      const next = new Set(open);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const sectionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!sectionMenuRef.current?.contains(event.target as Node)) {
        setSectionMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSectionMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sectionMenuOpen]);

  const goToSection = (index: number) => {
    setSectionMenuOpen(false);
    pin();
    jumpToSection(index);
  };

  /**
   * Open the contents with every entry he is currently inside already
   * unfolded, so the student's own position is the thing they see first.
   */
  const toggleSectionMenu = () => {
    setSectionMenuOpen((open) => {
      if (!open) setOpenParts(new Set(partTrail(parts, sectionIndex)));
      return !open;
    });
  };

  /**
   * The contents, one level at a time.
   *
   * An entry of one section is that section: press it and go. An entry of
   * several is a heading over them and not a place in itself, so pressing it
   * opens its own list rather than jumping anywhere — the paragraph is the
   * thing a student picks, not "the biography" — and that list is drawn the
   * same way, so an entry inside an entry behaves like the one above it.
   * Numbering follows the fold: 2, then 2.3, then 2.3.1.
   */
  const partItems = (list: CoursePart[], prefix: string, depth: number) =>
    list.map((part, p) => {
      const label = prefix ? `${prefix}.${p + 1}` : `${p + 1}`;
      const inside =
        part.sectionIndexes.includes(sectionIndex) && phase !== "complete";
      // The outermost level is the lesson's own list and is set like one.
      const numberClass =
        depth === 0
          ? "w-3 text-[11px]"
          : depth === 1
            ? "w-4 text-[10px]"
            : "w-8 text-[10px]";
      const titleClass = depth === 0 ? "text-sm" : "text-[13px]";
      const rowClass = `flex w-full items-baseline gap-2.5 px-3 text-left transition duration-150 hover:bg-ink-900 ${
        depth === 0 ? "py-2" : "py-1.5"
      }`;

      if (part.sectionIndexes.length === 1) {
        const i = part.sectionIndexes[0];
        return (
          <li key={part.id}>
            <button
              type="button"
              onClick={() => goToSection(i)}
              aria-current={inside ? "true" : undefined}
              className={rowClass}
              style={inside ? { background: `${accent}1a` } : undefined}
            >
              <span
                className={`shrink-0 ${numberClass}`}
                style={{ color: inside ? accent : undefined }}
              >
                {label}
              </span>
              <span
                className={`min-w-0 flex-1 leading-snug ${titleClass} ${
                  inside ? "text-parchment" : "text-parchment/70"
                }`}
              >
                {sections[i].title}
              </span>
              {linesHeard[i] > 0 && !inside && (
                <span className="shrink-0 text-[10px] text-muted">heard</span>
              )}
            </button>
          </li>
        );
      }

      const open = openParts.has(part.id);
      const allHeard = part.sectionIndexes.every(
        (i) => (linesHeard[i] ?? 0) > 0,
      );
      // An entry with no list of its own is still a run of sections: draw it
      // one per section, which is what it was before anything was grouped.
      const children =
        part.parts ??
        part.sectionIndexes.map((i) => ({
          id: sections[i].id,
          title: sections[i].title,
          sectionIndexes: [i],
        }));

      return (
        <li key={part.id}>
          <button
            type="button"
            onClick={() => togglePart(part.id)}
            aria-expanded={open}
            className={rowClass}
            style={inside ? { background: `${accent}1a` } : undefined}
          >
            <span
              className={`shrink-0 ${numberClass}`}
              style={{ color: inside ? accent : undefined }}
            >
              {label}
            </span>
            <span
              className={`min-w-0 flex-1 leading-snug ${titleClass} ${
                inside ? "text-parchment" : "text-parchment/70"
              }`}
            >
              {part.title}
            </span>
            {allHeard && !inside && (
              <span className="shrink-0 text-[10px] text-muted">heard</span>
            )}
            <svg
              aria-hidden
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`shrink-0 self-center text-muted transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <ul
              className="mb-1 ml-[1.6rem] border-l pl-1"
              style={{ borderColor: `${accent}44` }}
            >
              {partItems(children, label, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

  const toggleAsk = () => {
    const opening = !askOpen;
    setAskOpen(opening);
    // Opening it is a request to type, so land the cursor there — after the
    // panel has finished rising, or the scroll it causes fights the animation.
    if (opening) setTimeout(() => inputRef.current?.focus(), 260);
  };

  /** Him, speaking, at whatever size the place he is standing in allows. */
  const speakerAt = (aura: number) => (
    <div
      data-course-speaker
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: aura, height: aura }}
    >
      <VoiceVisualizer
        size={aura}
        innerRadius={Math.round(aura * 0.56) / 2 + 8}
        accent={accent}
        // A held voice is still "speaking" — it is suspended, not stopped —
        // so the aura has to be told that the lecture is standing still.
        active={phase !== "paused" && (speaking || phase === "narrating")}
        analyserRef={analyserRef}
      />
      <Portrait
        initials={philosopher.initials}
        accent={accent}
        imageSrc={philosopher.image}
        crop={philosopher.imageCrop}
        size={Math.round(aura * 0.56)}
      />
    </div>
  );

  const speakerPortrait = speakerAt(auraSize);

  return (
    // The lesson is exactly the viewport and never more. Scrolling here means
    // the transcript behind him — up past the board — so the page itself must
    // not scroll as well: a second scroll of a few pixels only ever took the
    // student off the bottom of the interface and onto blank background.
    <main className="flex h-dvh flex-col overflow-hidden overscroll-none">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-ink-800 px-4 pb-2 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={`/course/${philosopherId}`}
            aria-label="Back to the course contents"
            className="-m-2 shrink-0 rounded-full p-2 text-muted transition duration-150 hover:text-parchment active:scale-90"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-lg text-parchment">
              {number}. {module.title}
            </h1>
            {/* Where he is, and the way to send him somewhere else. The
                contents of a lesson are its most useful navigation, and this
                line was already naming the place — so it is the control. */}
            <div ref={sectionMenuRef} className="relative">
              <button
                type="button"
                onClick={toggleSectionMenu}
                aria-expanded={sectionMenuOpen}
                aria-haspopup="true"
                aria-label="Jump to a section"
                className="-mx-1 flex max-w-full items-center gap-1 rounded px-1 text-xs transition duration-150 hover:brightness-125"
                style={{ color: accent }}
              >
                <span className="truncate">
                  {phase === "complete"
                    ? "Lesson complete"
                    : `Section ${here.partNumber} of ${parts.length} · ${
                        here.group ? `${here.group}: ` : ""
                      }${section.title}`}
                </span>
                <svg
                  aria-hidden
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 transition-transform duration-200 ${
                    sectionMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {sectionMenuOpen && (
                <ul className="absolute left-0 top-full z-30 mt-1.5 max-h-[60vh] w-[min(24rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-ink-700 bg-ink-950/95 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur">
                  {partItems(parts, "", 0)}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={!settings.voiceEnabled}
            aria-label={settings.voiceEnabled ? "Mute the lecture" : "Unmute the lecture"}
            title={settings.voiceEnabled ? "Mute the lecture" : "Unmute the lecture"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition duration-150 active:scale-90"
            style={{
              borderColor: settings.voiceEnabled ? "#33333d" : accent,
              background: settings.voiceEnabled ? "#1c1c22" : `${accent}22`,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={settings.voiceEnabled ? "#e8e2d4" : accent}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {settings.voiceEnabled ? (
                <>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              ) : (
                <>
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>
        </div>
        <div
          className="mx-auto mt-2 h-0.5 max-w-3xl overflow-hidden rounded-full bg-ink-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Lesson progress"
        >
          <span
            className="block h-full rounded-full transition-[width] duration-700"
            style={{ width: `${progress * 100}%`, background: accent }}
          />
        </div>
      </header>

      {/* ── Scroll surface: transcript above, live stage below ──────────── */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto"
        >
          {/* Transcript & study guide */}
          {hasTranscript && (
            <div className="mx-auto max-w-3xl px-4 pb-4 pt-8 sm:px-6">
              <h2 className="text-center text-xs uppercase tracking-[0.3em] text-muted">
                Transcript &amp; study guide
              </h2>

              {/* Every section up to where the student is standing, in the
                  order they are taught — which is not necessarily the order
                  they were heard in, or heard at all, once the student has
                  jumped about the contents; see `printed`. */}
              {sections.map((sec, i) => {
                const lineCount = sec.beats.length + 1;
                const heard = printed[i] ?? 0;
                if (heard === 0) return null;
                const beatsHeard = Math.min(heard, sec.beats.length);
                const done = heard >= lineCount;
                const questions = asides.filter((a) => a.sectionIndex === i);
                const beatsHeardSoFar = sec.beats.slice(0, beatsHeard);
                // Read back the way it was seen: a board shared with the
                // paragraphs before this one still carries their lines.
                const pointsWritten = new Set([
                  ...carriedBoardPoints(sections, i, module.visuals),
                  ...revealedBoardPoints(beatsHeardSoFar),
                ]);
                const sectionBoards = boardsOf(beatsHeardSoFar, module.visuals);

                return (
                  <article key={sec.id} className="mt-10 first:mt-8">
                    <header
                      ref={(el) => {
                        sectionHeadingRefs.current[i] = el;
                      }}
                      className="scroll-mt-4 border-l-2 pl-4"
                      style={{ borderColor: accent }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                        Section {placement[i].partNumber}
                        {placement[i].group && ` · ${placement[i].group}`}
                      </p>
                      <h3 className="mt-1 font-serif text-xl text-parchment sm:text-2xl">
                        {sec.title}
                      </h3>
                    </header>

                    <div className="mt-5 space-y-5">
                      {toBlocks(beatsHeardSoFar, module.visuals).map(
                        (block, b) => (
                          <Fragment key={b}>
                            {/* A heading inside the read-back of one section:
                                what the run under it is about. Set below the
                                section's own title and above his prose, with
                                the extra air a new run wants. */}
                            {block.kind === "heading" && (
                              <h4 className="pt-2 font-serif text-lg text-parchment sm:text-xl">
                                {block.text}
                              </h4>
                            )}
                            {block.kind === "prose" && (
                              <p className="leading-relaxed text-parchment/85">
                                {block.text}
                              </p>
                            )}
                            {block.kind === "quote" && (
                              <blockquote
                                className="border-l-2 pl-4"
                                style={{ borderColor: `${accent}88` }}
                              >
                                <p className="font-serif text-xl leading-snug text-parchment sm:text-2xl">
                                  “{block.text}”
                                </p>
                                {block.cite && (
                                  <cite className="mt-2 block text-xs not-italic text-muted">
                                    {block.cite}
                                  </cite>
                                )}
                              </blockquote>
                            )}
                            {block.kind === "figure" && (
                              <figure className="rounded-xl border border-ink-800 bg-ink-900/40 p-3">
                                {/* Read back, a picture is illustration rather
                                    than the thing being looked at: a tall one
                                    printed to the full width of the column
                                    costs a screen of scrolling on its own, and
                                    the words are what the transcript is for. */}
                                <Image
                                  src={block.visual.src}
                                  alt={block.visual.alt}
                                  width={block.visual.width}
                                  height={block.visual.height}
                                  sizes="(max-width: 768px) 100vw, 720px"
                                  className="mx-auto h-auto max-h-[55vh] w-auto max-w-full rounded-lg"
                                />
                                <figcaption className="mt-3 text-center text-xs text-muted">
                                  {block.visual.caption}
                                  {block.visual.credit && (
                                    <span className="mt-1 block text-[10px] text-muted/70">
                                      {block.visual.credit}
                                    </span>
                                  )}
                                </figcaption>
                              </figure>
                            )}
                            {block.kind === "note" && (
                              <aside className="rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                                  A note on “{block.footnote.term}”
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-parchment/80">
                                  {block.footnote.body}
                                </p>
                              </aside>
                            )}
                          </Fragment>
                        ),
                      )}

                      {heard > sec.beats.length && (
                        <p className="italic leading-relaxed text-muted">
                          {sec.handoff}
                        </p>
                      )}
                    </div>

                    {/* What he wrote up while saying it — finished, but only
                        as far as he had actually got by this point. */}
                    {sectionBoards.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                          {sectionBoards.length > 1 ? "The boards" : "The board"}
                        </p>
                        {sectionBoards.map(([boardId, boardVisual]) => (
                          <CourseBoard
                            key={boardId}
                            board={boardVisual}
                            revealed={pointsWritten}
                            accent={accent}
                            speaker={philosopher.name}
                            still
                            // He answers from the stage, so a line pressed up
                            // here takes the student back down to him.
                            explainable={explainable}
                            onExplainPoint={(pointId) => {
                              pin();
                              explainPoint(pointId);
                            }}
                            className="max-w-none"
                          />
                        ))}
                      </div>
                    )}

                    {questions.length > 0 && (
                      <div className="mt-6 space-y-4">
                        {/* An opened-out board line is not a question of the
                            student's own, so a block holding only those is not
                            "your questions". */}
                        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                          {questions.every((a) => a.scripted)
                            ? "What you asked him to explain"
                            : "Your questions"}
                        </p>
                        {questions.map((a) => (
                          <div
                            key={a.id}
                            className="rounded-xl border px-4 py-3"
                            style={{
                              borderColor: `${accent}33`,
                              background: `${accent}0d`,
                            }}
                          >
                            <p className="text-sm text-parchment">{a.question}</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parchment/75">
                              {a.answer ||
                                (a.failed
                                  ? "That answer did not come through."
                                  : "…")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {done && (
                      <div className="mt-6 rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                          Key points
                        </p>
                        {/* A note, or a run of notes under a heading of its
                            own — the shelf sums up book by book. Both are the
                            same dash list; a group only puts a line above its
                            own notes and indents them under it. */}
                        <ul className="mt-3 space-y-2">
                          {sec.keyPoints.map((point) =>
                            typeof point === "string" ? (
                              <li
                                key={point}
                                className="flex gap-3 text-sm leading-relaxed text-parchment/85"
                              >
                                <span aria-hidden style={{ color: accent }}>
                                  —
                                </span>
                                <span>{point}</span>
                              </li>
                            ) : (
                              <li key={point.heading} className="pt-2">
                                <p className="font-serif text-base text-parchment">
                                  {point.heading}
                                </p>
                                <ul className="mt-2 space-y-2 pl-3">
                                  {point.points.map((note) => (
                                    <li
                                      key={note}
                                      className="flex gap-3 text-sm leading-relaxed text-parchment/85"
                                    >
                                      <span aria-hidden style={{ color: accent }}>
                                        —
                                      </span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}

              <p className="mt-10 text-center text-[11px] uppercase tracking-[0.25em] text-muted">
                {phase === "complete" ? "End of lesson" : "You are here ↓"}
              </p>
            </div>
          )}

          {/* Live stage. Exactly one viewport tall — never taller — so that
              scrolling up always means "into the transcript" and the pin back
              to the bottom always lands on the whole of the live view. */}
          <div
            className={`mx-auto flex h-full flex-col items-center justify-center overflow-hidden ${
              activeBoard
                ? "max-w-5xl gap-0 px-2 py-2 sm:px-4"
                : "max-w-3xl gap-4 px-4 py-4 sm:px-6"
            }`}
          >
            {/* A board is the whole stage. He is heard rather than watched
                while he writes, and a portrait beside the plates was taking
                width from the pictures the board is made of. */}
            <div
              data-course-board-stage={activeBoard ? "" : undefined}
              className={
                activeBoard
                  ? "flex min-h-0 w-full max-w-5xl items-center justify-center"
                  : "contents"
              }
            >
              {activeVisual && (
                <figure
                  className={
                    activeBoard
                      ? "flex min-w-0 flex-1 flex-col items-center"
                      : "flex w-full max-w-2xl shrink-0 flex-col items-center"
                  }
                >
                <div
                  className="relative flex w-full items-center justify-center"
                  style={{ height: visualHeight }}
                >
                  {/* Diagram layer. Stays mounted underneath a board so that
                      coming back to a diagram is a cross-fade rather than a
                      fresh load, and so the board's arrival does not disturb
                      the proportions the diagrams were sized to. */}
                  {diagramShape && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                        activeBoard ? "pointer-events-none opacity-0" : "opacity-100"
                      }`}
                      aria-hidden={!!activeBoard}
                    >
                      <div
                        className="relative h-full overflow-hidden rounded-xl border"
                        style={{
                          borderColor: `${accent}44`,
                          aspectRatio: `${diagramShape.width} / ${diagramShape.height}`,
                          maxWidth: "100%",
                        }}
                      >
                        {/* Every diagram is mounted from the start and
                            cross-faded. They arrive mid-sentence: one that
                            begins downloading when the sentence naming it
                            starts is a diagram the student reads late. */}
                        {diagrams.map(([id, visual]) => (
                          <Image
                            key={id}
                            src={visual.src}
                            alt={id === activeVisualId ? visual.alt : ""}
                            aria-hidden={id !== activeVisualId}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 672px"
                            className={`object-contain transition-opacity duration-700 ${
                              id === activeVisualId ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Board layer. Keyed by id so moving to another board
                      remounts it: the new one is meant to arrive empty and be
                      written on, not inherit the last one's finished lines. */}
                  {activeBoard && (
                    // Keyed with the board so a change of board replays the
                    // entrance: the stage has just been his, and the board
                    // should be seen to go up rather than to have been there.
                    <div
                      key={activeVisualId}
                      className="board-in absolute inset-0 flex items-center justify-center"
                    >
                      <CourseBoard
                        key={activeVisualId}
                        board={activeBoard}
                        revealed={revealed}
                        accent={accent}
                        speaker={philosopher.name}
                        explainable={explainable}
                        onExplainPoint={explainPoint}
                        // A card of somebody this deployment cannot serve has
                        // nowhere to send the student, so it puts the question
                        // to him here instead — an interruption like any other.
                        onAskAbout={ask}
                        // He holds the board until its pictures arrive, rather
                        // than leaving the student in front of a heading over
                        // an empty stage.
                        standIn={speakerAt(boardAuraSize)}
                        // The live board holds the shape it will finish in, so
                        // a line he has already written never moves again.
                        reserveSpace
                        className="max-w-none"
                      />
                    </div>
                  )}
                </div>
                {activeVisual.caption && (
                  <figcaption className="mt-2 shrink-0 text-center text-xs text-muted">
                    {activeVisual.caption}
                    {activeVisual.kind === "image" && activeVisual.credit && (
                      <span className="mt-0.5 block text-[10px] leading-tight text-muted/70">
                        {activeVisual.credit}
                      </span>
                    )}
                  </figcaption>
                )}
                </figure>
              )}

              {!activeBoard && speakerPortrait}
            </div>

            {/* Notes can share the stage with a diagram. Boards instead carry
                a compact version in their own writing while the full note
                remains in the transcript; see stageFootnote. */}
            {stageFootnote && (
              <aside
                className={`w-full max-w-xl shrink-0 overflow-y-auto rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3 ${
                  activeVisual ? "max-h-24" : "max-h-32"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                  A note on “{stageFootnote.term}”
                </p>
                <p className="mt-2 text-sm leading-relaxed text-parchment/80">
                  {stageFootnote.body}
                </p>
              </aside>
            )}

            {phase === "ready" && (
              <div className="max-w-md text-center">
                <p className="font-serif text-2xl text-parchment sm:text-3xl">
                  {module.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {philosopher.name} will take you through {parts.length}{" "}
                  sections. No background in philosophy is needed — and if
                  anything is unclear, interrupt him whenever you like, by
                  typing or with the microphone.
                </p>
                {/* The notice stands here rather than under the composer.
                    Every student passes this screen before a word is spoken —
                    a deep link into the lesson lands on it, and nothing plays
                    until "Begin" is pressed — so the disclosure is still
                    unavoidable, and it costs the board nothing once he
                    starts writing. */}
                <AiDisclaimer
                  variant="inline"
                  detail={`This lecture is a written script; ${philosopher.name}'s voice, and every answer to your questions, are an AI simulation — not the real philosopher, and they can be wrong.`}
                  className="mt-5"
                />
              </div>
            )}

            {phase === "complete" && (
              <div className="max-w-md text-center">
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  Lesson complete
                </p>
                <p className="mt-3 font-serif text-2xl text-parchment sm:text-3xl">
                  {module.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Everything he said is above, with the board he wrote for
                  each section and its key points. Scroll up to review it.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={scrollToTranscript}
                    className="rounded-full border px-4 py-2 text-sm transition duration-150 hover:bg-ink-900 active:scale-95"
                    style={{ borderColor: `${accent}66`, color: accent }}
                  >
                    Read the study guide
                  </button>
                  <Link
                    href={`/conversation/${philosopherId}`}
                    className="rounded-full border border-ink-700 px-4 py-2 text-sm text-parchment transition duration-150 hover:border-parchment active:scale-95"
                  >
                    Talk with {philosopher.name}
                  </Link>
                  <Link
                    href={`/course/${philosopherId}`}
                    className="rounded-full border border-ink-700 px-4 py-2 text-sm text-muted transition duration-150 hover:border-parchment hover:text-parchment active:scale-95"
                  >
                    Course contents
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* The transcript is a real scroll away, so the way back to it is a
            standing notice rather than a button hidden in a menu. */}
        {hasTranscript && atBottom && offerTranscript && (
          <button
            type="button"
            onClick={scrollToTranscript}
            className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border bg-ink-950/85 px-4 py-1.5 text-xs text-parchment backdrop-blur transition duration-150 hover:bg-ink-900 active:scale-95"
            style={{ borderColor: `${accent}66` }}
          >
            ↑ Scroll up for the transcript
          </button>
        )}
        {!atBottom && (
          <button
            type="button"
            onClick={pin}
            className="absolute left-1/2 bottom-3 z-10 -translate-x-1/2 rounded-full border bg-ink-950/85 px-4 py-1.5 text-xs text-parchment backdrop-blur transition duration-150 hover:bg-ink-900 active:scale-95"
            style={{ borderColor: `${accent}66` }}
          >
            ↓ Back to the lecture
          </button>
        )}
      </div>

      {/* ── Subtitles, the section CTA, and the question box ─────────────── */}
      <section className="relative border-t border-ink-800 px-4 pb-2 pt-3 sm:px-6">
        {/* The composer, on a shelf above the bar. It is positioned out of the
            flow on purpose: the lecture below the fold is a fixed height, and
            a box that pushed it around every time it opened would resize the
            board mid-sentence. This one slides over the board instead. */}
        <div
          inert={!askOpen}
          className={`absolute inset-x-0 bottom-full z-20 px-4 transition-all duration-300 ease-out sm:px-6 ${
            askOpen
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-3xl rounded-t-2xl border border-b-0 border-ink-800 bg-ink-950/95 px-3 pb-3 pt-3 shadow-[0_-16px_36px_rgba(0,0,0,0.75)] backdrop-blur sm:px-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                rows={1}
                wrap="soft"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={
                  phase === "handoff"
                    ? "Say “continue”, or ask a question…"
                    : "Ask a question at any point…"
                }
                className="max-h-[100px] min-w-0 flex-1 resize-none overflow-x-hidden rounded-2xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm leading-5 text-parchment placeholder:text-muted focus:border-ink-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="shrink-0 rounded-full border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm text-parchment transition duration-150 hover:border-parchment active:scale-95 active:bg-ink-700 disabled:opacity-40 disabled:active:scale-100"
              >
                Ask
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          {/* Subtitles. Fixed height so the composer never moves under the
              student's hand between one line and the next. */}
          <div className="flex min-h-[5.5rem] flex-col items-center justify-end pb-3">
            {showingAnswer && (
              <p
                className="mb-1.5 max-w-full truncate text-[11px] uppercase tracking-[0.25em]"
                style={{ color: accent }}
              >
                {!pendingAside
                  ? "Your question"
                  : pendingAside.scripted
                    ? pendingAside.question
                    : `You asked: ${pendingAside.question}`}
              </p>
            )}
            {busy && !caption ? (
              <span className="inline-flex gap-1 pb-2 text-lg text-muted">
                <span className="typing-dot inline-block">•</span>
                <span className="typing-dot inline-block [animation-delay:160ms]">•</span>
                <span className="typing-dot inline-block [animation-delay:320ms]">•</span>
              </span>
            ) : caption ? (
              <p
                aria-live="polite"
                className="max-h-24 overflow-y-auto text-center font-serif text-lg leading-snug text-white sm:text-xl"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}
              >
                {caption}
              </p>
            ) : (
              <p className="text-center text-sm italic text-muted">
                {phase === "ready"
                  ? "Press begin when you are ready."
                  : phase === "paused"
                    ? manuallyPaused
                      ? "The lecture is paused."
                      : "Listening — the lecture is holding."
                    : phase === "complete"
                      ? "You can still ask him anything about the lesson."
                      : ""}
              </p>
            )}
          </div>

          {/* The one thing to do next, whatever that currently is. */}
          {phase === "ready" && (
            <button
              type="button"
              onClick={begin}
              disabled={!loaded}
              className="mb-3 block w-full rounded-2xl border px-6 py-4 text-center font-serif text-xl text-parchment transition duration-150 hover:brightness-125 active:scale-[0.99] disabled:opacity-50 sm:text-2xl"
              style={{
                borderColor: accent,
                background: `${accent}26`,
                boxShadow: `0 0 24px ${accent}33`,
              }}
            >
              Begin the lesson
            </button>
          )}

          {error && (
            <p className="mb-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-sm text-red-300">
              {error}
            </p>
          )}

          {/* Always here, whatever the box above is doing: the microphone and
              the pause are how a student stops him, and they cannot be behind
              a fold he has to open first. */}
          <div className="flex items-center gap-2">
            {supported && (
              <MicButton
                listening={listening}
                preparing={preparing}
                disabled={busy}
                accent={accent}
                size={44}
                onStart={() => openMicRef.current()}
                onStop={stop}
              />
            )}
            <button
              type="button"
              onClick={togglePause}
              disabled={phase !== "narrating" && !manuallyPaused}
              aria-label={manuallyPaused ? "Resume the lecture" : "Pause the lecture"}
              title={manuallyPaused ? "Resume the lecture" : "Pause the lecture"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-parchment transition duration-150 hover:border-parchment active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100"
              style={
                manuallyPaused
                  ? { borderColor: accent, background: `${accent}22`, color: accent }
                  : undefined
              }
            >
              {manuallyPaused ? (
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>

            {/* The one thing to do next, when there is one. It sits in this
                row rather than in a band of its own because a handoff is the
                moment the student is reading the finished board, and a block
                button above the controls takes that reading space back out of
                the stage. */}
            {stepForward && (
              <button
                type="button"
                onClick={stepForward.onClick}
                className="ml-auto flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border px-4 font-serif text-base text-parchment transition duration-150 hover:brightness-125 active:scale-[0.98] sm:text-lg"
                style={{
                  borderColor: accent,
                  background: `${accent}26`,
                  boxShadow: `0 0 24px ${accent}33`,
                }}
              >
                <span className="truncate">{stepForward.label}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleAsk}
              aria-expanded={askOpen}
              aria-label={askOpen ? "Hide the question box" : "Ask a question"}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 text-sm text-parchment transition duration-150 hover:border-parchment active:scale-95 ${
                stepForward ? "" : "ml-auto"
              }`}
            >
              {/* Named for assistive technology either way; the words are
                  dropped on narrow screens so the CTA beside it keeps its. */}
              <span className={stepForward ? "hidden truncate sm:inline" : "truncate"}>
                {askOpen ? "Hide the question box" : "Ask a question"}
              </span>
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 transition-transform duration-300 ${
                  askOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <ListeningOverlay
        active={listening || preparing}
        preparing={preparing}
        transcript={interim}
        accent={accent}
        speakerLabel={`Asking ${philosopher.name}`}
        onDone={stop}
        onCancel={cancel}
      />
    </main>
  );
}
