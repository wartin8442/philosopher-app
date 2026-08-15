/**
 * Scripted courses.
 *
 * A course is the counterpart to a conversation: instead of the model choosing
 * what to say, the philosopher delivers a fixed, human-written lecture, and the
 * model is only reached for the student's own questions. Everything the
 * philosopher says as *teaching* is in this file and nowhere else — no
 * generation, no retrieval, no paraphrase drift between two students.
 *
 * The shape follows how the lesson is actually experienced:
 *
 *   course  → the philosopher's syllabus (its table of contents)
 *   module  → one numbered entry on that syllabus, e.g. "1. The Self"
 *   section → one part of a module, ending in a spoken handoff question
 *   beat    → ONE spoken sentence: one TTS request, one subtitle, one
 *             transcript line
 *
 * A beat must be exactly one sentence. The narrator reveals subtitles from the
 * TTS engine's own sentence boundaries, so a beat holding two sentences would
 * light up its subtitle a sentence early. `courses.test.ts` enforces this.
 *
 * This module is data only, and is safe to send to the browser — the script is
 * the thing the student is here to read. The prompt text that tells the model
 * how to answer questions *inside* a lesson lives in `providers/llm.ts`, with
 * the other server-only prompt material.
 */

/**
 * A picture on the lecture stage, shown again in the transcript: a diagram
 * drawn for the lesson, or a portrait, print or photograph he is holding up.
 */
export interface CourseImageVisual {
  kind: "image";
  src: string;
  width: number;
  height: number;
  /** Describes the picture for screen readers and for the transcript caption. */
  alt: string;
  /** The label under the picture — normally what it is, or who it is. */
  caption: string;
  /**
   * Source and licence, set smaller under the caption. Diagrams drawn for the
   * lesson have none; anything borrowed does, whether or not its licence
   * demands one — a lecture that shows a work should say whose it is.
   */
  credit?: string;
}

/** A portrait pinned beside a board, the way a lecturer holds up a face. */
export interface CourseBoardFigure {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Written under the portrait — normally just the name. */
  label: string;
  sublabel?: string;
}

/**
 * One line of a scripted deep dive: a single spoken sentence.
 *
 * It is a beat in every way except that it cannot touch the stage. The student
 * pressed a line on the board to hear more about it, and the board — with that
 * line on it — has to still be there when he has finished, so a deep dive
 * raises no visual and writes no point.
 */
export type CourseDeepDiveLine = Omit<CourseBeat, "visual" | "boardPoint">;

/**
 * The last thing he says after opening out a written line.
 *
 * A student who pressed a bullet was curious about that bullet, and the moment
 * he stops explaining it is the moment they are most likely to have something
 * to ask. Dropping straight back into the lecture there closes the door on
 * that, so every deep dive ends by holding it open — and the lesson waits at
 * the question instead of resuming on its own.
 */
export const DEEP_DIVE_HANDOFF =
  "Is there anything in particular you would like to ask about that, or shall I carry on?";

/**
 * One line written on the board, revealed by the beat that says it.
 *
 * A point is a note, not a sentence: one or two words, the way a lecturer
 * writes while talking rather than transcribing himself. What the two words
 * stand for is in `deepDive` — see `courses.test.ts`, which holds the length.
 */
export interface CourseBoardPoint {
  id: string;
  text: string;
  /** Optional column this point belongs to on a comparative board. */
  column?: string;
  /**
   * A line written underneath the one above it rather than beside it — the
   * dashed sub-point of a heading. Only these carry a marker; a top-level
   * line is written plain, the way a lecturer writes a heading.
   */
  sub?: boolean;
  /**
   * What he says when the student presses this line and asks for it to be
   * explained in more depth.
   *
   * Written out here rather than generated on the day, for the reason the
   * lecture itself is: two students who ask the same question of the same
   * bullet should hear the same answer. Delivered as an aside — the lecture
   * stops where it stands, he says these lines, and then it picks up again —
   * so it reads as him expanding on his own note, not as a detour.
   *
   * A point without one is simply a written line: nothing to press.
   */
  deepDive?: CourseDeepDiveLine[];
  /**
   * Makes the written line a link. Used for the ideas he names, each of which
   * leads to him with that question already asked — the lecture is fixed, so a
   * student who wants to push on one of its ideas has to leave it to do so.
   * Opened in a new tab: following a link is not abandoning the lesson.
   */
  href?: string;
}

/** One side of a board that compares two ideas without changing screens. */
export interface CourseBoardColumn {
  id: string;
  heading: string;
  /**
   * A face pinned beside this side of the board. On a board that sets one
   * thinker against another, the portrait belongs to the half that is his —
   * not to the board as a whole, which has no single owner.
   */
  figure?: CourseBoardFigure;
}

/**
 * A picture pinned across the top of a board.
 *
 * Unlike a `figure`, which belongs to the board or to a column and goes up with
 * it, a plate is raised by the beat that names it — so a board can gather two
 * pictures over the course of a section, each arriving on the sentence it
 * illustrates.
 */
export interface CourseBoardPlate {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Written under the picture: what it is, and who made it. */
  caption?: string;
  /** Source and licence, set smaller under the caption. See `CourseImageVisual`. */
  credit?: string;
  /**
   * Raised with the board rather than by a beat of its own.
   *
   * A board whose subject *is* its picture — one paragraph of a life, told
   * over a portrait or a map — has nothing to gain from holding the picture
   * back, and holding it back would cost the paragraph its opening sentence:
   * a beat can write one thing, so a beat spent raising the plate is a beat
   * that cannot write the first bullet. These plates are therefore not part of
   * the board's writing; see `boardWriting`.
   */
  withBoard?: boolean;
  /**
   * Raised with a written line rather than by a beat of its own.
   *
   * A picture sometimes belongs to a sentence that already has work to do: the
   * portrait of the man whose objection is being made arrives with the first
   * line of that objection, and a beat can carry one thing. Naming the line
   * here hangs the picture on it, so the two arrive together. Like a plate that
   * goes up with the board, it is not part of the board's writing — the line it
   * names is; see `boardWriting`.
   */
  withPoint?: string;
  /**
   * The philosopher this picture is of, where the app might serve them.
   *
   * Whether it does is a question about the roster a deployment is running
   * today, not about this board — a philosopher named in a lecture may simply
   * not be released yet — so the card settles it at render time and takes one
   * of two doors: `href` if he can be visited, `askInstead` if he cannot.
   */
  philosopherId?: string;
  /**
   * Where the picture leads, for a plate of somebody the app can speak as.
   *
   * A portrait on a board is a person, and a person on this board is a person
   * the student can go and ask — so the card is the door, with the question
   * the lecture raises about him already carried over in the link.
   */
  href?: string;
  /**
   * The question put to the lecturer instead, when that philosopher is not on
   * the roster. It is asked inside the lesson, like any other question a
   * student asks him — a card that cannot be a door out must not become one.
   */
  askInstead?: string;
}

/**
 * A book stood up on the board, raised by the beat that introduces it.
 *
 * The cover is generated from bibliographic facts and simple geometric
 * ornament, so every book has an original public-domain design without a
 * publisher scan. `href` points at the conversation focused on that work: the
 * lesson names the book, and the student can go and read it with him from here.
 */
export interface CourseBoardBook {
  id: string;
  title: string;
  year?: string;
  /**
   * The name the book was published under, set on the label beneath its title.
   *
   * A pseudonymous authorship is not a footnote to these books, it is the form
   * of the argument: the name on the cover is the standpoint the book is
   * written from. So the shelf carries the name as part of what the book is
   * called, and the lecture says why that particular name.
   */
  pseudonym?: string;
  href?: string;
}

/**
 * The quotation a board arrives at.
 *
 * It is written out line by line as it is spoken, set larger than the points,
 * and left standing under everything else — the last thing on the board and
 * the thing still there when he has stopped talking. Each line has its own id
 * because a quotation of two sentences is two beats, and the board should keep
 * pace with the voice rather than appearing whole on the first of them.
 */
export interface CourseBoardClosing {
  lines: { id: string; text: string }[];
  cite?: string;
}

/**
 * A board the philosopher writes on as he talks: a heading, an optional face,
 * and points that appear one at a time, each as its own sentence is spoken.
 *
 * Unlike a diagram, a board is not finished when it goes up. It is raised by
 * the beat carrying its `visual`, and then filled in line by line by the beats
 * carrying its `boardPoint`s — so the stage keeps pace with the argument
 * instead of showing its conclusion early.
 */
export interface CourseBoardVisual {
  kind: "board";
  /** Written at the top of the board, before any point appears. */
  heading: string;
  /** A thesis kept in view above the writing for the whole section. */
  quote?: {
    text: string;
    cite?: string;
  };
  /** A compact diagram that stays visible as the board is filled in. */
  diagram?: CourseImageVisual;
  /** Pictures pinned across the top, each raised by the beat that names it. */
  plates?: CourseBoardPlate[];
  /**
   * Where those pictures sit relative to the writing. The default stacks them
   * above it. "beside" stands them alongside, which is what a board carrying
   * one large picture and a few short bullets wants: the picture then has the
   * whole height of the board rather than the half of it a stack leaves, and
   * a map is only as legible as the space it is given. Stacks again when the
   * stage is too narrow to divide.
   *
   * The writing keeps whatever shape it has — a plain list, or the columns of
   * a board that sets two things against each other. A comparison does not
   * stop being a comparison because there is a picture next to it, and the
   * column it is given is narrow, so such a board usually wants its columns
   * stacked; see `columnLayout`.
   */
  mediaLayout?: "above" | "beside";
  /**
   * In a beside layout, group the books beneath this plate as one media panel.
   * The grouped panel takes the same share of the board as each remaining
   * plate, so a diagram and its books can balance a portrait beside them.
   */
  booksUnderPlate?: string;
  /**
   * How those pictures sit together. "row" stands them side by side, whole,
   * for pictures that are each their own subject. "overlap" deals them out as
   * a lapped hand of cards, for a group that belongs together — four heirs to
   * one philosophy read as a group, not as four separate portraits.
   */
  plateLayout?: "row" | "overlap";
  /** Books stood up on the board, each raised by the beat that names it. */
  books?: CourseBoardBook[];
  /** The quotation the board ends on, written out as it is spoken. */
  closing?: CourseBoardClosing;
  /** Side-by-side areas for points that need to be understood together. */
  columns?: CourseBoardColumn[];
  /** Comparative sections sit side by side; a lesson outline can stack them. */
  columnLayout?: "side-by-side" | "stacked";
  /**
   * Hold back an empty section until its first point is spoken.
   *
   * On the live board it holds back the heading, not the space: the half is
   * laid out from the start and simply not seen, so the half above it is
   * already standing where it will finish rather than drifting up as the
   * second one arrives. See `reserveSpace` in `CourseBoard`.
   */
  revealColumnsAsWritten?: boolean;
  figure?: CourseBoardFigure;
  points: CourseBoardPoint[];
  /** Boards are mostly text and rarely need one; diagrams always do. */
  caption?: string;
}

export type CourseVisual = CourseImageVisual | CourseBoardVisual;

/** A gloss on one word of a beat: shown while it is spoken, kept in the notes. */
export interface CourseFootnote {
  /** The word in the beat this note explains. */
  term: string;
  body: string;
}

/** One spoken sentence. */
export interface CourseBeat {
  text: string;
  /** Put this visual on the stage as the line begins; it stays until replaced. */
  visual?: string;
  /**
   * Take the stage back to the speaker as the line begins — no board, no
   * diagram, just him. A visual otherwise stays up until another replaces it,
   * including across the boundary into the next section, and a paragraph that
   * opens on the last board of the one before it opens on the wrong thing.
   * Applied before `visual`, so a beat may clear and then raise.
   */
  clearVisual?: boolean;
  /**
   * Write this point on the board that is on stage, as the line begins. The
   * point must belong to the board this beat raises or one already raised.
   */
  boardPoint?: string;
  footnote?: CourseFootnote;
  /**
   * In the transcript, start a new run under this heading.
   *
   * Written, not spoken: the lecture runs on unbroken, and nothing about the
   * stage changes. It is for a section that walks several things in turn — the
   * shelf of books, one after another — which read back as one long column of
   * prose otherwise, with no way to find the book you wanted again.
   */
  transcriptHeading?: string;
  /** Where a quoted line comes from. Set only on beats that quote the text. */
  cite?: string;
  /** A quoted thesis: set larger, in quotation marks, on stage and in notes. */
  quote?: boolean;
}

/**
 * The heading a run of sections sits under on the contents.
 *
 * Most sections are their own subject and need nothing above them. A life is
 * the exception: it is one subject told in several paragraphs, and each
 * paragraph wants what a section already has — its own board, its own pause at
 * the end, its own study notes — without pretending to be a separate topic.
 * Consecutive sections carrying the same group are therefore one entry on the
 * contents, which opens into a list of its own; see `courseParts`.
 */
export interface CourseSectionGroup {
  id: string;
  title: string;
}

export interface CourseSection {
  id: string;
  title: string;
  /** The larger part of the lesson this section is one paragraph of. */
  group?: CourseSectionGroup;
  /**
   * A subject inside that part, told in several paragraphs of its own.
   *
   * One paragraph of a life is sometimes three: the reply to Hegel is three
   * ideas, and each of them wants its own board and its own pause without
   * leaving the life or becoming a topic beside it. Consecutive sections
   * sharing a subgroup close up into one entry *within* their part's list,
   * which opens in turn — so the life still offers one choice, and Hegel is
   * one of the choices it offers.
   */
  subgroup?: CourseSectionGroup;
  beats: CourseBeat[];
  /**
   * Spoken after the last beat: "Should we move on to X, or do you have
   * questions so far?" The continue CTA is the answer to this question, so the
   * two are written together.
   */
  handoff: string;
  continueLabel: string;
  /** Study-guide notes, revealed once the section has been delivered. */
  keyPoints: CourseKeyPoint[];
}

/**
 * A study note, or a run of notes gathered under a heading of their own.
 *
 * Most sections sum up as a flat list of notes. A section that walks several
 * things in turn — the shelf of books, one after another — sums up as those
 * things: a heading per book with its notes under it reads as a study guide
 * rather than as five long sentences in a row. The grouping is only in the
 * summing-up; the lecture itself is not cut into sections by it, and nothing
 * has to be clicked to reach one.
 */
export type CourseKeyPoint = string | CourseKeyPointGroup;

export interface CourseKeyPointGroup {
  /** What the notes under it are about — a book, in the one place this is used. */
  heading: string;
  points: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  /**
   * One-sentence description of the lesson. Used as the page description for
   * search and link previews; the table of contents carries the byline
   * instead, so this is not shown on it.
   */
  blurb: string;
  /** Who wrote the lecture, credited on the table of contents. */
  preparedBy?: string;
  sections: CourseSection[];
  visuals: Record<string, CourseVisual>;
}

export interface Course {
  philosopherId: string;
  /** Centered heading on the table of contents. */
  title: string;
  /**
   * One-sentence description of the course. Used as the page description for
   * search and link previews; the table of contents itself is kept bare, so
   * this is not shown on it.
   */
  standfirst: string;
  modules: CourseModule[];
}

// ---- Kierkegaard ------------------------------------------------------------

// Laid out the way the life is: the pictures the section is about standing at
// the size of the board, and the short notes written beside them. This lesson
// is an argument between two men, so it is two faces rather than one — Hegel
// from the first sentence, and Kierkegaard on the sentence that turns against
// him. The writing keeps the two halves it has always had; where a picture
// takes the width of the board it keeps them in the column left over, which is
// why those boards stack them. The board with no picture on it has the whole
// width and sets its halves side by side.
const KIERKEGAARD_VISUALS: Record<string, CourseVisual> = {
  introduction: {
    kind: "board",
    heading: "Introduction",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-hegel-face",
        withBoard: true,
        src: "/philosophers/hegel.jpg",
        width: 640,
        height: 640,
        alt: "Portrait of Georg Wilhelm Friedrich Hegel.",
        caption: "G. W. F. Hegel (1770–1831)",
        credit: "Jakob Schlesinger, 1831. Public domain.",
      },
      {
        // Hung on his own question rather than on a beat of its own: his face
        // belongs to the moment the lecture stops describing the System and
        // puts the question it cannot answer. See `withPoint`.
        id: "pl-kierkegaard-face",
        withPoint: "individual",
        src: "/philosophers/kierkegaard.jpg",
        width: 555,
        height: 555,
        alt: "Portrait of Søren Kierkegaard.",
        caption: "Søren Kierkegaard (1813–1855)",
        credit: "Niels Christian Kierkegaard, c. 1840. Public domain.",
      },
    ],
    columns: [
      { id: "hegel", heading: "Hegel" },
      { id: "kierkegaard", heading: "Kierkegaard" },
    ],
    columnLayout: "stacked",
    revealColumnsAsWritten: true,
    points: [
      {
        id: "system",
        text: "System = Rational understanding of all of reality",
        column: "hegel",
      },
      { id: "detached", text: "Detached perspective", column: "hegel" },
      {
        id: "individual",
        text: "How should an individual live their particular life?",
        column: "kierkegaard",
      },
      { id: "christian", text: "Christian understanding", column: "kierkegaard" },
    ],
  },
  "human-being": {
    kind: "board",
    heading: "The human being",
    quote: {
      text: "A human being is a synthesis of the infinite and the finite.",
      cite: "The Sickness Unto Death, 1849",
    },
    // No picture: the two circles said the same thing the two headings say,
    // and they said it in the middle of the board, which is where the halves
    // of the comparison want to be.
    columns: [
      { id: "finite", heading: "The finite" },
      { id: "infinite", heading: "The infinite" },
    ],
    // Side by side, the finite on the left and the infinite on the right. The
    // claim of this section is that a human being is both at once, and the
    // board says that by standing them level with each other across the width
    // it has — a stack says one and then the other.
    columnLayout: "side-by-side",
    // The section takes the two poles one at a time — the finite for half of
    // it, and only then the infinite — so the board does too. Neither heading
    // is up when it goes up: each arrives with the first line written under
    // it, and the half not yet reached holds its place unseen so that the one
    // being written on never moves.
    revealColumnsAsWritten: true,
    // Each half opens on the claim it is making and then dashes off what that
    // claim is made of: the three things about a life that are given, and the
    // one power that is not.
    points: [
      {
        id: "limited",
        text: "Parts of human being that is limited",
        column: "finite",
      },
      { id: "body", text: "Body", column: "finite", sub: true },
      { id: "past", text: "Concrete past", column: "finite", sub: true },
      {
        id: "circumstance",
        text: "Current situation",
        column: "finite",
        sub: true,
      },
      { id: "abstract", text: "Abstract beyond the limited", column: "infinite" },
      {
        id: "imagination",
        text: "Imagination and Reflection",
        column: "infinite",
        sub: true,
      },
      {
        id: "otherwise",
        text: "Conceive that life could be different from how it was/is now",
        column: "infinite",
      },
      { id: "freedom", text: "Freedom", column: "infinite" },
    ],
  },
  "synthesis-self": {
    kind: "board",
    heading: "The self",
    quote: {
      text: "The self is a relation which relates itself to itself.",
      cite: "The Sickness Unto Death, 1849",
    },
    mediaLayout: "beside",
    // The figure the board before it left off at, with the loop drawn in. It
    // stands at the size of the board rather than as a diagram tucked under the
    // heading: the loop is the whole claim of this section, and it was small
    // enough to be missed.
    plates: [
      {
        id: "pl-self",
        withBoard: true,
        src: "/courses/kierkegaard/synthesis-self-sketch.webp",
        width: 1600,
        height: 885,
        alt: "The infinite and finite circles joined by a line, with a loop in the middle labelled SPIRIT/SELF.",
        caption: "The relation turning back on itself as spirit or self",
      },
    ],
    columns: [
      { id: "infinite-imbalance", heading: "Too much infinite" },
      { id: "finite-imbalance", heading: "Too much finite" },
    ],
    columnLayout: "stacked",
    points: [
      {
        id: "relating",
        text: "Relating/Stance towards infinite and finite",
        deepDive: [
          {
            text: "Two people can be handed the same body, the same past and the same circumstance, and be entirely different people inside it.",
          },
          {
            text: "What differs is not the material but the stance they take toward it.",
          },
          {
            text: "One man treats his circumstance as the whole account of him, and another treats it as the place he is standing while he becomes something.",
          },
          {
            text: "Neither of them has changed a single fact about himself.",
          },
          {
            text: "That is why I say the self is the relating and not either of the things related: it is the only part of you that is genuinely yours to do.",
          },
        ],
      },
      { id: "healthy", text: "Long term dreams, concrete present action" },
      {
        id: "dreamer",
        text: "Constant daydreams",
        column: "infinite-imbalance",
      },
      {
        id: "too-much-infinite",
        text: "No effort in the “now” to achieve those dreams",
        column: "infinite-imbalance",
      },
      {
        id: "conformist",
        text: "Focused on appeasing the crowd",
        column: "finite-imbalance",
      },
      {
        id: "too-much-finite",
        text: "Never dreams, completely focused on the current circumstance he is in",
        column: "finite-imbalance",
      },
    ],
  },
};

const KIERKEGAARD_INTRO_VISUALS: Record<string, CourseVisual> = {
  // The opening board is a picture board rather than a list: two images and
  // the journal entry they are both about. Nothing is bulleted, because the
  // point of this section is the sentence at the bottom, not a summary of it.
  "truth-for-me": {
    kind: "board",
    heading: "Introduction",
    plates: [
      {
        id: "school-of-athens",
        src: "/courses/kierkegaard/school-of-athens.webp",
        width: 1400,
        height: 1086,
        alt: "Raphael's fresco of the philosophers of antiquity gathered under a vast vaulted hall, Plato and Aristotle walking together at its centre.",
        caption: "Raphael, The School of Athens, 1509–11",
        credit: "Public domain, via Wikimedia Commons",
      },
      {
        id: "statue",
        src: "/courses/kierkegaard/kierkegaard-statue.webp",
        width: 667,
        height: 820,
        alt: "Louis Hasselriis's bronze statue of Kierkegaard, seated and writing, on a granite plinth in a garden.",
        caption:
          "Louis Hasselriis's Kierkegaard, the Royal Library Garden, Copenhagen",
      },
    ],
    points: [],
    closing: {
      lines: [
        {
          id: "quote-do",
          text: "What I really need is to get clear about what I must do, not what I must know.",
        },
        {
          id: "quote-truth",
          text: "What matters is to find a purpose, to see what it really is that God wills that I do; the crucial thing is to find a truth which is truth for me, to find the idea for which I am willing to live and die.",
        },
      ],
      cite: "Journals, 1835",
    },
  },

  // The biography is told in six paragraphs, and each paragraph is a board of
  // its own: the pictures it is about, standing beside the short notes he
  // writes while telling it. A paragraph that turns to a second picture
  // partway through pins that one up on the sentence that turns — the board
  // does not change, because the paragraph has not ended.
  "bio-father": {
    kind: "board",
    heading: "Upbringing",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-father",
        withBoard: true,
        src: "/courses/kierkegaard/michael-kierkegaard.webp",
        width: 512,
        height: 655,
        alt: "Oval daguerreotype portrait of an elderly Michael Pedersen Kierkegaard in a dark coat and high collar.",
        caption: "Michael Pedersen Kierkegaard (1756–1838)",
        credit: "Daguerreotype, photographer unknown. Public domain.",
      },
      {
        // Raised partway through, on the sentence that leaves Copenhagen for
        // the heath his father came from: the map is the second half of this
        // paragraph, and it would mean nothing pinned up before it.
        id: "pl-denmark",
        src: "/courses/kierkegaard/denmark-map.webp",
        width: 800,
        height: 1000,
        alt: "Drawn map of Denmark with Jutland named, Sædding marked on its west coast as the home of Michael, and Copenhagen marked on Zealand as the birthplace of Søren.",
        caption: "Sædding, in west Jutland, and Copenhagen",
      },
    ],
    points: [
      {
        id: "bp-born",
        text: "Born 1813 to a wealthy family in Copenhagen",
      },
      {
        id: "bp-influence",
        text: "Father’s influence: spiritual intensity, guilt, a personal relationship with God",
      },
      {
        // The one line on this board that opens out, written under the heading
        // it belongs to rather than beside it.
        id: "bp-curse",
        sub: true,
        text: "Divine curse",
        deepDive: [
          {
            text: "My father believed a punishment had been put on our family, and that he had brought it on himself.",
          },
          {
            text: "It was not a superstition he held lightly; it was how he understood his whole life.",
          },
          {
            text: "He had grown rich, and he took even that as part of the punishment — money his children would have to pay for.",
          },
          {
            text: "So he waited for us to die, and expected to outlive every one of us.",
          },
          {
            text: "By the time I was twenty-one he very nearly had, and I grew up inside that expectation rather than merely hearing about it.",
          },
        ],
      },
    ],
  },
  "bio-university": {
    kind: "board",
    heading: "The university",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-university",
        withBoard: true,
        src: "/courses/kierkegaard/university-of-copenhagen.webp",
        width: 1092,
        height: 860,
        alt: "Nineteenth-century lithograph of the main building of the University of Copenhagen, with figures standing in the square before it.",
        caption: "The University of Copenhagen",
        credit:
          "Søren Henrik Petersen, “Universitetet i Kjøbenhavn”. SMK, public domain.",
      },
    ],
    points: [
      {
        id: "bp-theology",
        text: "17 years old, University of Copenhagen for Theology",
      },
      { id: "bp-debt", text: "Young Socialite" },
      { id: "bp-truth-for-me", text: "Thoughts about life's purpose" },
      { id: "bp-hegel-city", text: "Philosophy world, Hegel" },
    ],
  },
  // The part of the life that is about ideas rather than a place or a person
  // he knew, and the one part told in three paragraphs over a single board.
  // The board is the whole argument with Hegel — his position, and the reply
  // to it, one line per reply — so it is not finished until the third
  // paragraph is, and it stands through all three rather than coming down and
  // going back up between them; see `carriedBoardPoints`. The man himself is
  // on it at the size the rest of the life gives its pictures, with the two
  // books the replies became beside him.
  "bio-hegel": {
    kind: "board",
    heading: "Hegel",
    mediaLayout: "beside",
    booksUnderPlate: "pl-hegel-mediation",
    plates: [
      {
        id: "pl-hegel",
        withBoard: true,
        src: "/philosophers/hegel.jpg",
        width: 640,
        height: 640,
        alt: "Portrait of Georg Wilhelm Friedrich Hegel.",
        caption: "G. W. F. Hegel (1770–1831)",
        credit: "Jakob Schlesinger, 1831. Public domain.",
      },
      {
        // Raised on the sentence that first names mediation, so the diagram
        // arrives alongside Hegel as the dialectic is being explained rather
        // than giving away the argument during the preceding section.
        id: "pl-hegel-mediation",
        src: "/courses/kierkegaard/mediation.webp",
        width: 1280,
        height: 720,
        alt: "Diagram of mediation: a thesis and its opposite come into tension and lead to a synthesis.",
        caption: "Mediation: thesis, opposite, synthesis",
      },
    ],
    books: [
      {
        id: "hegel-either-or",
        title: "Either/Or",
        year: "1843",
        href: "/conversation/kierkegaard?work=either-or&prompt=course-kierkegaard-either-or",
      },
      {
        id: "hegel-fear",
        title: "Fear and Trembling",
        year: "1843",
        href: "/conversation/kierkegaard?work=fear-and-trembling&prompt=course-kierkegaard-abraham",
      },
    ],
    // Three of the four lines are the argument itself, written as the two
    // sides it has: what Hegel put the weight on, against what I put it on.
    points: [
      {
        id: "bp-system",
        text: "System — rational framework for all of reality",
      },
      { id: "bp-universal", text: "The Universal vs. The Individual" },
      { id: "bp-dialectic", text: "The Dialectic vs. Decisive choice" },
      { id: "bp-faith", text: "Rationality vs. Faith" },
    ],
  },

  // The paragraph that carries the two sides of him: the man in the street,
  // and the man who could not be himself with anyone. It is also the one board
  // of the life that ends on a quotation — he has just said that his books
  // describe particular people, and the shortest way to show it is to let one
  // of those descriptions be heard.
  //
  // It is raised late, on the sentence about walking the city rather than on
  // the first line of the paragraph: the two sentences before that are about
  // the inheritance, and he says them standing on his own. Because the board
  // arrives already carrying the man in the top hat, the sentence that raises
  // it can also write the first line under him.
  "bio-walking": {
    kind: "board",
    heading: "Copenhagen",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-walking",
        withBoard: true,
        src: "/courses/kierkegaard/kierkegaard-walking.webp",
        width: 592,
        height: 900,
        alt: "Watercolour drawing of Kierkegaard walking in profile, in a top hat and long brown coat, cigar in hand and cane under his arm.",
        caption: "Søren Kierkegaard",
        credit:
          "Drawing by P.C. Klæstrup, c. 1845. Frederiksborg Museum, via the Royal Danish Library. Public domain.",
      },
      {
        // Pinned up on the sentence that names her, beside the man in the
        // street the paragraph has by then turned away from.
        id: "pl-regine",
        src: "/courses/kierkegaard/regine-olsen.webp",
        width: 613,
        height: 797,
        alt: "Painted portrait of the young Regine Olsen.",
        caption: "Regine Olsen",
        credit: "Emil Bærentzen, 1840. Public domain.",
      },
    ],
    points: [
      { id: "bp-walks", text: "Walks around Copenhagen" },
      {
        id: "bp-lived",
        text: "Philosophy about real, lived experience with others",
      },
      { id: "bp-inward", text: "Inward spiritual intensity and depression" },
      { id: "bp-regine", text: "Regine Olsen" },
    ],
    closing: {
      lines: [{ id: "q-tax", text: "He looks just like a tax collector." }],
      cite: "Fear and Trembling, 1843, on the knight of faith",
    },
  },
  "bio-corsair": {
    kind: "board",
    heading: "The Corsair",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-corsair",
        withBoard: true,
        src: "/courses/kierkegaard/kierkegaard-in-the-corsair.webp",
        width: 191,
        height: 412,
        alt: "Caricature of Kierkegaard from the satirical journal Corsaren: the same walking figure as the drawing, redrawn with trouser legs of unequal length.",
        caption: "Picture of Kierkegaard in the Corsair",
        credit:
          "Corsaren, 27 August 1846; scan from P. Hansen's Illustreret Dansk Litteraturhistorie, 1902. Public domain.",
      },
    ],
    points: [
      { id: "bp-corsair", text: "1846, Corsair Piece" },
      { id: "bp-withdrawn", text: "More reserved, less walks" },
      {
        id: "bp-crowd",
        text: "Shift in writing to be hostile to crowds and the group",
      },
    ],
  },
  "bio-mynster": {
    kind: "board",
    heading: "Mynster",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-mynster",
        withBoard: true,
        src: "/courses/kierkegaard/mynster.webp",
        width: 644,
        height: 900,
        alt: "Painted portrait of Bishop Jacob Peter Mynster in clerical dress.",
        caption: "J.P. Mynster",
        credit: "Vilhelm Gertner, 1842. Public domain.",
      },
    ],
    points: [
      { id: "bp-mynster", text: "Death of Bishop Mynster in 1854" },
      { id: "bp-witness", text: "“A witness to the truth”" },
      { id: "bp-attack", text: "Criticism of “Christendom”" },
    ],
  },
  // The last month of the life, told over three pictures that arrive one at a
  // time as the month does: the hospital he was carried into, the friend who
  // sat with him there, and — only once he has said he died — the grave.
  // The hospital comes up with the board because the board is raised by the
  // sentence that names it; the other two wait for their own.
  "bio-death": {
    kind: "board",
    heading: "Death",
    mediaLayout: "beside",
    plates: [
      {
        id: "pl-hospital",
        withBoard: true,
        src: "/courses/kierkegaard/frederiks-hospital.webp",
        width: 1300,
        height: 933,
        alt: "Drawing of the long, low frontage of Frederik's Hospital on Amaliegade in Copenhagen.",
        caption: "Frederik's Hospital, where Kierkegaard died",
        credit:
          "Kristian Kongstad, from Otto Asmussen's “Kjøbenhavn”, 1914. Public domain.",
      },
      {
        // Pinned up on the sentence that names him — the one man he asked for
        // at the end, beside the hospital he asked for him in.
        id: "pl-boesen",
        src: "/courses/kierkegaard/emil-boesen.jpg",
        width: 692,
        height: 1000,
        alt: "Photographic portrait of Emil Ferdinand Boesen, a clergyman in a dark coat and high stock, the print signed “E. F. Boesen”.",
        caption: "Emil Boesen (1812–1881)",
        credit:
          "Photograph by A. Lønborg. Den Gamle By's image collection. Public domain.",
      },
      {
        id: "pl-grave",
        src: "/courses/kierkegaard/kierkegaard-grave.webp",
        width: 675,
        height: 900,
        alt: "The Kierkegaard family grave in Assistens Cemetery, Copenhagen: a stone monument enclosed by an iron railing.",
        caption: "The Kierkegaard family grave, Assistens Cemetery",
        credit: "Photograph via Wikimedia Commons. Public domain.",
      },
    ],
    points: [
      { id: "bp-collapse", text: "Collapse" },
      { id: "bp-boesen", text: "Deathbed discussions with Boesen" },
      { id: "bp-died", text: "11 November" },
    ],
  },
  // The four heirs, dealt out as overlapping cards, and under them the three
  // ideas — each written as a link to him, with that question already asked.
  impact: {
    kind: "board",
    heading: "Impact",
    plateLayout: "overlap",
    plates: [
      {
        id: "heidegger",
        src: "/philosophers/heroes/heidegger.webp",
        width: 1024,
        height: 1536,
        alt: "Drawn portrait of Martin Heidegger.",
        caption: "Heidegger",
        philosopherId: "heidegger",
        href: "/philosopher/heidegger?prompt=course-kierkegaard-heir-heidegger",
        askInstead: "What impact did you have on Martin Heidegger?",
      },
      {
        id: "sartre",
        src: "/philosophers/heroes/sartre.webp",
        width: 1024,
        height: 1536,
        alt: "Drawn portrait of Jean-Paul Sartre.",
        caption: "Sartre",
        philosopherId: "sartre",
        href: "/philosopher/sartre?prompt=course-kierkegaard-heir-sartre",
        askInstead: "What impact did you have on Jean-Paul Sartre?",
      },
      {
        id: "beauvoir",
        src: "/philosophers/heroes/beauvoir.webp",
        width: 1024,
        height: 1536,
        alt: "Drawn portrait of Simone de Beauvoir.",
        caption: "Beauvoir",
        philosopherId: "beauvoir",
        href: "/philosopher/beauvoir?prompt=course-kierkegaard-heir-beauvoir",
        askInstead: "What impact did you have on Simone de Beauvoir?",
      },
      {
        id: "camus",
        src: "/philosophers/heroes/camus.webp",
        width: 1122,
        height: 1402,
        alt: "Drawn portrait of Albert Camus.",
        caption: "Camus",
        philosopherId: "camus",
        href: "/philosopher/camus?prompt=course-kierkegaard-heir-camus",
        askInstead: "What impact did you have on Albert Camus?",
      },
    ],
    points: [
      {
        id: "idea-individual",
        text: "The emphasis on the individual",
        href: "/conversation/kierkegaard?prompt=course-kierkegaard-individual",
      },
      {
        id: "idea-anxiety",
        text: "Anxiety as the dizziness of freedom",
        href: "/conversation/kierkegaard?prompt=course-kierkegaard-anxiety",
      },
      {
        id: "idea-leap",
        text: "The leap",
        href: "/conversation/kierkegaard?prompt=course-kierkegaard-leap-of-faith",
      },
    ],
  },
  // The shelf. Each book is stood up as he introduces it, and clicking one
  // opens the conversation focused on that work — the same place the "Explore
  // this work" button on his profile leads.
  //
  // Shelved in the order they were written, left to right, because the order
  // is itself a thing the section says: four books in two years, then five
  // years of silence, then the book the Corsair left behind it. The lecture
  // walks the shelf in that direction, so the row fills from the left and the
  // gap before the last one can be heard as well as seen.
  "key-works": {
    kind: "board",
    heading: "Key works",
    books: [
      {
        id: "book-either-or",
        title: "Either/Or",
        year: "1843",
        pseudonym: "Victor Eremita",
        href: "/conversation/kierkegaard?work=either-or",
      },
      {
        id: "book-fear",
        title: "Fear and Trembling",
        year: "1843",
        pseudonym: "Johannes de Silentio",
        href: "/conversation/kierkegaard?work=fear-and-trembling",
      },
      {
        id: "book-anxiety",
        title: "The Concept of Anxiety",
        year: "1844",
        pseudonym: "Vigilius Haufniensis",
        href: "/conversation/kierkegaard?work=the-concept-of-anxiety",
      },
      {
        id: "book-fragments",
        title: "Philosophical Fragments",
        year: "1844",
        pseudonym: "Johannes Climacus",
        href: "/conversation/kierkegaard?work=philosophical-fragments",
      },
      {
        id: "book-sickness",
        title: "The Sickness Unto Death",
        year: "1849",
        pseudonym: "Anti-Climacus",
        href: "/conversation/kierkegaard?work=the-sickness-unto-death",
      },
    ],
    points: [],
  },
};

/** The paragraphs of the life, gathered under one entry on the contents. */
const BIOGRAPHY: CourseSectionGroup = { id: "biography", title: "Biography" };

/**
 * The three replies to Hegel, gathered under one entry inside the life.
 *
 * They are paragraphs of the biography like any other — the same board, the
 * same pause, the same notes — but a student choosing where to go in the life
 * is choosing between his father, his student years, Hegel and the Corsair,
 * not between three ideas of Hegel's they have not heard of yet.
 */
const HEGEL: CourseSectionGroup = { id: "hegel", title: "Hegel" };

/**
 * The opening lesson: who he was, before any of the philosophy.
 */
const KIERKEGAARD_INTRODUCTION: CourseModule = {
  id: "introduction",
  title: "Introduction",
  blurb:
    "Start here. The question his whole philosophy is an answer to, the life he actually lived, what became of his ideas after him, and the books he left behind. No background in philosophy needed.",
  preparedBy: "Will Martin",
  visuals: KIERKEGAARD_INTRO_VISUALS,
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      beats: [
        {
          text: "There is a question every student has asked themselves at some point in school: “When am I ever going to use this?”",
        },
        {
          text: "School is meant to prepare you for the real world, and to give you things you will actually use in your life.",
        },
        {
          text: "So it is frustrating to sit through a lesson knowing that what you are being taught has nothing to do with the life you go home to.",
        },
        {
          text: "Philosophy has the same problem: it asks the biggest questions there are, but what good are its answers if they never touch your own life?",
          visual: "truth-for-me",
          boardPoint: "school-of-athens",
        },
        {
          text: "Ten thousand trivia facts about philosophy are worth less than one truth you actually believe.",
        },
        {
          text: "I mean something you would stake your life on, something that guides every action you take, great and small.",
        },
        {
          text: "My whole philosophy is centered on that question.",
          boardPoint: "statue",
        },
        {
          text: "Which truths really reach a particular person, and make a real difference to the way that person lives?",
        },
        {
          text: "Which truths make someone see that their life is their own, and that becoming the individual they are meant to be is their own choice?",
        },
        {
          text: "What I really need is to get clear about what I must do, not what I must know.",
          quote: true,
          boardPoint: "quote-do",
        },
        {
          text: "What matters is to find a purpose, to see what it really is that God wills that I do; the crucial thing is to find a truth which is truth for me, to find the idea for which I am willing to live and die.",
          quote: true,
          cite: "Journals, 1835",
          boardPoint: "quote-truth",
        },
        {
          text: "That is what my whole philosophy attempts to answer: who am I, and how do I become the person God created me to be, in my own particular life?",
        },
      ],
      handoff:
        "Should we move on to the life I actually lived, or do you have questions so far?",
      continueLabel: "Yes, continue to the next section",
      keyPoints: [
        "The complaint behind everything that follows: a truth that never touches the life you are living is of little use, however impressive it is.",
        "Ten thousand trivia facts about philosophy weigh less than one truth you actually believe — something you would stake your life on, and that guides every action you take.",
        "“To find a truth which is truth for me, to find the idea for which I am willing to live and die.”",
      ],
    },
    // The life, told in paragraphs. Each is a section of its own — its own
    // board, its own pause for questions, its own notes — and all of them carry
    // the same group, so the contents shows one entry called "Biography" that
    // opens into them. Told as one section it was twenty minutes with no way in
    // and no way out; told this way a student can go straight to the Corsair.
    // The paragraphs about Hegel carry a group of their own inside that one,
    // for the same reason one level down; see `HEGEL`.
    {
      id: "bio-father",
      title: "Upbringing",
      group: BIOGRAPHY,
      beats: [
        {
          // He opens standing on his own. The board here is his father's
          // board — his father's face is the first thing on it — so it waits
          // for the sentence that names him rather than going up on a line
          // about the student's own narrator.
          text: "I was born in Copenhagen in 1813, the youngest of seven children in a wealthy family.",
          clearVisual: true,
        },
        {
          // The board goes up on the sentence that names him, and the line
          // about the birth is the first thing written on it — a board cannot
          // be written on before it exists.
          text: "My father, Michael, was one of the biggest influences on my life.",
          visual: "bio-father",
          boardPoint: "bp-born",
        },
        {
          text: "The most obvious part of that was his money, which paid for my years at the university and later, when he had left me an inheritance after he had died, allowed me to live as an independent writer.",
        },
        {
          text: "In addition to providing for me financially, he deeply shaped ideas that I would carry with me through my whole life and writing.",
        },
        {
          text: "He was a deeply religious man who lived in his head, and belonged to a branch of Christianity which heavily emphasized sin, guilt, and a personal relationship with God.",
          boardPoint: "bp-influence",
        },
        {
          text: "What marked me most was his fixed conviction that our family was cursed.",
          boardPoint: "bp-curse",
        },
        {
          // Same board, second picture: the paragraph is still about his
          // father, so the map goes up beside him rather than replacing him.
          text: "Before he came to Copenhagen at the age of eleven, my father was a shepherd boy in Jutland, a poor, rural, and sparse part of Denmark.",
          boardPoint: "pl-denmark",
        },
        {
          text: "His family was desperately poor, and one day, out on the heath, he cursed God.",
        },
        {
          text: "At 11 he moved to Copenhagen, the capital of Denmark, and things turned for the better for him by starting his own business and eventually becoming extremely wealthy.",
        },
        {
          text: "However, he never let go of the memory of insulting God.",
        },
        {
          text: "He believed God had cursed his family for it, and believed it was the cause of our family's misfortunes: by the time I was twenty-one, five of my six siblings and my mother had died, and his first wife had died years before that.",
        },
        {
          text: "I believed firmly in the love and the mercy of God, but that intensity about religion stayed with me all my life, and it runs through everything I wrote.",
        },
      ],
      handoff:
        "Should I move onto my time at the university, or do you have questions about my upbringing?",
      continueLabel: "Continue — the university",
      keyPoints: [
        "Born in Copenhagen in 1813, the youngest of seven. My father Michael left me both the money that made a writing life possible and a Christianity built on sin, guilt, and a personal relationship with God.",
        "He was convinced the family was cursed, because as a boy on the Jutland heath he had cursed God — and by the time I was twenty-one, five of my six siblings and my mother had died.",
        "The intensity about religion behind it stayed with me all my life, and it runs through everything I wrote.",
      ],
    },
    {
      id: "bio-university",
      title: "The university",
      group: BIOGRAPHY,
      beats: [
        {
          text: "In 1830, at seventeen, I enrolled at the University of Copenhagen to study theology, which was the normal path to becoming a pastor in the Danish Church.",
          visual: "bio-university",
          boardPoint: "bp-theology",
        },
        {
          text: "My real interest, though, was philosophy and literature.",
        },
        {
          text: "I was sociable in those years, and careless with money.",
          boardPoint: "bp-debt",
        },
        {
          text: "By 1836 I had run up an enormous debt — about what a university professor made in a year — on clothes, wine, tobacco, the theater, and carriage rides.",
        },
        {
          text: "Underneath all that, though, I was thinking hard about what I wanted to do with my life.",
          boardPoint: "bp-truth-for-me",
        },
        {
          text: "I came to feel that there was no point in building grand philosophical arguments and systems if they meant nothing to me and changed nothing about how I lived.",
        },
        {
          text: "That feeling is the foundation of everything my philosophy became.",
        },
        {
          text: "I was also mixed up in the philosophical world of Copenhagen in those years — the lectures, the societies, the arguments people were having in print.",
          boardPoint: "bp-hegel-city",
        },
        {
          text: "And the idea everyone in that world was arguing about was Hegel's.",
        },
      ],
      handoff:
        "Shall I go on to Hegel, then, or do you have questions about my student years?",
      continueLabel: "Continue — Hegel",
      keyPoints: [
        "I enrolled at seventeen to study theology, the ordinary road to a pastorate, but cared far more for philosophy and literature.",
        "I was sociable and badly in debt, and underneath it working out what I wanted to do with my life.",
        "The conclusion I reached there is the foundation of the rest: a grand system is no use if it means nothing to the person holding it and changes nothing about how they live.",
        "I was mixed up in the philosophical world of Copenhagen, where the idea everyone argued about was Hegel's.",
      ],
    },
    {
      id: "bio-hegel-universal",
      title: "The universal",
      group: BIOGRAPHY,
      subgroup: HEGEL,
      beats: [
        {
          text: "In addition to my father, the second largest influence on my philosophy was Georg Wilhelm Friedrich Hegel, but my philosophy was not inspired by him — it was mostly a reaction against his thinking.",
          visual: "bio-hegel",
        },
        {
          text: "His philosophy was extremely popular in Denmark, and in Europe as a whole, in my time.",
        },
        {
          text: "What it attempted was to explain how the separate parts of reality — nature, logic, consciousness, science, religion, philosophy — could be brought together into one comprehensive and understandable system.",
          boardPoint: "bp-system",
        },
        {
          text: "There are three ideas of his in particular that my philosophy is a reply to.",
        },
        {
          text: "The first is his emphasis on the universal.",
          boardPoint: "bp-universal",
        },
        {
          text: "Hegel's System looks at reality as a whole, and puts the emphasis on the groups a person belongs to — a citizen of a country, a student at a school, a member of a particular group — rather than on the individual.",
        },
        {
          text: "In my view, what's the point of a grand philosophical system that has no impact on the way someone actually lives their life?",
        },
        {
          text: "I applied this particularly to Christianity: it is not enough to just belong to the Church — the Christian will be judged as an individual before God, not as part of one whole.",
        },
        {
          text: "So I focus heavily on the individual person, and I am at times hostile to groups, because of the way they strip people of their individuality.",
        },
      ],
      handoff:
        "Shall I go on to the second of the three, the dialectic, or do you have questions about the universal?",
      continueLabel: "Continue — the dialectic",
      keyPoints: [
        "After my father, Hegel was the second largest influence on my philosophy, though mostly as something to react against: his attempt to bring every part of reality — nature, logic, consciousness, science, religion, philosophy — into one comprehensive system was the popular philosophy of my day.",
        "There are three ideas of his my philosophy is a reply to, and the first is the universal: his System puts the emphasis on the groups a person belongs to rather than on the individual.",
        "What is the point of a grand system that has no impact on the way someone actually lives? This applies above all to Christianity: it is not enough to belong to the Church, because the Christian is judged as an individual before God. So I focus heavily on the individual, and am at times hostile to groups for the way they strip people of their individuality.",
      ],
    },
    {
      id: "bio-hegel-dialectic",
      title: "The dialectic",
      group: BIOGRAPHY,
      subgroup: HEGEL,
      beats: [
        {
          text: "The second is the Hegelian dialectic.",
          visual: "bio-hegel",
          boardPoint: "bp-dialectic",
        },
        {
          text: "Hegel believed that in the rational unfolding of history, contradictions in ideas come into tension together and are ultimately resolved by a higher form, in a process he calls mediation.",
          boardPoint: "pl-hegel-mediation",
        },
        {
          text: "Take the idea of freedom, which can start off as being able to do whatever you want.",
        },
        {
          text: "Its opposite — someone putting rules in place to restrict what you can do — seems contradictory, and it appears that a free society would have no rules or laws.",
        },
        {
          text: "But you can imagine a situation where someone being free to do whatever they want restricts another person's freedom: if a man kidnaps another, that man's freedom is restricted.",
        },
        {
          text: "So then it becomes clear that a society promoting freedom has certain rules and laws that are restricting but that promote freedom in general.",
        },
        {
          text: "The original idea of freedom comes into tension with its opposite, and out of that tension mediation makes a new, higher, more rational idea of freedom.",
        },
        {
          text: "I think that idea of mediation, of both this and that, cannot be applied to a person's concrete life.",
        },
        {
          text: "In a life there are things you have to choose over others, and both are not achievable.",
        },
        {
          text: "If someone is deciding whether to marry, they cannot decide to mediate marriage and non-marriage into a higher, rational concept.",
        },
        {
          text: "You have to decide whether you are going to commit to marriage or not.",
        },
        {
          text: "That responsibility of the individual to make direct and distinctive choices about how they are going to live runs all the way through my philosophy, and it is most visible in Either/Or.",
          boardPoint: "hegel-either-or",
        },
      ],
      handoff:
        "Shall I go on to the third, on religion and philosophy, or do you have questions about the dialectic?",
      continueLabel: "Continue — religion and philosophy",
      keyPoints: [
        "The dialectic: contradictions in ideas come into tension and are resolved by a higher form, in a process Hegel calls mediation — as a freedom that has no rules and a freedom that has too many are resolved into laws that restrict in order to free.",
        "But a life cannot be mediated. Someone deciding whether to marry cannot mediate marriage and non-marriage into a higher concept; they have to choose one over the other.",
        "That responsibility of the individual to make direct and distinctive choices runs all the way through my philosophy, and it is most visible in Either/Or.",
      ],
    },
    {
      id: "bio-hegel-religion",
      title: "Religion and philosophy",
      group: BIOGRAPHY,
      subgroup: HEGEL,
      beats: [
        {
          text: "The third is his account of religion and philosophy.",
          visual: "bio-hegel",
          boardPoint: "bp-faith",
        },
        {
          text: "Hegel believed that religion was a lower, less rational version of philosophy: that religion expresses truths through symbols and imagery, while philosophy expresses them conceptually and clearly.",
        },
        {
          text: "I believed that you could not hold that idea and be a Christian, which was a popular position in Denmark at the time.",
        },
        {
          text: "You cannot reason your way into faith in God, and you cannot explain everything in Christianity rationally.",
        },
        {
          text: "At some point in faith there has to be a risk, in believing something that cannot be objectively certain.",
        },
        {
          text: "And in Fear and Trembling I conclude that Abraham's faith cannot be explained rationally, when God commands him to sacrifice Isaac in the Old Testament.",
          boardPoint: "hegel-fear",
        },
        {
          text: "Both books are on the board, and you may take either one down and put its question to me directly.",
        },
      ],
      handoff:
        "Shall I go on to the life I made in Copenhagen after that, or do you have questions about Hegel?",
      continueLabel: "Continue — Copenhagen",
      keyPoints: [
        "Religion and philosophy: Hegel made religion a lower, less rational version of philosophy — truths in symbols and imagery, where philosophy has them conceptually and clearly.",
        "You cannot hold that and be a Christian. You cannot reason your way into faith in God, and you cannot explain everything in Christianity.",
        "At some point faith risks something that cannot be objectively certain — which is where Abraham's faith, in Fear and Trembling, stops being explicable.",
      ],
    },
    {
      id: "bio-copenhagen",
      title: "Copenhagen",
      group: BIOGRAPHY,
      beats: [
        {
          // The money is not what this board is about, so he says these two
          // sentences standing on his own and the stage stays empty for them.
          text: "At twenty-seven I finished my theology degree, and the inheritance my father left me meant I never needed an ordinary job.",
          clearVisual: true,
        },
        { text: "I was free to write at my own pace, and I did." },
        {
          // The board goes up on the walking, carrying the man in the top hat
          // with it, and the first line is written under him as he says it.
          text: "I spent a great deal of my time walking around Copenhagen, talking with whoever I came across — children and servants, theology students and philosophers.",
          visual: "bio-walking",
          boardPoint: "bp-walks",
        },
        {
          text: "You can see it in my books: when I occasionally describe someone who is meant to stand for an idea, I tell you their job, their family, and the small details of their situation.",
        },
        {
          text: "In Fear and Trembling I go looking for a man of faith, and when I finally imagine finding him, this is what I say about him.",
        },
        {
          text: "He looks just like a tax collector.",
          quote: true,
          cite: "Fear and Trembling, 1843",
          boardPoint: "q-tax",
        },
        {
          text: "I give him a wife, an afternoon walk out to the woods, and the roast lamb's head with vegetables he hopes is waiting for him at home.",
        },
        {
          text: "I was not theorizing about life on my own; I was watching real people and listening to them, and they shaped my philosophy.",
          boardPoint: "bp-lived",
        },
        {
          // The paragraph turns inward here.
          text: "But I was not only the sociable, talkative man on the street.",
        },
        {
          text: "There was another side to me, and it is the side that mattered most to the writing.",
        },
        {
          text: "On my own I carried a deep melancholy and religious intensity that made it hard for me to believe I could show another person the whole of myself.",
          boardPoint: "bp-inward",
        },
        {
          text: "This led to me believing an intimate relationship with someone else was impossible for me.",
        },
        {
          // Her face goes up on the sentence that names her; the line under it
          // waits for the sentence after, because a beat writes one thing.
          text: "Even so, I became engaged to Regine Olsen, a woman I did truly love.",
          boardPoint: "pl-regine",
        },
        {
          text: "However, soon after the engagement I tried calling the marriage off.",
          boardPoint: "bp-regine",
        },
        {
          text: "I believed that my inward intensity and sadness would be too much for Regine, and that a life with me would make her unhappy.",
        },
        {
          text: "Regine initially resisted my attempts to stop the wedding, but her protests did not change my mind.",
        },
        {
          text: "I then began to pretend I was a bad man, and that I had only been using her.",
        },
        {
          text: "Eventually, the marriage was officially called off, and Regine went and married another person.",
        },
        {
          // What he left her is not said here: the lecture now reaches the
          // deathbed itself, and the instruction about the estate is told
          // there, in the section where he is actually dying.
          text: "I, however, continued to think about her and the breakup my entire life and continually wrote about her in my journals.",
        },
        {
          text: "She was a woman I truly loved, but that I did not think would be happy with me because of my inwardness.",
        },
      ],
      handoff:
        "Shall I go on to the Corsair affair, or do you have questions about those years?",
      continueLabel: "Continue — the Corsair",
      keyPoints: [
        "My father's inheritance meant I never needed an occupation, so I wrote at my own pace and spent my days walking and talking across Copenhagen.",
        "That is why my books describe particular people with jobs and families rather than abstractions — the man of faith in Fear and Trembling “looks just like a tax collector.”",
        "Behind the sociable man was a melancholy and a religious intensity that made it hard to believe I could show anyone the whole of myself, and it is why I broke off my engagement to Regine Olsen.",
        "I pretended to be a scoundrel to make her let go, she married another man, and I wrote about her for the rest of my life.",
      ],
    },
    {
      id: "bio-corsair",
      title: "The Corsair",
      group: BIOGRAPHY,
      beats: [
        {
          text: "In 1846 a satirical newspaper called The Corsair, which I had gone out of my way to provoke, published a piece mocking my appearance.",
          visual: "bio-corsair",
          boardPoint: "bp-corsair",
        },
        {
          text: "It was widely read, and people who saw me in the street began to mock me.",
        },
        {
          text: "It made me painfully self-conscious and far more withdrawn, and I gave up most of the walks that had given me so much.",
          boardPoint: "bp-withdrawn",
        },
        {
          text: "From then on I wrote more sharply against people identifying with a group instead of taking responsibility and risking being themselves, an individual.",
          boardPoint: "bp-crowd",
        },
      ],
      handoff:
        "Shall I go on to the quarrel that came out of that, or do you have questions about the Corsair?",
      continueLabel: "Continue — Bishop Mynster",
      keyPoints: [
        "The Corsair mocked my appearance in 1846, and strangers in the street took it up.",
        "It drove me indoors and cost me the walks, and it turned my writing against the crowd — against identifying with a group instead of risking being yourself, an individual.",
      ],
    },
    {
      id: "bio-mynster",
      title: "Mynster and the Church",
      group: BIOGRAPHY,
      beats: [
        {
          // Raises the board but writes nothing: the first line on it is about
          // his death, and he has not died yet.
          text: "In the end that criticism came to rest on one man: Bishop Jacob Peter Mynster.",
          visual: "bio-mynster",
        },
        {
          text: "Mynster was Bishop of Zealand, which is the highest office in the Danish Church, a man everyone respected and one my own father had looked up to.",
        },
        {
          text: "He died in January of 1854.",
          boardPoint: "bp-mynster",
        },
        {
          text: "Shortly afterwards his successor Hans Lassen Martensen praised him from the pulpit as “a witness to the truth,” one of the genuine links in the holy chain that runs back to the apostles.",
          boardPoint: "bp-witness",
        },
        { text: "I could not let that stand." },
        {
          text: "A witness to the truth, as I understand those words, is an apostle or a martyr — someone whose life is struggle, poverty and sacrifice for the faith.",
        },
        {
          text: "Mynster had lived comfortably at the head of a comfortable Christianity, and calling a man like that a witness to the truth empties the words of what they mean.",
        },
        {
          text: "So I attacked the Danish Church directly, because it was keeping Christianity comfortable and easy, when the real thing is difficult and asks for struggle and sacrifice in following God.",
          boardPoint: "bp-attack",
        },
        {
          text: "In addition to my public ridicule because of the Corsair Affair, I also became heavily criticized by the Danish Church, with many people writing that I was critical simply because I was bitter at life.",
        },
        {
          text: "This isolation and criticism caused me to suffer greatly, and I continually wrote in my journals about my idea of suffering for the sake of the truth.",
        },
        {
          text: "Overall, I wanted people not to accept the comfortable but false cultural version of Christianity I saw in the Danish Church.",
        },
        {
          text: "I wanted people to really understand what the Bible demanded from a believer, and that following Christ required struggle.",
        },
      ],
      handoff:
        "Shall I go on to the last year of my life, or do you have questions about the attack on the Church?",
      continueLabel: "Continue — my last year",
      keyPoints: [
        "Martensen praised Bishop Mynster from the pulpit as “a witness to the truth” — words that belong to apostles and martyrs, not to a comfortable man at the head of a comfortable Christianity.",
        "That eulogy was the occasion of my direct attack on the Danish Church, which had made Christianity easy when the real thing asks for struggle and sacrifice.",
        "The Church criticized me back, and many wrote that I was only bitter at life; I suffered under that isolation and filled my journals with the idea of suffering for the sake of the truth.",
      ],
    },
    {
      id: "bio-death",
      title: "Death",
      group: BIOGRAPHY,
      beats: [
        {
          text: "In early October of 1855 I collapsed in the street and was taken to Frederik's Hospital.",
          visual: "bio-death",
          boardPoint: "bp-collapse",
        },
        {
          // His face goes up on the sentence that names him; the line under it
          // waits for the sentence after, because a beat writes one thing.
          text: "During my time in the hospital, I was frequently visited by my lifelong friend Emil Boesen, and we talked about my life.",
          boardPoint: "pl-boesen",
        },
        {
          text: "I talked to him about what I called my “thorn in my flesh” (a reference to a passage by St Paul) and said that it was the reason for my breaking off of the engagement with Regine Olsen and my general struggle with intimacy.",
          boardPoint: "bp-boesen",
        },
        {
          text: "I wanted this to be removed from me, but it never was, and it was a constant part of my life.",
        },
        {
          text: "Most likely I was talking about my spiritual intensity and melancholy.",
        },
        {
          text: "I also told Boesen that I prayed that I would be freed from despair before my death.",
        },
        {
          text: "Despair is the topic I discuss in The Sickness Unto Death, and I define it as failing to make a self and to rest transparently in God, the goal of every Christian.",
        },
        {
          text: "This shows a crucial thing about me — though I wrote about the responsibility of living as a Christian and the task of becoming an individual, I did not claim that I had achieved these things.",
        },
        {
          text: "I believed that I could write about them, but not claim them, and that is part of the reason I wrote most of my works using a pseudonym.",
        },
        {
          text: "Additionally, I talked about Regine and the love I still had for her.",
        },
        {
          text: "I left my entire estate to her as if we had actually been married.",
        },
        {
          text: "When I was close to death, I was visited by my only surviving brother Peter, who was a pastor in the Church, but I refused to even let him into the room.",
        },
        {
          text: "Later, Emil asked me if I wanted to receive Communion, and I said that I would only receive it from a layperson, not a Church official, and ultimately refused it because this was not done.",
        },
        {
          text: "This shows that I kept my commitment to condemning the Danish Church, even if it meant not seeing my own brother and rejecting Communion.",
        },
        {
          text: "My health worsened quickly, and I died about a month later, on the eleventh of November, at forty-two.",
          boardPoint: "bp-died",
        },
        {
          // The grave waits until he has said he died, and goes up on the
          // sentence that puts him in it.
          text: "I was buried in the family grave at Assistens Cemetery in Copenhagen.",
          boardPoint: "pl-grave",
        },
      ],
      handoff:
        "Should we move on to what became of my ideas after me, or do you have questions so far?",
      continueLabel: "Yes, continue to the next section",
      keyPoints: [
        "I collapsed in the street in early October 1855 and died at Frederik's Hospital on the eleventh of November, at forty-two.",
        "In the hospital my lifelong friend Emil Boesen sat with me, and I told him about the “thorn in the flesh” that was my reason for breaking the engagement, and that I prayed to be freed from despair before I died.",
        "I wrote about the task of becoming an individual without ever claiming I had done it — which is part of why so much of the work is pseudonymous.",
        "I would not let my brother Peter, a pastor, into the room, and I would take Communion only from a layperson and so went without it: the attack on the Church held to the end.",
      ],
    },
    {
      id: "impact",
      title: "Impact",
      beats: [
        {
          text: "My ideas have had a tremendous impact on the philosophy that came after me.",
          visual: "impact",
        },
        {
          text: "I am frequently called the father of existentialism, because of the direct impact my ideas had on the philosophers who are associated with that branch of philosophy, even though I wrote from a Christian worldview and most of the existentialists after me take an atheistic approach.",
        },
        {
          text: "Martin Heidegger took up my account of anxiety, and of what it is for a being to have its own existence in question.",
          boardPoint: "heidegger",
        },
        {
          text: "Jean-Paul Sartre took up freedom, and the choosing of oneself that no one else can do on your behalf.",
          boardPoint: "sartre",
        },
        {
          text: "Simone de Beauvoir took up what it costs to become oneself inside a situation one did not choose.",
          boardPoint: "beauvoir",
        },
        {
          text: "Albert Camus took up the absurd, and the question of how to live once reason has run out.",
          boardPoint: "camus",
        },
        { text: "There are others besides these four." },
        { text: "Three of my ideas did most of that work." },
        {
          text: "The first is the importance of becoming a genuine individual rather than losing yourself in the crowd.",
          boardPoint: "idea-individual",
        },
        {
          text: "The second is anxiety, which I call the dizziness of freedom.",
          boardPoint: "idea-anxiety",
        },
        {
          text: "The third is that religious faith asks for a personal commitment beyond anything that can be established with complete certainty, which is the idea behind the phrase leap of faith.",
          boardPoint: "idea-leap",
        },
        {
          text: "Each of the three is written on the board, and you can follow any of them to put the question to me directly.",
        },
      ],
      handoff:
        "Should we move on to the books themselves, or do you have questions so far?",
      continueLabel: "Yes, continue to the next section",
      keyPoints: [
        "A life of suffering and inwardness, and a body of work that reshaped the philosophy after it.",
        "Frequently called the father of existentialism, through the direct impact on Heidegger, Sartre, Beauvoir, and Camus.",
        "Becoming a genuine individual, rather than losing oneself in the crowd.",
        "Anxiety as the “dizziness of freedom.”",
        "Faith as a personal commitment beyond what can be established with complete certainty — the “leap of faith.”",
      ],
    },
    {
      id: "key-works",
      title: "Key works",
      beats: [
        {
          text: "A note before we begin: these are not all the books I have written, but they are the ones you need for a comprehensive understanding of my philosophy and its impact on the philosophers who came after me.",
        },
        { text: "Most of my books were written under pseudonyms." },
        {
          text: "A pseudonym is not a disguise: each one shows a certain way of thinking from the perspective of a person who adopts the idea, rather than stating what I believe directly.",
        },
        {
          text: "So the name on the cover is part of the argument, and I will give you each one as we go along the shelf, in the order the books were written.",
        },
        {
          text: "Either/Or came first, in 1843, published by Victor Eremita — the victorious hermit — who claims only to have found the papers in an old writing desk and to have put them into print.",
          visual: "key-works",
          boardPoint: "book-either-or",
          // Read back, the shelf is walked book by book; see
          // `transcriptHeading`. The heading is the book being taken down,
          // named as it stands on the shelf.
          transcriptHeading: "Either/Or (1843) — Victor Eremita",
        },
        {
          text: "I gave it that editor because the book must not have an author who can settle it for you: a hermit who merely found the papers cannot tell you which half to live by.",
        },
        {
          text: "Either/Or sets out two ways of living life: the unreflective, or aesthetic, given over to pleasure and to staying out of boredom; and the ethical, which requires commitment and responsibility.",
        },
        {
          text: "What the book finally says is that it is up to each individual to decide how they want to live.",
        },
        {
          text: "Later in that same year, 1843, came Fear and Trembling, under the name Johannes de Silentio — John of the Silence.",
          boardPoint: "book-fear",
          transcriptHeading: "Fear and Trembling (1843) — Johannes de Silentio",
        },
        {
          text: "He is silent because he has no faith of his own to speak from, and because the man who does have it cannot explain himself either; a book about faith should be written by someone standing outside it and admitting so.",
        },
        {
          text: "Fear and Trembling explores the role of faith in the story of Abraham being asked to sacrifice Isaac.",
        },
        {
          text: "There I argue that faith is not entirely rational, that a person of faith cannot fully explain themselves to anyone else, and that God is not bound by reason and may suspend the rules of ethics — what I call the teleological suspension of the ethical.",
        },
        {
          text: "The next year, 1844, brought The Concept of Anxiety, written by Vigilius Haufniensis — the watchman of Copenhagen.",
          boardPoint: "book-anxiety",
          transcriptHeading: "The Concept of Anxiety (1844) — Vigilius Haufniensis",
        },
        {
          text: "A watchman keeps awake and reports what he sees, which is exactly the distance that book needs: it observes sin as a psychologist rather than condemning it as a preacher.",
        },
        {
          text: "The Concept of Anxiety is a notoriously difficult book.",
        },
        {
          text: "In it I criticize the traditional understanding of original sin, insisting on each individual’s own choice in sin rather than on sin as something simply inherited.",
        },
        {
          text: "I describe anxiety as the dizziness of freedom, and show its place in living a truly individual life.",
        },
        {
          text: "And I give the cure for anxiety: trusting in God’s plan for one’s own life.",
        },
        {
          text: "Philosophical Fragments came out in that same year, 1844, under the name Johannes Climacus, simply John Climacus in English.",
          boardPoint: "book-fragments",
          transcriptHeading: "Philosophical Fragments (1844) — Johannes Climacus",
        },
        {
          text: "John Climacus was a 7th century monk who wrote The Ladder of Divine Ascent.",
        },
        {
          text: "The name here is meant to reflect someone who is on the ladder, someone still climbing towards faith, who can therefore ask what faith would have to be without ever claiming to have it.",
        },
        {
          text: "Philosophical Fragments argues that the human person is not entirely rational, and needs subjective truths that they really feel and deeply identify with, rather than a great store of objective facts.",
        },
        {
          text: "Then look at the gap on the shelf: four books in two years, and the next one five years later.",
          // The heading goes above the gap rather than below it: the five
          // years are the first thing the last book has to say for itself.
          transcriptHeading: "The Sickness Unto Death (1849) — Anti-Climacus",
        },
        {
          text: "The Sickness Unto Death was written in that gap, after the Corsair affair, and you can hear in it what being laughed at by a whole city had taught me.",
          boardPoint: "book-sickness",
        },
        {
          text: "It takes up the human person and the self, and argues that despair, and ultimately sin, is a failure to become a self.",
        },
        {
          text: "And one type of this failure I frequently reference is the person who, instead of unreservedly becoming themselves, attaches themselves to the crowd and assimilates with them, never discovering who they are as a person.",
        },
        {
          text: "It was written by Anti-Climacus — above Climacus rather than against him, a name standing for a height of spiritual maturity I myself admitted in a journal that I had not yet reached.",
        },
        {
          text: "Those are the books, and every one of them comes back to the question we began with.",
        },
        {
          text: "They are on the shelf beside me, and you can take any of them down and read it with me.",
        },
      ],
      handoff: "Any questions?",
      continueLabel: "No questions — finish the lesson",
      // The shelf, summed up as the shelf: the two notes that hold for every
      // book, and then a heading per book with its own notes under it. See
      // `CourseKeyPoint` — the grouping is a study guide, not a cut in the
      // lecture.
      keyPoints: [
        "These are not all the books I wrote, but they are the ones the philosophy and its influence run through.",
        "The pseudonyms present a way of thinking from the perspective of a person who adopts the idea rather than stating my own belief, so the name on the cover is part of the argument.",
        {
          heading: "Either/Or (1843) — Victor Eremita",
          points: [
            "The victorious hermit claims only to have found the papers, so the book has no author who can settle it for you.",
            "Two ways of living: the aesthetic, given over to pleasure and to staying out of boredom, and the ethical, which requires commitment and responsibility.",
            "It is up to each individual to decide how they want to live.",
          ],
        },
        {
          heading: "Fear and Trembling (1843) — Johannes de Silentio",
          points: [
            "John of the Silence has no faith of his own to speak from, and the man who does have it cannot explain himself either.",
            "The role of faith in the story of Abraham being asked to sacrifice Isaac.",
            "Faith is not entirely rational, and a person of faith cannot fully explain themselves to anyone else.",
            "God is not bound by reason and may suspend the rules of ethics — the teleological suspension of the ethical.",
          ],
        },
        {
          heading: "The Concept of Anxiety (1844) — Vigilius Haufniensis",
          points: [
            "The watchman of Copenhagen keeps awake and reports what he sees, observing sin as a psychologist rather than condemning it as a preacher.",
            "Against sin as something simply inherited: each individual’s own choice in sin.",
            "Anxiety as the dizziness of freedom, and its place in living a truly individual life.",
            "The cure for anxiety: trusting in God’s plan for one’s own life.",
          ],
        },
        {
          heading: "Philosophical Fragments (1844) — Johannes Climacus",
          points: [
            "Named for the 7th century monk who wrote The Ladder of Divine Ascent — someone still climbing towards faith rather than standing at the top of it.",
            "The human person is not entirely rational, and needs subjective truths they really feel and deeply identify with, rather than a great store of objective facts.",
          ],
        },
        {
          heading: "The Sickness Unto Death (1849) — Anti-Climacus",
          points: [
            "Written five years after the others, in the gap the Corsair affair opened.",
            "Anti-Climacus stands above Climacus rather than against him, at a height of spiritual maturity I admitted in a journal that I had not yet reached.",
            "Despair, and ultimately sin, is a failure to become a self.",
            "Above all in the person who attaches themselves to the crowd and assimilates with them, never discovering who they are.",
          ],
        },
      ],
    },
  ],
};

const KIERKEGAARD_THE_SELF: CourseModule = {
  id: "the-self",
  title: "The Self",
  blurb:
    "What Kierkegaard was arguing against, what he thinks a human being is made of, and why he says the self is something you become rather than something you are born with. No background in philosophy needed.",
  preparedBy: "Will Martin",
  visuals: KIERKEGAARD_VISUALS,
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      beats: [
        {
          text: "In my own century, the philosophy of Hegel was the most popular philosophy in Europe.",
          visual: "introduction",
          // The first proper name in the course, and the one thing a beginner
          // needs handed to them: everything in this section is a reaction to
          // him, and the script never stops to say who he was.
          footnote: {
            term: "Hegel",
            body: "Georg Wilhelm Friedrich Hegel (1770–1831): a German philosopher whose followers dominated European thought in Kierkegaard's lifetime. You do not need to know his philosophy to follow this lesson — only that he built an enormous system meant to explain everything at once.",
          },
        },
        {
          text: "Hegel famously tried to contain the whole of human history and existence inside his System.",
        },
        {
          text: "He believed history could be explained through reason, rather than as a random series of events.",
          boardPoint: "system",
        },
        {
          text: "In his view, one period led to the next step by step, like parts of one enormous logical argument.",
        },
        {
          text: "My chief complaint against that philosophy is this: it makes bold and grand claims about the universe and about history, but it makes them from a detached perspective.",
          boardPoint: "detached",
        },
        {
          text: "Even if the System could explain the whole course of history, it still would not tell one particular person how to live their real life.",
        },
        {
          text: "So the question my philosophy sets out to answer is a different one: how is a particular individual supposed to live their own life?",
          boardPoint: "individual",
        },
        {
          text: "And especially, how are they to live it in a religious context, before God?",
          boardPoint: "christian",
        },
        {
          text: "Keep that question in front of you, because everything else I say is an attempt to answer it.",
        },
      ],
      handoff:
        "Should we move on to the human being as a synthesis of the infinite and the finite, or do you have questions so far?",
      continueLabel: "Yes, continue to the next section",
      keyPoints: [
        "The System — Hegel's attempt to explain all of history through reason, as a step-by-step logical process.",
        "Kierkegaard's objection: explaining history as a whole does not tell one particular person how to live their real life.",
        "The governing question of everything that follows: how is a particular individual to live their own life, and to live it before God?",
      ],
    },
    {
      id: "synthesis",
      title: "The human being as a synthesis of the infinite and the finite",
      beats: [
        {
          text: "To understand the rest of my philosophy, you must first understand what I take a human being to be.",
          visual: "human-being",
        },
        {
          text: "A human being is a synthesis of the infinite and the finite.",
          quote: true,
          cite: "The Sickness Unto Death, 1849",
        },
        {
          text: "That sounds abstract, so let us break down what I actually mean by it.",
        },
        {
          // The section is two halves taught in turn, and read back as one
          // column of prose it was a wall with the turn buried in it. The
          // headings are the two the board carries, so the notes and the board
          // are read as the same pair; see `transcriptHeading`.
          text: "Begin with the finite.",
          transcriptHeading: "The finite",
        },
        {
          text: "There are parts of being human that are limited, and to a certain extent unchangeable.",
          boardPoint: "limited",
        },
        {
          text: "Your body takes up a limited amount of space.",
          boardPoint: "body",
        },
        {
          text: "You have a concrete past: certain things happened in your life and not other things, and you were born on one particular date, at one particular hour.",
          boardPoint: "past",
        },
        {
          text: "You find yourself in one particular circumstance rather than in any of the others you might have been in.",
          boardPoint: "circumstance",
        },
        {
          text: "In short, there are parts of the human being that are simply limited, and that is the finite.",
        },
        {
          text: "But a human being is not completely defined by those limited parts — not by the limited body, not by the concrete past, not by the present situation.",
          // The turn out of the finite: the sentence that says what the second
          // half is not is the first sentence of that half.
          transcriptHeading: "The infinite",
        },
        {
          text: "A human being has the power to abstract beyond their own circumstances.",
          boardPoint: "abstract",
        },
        { text: "What does that actually mean?" },
        {
          text: "Through imagination and reflection, a person can conceive of possibilities beyond the circumstances they are in.",
          boardPoint: "imagination",
        },
        {
          text: "They could imagine themselves in a different occupation, look back at their past and see how it might have gone otherwise, and think about how their life might yet be different.",
          boardPoint: "otherwise",
        },
        {
          text: "This ability to conceive of possibilities beyond one's present circumstances is the infinite in the human being.",
        },
        {
          text: "This is also where freedom enters the human being.",
        },
        {
          text: "You are not confined to one possible choice: you can imagine different ways of acting and choose which possibility to pursue.",
          boardPoint: "freedom",
        },
        {
          text: "That freedom is not limitless, because your body, past, and circumstances still place real limits on what you can do.",
        },
        {
          text: "These two components combine to make the human being.",
        },
        {
          text: "The person is a synthesis — a combination — of the infinite and the finite.",
        },
        { text: "Every human being is naturally this combination." },
        {
          text: "But how does one get from being a human being to being a particular individual?",
        },
        {
          text: "What makes you yourself, rather than simply one more human being?",
        },
        { text: "For me, the answer is the self." },
      ],
      handoff: "Should we move on to the self, or do you have questions so far?",
      continueLabel: "Yes, continue to the next section",
      keyPoints: [
        "“A human being is a synthesis of the infinite and the finite.”",
        "The finite: the body, the concrete past, the particular circumstance — everything about a life that is limited and largely unchangeable.",
        "The infinite: the power to imagine different possibilities and freely choose which one to pursue, within the real limits of your life.",
        "Every human being is this combination by nature. Being a human being is therefore not yet the same as being a particular individual.",
      ],
    },
    {
      id: "the-self",
      title: "The self",
      beats: [
        {
          text: "The self is a relation which relates itself to itself.",
          quote: true,
          cite: "The Sickness Unto Death, 1849",
          visual: "synthesis-self",
        },
        {
          text: "Every human being carries both parts of themselves within them, as we have just seen.",
        },
        {
          text: "What differentiates one human being from another is how they relate to those parts of themselves.",
          boardPoint: "relating",
        },
        // Said aloud rather than left as a note on the word: the whole claim of
        // the section rests on what "relate" is doing, and in English it does
        // almost nothing. It is a digression, so it is headed off in the
        // transcript and the argument is picked up again under a heading of
        // its own; see `transcriptHeading`.
        {
          text: "Let me stay on that word for a moment, because the English does not carry what I mean by it.",
          transcriptHeading: "The word in Danish",
        },
        {
          text: "In my own language the verb is forholde sig til, and it says something the English “relate to” does not.",
        },
        {
          text: "To relate to a thing, in English, sounds like a line drawn between two points, and a line is simply there or not there.",
        },
        {
          text: "Forholde sig til is closer to holding yourself in relation to something — the position you take up toward it.",
        },
        {
          text: "The noun underneath it, et Forhold, is a relation in the sense of how two things stand with respect to each other: a proportion, a bearing, which way a thing is facing.",
        },
        {
          text: "So when I say the self relates itself to itself, hear a posture rather than a connection.",
        },
        {
          text: "It is where you place yourself, and how you hold yourself, with regard to your own limits and your own possibility.",
        },
        {
          text: "And a posture is not something you have: it is something you are holding, and can hold well or badly.",
        },
        {
          text: "The healthy self relates itself rightly to these different aspects of itself.",
          transcriptHeading: "Relating well, and badly",
        },
        {
          text: "Such a person holds long-term dreams and ambitions for themselves, and then brings themselves back to the concrete now, to do the things that carry them toward those dreams.",
          boardPoint: "healthy",
        },
        {
          text: "Let me show you what bad relating looks like, with two examples.",
        },
        {
          text: "Imagine a man who lives in constant daydreams.",
          boardPoint: "dreamer",
        },
        {
          text: "He dreams of himself in grand situations: of being rich, of having his dream wife, of being a great man whom people admire.",
        },
        { text: "But he does nothing at all to try to achieve these dreams." },
        {
          text: "It is clear that this person is imbalanced: he is focused too much on his infinite ability to dream, and not nearly enough on his present situation.",
          boardPoint: "too-much-infinite",
        },
        {
          text: "He has great dreams for himself and does nothing to make them real — he gets lost in the fantasy, and never does the work his dreams would ask of him.",
        },
        {
          text: "Now, on the other hand, imagine a man entirely focused on the world around him and on fitting into it.",
          boardPoint: "conformist",
        },
        {
          text: "He does not dream at all: he attends only to fitting in with the crowd, to having the right occupation, to marrying the right person, to behaving in the right way.",
        },
        {
          text: "This person is focused entirely on the finite in himself, on the time and the circumstance in which he happens to find himself.",
        },
        {
          text: "He never takes the risk of dreaming for himself what his life could be.",
        },
        {
          text: "He is imbalanced in the other direction — too much of the finite, too little of the infinite — and so he never takes the chance to become an individual.",
          boardPoint: "too-much-finite",
        },
        {
          text: "So the self is neither of the two poles: it is the relating itself, the stance you take toward your own infinite and your own finite.",
        },
        {
          text: "And that is why the self is an ongoing process, something you become rather than something you were handed at birth.",
        },
        {
          text: "This is the foundation for understanding everything else in my philosophy.",
        },
      ],
      handoff: "Any questions?",
      continueLabel: "No questions — finish the lesson",
      keyPoints: [
        "“The self is a relation which relates itself to itself.” The self is not one of the two poles but the relating between them.",
        "To relate — forholde sig til — is to hold yourself in relation to something: the position or bearing you take up toward it, not a connection you simply have. Et Forhold is how two things stand with respect to each other.",
        "Imbalance toward the infinite: the daydreamer, full of possibility, who never acts.",
        "Imbalance toward the finite: the conformist, absorbed in his circumstances, who never risks a possibility of his own.",
        "The healthy self holds both — long-term dreams, returned again and again to the concrete now.",
        "The self is therefore a task rather than a possession: something you become, not something you were born holding.",
      ],
    },
  ],
};

const COURSES: readonly Course[] = [
  {
    philosopherId: "kierkegaard",
    title: "Søren Kierkegaard",
    standfirst:
      "A course taught in his own voice, written for people starting from nothing. He follows a script — but you can interrupt with a question at any point, and he will stop and answer it before picking up where he left off.",
    modules: [KIERKEGAARD_INTRODUCTION, KIERKEGAARD_THE_SELF],
  },
];

// ---- Lookups ----------------------------------------------------------------

/** Philosopher ids that have a course, for linking from their profile card. */
export const COURSE_PHILOSOPHER_IDS: ReadonlySet<string> = new Set(
  COURSES.map((c) => c.philosopherId),
);

export function getCourse(philosopherId: string): Course | undefined {
  return COURSES.find((c) => c.philosopherId === philosopherId);
}

export function getCourseModule(
  philosopherId: string,
  moduleId: string,
): CourseModule | undefined {
  return getCourse(philosopherId)?.modules.find((m) => m.id === moduleId);
}

/** 1-based position of a module in its course; 0 if it is not in one. */
export function moduleNumber(course: Course, moduleId: string): number {
  return course.modules.findIndex((m) => m.id === moduleId) + 1;
}

/**
 * Every spoken line of a section, in order. The handoff is one of them: it is
 * read aloud like any other line, and it is the last thing the student hears
 * before the continue button means anything.
 */
export function sectionLines(section: CourseSection): string[] {
  return [...section.beats.map((b) => b.text), section.handoff];
}

/** One entry on a lesson's contents: a section, or a group of them. */
export interface CoursePart {
  id: string;
  title: string;
  /** Indexes into the module's sections, in the order they are taught. */
  sectionIndexes: number[];
  /**
   * What this entry opens into, when it holds more than one section: one child
   * per section, except where a run of them shares a subgroup and closes up
   * into a child that opens in turn. Absent on an entry that is a section.
   */
  parts?: CoursePart[];
}

/**
 * The contents of a lesson as the student is offered it.
 *
 * A section is the unit of delivery — one board, one pause, one set of notes —
 * but it is not always the unit a student thinks in. Six paragraphs of a life
 * are six sections and one subject, so consecutive sections sharing a group
 * close up into a single entry holding all of them. Everything else is its own
 * entry, which is why a module that groups nothing comes back unchanged.
 *
 * A subject told in several paragraphs *inside* one of those entries closes up
 * the same way one level down; see `subgroup`.
 */
export function courseParts(sections: CourseSection[]): CoursePart[] {
  const parts = closeUp(sections, sections.map((_, i) => i), (s) => s.group);
  for (const part of parts) {
    if (part.sectionIndexes.length < 2) continue;
    part.parts = closeUp(sections, part.sectionIndexes, (s) => s.subgroup);
  }
  return parts;
}

/**
 * A run of sections as entries: consecutive sections answering `groupOf` with
 * the same group become one entry holding all of them, and every other section
 * is an entry of its own.
 */
function closeUp(
  sections: CourseSection[],
  indexes: number[],
  groupOf: (section: CourseSection) => CourseSectionGroup | undefined,
): CoursePart[] {
  const parts: CoursePart[] = [];
  for (const i of indexes) {
    const section = sections[i];
    const group = groupOf(section);
    const open = parts[parts.length - 1];
    if (group && open?.id === group.id) {
      open.sectionIndexes.push(i);
      continue;
    }
    parts.push({
      id: group?.id ?? section.id,
      title: group?.title ?? section.title,
      sectionIndexes: [i],
    });
  }
  return parts;
}

/**
 * The board points written up by a run of beats. Used both on the stage (the
 * beats heard so far) and in the transcript (the beats of a finished section),
 * so a board reads the same in both places.
 */
export function revealedBoardPoints(beats: CourseBeat[]): Set<string> {
  const ids = new Set<string>();
  for (const beat of beats) if (beat.boardPoint) ids.add(beat.boardPoint);
  return ids;
}

/** The single board a section raises, if that is all it puts on the stage. */
function loneBoardOf(
  section: CourseSection,
  visuals: Record<string, CourseVisual>,
): string | undefined {
  const raised = new Set(
    section.beats.map((beat) => beat.visual).filter(Boolean) as string[],
  );
  if (raised.size !== 1) return undefined;
  const [id] = raised;
  return visuals[id]?.kind === "board" ? id : undefined;
}

/**
 * The board a section inherits from the one before it, if they share one.
 *
 * Undefined for a section that opens a board of its own — which is nearly all
 * of them — and that is the difference the stage turns on: a paragraph with
 * its own board opens on the speaker and puts the board up, while a paragraph
 * going on with the board already standing must not take it down and raise it
 * again. The board did not change; only the paragraph did.
 */
export function sharedBoardId(
  sections: CourseSection[],
  index: number,
  visuals: Record<string, CourseVisual>,
): string | undefined {
  if (index <= 0) return undefined;
  const board = loneBoardOf(sections[index], visuals);
  if (!board) return undefined;
  return loneBoardOf(sections[index - 1], visuals) === board ? board : undefined;
}

/**
 * What is already written on a section's board when it opens.
 *
 * A board normally belongs to one section and starts empty, because the
 * section it belonged to ending takes it down. But a subject too big for one
 * paragraph is told in several that share a single board — the argument with
 * Hegel is three paragraphs and one board — and there the board is a thing
 * that persists: it goes on standing between the paragraphs, with the lines
 * already on it. So the writing of the run of sections immediately before
 * this one that raise the same board comes back up with it.
 *
 * The run is the point. A student who jumps into the middle of that argument
 * meets the board as it stood there, not a board with holes in it; a student
 * who jumps back to its first paragraph meets it as it stood *then*, because
 * nothing after it is carried.
 */
export function carriedBoardPoints(
  sections: CourseSection[],
  index: number,
  visuals: Record<string, CourseVisual>,
): Set<string> {
  const ids = new Set<string>();
  const board = loneBoardOf(sections[index], visuals);
  if (!board) return ids;
  for (let i = index - 1; i >= 0; i--) {
    if (loneBoardOf(sections[i], visuals) !== board) break;
    for (const beat of sections[i].beats) {
      if (beat.boardPoint) ids.add(beat.boardPoint);
    }
  }
  return ids;
}

/**
 * Everything a beat can write onto a board, in one id space: its points, the
 * plates it pins up, and the lines of the quotation it ends on. They share the
 * space because the lesson tracks what has been written as a single set of
 * ids — `boardPoint` names one of these and does not care which kind it is.
 */
export function boardWriting(board: CourseBoardVisual): string[] {
  return [
    ...board.points.map((point) => point.id),
    // Plates that go up with the board, or with a line already written on it,
    // are not written on it themselves; see `withBoard` and `withPoint`.
    ...(board.plates ?? [])
      .filter((plate) => !plate.withBoard && !plate.withPoint)
      .map((plate) => plate.id),
    ...(board.books ?? []).map((book) => book.id),
    ...(board.closing?.lines ?? []).map((line) => line.id),
  ];
}

/**
 * The written line with this id, wherever in the module it was written.
 *
 * Point ids are unique across a module — `courses.test.ts` holds them so — and
 * the student presses a line on a board rather than a line in a section, so
 * the lookup is over the module's visuals rather than over one board.
 */
export function findBoardPoint(
  visuals: Record<string, CourseVisual>,
  pointId: string,
): CourseBoardPoint | undefined {
  for (const visual of Object.values(visuals)) {
    if (visual.kind !== "board") continue;
    const point = visual.points.find((p) => p.id === pointId);
    if (point) return point;
  }
  return undefined;
}

/** The sentences of a point's deep dive, in order; empty if it has none. */
export function deepDiveLines(point: CourseBoardPoint | undefined): string[] {
  return (point?.deepDive ?? []).map((line) => line.text);
}

/** Every spoken line of a module, in order, handoffs included. */
export function moduleLines(module: CourseModule): string[] {
  return module.sections.flatMap(sectionLines);
}

/**
 * Where the student is in a lesson, as the material itself: what they have
 * heard, what is still coming, and what remains after this section.
 *
 * The point of `upcoming` is to stop an interrupting question from being
 * answered with material the lecture is about to deliver — the model can see
 * what it is about to say and defer to it instead of spoiling it.
 */
export interface CoursePosition {
  moduleTitle: string;
  sectionTitle: string;
  /** 1-based, for "section 2 of 3". */
  sectionNumber: number;
  sectionCount: number;
  delivered: string[];
  upcoming: string[];
  remainingSections: string[];
}

export function coursePosition(
  module: CourseModule,
  sectionIndex: number,
  deliveredInSection: number,
): CoursePosition {
  const section = module.sections[sectionIndex];
  const lines = sectionLines(section);
  const heard = Math.min(Math.max(deliveredInSection, 0), lines.length);

  return {
    moduleTitle: module.title,
    sectionTitle: section.title,
    sectionNumber: sectionIndex + 1,
    sectionCount: module.sections.length,
    delivered: [
      ...module.sections.slice(0, sectionIndex).flatMap(sectionLines),
      ...lines.slice(0, heard),
    ],
    upcoming: lines.slice(heard),
    remainingSections: module.sections
      .slice(sectionIndex + 1)
      .map((s) => s.title),
  };
}

/**
 * Rough listening time, for the table of contents. Deliberately a plain
 * words-per-minute estimate rather than a measurement: the real duration
 * depends on the voice, and on how long the student stops to ask things.
 */
export function estimateMinutes(module: CourseModule): number {
  const lines = moduleLines(module);
  const words = lines.reduce(
    (total, line) => total + line.split(/\s+/).length,
    0,
  );
  // Roughly the lecture's own pace: ~140 words a minute at the rate the voice
  // is asked for, plus the beat left between one sentence and the next.
  const seconds = (words / 140) * 60 + lines.length * 0.7;
  return Math.max(1, Math.round(seconds / 60));
}
