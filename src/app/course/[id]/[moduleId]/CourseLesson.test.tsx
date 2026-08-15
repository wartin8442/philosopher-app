import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CourseLesson from "./CourseLesson";
import { readingTime } from "@/lib/courseNarration";
import {
  DEEP_DIVE_HANDOFF,
  getCourseModule,
  sectionLines,
  type CourseModule,
} from "@/lib/courses";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";

/**
 * The lesson is a state machine driven by a clock, so it is tested on the
 * silent path: with the voice muted, `narrateLines` paces the script on plain
 * timers instead of the audio clock, and fake timers can walk the whole lesson
 * through in milliseconds. Everything the student actually sees — subtitles,
 * diagrams, the handoff CTA, the transcript, the study notes — comes out of the
 * same code either way.
 */

vi.mock("@/components/VoiceVisualizer", () => ({ default: () => null }));

// next/image renders a plain img so the diagrams can be asserted on by alt text.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
  }: {
    src: string;
    alt: string;
  }) => <img src={src} alt={alt} />,
}));

vi.mock("@/lib/settings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/settings")>();
  return {
    ...actual,
    useSettings: () => ({
      settings: {
        answerLevel: "intermediate",
        philosopherLevels: {},
        voiceEnabled: false,
        showSources: false,
      },
      update: vi.fn(),
      loaded: true,
    }),
  };
});

/**
 * The voice, stubbed. Every test below runs muted, so the only thing the stub
 * has to be is *identifiable*: `startSpeechStream` being called at all means
 * the lecture was put back on the audio clock. The stream it hands back never
 * finishes, which is exactly right for a test that only wants to know a run
 * was started.
 */
const speech = vi.hoisted(() => ({
  stop: vi.fn(),
  hold: vi.fn(),
  release: vi.fn(),
  startSpeechStream: vi.fn(() => ({
    push() {},
    end: () => new Promise<void>(() => {}),
    cancel() {},
    cancelled: false,
    hold() {},
    release() {},
  })),
}));

vi.mock("@/lib/useSpeech", () => ({
  useSpeech: () => ({
    ...speech,
    speaking: false,
    analyserRef: { current: null },
  }),
}));

vi.mock("@/lib/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    listening: false,
    preparing: false,
    interim: "",
    supported: true,
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  }),
}));

const philosopher = toPhilosopherDisplay(getDemoPhilosopher("kierkegaard")!);
const module = getCourseModule("kierkegaard", "the-self")!;

/** One of the module's boards, narrowed out of the visual union. */
function board(id: string) {
  const visual = module.visuals[id];
  if (visual?.kind !== "board") throw new Error(`"${id}" is not a board`);
  return visual;
}
const introduction = board("introduction");
const humanBeing = board("human-being");
const self = board("synthesis-self");

function renderLesson() {
  return render(
    <CourseLesson philosopher={philosopher} module={module} number={1} />,
  );
}

/**
 * Let the given lines play out, one reading-timer at a time. Stepping line by
 * line (rather than jumping a big block of time) is what makes "the subtitle
 * is on line N" a meaningful assertion at all.
 */
async function play(lines: string[]) {
  for (const line of lines) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(readingTime(line) + 1);
    });
  }
}

/** Play a whole section, handoff included. */
const playSection = (index: number) => play(sectionLines(module.sections[index]));

/**
 * Let the board finish writing the point it is on. Board points are typed out
 * a character at a time and always finish well inside the line that raised
 * them, so this never crosses into the next line.
 */
async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
}

/**
 * Let a section's opening moment pass.
 *
 * Every section opens on the speaker alone and raises its board a moment
 * later, whichever beat happens to carry it — see `SECTION_OPENING_MS`. It is
 * well inside the first line, so anything that has played a line is already
 * past it; only an assertion made the instant a section is entered has to wait.
 */
async function raiseBoard() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(900);
  });
}

/** The white subtitle band under the portrait. */
function subtitle() {
  return document.querySelector('[aria-live="polite"]')?.textContent ?? "";
}

/** The composer, and whether it is folded away (rendered inert when closed). */
function composer() {
  return screen.getByPlaceholderText(/ask a question|continue/i);
}
function composerIsFolded() {
  return composer().closest("[inert]") !== null;
}

/** A board rendered in the transcript rather than on the live stage. */
function transcriptBoard(heading: string) {
  return [...document.querySelectorAll(`[aria-label="${heading}"]`)].find(
    (el) => !el.closest("[data-course-board-stage]"),
  );
}

/** True when `first` appears before `second` in the document. */
function comesBefore(first: Element, second: Element) {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

/** Press something and let the state updates it kicked off settle. */
async function click(element: Element) {
  await act(async () => {
    fireEvent.click(element);
  });
}

/** Fill the composer the way a controlled React textarea expects. */
async function typeInto(element: Element, text: string) {
  await act(async () => {
    fireEvent.change(element, { target: { value: text } });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom has no layout, so the stage measures nothing; the component only
  // needs the observer to exist.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the lesson", () => {
  it("waits for the student before it starts talking", () => {
    renderLesson();
    expect(
      screen.getByRole("button", { name: /begin the lesson/i }),
    ).toBeTruthy();
    expect(subtitle()).toBe("");
  });

  it("subtitles the script one line at a time, in order", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const lines = sectionLines(module.sections[0]);
    expect(subtitle()).toBe(lines[0]);

    await play(lines.slice(0, 1));
    expect(subtitle()).toBe(lines[1]);

    await play(lines.slice(1, 2));
    expect(subtitle()).toBe(lines[2]);
  });

  it("ends a section on its handoff question and offers the continue CTA", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const section = module.sections[0];
    await playSection(0);

    expect(subtitle()).toBe(section.handoff);
    expect(
      screen.getByRole("button", { name: section.continueLabel }),
    ).toBeTruthy();
  });

  /**
   * The handoff is a spoken line like any other, and the CTA used to wait for
   * it to finish. So the student heard "shall we move on?" and then sat for
   * the length of the question with nothing on screen to answer it with.
   */
  it("offers the way on as he starts asking, not after he has finished", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const section = module.sections[0];
    const label = { name: section.continueLabel };
    // Everything up to the handoff: he is still teaching, and there is no
    // question on the table yet.
    await play(section.beats.map((beat) => beat.text));
    expect(subtitle()).toBe(section.handoff);
    expect(screen.getByRole("button", label)).toBeTruthy();

    // And it is still there once the question has been asked in full.
    await play([section.handoff]);
    expect(screen.getByRole("button", label)).toBeTruthy();
  });

  it("moves to the next section when the CTA is pressed", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await playSection(0);
    await click(
      screen.getByRole("button", { name: module.sections[0].continueLabel }),
    );

    expect(subtitle()).toBe(module.sections[1].beats[0].text);
    expect(screen.getByText(/Section 2 of 3/)).toBeTruthy();
  });

  it("pauses and resumes the lecture on the same line", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const lines = sectionLines(module.sections[0]);
    await play(lines.slice(0, 1));
    const held = subtitle();
    const microphone = screen.getByRole("button", { name: "Start speaking" });
    const pause = screen.getByRole("button", { name: "Pause the lecture" });
    expect(pause.parentElement).toBe(microphone.parentElement);

    await click(pause);
    expect(
      screen.getByRole("button", { name: "Resume the lecture" }),
    ).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(readingTime(held) * 2);
    });
    expect(subtitle()).toBe(held);

    await click(screen.getByRole("button", { name: "Resume the lecture" }));
    expect(screen.getByRole("button", { name: "Pause the lecture" })).toBeTruthy();
    expect(subtitle()).toBe(held);
    await play([held]);
    expect(subtitle()).toBe(lines[2]);
  });

  /**
   * The lecture is *paced* by whatever is delivering it — the audio clock with
   * the voice on, a reading timer with it off. So switching the voice cannot
   * merely silence the sound: it replaces the thing moving the lesson along,
   * and the run has to be replaced with it. It used not to be, and the lecture
   * stopped dead on whichever line the student pressed the button.
   */
  it("keeps the lecture running when the voice is switched mid-sentence", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const lines = sectionLines(module.sections[0]);
    await play(lines.slice(0, 1));
    const interrupted = subtitle();
    speech.startSpeechStream.mockClear();

    await click(screen.getByRole("button", { name: /unmute the lecture/i }));

    // Put back on the other clock, on the line it was already saying.
    expect(speech.startSpeechStream).toHaveBeenCalled();
    expect(subtitle()).toBe(interrupted);
  });

  it("keeps the synthesis quote above the finite and infinite columns", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await playSection(0);
    await click(
      screen.getByRole("button", { name: module.sections[0].continueLabel }),
    );
    await raiseBoard();

    expect(
      screen.getAllByText(new RegExp(escape(humanBeing.quote!.text))).length,
    ).toBeGreaterThan(0);
    // The columns carry the finite and the infinite on their own; the board
    // raises no picture above them.
    expect(humanBeing.diagram).toBeUndefined();
    for (const column of humanBeing.columns!) {
      expect(screen.getAllByText(column.heading).length).toBeGreaterThan(0);
    }
    const boardStage = document.querySelector("[data-course-board-stage]");
    const liveBoard = boardStage?.querySelector(
      `[aria-label="${humanBeing.heading}"]`,
    );
    expect(liveBoard).toBeTruthy();
    // A board holds the stage on its own: the speaker's portrait stands down
    // rather than taking width from the plates.
    expect(boardStage?.querySelector("[data-course-speaker]")).toBeNull();

    // He takes the two poles one at a time, and the board waits with him:
    // neither half is written on until he reaches it, though both are laid out.
    const written = (columnId: string) =>
      boardStage!
        .querySelector(`[data-board-section="${columnId}"]`)
        ?.getAttribute("data-written") === "true";
    expect(written("finite")).toBe(false);
    expect(written("infinite")).toBe(false);

    const section = module.sections[1];
    const beatFor = (pointId: string) =>
      section.beats.findIndex((beat) => beat.boardPoint === pointId);
    const finiteAt = beatFor("limited");
    await play(sectionLines(section).slice(0, finiteAt));
    await settle();

    // The finite half is his now; the infinite is still to come.
    expect(written("finite")).toBe(true);
    expect(written("infinite")).toBe(false);

    const infiniteAt = beatFor("abstract");
    await play(sectionLines(section).slice(finiteAt, infiniteAt));
    await settle();

    expect(written("infinite")).toBe(true);
    expect(
      screen.getAllByText(new RegExp(escape(humanBeing.quote!.text))).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(humanBeing.points[0].text).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        humanBeing.points.find((point) => point.id === "abstract")!.text,
      ).length,
    ).toBeGreaterThan(0);
  });

  it("starts the introduction board with only Hegel's vertical section", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await raiseBoard();

    // Up to the first line of Hegel's half: his section is the only one on a
    // board that reveals a column when it is first written on.
    const firstHegel = introduction.points.find(
      (point) => point.column === "hegel",
    )!;
    const at = module.sections[0].beats.findIndex(
      (beat) => beat.boardPoint === firstHegel.id,
    );
    await play(sectionLines(module.sections[0]).slice(0, at));
    await settle();

    expect(screen.getAllByText(introduction.heading).length).toBeGreaterThan(0);
    expect(
      document.querySelectorAll('[data-board-section="hegel"][data-written="true"]'),
    ).toHaveLength(2);
    expect(
      document.querySelectorAll(
        '[data-board-section="kierkegaard"][data-written="true"]',
      ),
    ).toHaveLength(0);

    // His half is held rather than absent on the stage board, so Hegel's lines
    // are already standing where they will finish; the transcript prints only
    // what has been delivered and has no second half at all.
    const stage = document.querySelector("[data-course-board-stage]")!;
    expect(
      stage.querySelector('[data-board-section="kierkegaard"][data-written="false"]'),
    ).toBeTruthy();
    expect(
      document.querySelectorAll('[data-board-section="kierkegaard"]'),
    ).toHaveLength(1);
  });

  it("writes each board point as its own line is spoken, and not before", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const first = introduction.points.find((point) => point.column === "hegel")!;
    const problem = introduction.points.find(
      (point) => point.column === "kierkegaard",
    )!;
    const lines = sectionLines(module.sections[0]);
    // Written, as opposed to laid out: every line of the board is in the DOM
    // from the start, holding the place it will keep — see `reserveSpace`.
    const isWritten = (pointId: string) =>
      document
        .querySelector("[data-course-board-stage]")!
        .querySelector(`[data-board-point="${pointId}"]`)
        ?.getAttribute("data-written") === "true";
    // The point on the beat now being spoken finishes writing itself well
    // inside that beat; the ones still to come are not written at all.
    const firstAt = module.sections[0].beats.findIndex(
      (b) => b.boardPoint === first.id,
    );
    await play(lines.slice(0, firstAt));
    await settle();
    expect(screen.getAllByText(first.text).length).toBeGreaterThan(0);
    expect(isWritten(first.id)).toBe(true);
    expect(isWritten(problem.id)).toBe(false);

    // The later objection earns the first point on Kierkegaard's side.
    const at = module.sections[0].beats.findIndex(
      (b) => b.boardPoint === problem.id,
    );
    expect(at).toBeGreaterThan(firstAt);
    await play(lines.slice(firstAt, at));
    await settle();
    expect(subtitle()).toBe(module.sections[0].beats[at].text);
    expect(screen.getAllByText(problem.text).length).toBeGreaterThan(0);
    expect(isWritten(problem.id)).toBe(true);
  });

  it("keeps one board while the notes move from Hegel to Kierkegaard", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await raiseBoard();

    expect(
      screen.getAllByRole("region", { name: introduction.heading }),
    ).toHaveLength(2);
    const question = introduction.points.find(
      (point) => point.id === "individual",
    )!;
    const at = module.sections[0].beats.findIndex(
      (beat) => beat.boardPoint === question.id,
    );
    expect(at).toBeGreaterThan(0);
    await play(sectionLines(module.sections[0]).slice(0, at));
    await settle();

    expect(
      screen.getAllByRole("region", { name: introduction.heading }),
    ).toHaveLength(2);
    expect(screen.getAllByText(question.text)).toHaveLength(2);
    expect(screen.getAllByText(introduction.points[0].text)).toHaveLength(2);
    const liveBoard = document.querySelector("[data-course-board-stage]");
    expect(liveBoard?.querySelector('[data-board-layout="stacked"]')).toBeTruthy();
    const hegelSection = liveBoard?.querySelector('[data-board-section="hegel"]');
    const kierkegaardSection = liveBoard?.querySelector(
      '[data-board-section="kierkegaard"]',
    );
    expect(hegelSection).toBeTruthy();
    expect(kierkegaardSection).toBeTruthy();
    expect(
      hegelSection!.compareDocumentPosition(kierkegaardSection!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("stands each man's portrait up as the board turns to him", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await raiseBoard();

    const stage = document.querySelector("[data-course-board-stage]")!;
    const faceOf = (plateId: string) =>
      introduction.plates!.find((plate) => plate.id === plateId)!;

    // Hegel stands with the board: the first half of the section is about him.
    expect(
      stage.querySelector(`img[alt="${faceOf("pl-hegel-face").alt}"]`),
    ).toBeTruthy();

    // Kierkegaard's face arrives with his half of the writing, not before it.
    const face = faceOf("pl-kierkegaard-face");
    expect(screen.queryByAltText(face.alt)).toBeNull();
    expect(
      document.querySelectorAll(
        '[data-board-section="kierkegaard"][data-written="true"]',
      ),
    ).toHaveLength(0);
    const at = module.sections[0].beats.findIndex(
      (beat) => beat.boardPoint === face.withPoint,
    );
    expect(at).toBeGreaterThan(0);
    await play(sectionLines(module.sections[0]).slice(0, at));
    await settle();

    expect(stage.querySelector(`img[alt="${face.alt}"]`)).toBeTruthy();
    expect(
      stage.querySelector('[data-board-section="kierkegaard"][data-written="true"]'),
    ).toBeTruthy();
  });

  /**
   * A section used to open on whatever was last on stage, which after the
   * first section is always the finished board of the one before it. So the
   * first thing a student saw of a new section was the summary of the old
   * one — and moving between two sections was one full board being swapped
   * for another with no moment of him in between.
   */
  it("opens every section on the speaker, not on the last board", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await playSection(0);

    const stage = () => document.querySelector("[data-course-board-stage]");
    const speaker = () =>
      document.querySelector("[data-course-speaker]") !== null;

    // The introduction board is up, finished, with its handoff waiting.
    expect(stage()?.querySelector(`[aria-label="${introduction.heading}"]`))
      .toBeTruthy();

    await click(
      screen.getByRole("button", { name: module.sections[0].continueLabel }),
    );
    // The board it came from has gone, and the next one is not up yet.
    expect(stage()).toBeNull();
    expect(speaker()).toBe(true);

    await raiseBoard();
    expect(
      stage()?.querySelector(`[aria-label="${humanBeing.heading}"]`),
    ).toBeTruthy();

    // A jump from the contents behaves the same way, over the top of a
    // section still being delivered.
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /The self/ }));
    expect(stage()).toBeNull();
    expect(speaker()).toBe(true);

    await raiseBoard();
    expect(stage()?.querySelector(`[aria-label="${self.heading}"]`)).toBeTruthy();
  });

  it("prints the board under the section's words rather than inside them", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await playSection(0);

    const board = transcriptBoard(introduction.heading);
    expect(board).toBeTruthy();

    // Everything he said runs unbroken above it: the last spoken line of the
    // section, its handoff, comes first, and the board follows the lot.
    const article = board!.closest("article")!;
    const handoff = [...article.querySelectorAll("p")].find(
      (p) => p.textContent === module.sections[0].handoff,
    );
    expect(handoff).toBeTruthy();
    expect(comesBefore(handoff!, board!)).toBe(true);
    expect(comesBefore(board!, screen.getByText("Key points"))).toBe(true);
  });

  it("folds the question box away while he talks, and reopens at the handoff", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const lines = sectionLines(module.sections[0]);
    await play(lines.slice(0, 1));
    expect(composerIsFolded()).toBe(true);

    // Pulling it up mid-sentence covers a strip of the board and nothing
    // else — he is still on the same line, and he goes on to the next one.
    const held = subtitle();
    await click(screen.getByRole("button", { name: "Ask a question" }));
    expect(composerIsFolded()).toBe(false);
    expect(subtitle()).toBe(held);
    await play([held]);
    expect(subtitle()).toBe(lines[2]);

    // It stays where the student put it — a box that folded itself back up a
    // sentence later would be taking the decision off them — and it is still
    // up at the handoff, where the turn is theirs anyway.
    expect(composerIsFolded()).toBe(false);
    await playSection(0);
    expect(composerIsFolded()).toBe(false);

    // The lesson takes it back when he starts talking again.
    await click(
      screen.getByRole("button", { name: module.sections[0].continueLabel }),
    );
    expect(composerIsFolded()).toBe(true);
  });

  it("jumps to any section from the contents without losing what was heard", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await playSection(0);
    await click(
      screen.getByRole("button", { name: module.sections[0].continueLabel }),
    );
    await play(sectionLines(module.sections[1]).slice(0, 2));
    expect(screen.getByText(/Section 2 of 3/)).toBeTruthy();

    // Straight to the last section, over the top of the one he is delivering.
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /The self/ }));
    expect(screen.getByText(/Section 3 of 3/)).toBeTruthy();
    expect(subtitle()).toBe(module.sections[2].beats[0].text);

    // Back to the beginning: the introduction starts over from its first
    // line, with its board empty again...
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /Introduction/ }));
    expect(screen.getByText(/Section 1 of 3/)).toBeTruthy();
    expect(subtitle()).toBe(module.sections[0].beats[0].text);

    // ...and everything already heard is still in the transcript behind him.
    expect(transcriptBoard(introduction.heading)).toBeTruthy();
    expect(transcriptBoard(humanBeing.heading)).toBeTruthy();
    expect(transcriptBoard(self.heading)).toBeTruthy();
  });

  /**
   * A student who goes straight to the third section has still arrived at the
   * third section: the notes behind them are the study guide for the lesson up
   * to where they are standing, not a log of what the speaker got through.
   */
  it("prints the sections jumped over rather than leaving a gap", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /The self/ }));
    expect(screen.getByText(/Section 3 of 3/)).toBeTruthy();

    // Both skipped sections are there whole — every line of them, their boards
    // finished, and the notes that only appear once a section is complete.
    for (const skipped of module.sections.slice(0, 2)) {
      const last = skipped.beats[skipped.beats.length - 1].text;
      expect(
        screen.getAllByText(new RegExp(escape(last))).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(new RegExp(escape(skipped.handoff))).length,
      ).toBeGreaterThan(0);
    }
    expect(transcriptBoard(introduction.heading)).toBeTruthy();
    expect(transcriptBoard(humanBeing.heading)).toBeTruthy();
    // Only those two: the section he is standing in is printed as far as he
    // has got in it, like any section being delivered, so it has no notes yet.
    expect(screen.getAllByText("Key points").length).toBe(2);
  });

  it("fills the progress bar by how far through the lesson the student is", async () => {
    renderLesson();
    const progress = () =>
      Number(
        screen
          .getByRole("progressbar", { name: "Lesson progress" })
          .getAttribute("aria-valuenow"),
      );
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    expect(progress()).toBeLessThan(20);

    // Jumped to the last section and heard it out: the lesson is behind them,
    // and a bar that counted only the lines actually spoken said it was half
    // over. Full here, before the closing card sets it full by definition.
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /The self/ }));
    await playSection(2);
    expect(progress()).toBe(100);

    // And going back to reread the first section does not undo the lesson.
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /Introduction/ }));
    expect(progress()).toBe(100);
  });

  it("builds a transcript with the study notes for each finished section", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const section = module.sections[0];
    // Mid-section: what he has said is already in the transcript, the notes
    // are not — they are the summing-up, and it has not been summed up yet.
    await play(sectionLines(section).slice(0, 2));
    expect(screen.getAllByText(new RegExp(escape(section.beats[0].text))).length)
      .toBeGreaterThan(0);
    expect(screen.queryByText("Key points")).toBeNull();

    await playSection(0);
    expect(screen.getByText("Key points")).toBeTruthy();
    for (const point of section.keyPoints.flatMap((p) =>
      typeof p === "string" ? [p] : [p.heading, ...p.points],
    )) {
      expect(screen.getByText(point)).toBeTruthy();
    }
  });

  it("keeps a footnote in the transcript while its board holds the stage", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await raiseBoard();

    // Hegel's board is on stage and says who he was, so his note stays in the
    // transcript rather than being stacked underneath it.
    const hegelNote = module.sections[0].beats[0].footnote!;
    expect(screen.getAllByText(`A note on “${hegelNote.term}”`)).toHaveLength(1);

    // The self board keeps its full quote in view while it is written on: the
    // thesis stands above the writing rather than being replaced by it.
    for (const i of [0, 1]) {
      await playSection(i);
      await click(
        screen.getByRole("button", { name: module.sections[i].continueLabel }),
      );
    }
    const last = module.sections[2];
    const at = last.beats.findIndex((b) => b.boardPoint === "relating");
    expect(at).toBeGreaterThanOrEqual(0);
    await play(sectionLines(last).slice(0, at));
    await settle();
    expect(subtitle()).toBe(last.beats[at].text);
    expect(
      screen.getAllByText(new RegExp(escape(self.quote!.text))).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByAltText(self.plates![0].alt).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(self.points.find((point) => point.id === "relating")!.text)
        .length,
    ).toBeGreaterThan(0);
  });

  it("finishes the lesson after the last section", async () => {
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    for (const [i, section] of module.sections.entries()) {
      await playSection(i);
      await click(
        screen.getByRole("button", { name: section.continueLabel }),
      );
    }

    // Named in the header and again on the closing card.
    expect(screen.getAllByText("Lesson complete").length).toBeGreaterThan(0);
    expect(screen.getByText("End of lesson")).toBeTruthy();
  });
});

describe("interrupting the lesson", () => {
  /** A streaming /api/chat response carrying one reply. */
  function mockChat(reply: string) {
    const body = [
      JSON.stringify({ type: "sources", sources: [] }),
      ...reply.split(" ").map((w) => JSON.stringify({ type: "text", text: w + " " })),
      JSON.stringify({ type: "done" }),
    ].join("\n");
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      void init;
      return { ok: true, body: new Response(body).body, json: async () => ({}) };
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("stops mid-line, answers, and picks the script up on the same line", async () => {
    const fetchMock = mockChat("A stance, not a connection.");
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await play(sectionLines(module.sections[0]).slice(0, 2));

    const interrupted = subtitle();
    await typeInto(screen.getByPlaceholderText(/ask a question/i), "What is the System?");
    await click(screen.getByRole("button", { name: "Ask" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // The question reached the API with the lesson position attached, so the
    // answer can be held to what has actually been covered.
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.courseModuleId).toBe("the-self");
    expect(sent.courseSectionId).toBe("introduction");
    expect(sent.courseDelivered).toBe(3);
    expect(sent.answerLevel).toBe("beginner");

    const resume = screen.getByRole("button", {
      name: /question answered — continue/i,
    });
    await click(resume);
    expect(subtitle()).toBe(interrupted);
  });

  describe("opening out a written line", () => {
    /** The bullet on the live stage carrying `relating`'s scripted explanation. */
    function explainableBullet() {
      const point = self.points.find((p) => p.id === "relating")!;
      const stage = document.querySelector("[data-course-board-stage]")!;
      return [...stage.querySelectorAll("button")].find((button) =>
        button.textContent?.includes(point.text),
      );
    }

    /** Play up to and including the beat that writes `relating`. */
    async function playToRelating() {
      renderLesson();
      await click(screen.getByRole("button", { name: /begin the lesson/i }));
      await playSection(0);
      await click(screen.getByRole("button", { name: /continue/i }));
      await playSection(1);
      await click(screen.getByRole("button", { name: /continue/i }));

      const beats = module.sections[2].beats;
      const at = beats.findIndex((b) => b.boardPoint === "relating");
      await play(beats.slice(0, at + 1).map((b) => b.text));
      await settle();
    }

    it("offers the explanation only on the lines that have one", async () => {
      await playToRelating();

      expect(explainableBullet()).toBeTruthy();
      expect(
        screen.getAllByText(/explain this in more depth/i).length,
      ).toBeGreaterThan(0);

      // The line written just before it has no deep dive, so it is written
      // text and not something to press.
      const stage = document.querySelector("[data-course-board-stage]")!;
      const pressable = [...stage.querySelectorAll("button")].filter((b) =>
        self.points.some((p) => b.textContent?.includes(p.text)),
      );
      expect(pressable).toHaveLength(1);
    });

    it("speaks the script behind the line, then asks whether it raised anything", async () => {
      await playToRelating();

      const interrupted = subtitle();
      const dive = self.points.find((p) => p.id === "relating")!.deepDive!;

      await click(explainableBullet()!);
      expect(subtitle()).toBe(dive[0].text);

      // The board the student pressed is untouched: he is explaining a line
      // on it, so it has to still be there — with that line still written.
      const stage = document.querySelector("[data-course-board-stage]")!;
      expect(stage.querySelector(`[aria-label="${self.heading}"]`)).toBeTruthy();
      expect(explainableBullet()).toBeTruthy();

      // He does not resume over the top of the curiosity that pressed the
      // line: the explanation ends on the invitation, and the lecture holds.
      await play([...dive.map((line) => line.text), DEEP_DIVE_HANDOFF]);
      expect(subtitle()).toBe(DEEP_DIVE_HANDOFF);

      const carryOn = screen.getByRole("button", {
        name: /no questions — carry on/i,
      });
      await click(carryOn);
      // Back to the sentence it interrupted, not to the top of the section.
      expect(subtitle()).toBe(interrupted);
    });

    it("reads a plain 'no questions' after an explanation as the CTA", async () => {
      const fetchMock = mockChat("should not be called");
      await playToRelating();

      const interrupted = subtitle();
      const dive = self.points.find((p) => p.id === "relating")!.deepDive!;
      await click(explainableBullet()!);
      await play([...dive.map((line) => line.text), DEEP_DIVE_HANDOFF]);

      await typeInto(screen.getByPlaceholderText(/ask a question/i), "no, carry on");
      await click(screen.getByRole("button", { name: "Ask" }));

      expect(fetchMock).not.toHaveBeenCalled();
      expect(subtitle()).toBe(interrupted);
    });

    it("keeps the explanation in the transcript, apart from the student's own questions", async () => {
      await playToRelating();
      const dive = self.points.find((p) => p.id === "relating")!.deepDive!;

      await click(explainableBullet()!);
      await play(dive.map((line) => line.text));

      expect(screen.getByText(/what you asked him to explain/i)).toBeTruthy();
      expect(
        screen.getByText(new RegExp(escape(dive[0].text))),
      ).toBeTruthy();
    });
  });

  it("reads a plain 'yes, continue' at a handoff as the CTA, not a question", async () => {
    const fetchMock = mockChat("should not be called");
    renderLesson();
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await playSection(0);

    await typeInto(screen.getByPlaceholderText(/continue/i), "yes, continue");
    await click(screen.getByRole("button", { name: "Ask" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Section 2 of 3/)).toBeTruthy();
  });
});

/**
 * A lesson whose sections are grouped — the six paragraphs of the life under
 * one "Biography". The contents has to offer the group as the choice, and the
 * paragraphs only once it has been chosen; otherwise a four-part lesson reads
 * as a nine-part one and the shape of it is lost.
 */
describe("a lesson told in grouped sections", () => {
  const life = getCourseModule("kierkegaard", "introduction")!;

  async function openContents() {
    render(<CourseLesson philosopher={philosopher} module={life} number={1} />);
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await click(screen.getByRole("button", { name: "Jump to a section" }));
  }

  it("offers the life as one entry that opens into its paragraphs", async () => {
    await openContents();

    // Four entries at the top level, not nine.
    const biography = screen.getByRole("button", { name: /^2\s*Biography$/ });
    expect(screen.queryByRole("button", { name: /The Corsair/ })).toBeNull();

    await click(biography);
    const corsair = screen.getByRole("button", { name: /^2\.\d+\s*The Corsair$/ });
    await click(corsair);

    expect(
      screen.getByText(/Section 2 of 4 · Biography: The Corsair/),
    ).toBeTruthy();
    const section = life.sections.find((s) => s.id === "bio-corsair")!;
    expect(subtitle()).toBe(section.beats[0].text);
  });

  /**
   * The reply to Hegel is three replies, and each is a paragraph of the life
   * like any other — so the life's own list has a fold in it. Pressing Hegel
   * opens the three rather than going anywhere, and from the outside the
   * lesson is still four parts.
   */
  it("opens Hegel into the three replies, inside the life", async () => {
    await openContents();
    await click(screen.getByRole("button", { name: /^2\s*Biography$/ }));

    // Folded away until it is asked for, like the life above it.
    expect(
      screen.queryByRole("button", { name: /The dialectic$/ }),
    ).toBeNull();
    await click(screen.getByRole("button", { name: /^2\.\d+\s*Hegel$/ }));

    await click(
      screen.getByRole("button", { name: /^2\.\d+\.\d+\s*The dialectic$/ }),
    );
    expect(
      screen.getByText(/Section 2 of 4 · Biography: Hegel: The dialectic/),
    ).toBeTruthy();
    const dialectic = life.sections.find((s) => s.id === "bio-hegel-dialectic")!;
    expect(subtitle()).toBe(dialectic.beats[0].text);
  });

  it("raises the mediation diagram beside Hegel when mediation is introduced", async () => {
    await openContents();
    await click(screen.getByRole("button", { name: /^2\s*Biography$/ }));
    await click(screen.getByRole("button", { name: /^2\.\d+\s*Hegel$/ }));
    await click(
      screen.getByRole("button", { name: /^2\.\d+\.\d+\s*The dialectic$/ }),
    );

    const dialectic = life.sections.find((s) => s.id === "bio-hegel-dialectic")!;
    const diagramAlt =
      "Diagram of mediation: a thesis and its opposite come into tension and lead to a synthesis.";

    // The board opens on Hegel alone. The diagram joins him only when the
    // narration reaches the sentence that first names mediation.
    expect(screen.queryByAltText(diagramAlt)).toBeNull();
    await play([dialectic.beats[0].text]);

    const stage = document.querySelector("[data-course-board-stage]")!;
    expect(
      stage.querySelector(
        'img[alt="Portrait of Georg Wilhelm Friedrich Hegel."]',
      ),
    ).toBeTruthy();
    expect(stage.querySelector(`img[alt="${diagramAlt}"]`)).toBeTruthy();
  });

  /**
   * The Hegel board is the one board of the life that stands books up, and it
   * is one board across the three replies: the second paragraph opens on the
   * lines the first wrote, and each book is a way out of the lecture — the
   * conversation focused on that work, with the question the paragraph raised
   * about it already waiting to be asked.
   */
  /**
   * The live board is laid out as the board it will finish as, and the lines
   * appear in the places they will keep. A line already written must never be
   * pushed about by the next one arriving — see `reserveSpace`.
   */
  it("lays the whole board out from the start and writes into it", async () => {
    render(<CourseLesson philosopher={philosopher} module={life} number={1} />);
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /^2\s*Biography$/ }));
    await click(screen.getByRole("button", { name: /^2\.\d+\s*Hegel$/ }));
    await click(
      screen.getByRole("button", { name: /^2\.\d+\.\d+\s*The universal$/ }),
    );

    const hegel = boardIn(life, "bio-hegel");
    const universal = life.sections.find((s) => s.id === "bio-hegel-universal")!;
    const rows = () => [
      ...document
        .querySelector("[data-course-board-stage]")!
        .querySelectorAll("[data-board-point]"),
    ];
    const laidOut = () => rows().map((r) => r.getAttribute("data-board-point"));
    const written = () => rows().map((r) => r.getAttribute("data-written"));

    // The opening beat raises the board. Every line it will hold is already
    // in place, and none of them is written yet.
    await play([universal.beats[0].text]);
    expect(laidOut()).toEqual(hegel.points.map((p) => p.id));
    expect(written()).toEqual(["false", "false", "false", "false"]);

    // On to the beat that writes the first line: same rows, same order, one
    // of them now written — nothing has moved to make room for it.
    const at = universal.beats.findIndex((b) => b.boardPoint === "bp-system");
    await play(universal.beats.slice(1, at + 1).map((b) => b.text));
    expect(laidOut()).toEqual(hegel.points.map((p) => p.id));
    expect(written()).toEqual(["true", "false", "false", "false"]);
  });

  /**
   * Every section opens on the speaker — except the ones that go on writing on
   * the board already up. Taking it down and putting it back would be a blink
   * in the middle of a single argument.
   */
  it("hands over between the replies without taking the board down", async () => {
    render(<CourseLesson philosopher={philosopher} module={life} number={1} />);
    await click(screen.getByRole("button", { name: /begin the lesson/i }));
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /^2\s*Biography$/ }));
    await click(screen.getByRole("button", { name: /^2\.\d+\s*Hegel$/ }));
    await click(
      screen.getByRole("button", { name: /^2\.\d+\.\d+\s*The universal$/ }),
    );

    const hegel = boardIn(life, "bio-hegel");
    const onStage = () =>
      document
        .querySelector("[data-course-board-stage]")
        ?.querySelector(`[aria-label="${hegel.heading}"]`) ?? null;

    const universal = life.sections.find((s) => s.id === "bio-hegel-universal")!;
    await play(sectionLines(universal));
    expect(onStage()).toBeTruthy();

    // Straight across into the next reply: the board never leaves.
    await click(screen.getByRole("button", { name: universal.continueLabel }));
    expect(onStage()).toBeTruthy();
    expect(document.querySelector("[data-course-speaker]")).toBeNull();

    // And it is the same board, still carrying what the first reply wrote.
    const stage = document.querySelector("[data-course-board-stage]")!;
    expect(stage.textContent).toContain(hegel.points[0].text);
    expect(stage.textContent).toContain(hegel.points[1].text);
  });

  it("keeps one Hegel board standing, and stands the books up on it", async () => {
    await openContents();
    await click(screen.getByRole("button", { name: /^2\s*Biography$/ }));
    await click(screen.getByRole("button", { name: /^2\.\d+\s*Hegel$/ }));
    await click(
      screen.getByRole("button", { name: /^2\.\d+\.\d+\s*The dialectic$/ }),
    );

    const board = boardIn(life, "bio-hegel");
    const stage = () => document.querySelector("[data-course-board-stage]")!;
    const linksOnStage = () =>
      [...stage().querySelectorAll("a")].map((a) => a.getAttribute("href"));
    // A line he has not reached is on the board holding its place, unseen, so
    // what counts is whether it has been written — not whether it is present.
    const written = (point: { id: string }) =>
      stage()
        .querySelector(`[data-board-point="${point.id}"]`)
        ?.getAttribute("data-written") === "true";

    const dialectic = life.sections.find((s) => s.id === "bio-hegel-dialectic")!;
    await play(sectionLines(dialectic));

    // Jumped straight into the middle of the argument, and the board is the
    // one the first paragraph left standing — not an empty board.
    expect(linksOnStage()).toContain(
      "/conversation/kierkegaard?work=either-or&prompt=course-kierkegaard-either-or",
    );
    expect(board.points).toHaveLength(4);
    for (const point of board.points.slice(0, 3)) expect(written(point)).toBe(true);
    // The reply he has not reached is not on it yet.
    expect(written(board.points[3])).toBe(false);

    // On through the third: the same board, with the last line and the other
    // book added to what is already there.
    await click(screen.getByRole("button", { name: dialectic.continueLabel }));
    const religion = life.sections.find((s) => s.id === "bio-hegel-religion")!;
    await play(religion.beats.map((b) => b.text));
    for (const point of board.points) expect(written(point)).toBe(true);
    expect(linksOnStage()).toEqual(
      expect.arrayContaining([
        "/conversation/kierkegaard?work=either-or&prompt=course-kierkegaard-either-or",
        "/conversation/kierkegaard?work=fear-and-trembling&prompt=course-kierkegaard-abraham",
      ]),
    );
    const mediaStack = stage().querySelector("[data-board-media-stack]")!;
    expect(mediaStack).toBeTruthy();
    expect(
      stage().querySelectorAll("[data-board-media-panel]"),
    ).toHaveLength(2);
    expect(
      mediaStack.querySelector(
        'img[alt="Diagram of mediation: a thesis and its opposite come into tension and lead to a synthesis."]',
      ),
    ).toBeTruthy();
    expect(
      [...mediaStack.querySelectorAll("a")].map((link) =>
        link.getAttribute("href"),
      ),
    ).toEqual(
      expect.arrayContaining([
        "/conversation/kierkegaard?work=either-or&prompt=course-kierkegaard-either-or",
        "/conversation/kierkegaard?work=fear-and-trembling&prompt=course-kierkegaard-abraham",
      ]),
    );
    const bookRow = mediaStack.querySelector("[data-board-book-row]")!;
    // Each cover fills its half of the row, so the pair spans exactly what the
    // diagram above them spans; see `composedMedia`. A cover set to a width of
    // its own would leave the two outer edges wherever that width fell.
    for (const cell of bookRow.children) {
      expect(cell.className).toContain("w-full");
    }
    for (const title of ["Either/Or", "Fear and Trembling"]) {
      const cover = [...bookRow.querySelectorAll('[role="img"]')].find(
        (element) =>
          element.getAttribute("aria-label") ===
          `Original cover design for ${title} by Søren Kierkegaard`,
      );
      expect(cover).toBeTruthy();
      expect(cover?.getAttribute("data-cover-origin")).toBe("original-cc0");
    }
  });

  /**
   * The shelf is walked book by book, and read back it is too: the run of the
   * transcript about each book stands under a heading of its own, so a student
   * looking for one book is not reading a column of prose to find it.
   */
  it("breaks the read-back of the shelf into a run under each book", async () => {
    await openContents();
    await click(screen.getByRole("button", { name: /Key works/ }));

    const shelf = life.sections.find((s) => s.id === "key-works")!;
    const headings = shelf.beats.flatMap((b) => b.transcriptHeading ?? []);
    expect(headings.length).toBe(5);

    await play(sectionLines(shelf));
    for (const heading of headings) {
      // A heading in the transcript, not a study note repeating the title.
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }
  });

  it("ends each paragraph on its own question and its own way on", async () => {
    render(<CourseLesson philosopher={philosopher} module={life} number={1} />);
    await click(screen.getByRole("button", { name: /begin the lesson/i }));

    const corsair = life.sections.find((s) => s.id === "bio-corsair")!;
    await click(screen.getByRole("button", { name: "Jump to a section" }));
    await click(screen.getByRole("button", { name: /^2\s*Biography$/ }));
    await click(screen.getByRole("button", { name: /^2\.\d+\s*The Corsair$/ }));
    await play(sectionLines(corsair));

    expect(subtitle()).toBe(corsair.handoff);
    await click(screen.getByRole("button", { name: corsair.continueLabel }));
    const mynster = life.sections.find((s) => s.id === "bio-mynster")!;
    expect(subtitle()).toBe(mynster.beats[0].text);
  });
});

/** One of a module's boards, narrowed out of the visual union. */
function boardIn(from: CourseModule, id: string) {
  const visual = from.visuals[id];
  if (visual?.kind !== "board") throw new Error(`"${id}" is not a board`);
  return visual;
}

/** Escape a script line for use inside a RegExp. */
function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
