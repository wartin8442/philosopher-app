import { describe, expect, it } from "vitest";
import { createSentenceChunker } from "./sentences";
import { LECTURE_SPEECH } from "./courseNarration";
import { SPEED_RANGE } from "./providers/tts";
import {
  boardWriting,
  carriedBoardPoints,
  courseParts,
  COURSE_PHILOSOPHER_IDS,
  DEEP_DIVE_HANDOFF,
  deepDiveLines,
  estimateMinutes,
  findBoardPoint,
  getCourse,
  getCourseModule,
  moduleLines,
  moduleNumber,
} from "./courses";
import { DEMO_ROSTER } from "./demoRoster";

const COURSES = [...COURSE_PHILOSOPHER_IDS].map((id) => getCourse(id)!);
const MODULES = COURSES.flatMap((course) =>
  course.modules.map((module) => ({ course, module })),
);
const SECTIONS = MODULES.flatMap(({ course, module }) =>
  module.sections.map((section) => ({ course, module, section })),
);

describe("course structure", () => {
  it("only offers courses for philosophers the demo actually serves", () => {
    for (const id of COURSE_PHILOSOPHER_IDS) {
      expect(DEMO_ROSTER.has(id), `${id} has a course but is not in the roster`)
        .toBe(true);
    }
  });

  it("numbers modules from one and resolves them by id", () => {
    for (const course of COURSES) {
      course.modules.forEach((module, i) => {
        expect(moduleNumber(course, module.id)).toBe(i + 1);
        expect(getCourseModule(course.philosopherId, module.id)).toBe(module);
      });
      expect(moduleNumber(course, "no-such-module")).toBe(0);
    }
  });

  it("gives every section beats, a spoken handoff, a CTA, and study notes", () => {
    for (const { module, section } of SECTIONS) {
      const where = `${module.id}/${section.id}`;
      expect(section.beats.length, `${where} has no beats`).toBeGreaterThan(0);
      expect(section.handoff.trim(), `${where} handoff`).not.toBe("");
      expect(section.continueLabel.trim(), `${where} CTA`).not.toBe("");
      expect(section.keyPoints.length, `${where} notes`).toBeGreaterThan(0);
      // A grouped note is a heading with notes under it; an empty one prints
      // as a heading over nothing.
      for (const point of section.keyPoints) {
        if (typeof point === "string") continue;
        expect(point.heading.trim(), `${where} note group`).not.toBe("");
        expect(
          point.points.length,
          `${where} note group "${point.heading}"`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("gives every transcript heading something to say", () => {
    for (const { module, section } of SECTIONS) {
      for (const beat of section.beats) {
        if (beat.transcriptHeading === undefined) continue;
        expect(
          beat.transcriptHeading.trim(),
          `${module.id}/${section.id} transcript heading`,
        ).not.toBe("");
      }
    }
  });

  it("resolves every visual a beat names", () => {
    for (const { module, section } of SECTIONS) {
      for (const beat of section.beats) {
        if (!beat.visual) continue;
        expect(
          module.visuals[beat.visual],
          `${module.id} has no visual "${beat.visual}"`,
        ).toBeDefined();
      }
    }
  });

  it("only writes a board point onto a board that is already on stage", () => {
    // A board is raised by one beat and filled in by later ones, so what a
    // `boardPoint` means depends on which visual is up when it is spoken.
    // Walking a module in order is the only way to check that.
    for (const { module } of MODULES) {
      let onStage: string | undefined;
      for (const section of module.sections) {
        for (const beat of section.beats) {
          if (beat.clearVisual) onStage = undefined;
          if (beat.visual) onStage = beat.visual;
          if (!beat.boardPoint) continue;
          const visual = onStage ? module.visuals[onStage] : undefined;
          const where = `${module.id}: "${beat.text.slice(0, 40)}…"`;
          expect(visual?.kind, `${where} writes on no board`).toBe("board");
          if (visual?.kind !== "board") continue;
          expect(
            boardWriting(visual),
            `${where} names a point board "${onStage}" does not have`,
          ).toContain(beat.boardPoint);
        }
      }
    }
  });

  it("writes up everything it declares — points, plates and quotation", () => {
    for (const { module } of MODULES) {
      const written = new Set(
        module.sections.flatMap((s) =>
          s.beats.map((b) => b.boardPoint).filter(Boolean),
        ),
      );
      for (const [id, visual] of Object.entries(module.visuals)) {
        if (visual.kind !== "board") continue;
        const declared = boardWriting(visual);
        // A board nobody writes on is a slide, and this is not a slide deck.
        expect(declared.length, `board "${id}" has nothing to write`)
          .toBeGreaterThan(0);
        for (const pointId of declared) {
          expect(
            written.has(pointId),
            `${module.id}: no beat writes "${id}/${pointId}" onto the board`,
          ).toBe(true);
        }
      }
    }
  });

  it("hangs a plate on a line its own board actually writes", () => {
    // A plate raised with a written line is raised by that line's id, so a
    // line that belongs to another board — or to no board — would leave the
    // picture either up from the start of the wrong section or never at all.
    for (const { module } of MODULES) {
      for (const [id, visual] of Object.entries(module.visuals)) {
        if (visual.kind !== "board") continue;
        const ownLines = visual.points.map((point) => point.id);
        for (const plate of visual.plates ?? []) {
          if (!plate.withPoint) continue;
          expect(
            ownLines,
            `${module.id}/${id}: plate "${plate.id}" waits on a line this board does not write`,
          ).toContain(plate.withPoint);
        }
      }
    }
  });

  it("groups books only beneath a plate declared on the same board", () => {
    for (const { module } of MODULES) {
      for (const [id, visual] of Object.entries(module.visuals)) {
        if (visual.kind !== "board" || !visual.booksUnderPlate) continue;
        expect(
          visual.plates?.map((plate) => plate.id) ?? [],
          `${module.id}/${id} groups books under an unknown plate`,
        ).toContain(visual.booksUnderPlate);
        expect(visual.books?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("keeps board point ids unique across a module", () => {
    // The lesson tracks written points in one set for the whole module, so two
    // boards sharing a point id would write on each other.
    for (const { module } of MODULES) {
      const seen = new Set<string>();
      for (const visual of Object.values(module.visuals)) {
        if (visual.kind !== "board") continue;
        for (const pointId of boardWriting(visual)) {
          expect(seen.has(pointId), `${module.id} reuses point id "${pointId}"`)
            .toBe(false);
          seen.add(pointId);
        }
      }
    }
  });

  it("places comparative board points in declared columns", () => {
    for (const { module } of MODULES) {
      for (const [id, visual] of Object.entries(module.visuals)) {
        if (visual.kind !== "board" || !visual.columns) continue;
        const columnIds = visual.columns.map((column) => column.id);
        expect(new Set(columnIds).size, `${module.id}/${id} repeats a column id`)
          .toBe(columnIds.length);
        for (const point of visual.points) {
          if (!point.column) continue;
          expect(
            columnIds,
            `${module.id}/${id} puts "${point.id}" in an unknown column`,
          ).toContain(point.column);
        }
      }
    }
  });

  it("uses every visual it declares", () => {
    for (const { module } of MODULES) {
      const used = new Set(
        module.sections.flatMap((s) =>
          s.beats.map((b) => b.visual).filter(Boolean),
        ),
      );
      for (const id of Object.keys(module.visuals)) {
        expect(used.has(id), `${module.id} declares unused visual "${id}"`)
          .toBe(true);
      }
    }
  });

  /**
   * The life is told in paragraphs, and a paragraph is a section that raises
   * one board — not a picture, and not a stretch of a longer section. A board
   * that went up mid-section would cut the paragraph in half; a second picture
   * inside one is pinned to the board already up.
   *
   * Mostly that board is the paragraph's own. The argument with Hegel is the
   * exception: three paragraphs over one board, which each of them raises and
   * none of them starts empty. See `carriedBoardPoints`.
   */
  it("gives the Kierkegaard biography one section and one board per paragraph of the life", () => {
    const module = getCourseModule("kierkegaard", "introduction")!;
    const life = module.sections.filter((s) => s.group?.id === "biography");
    const raised = life.flatMap((s) => s.beats.map((b) => b.visual).filter(Boolean));
    expect(raised).toEqual([
      "bio-father",
      "bio-university",
      "bio-hegel",
      "bio-hegel",
      "bio-hegel",
      "bio-walking",
      "bio-corsair",
      "bio-mynster",
      "bio-death",
    ]);
  });

  /**
   * A shared board is one board: the paragraph that opens it writes the first
   * lines, and the ones after it find those lines already there rather than a
   * board that has been wiped between them.
   */
  it("carries a shared board's writing into the sections that go on using it", () => {
    const module = getCourseModule("kierkegaard", "introduction")!;
    const at = (id: string) =>
      module.sections.findIndex((section) => section.id === id);
    const carried = (id: string) =>
      carriedBoardPoints(module.sections, at(id), module.visuals);

    // The paragraph that raises it first opens on an empty board.
    expect([...carried("bio-hegel-universal")]).toEqual([]);
    // The second finds what the first wrote…
    expect([...carried("bio-hegel-dialectic")].sort()).toEqual([
      "bp-system",
      "bp-universal",
    ]);
    // …and the third finds both, the diagram and book included.
    expect([...carried("bio-hegel-religion")].sort()).toEqual([
      "bp-dialectic",
      "bp-system",
      "bp-universal",
      "hegel-either-or",
      "pl-hegel-mediation",
    ]);

    // A paragraph with a board of its own carries nothing into it.
    expect([...carried("bio-copenhagen")]).toEqual([]);
    expect([...carried("bio-father")]).toEqual([]);
  });

  it("does not carry remote asset URLs on the Hegel board books", () => {
    const module = getCourseModule("kierkegaard", "introduction")!;
    const board = module.visuals["bio-hegel"];
    expect(board.kind).toBe("board");
    if (board.kind !== "board") return;
    expect(JSON.stringify(board.books)).not.toMatch(/https?:\/\//);
  });

  /**
   * The six paragraphs are one entry on the contents, and every other section
   * is its own. A student is offered the life as one thing to choose, and the
   * paragraphs of it only once they have chosen it.
   */
  it("gathers grouped sections into one part of the contents", () => {
    const module = getCourseModule("kierkegaard", "introduction")!;
    const parts = courseParts(module.sections);
    expect(parts.map((p) => p.title)).toEqual([
      "Introduction",
      "Biography",
      "Impact",
      "Key works",
    ]);
    expect(parts[1].sectionIndexes).toHaveLength(9);

    // A module that groups nothing is its own contents, unchanged.
    const self = getCourseModule("kierkegaard", "the-self")!;
    expect(courseParts(self.sections).map((p) => p.sectionIndexes)).toEqual(
      self.sections.map((_, i) => [i]),
    );
    for (const part of courseParts(self.sections)) {
      expect(part.parts, "an entry of one section opens into nothing")
        .toBeUndefined();
    }
  });

  /**
   * A subject inside one of those entries folds the same way one level down.
   * The three replies to Hegel are three paragraphs of the life, so the life
   * still offers one choice — and Hegel is one of the choices it offers,
   * rather than three ideas standing beside his father and the Corsair.
   */
  it("folds a subgroup into an entry inside its part", () => {
    const module = getCourseModule("kierkegaard", "introduction")!;
    const life = courseParts(module.sections)[1];

    expect(life.parts?.map((p) => p.title)).toEqual([
      "Upbringing",
      "The university",
      "Hegel",
      "Copenhagen",
      "The Corsair",
      "Mynster and the Church",
      "Death",
    ]);

    // Hegel is the only one that opens further, and it holds the three
    // replies in the order they are taught.
    const hegel = life.parts!.find((p) => p.id === "hegel")!;
    expect(
      hegel.sectionIndexes.map((i) => module.sections[i].id),
    ).toEqual([
      "bio-hegel-universal",
      "bio-hegel-dialectic",
      "bio-hegel-religion",
    ]);

    // Every section of the part is still reachable from its list, once.
    expect(life.parts!.flatMap((p) => p.sectionIndexes)).toEqual(
      life.sectionIndexes,
    );
  });

  it("keeps every part of the contents distinct and complete", () => {
    for (const { module } of MODULES) {
      const parts = courseParts(module.sections);
      const ids = parts.map((p) => p.id);
      expect(new Set(ids).size, `${module.id} repeats a part id`).toBe(
        ids.length,
      );
      expect(parts.flatMap((p) => p.sectionIndexes)).toEqual(
        module.sections.map((_, i) => i),
      );
    }
  });

  /**
   * The line he ends a deep dive on is spoken by the same narrator as the
   * lecture, so it obeys the same rule: one sentence.
   */
  it("ends a deep dive on a single spoken invitation to ask", () => {
    const chunker = createSentenceChunker();
    const cut = [
      ...chunker.push(DEEP_DIVE_HANDOFF + "\n"),
      ...chunker.flush(),
    ];
    expect(cut).toEqual([DEEP_DIVE_HANDOFF]);
    expect(DEEP_DIVE_HANDOFF).toMatch(/\?$/);
  });

  it("uses one persistent board for each part of the Kierkegaard lesson", () => {
    const module = getCourseModule("kierkegaard", "the-self")!;
    for (const section of module.sections) {
      const visualIds = new Set(
        section.beats.map((beat) => beat.visual).filter(Boolean),
      );
      expect(visualIds.size, section.id).toBe(1);
      const [visualId] = visualIds;
      expect(module.visuals[visualId!].kind, section.id).toBe("board");
    }
  });

  /**
   * A board is a teacher's notes, not a transcript of him. Most lines are a
   * word or three; a heading that names what it covers ("Father's influence:
   * spiritual intensity, guilt, a personal relationship with God") is allowed
   * the room to name it. Past a dozen words it is a spoken sentence, and a
   * spoken sentence belongs in the script.
   */
  it("keeps every written line to a note rather than a sentence", () => {
    for (const { module } of MODULES) {
      for (const [id, visual] of Object.entries(module.visuals)) {
        if (visual.kind !== "board") continue;
        for (const point of visual.points) {
          const words = point.text.trim().split(/\s+/);
          expect(
            words.length,
            `${module.id}/${id}: "${point.text}" is too long for a board`,
          ).toBeLessThanOrEqual(12);
        }
      }
    }
  });

  it("resolves every written line by id, across the whole module", () => {
    for (const { module } of MODULES) {
      for (const visual of Object.values(module.visuals)) {
        if (visual.kind !== "board") continue;
        for (const point of visual.points) {
          expect(findBoardPoint(module.visuals, point.id)).toBe(point);
        }
      }
    }
    const module = getCourseModule("kierkegaard", "introduction")!;
    expect(findBoardPoint(module.visuals, "no-such-point")).toBeUndefined();
  });

  /**
   * A deep dive is delivered by the same narrator as the lecture, over the
   * board the student pressed. So it obeys the lecture's rule — one sentence
   * per line — and it must not try to touch the stage, because the board it
   * is explaining has to still be there underneath it.
   */
  it("scripts every deep dive as spoken sentences that leave the stage alone", () => {
    for (const { module } of MODULES) {
      for (const [id, visual] of Object.entries(module.visuals)) {
        if (visual.kind !== "board") continue;
        for (const point of visual.points) {
          if (!point.deepDive) continue;
          const where = `${module.id}/${id}/${point.id}`;
          expect(point.deepDive.length, `${where} is empty`).toBeGreaterThan(0);
          // A line that only restates the two words is not an explanation.
          expect(deepDiveLines(point).join(" ").length, where).toBeGreaterThan(
            point.text.length,
          );
          for (const line of point.deepDive) {
            expect(
              line,
              `${where} tries to move the stage`,
            ).not.toHaveProperty("visual");
            expect(
              line,
              `${where} tries to write on the board`,
            ).not.toHaveProperty("boardPoint");
            const chunker = createSentenceChunker();
            const cut = [...chunker.push(line.text + "\n"), ...chunker.flush()];
            expect(cut, `${where}: "${line.text}" is not one sentence`).toEqual([
              line.text,
            ]);
            expect(line.text.length, `${where} line is too long to speak`)
              .toBeLessThan(400);
          }
        }
      }
    }
  });

  it("has no deep dive on a line that is a link out instead", () => {
    // A point offers one thing when pressed. `CourseBoard` prefers the link,
    // so a point carrying both would silently drop its explanation.
    for (const { module } of MODULES) {
      for (const visual of Object.values(module.visuals)) {
        if (visual.kind !== "board") continue;
        for (const point of visual.points) {
          expect(
            !!(point.href && point.deepDive),
            `${module.id}: "${point.id}" is both a link and a deep dive`,
          ).toBe(false);
        }
      }
    }
  });

  it("footnotes a word that appears in the beat it annotates", () => {
    for (const { section } of SECTIONS) {
      for (const beat of section.beats) {
        if (!beat.footnote) continue;
        expect(
          beat.text.toLowerCase(),
          `footnote term "${beat.footnote.term}" is not in its beat`,
        ).toContain(beat.footnote.term.toLowerCase());
      }
    }
  });
});

describe("course narration", () => {
  /**
   * The player reveals one subtitle per sentence the speech engine starts, and
   * the engine cuts sentences with `createSentenceChunker`. A beat holding two
   * sentences would therefore light its subtitle up a sentence early and leave
   * the transcript a line behind the voice for the rest of the section — so
   * every spoken line has to survive the chunker whole.
   */
  it("keeps every spoken line to exactly one sentence", () => {
    for (const { module } of MODULES) {
      for (const line of moduleLines(module)) {
        const chunker = createSentenceChunker();
        const cut = [...chunker.push(line + "\n"), ...chunker.flush()];
        expect(cut, `"${line}" is not one sentence`).toEqual([line]);
      }
    }
  });

  it("stays under the per-request character cap for speech synthesis", () => {
    // LIMITS.maxTtsChars is 1200; one sentence should be nowhere near it.
    for (const { module } of MODULES) {
      for (const line of moduleLines(module)) {
        expect(line.length, `"${line}" is too long to speak`).toBeLessThan(400);
      }
    }
  });

  it("estimates a listening time for every module", () => {
    for (const { module } of MODULES) {
      expect(estimateMinutes(module)).toBeGreaterThan(0);
    }
  });

  it("asks the speech provider for a rate it will actually honour", () => {
    // Outside 0.7–1.2 the provider clamps silently, so the lecture would play
    // at a pace nobody chose. See SPEED_RANGE in providers/tts.ts.
    const { speed } = LECTURE_SPEECH;
    expect(speed).toBeDefined();
    expect(speed!).toBeGreaterThanOrEqual(SPEED_RANGE.min);
    expect(speed!).toBeLessThanOrEqual(SPEED_RANGE.max);
  });
});
