"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import BookCover from "@/components/BookCover";
import { isDemoPhilosopherId } from "@/lib/demoRoster";
import type {
  CourseBoardBook,
  CourseBoardColumn,
  CourseBoardFigure,
  CourseBoardPlate,
  CourseBoardPoint,
  CourseBoardVisual,
} from "@/lib/courses";

/**
 * The lecture board.
 *
 * A diagram is finished before it is shown; a board is not. It goes up empty
 * except for its heading, and each point is written on as the sentence that
 * says it is spoken — so the student watches the argument accumulate at the
 * speed it is being made, the way they would watch a teacher fill a whiteboard.
 * Two things carry that: a point only exists once the lecture has reached it,
 * and it arrives letter by letter rather than all at once.
 *
 * The same component renders the finished board in the transcript, with
 * `still` set — no entrance, no typing, everything already written.
 */

/**
 * How much wider the portrait's column is than the diagram-and-books column
 * beside it, on a board that composes the two; see `composedMedia`, which is
 * where the number has to be true and why.
 */
const PORTRAIT_SHARE = 1.5;

export interface CourseBoardProps {
  board: CourseBoardVisual;
  /** Ids of the points the lecture has reached. Order comes from the board. */
  revealed: ReadonlySet<string>;
  accent: string;
  /** Whose lecture this is; written on the covers of books that have no scan. */
  speaker?: string;
  /** Render the finished board with no animation (transcript, reduced motion). */
  still?: boolean;
  /**
   * Ask for the scripted explanation behind one written line. Offered only on
   * the lines that have one — see `deepDive` on `CourseBoardPoint` — and the
   * lesson owns what happens when it is pressed.
   */
  onExplainPoint?: (pointId: string) => void;
  /** Point ids that have an explanation to give. */
  explainable?: ReadonlySet<string>;
  /**
   * Put a card's question to the lecturer, for a card of somebody this
   * deployment does not serve; see `askInstead` on `CourseBoardPlate`.
   */
  onAskAbout?: (question: string) => void;
  /**
   * Who to stand in the pictures' place while none of them are up yet.
   *
   * A board of nothing but portraits opens as a heading over an empty stage,
   * because its first sentence is spoken before its first picture is dealt —
   * and the speaker has just left the stage to make room for it. He stands
   * there until the pictures arrive, so the student is never looking at an
   * empty board wondering who is talking.
   */
  standIn?: ReactNode;
  /**
   * Lay the board out as the finished board from the start, and let the lines
   * appear in the places they will keep.
   *
   * A board writes downward, but it is not always anchored at the top: the
   * writing beside a tall picture is centred against it, so a list that only
   * held the lines spoken so far shifted every one of them upward each time a
   * new one arrived. The student then had to find their place again on a line
   * they had already read. Reserving the whole shape costs an invisible line
   * or two of space and buys stillness, which is what a board is for.
   *
   * Off in the transcript, where the board is finished by definition and a
   * section left half-heard should print the half he gave rather than a
   * finished board with holes in it.
   */
  reserveSpace?: boolean;
  className?: string;
}

/** Milliseconds per character while a point is being written. */
const MS_PER_CHAR = 26;
/** However long a point is, it is on the board within this. */
const MAX_WRITE_MS = 2600;
/** How often the typewriter repaints; characters are added in whole steps. */
const TICK_MS = 40;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** How many characters of `text` have been written by now. */
function useWritten(text: string, instant: boolean): number {
  const [written, setWritten] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setWritten(text.length);
      return;
    }
    setWritten(0);
    const duration = Math.min(MAX_WRITE_MS, text.length * MS_PER_CHAR);
    const step = Math.max(1, Math.ceil(text.length / (duration / TICK_MS)));
    let at = 0;
    const timer = setInterval(() => {
      at = Math.min(text.length, at + step);
      setWritten(at);
      if (at >= text.length) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [instant, text]);

  return written;
}

/**
 * Text as it is being written, with the caret doing the writing.
 *
 * The text is not split across elements — it grows in place — so once it has
 * finished the DOM holds exactly the written text, for assistive technology
 * and for anything else reading the page.
 */
function Written({
  text,
  accent,
  instant,
  steady = false,
  trailing,
}: {
  text: string;
  accent: string;
  instant: boolean;
  /**
   * Keep the box the finished line will need while it is being written.
   *
   * A line that wraps onto two lines is one line tall until the writing
   * reaches the wrap, so a list holding it changed height mid-word and every
   * other line moved — twice, once on the wrap and once back. The finished
   * text is laid out unseen underneath, and the writing runs over the top of
   * it. Off for a quotation, whose lines are meant to flow into one another
   * as prose rather than each hold a box of its own.
   */
  steady?: boolean;
  /**
   * A mark that belongs to the end of the line — the arrow on a link.
   *
   * It is set inside the steady box rather than after it, because the box is a
   * block and anything following a block starts a line of its own: an arrow
   * put after the writing sat under the last word instead of beside it. In
   * here it is ordinary inline content trailing the text, so it follows the
   * final word and is part of the space the finished line reserves.
   */
  trailing?: ReactNode;
}) {
  const written = useWritten(text, instant);

  const typed = (
    <>
      {text.slice(0, written)}
      {written < text.length && (
        // Out of flow, inside a box of no size. An inline-block caret an em
        // tall sits its own bottom on the baseline, which makes the line box
        // taller than the same line without it — so every line under it moved
        // three pixels the moment he started writing, and moved back when he
        // finished. A line that has been written must not move at all.
        <span
          aria-hidden
          className="relative inline-block h-0 w-0 align-baseline"
        >
          <span
            className="board-caret absolute bottom-[-0.15em] left-0.5 h-[1em] w-[2px]"
            style={{ background: accent }}
          />
        </span>
      )}
    </>
  );

  if (!steady) return typed;

  // The finished line is what holds the box, written or not: while the writing
  // is in progress it is laid out unseen and the writing runs over the top of
  // it, and when the writing catches up it simply becomes visible. The only
  // difference between the two states is an absolutely positioned overlay,
  // which takes no part in layout — so nothing on the board moves at any point
  // between a line being blank and that line being finished.
  const done = written >= text.length;
  return (
    <span className="relative block">
      <span aria-hidden={!done} className={done ? undefined : "invisible"}>
        {text}
        {trailing}
      </span>
      {!done && <span className="absolute inset-0">{typed}</span>}
    </span>
  );
}

/** What the hover CTA on an explainable line says, in one place. */
export const EXPLAIN_CTA = "Explain this in more depth";

/**
 * One written line, with whatever it offers: the scripted explanation behind
 * it, or the link it carries, or neither.
 *
 * A top-level line is bulleted; a `sub` line is dashed and indented under the
 * one above it. Two glyphs rather than one, because the only thing the marker
 * has to say is which of the two levels a line is on.
 *
 * A line he has not reached yet is still laid out, and simply not seen; see
 * `reserveSpace`. It holds its place with no marker, no text to read out and
 * nothing to press — the space it takes is the whole of its job.
 */
function BoardPoint({
  id,
  text,
  accent,
  instant,
  href,
  sub = false,
  written: isWritten = true,
  onExplain,
}: {
  id: string;
  text: string;
  accent: string;
  instant: boolean;
  href?: string;
  /** Written under the line above it, dashed and indented. */
  sub?: boolean;
  /** False while the line is only holding its place on the finished board. */
  written?: boolean;
  onExplain?: () => void;
}) {
  // The arrow rides the end of the writing rather than following the box that
  // holds it; see `trailing`. It is only ever on a line that leads somewhere.
  const arrow = href ? (
    <span aria-hidden className="ms-1 whitespace-nowrap" style={{ color: accent }}>
      ↗
    </span>
  ) : undefined;

  const written = (
    <Written
      text={text}
      accent={accent}
      instant={instant}
      steady
      trailing={arrow}
    />
  );

  return (
    <li
      data-board-point={id}
      data-written={isWritten}
      // Hidden rather than absent, so the line below it is already where it
      // will end up: `visibility` keeps the box and takes the ink.
      aria-hidden={isWritten ? undefined : true}
      className={`relative flex gap-2.5 leading-[1.35] text-parchment/90 ${
        isWritten ? "" : "invisible"
      } ${
        sub
          ? "ps-5 text-[clamp(0.85rem,2.2vh,1.15rem)]"
          : "text-[clamp(0.95rem,2.7vh,1.4rem)]"
      }`}
    >
      <span
        aria-hidden
        className="shrink-0 select-none"
        style={{ color: accent }}
      >
        {sub ? "–" : "•"}
      </span>
      {!isWritten ? (
        // No `Written`: the typewriter must not run while the line cannot be
        // seen, or it would have finished writing by the time he says it.
        // Swapping this for one of the branches below on the beat that reaches
        // the line is what starts it — and the box is nested exactly as
        // `steady` nests it, so that swap changes nothing about the layout.
        <span className="min-w-0">
          <span className="relative block">
            <span aria-hidden className="invisible">
              {text}
              {arrow}
            </span>
          </span>
        </span>
      ) : onExplain && !href ? (
        // A note of two words, and the offer to open it out. Left-aligned and
        // underlined only on hover: it has to read as a line he wrote, not as
        // a button parked on the board. The CTA is positioned off the row
        // rather than set inside it, because a board is written to the edge of
        // its column and a label that took part in the layout would reflow the
        // writing every time a cursor crossed it.
        <button
          type="button"
          onClick={onExplain}
          className="group min-w-0 text-left transition hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: accent }}
        >
          <span className="underline decoration-dotted underline-offset-4 decoration-transparent transition group-hover:decoration-inherit">
            {written}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-full z-20 mt-1 translate-y-1 whitespace-nowrap rounded-md border border-ink-700 bg-ink-950/95 px-2 py-1 text-[10px] font-normal tracking-wide text-parchment/90 opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
          >
            {EXPLAIN_CTA}
          </span>
          <span className="sr-only"> — {EXPLAIN_CTA}</span>
        </button>
      ) : href ? (
        // A new tab on purpose: the lesson keeps no place of its own, so
        // following a link in this one would cost the student the lecture.
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 underline decoration-dotted underline-offset-4 transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ textDecorationColor: accent, outlineColor: accent }}
        >
          {written}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <span className="min-w-0">{written}</span>
      )}
    </li>
  );
}

/**
 * Whether a thing that arrives mid-lecture has finished sliding in.
 *
 * `show` is for the things that are laid out before they arrive — a book
 * holding its slot on the shelf; see `BoardBook`. They cannot start their
 * entrance on mount, because they were mounted long before he named them, so
 * it starts on the beat that turns `show` on instead.
 */
function useEntered(instant: boolean, show = true): boolean {
  const [entered, setEntered] = useState(instant && show);

  useEffect(() => {
    if (!show) {
      setEntered(false);
      return;
    }
    if (instant) {
      setEntered(true);
      return;
    }
    const timer = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(timer);
  }, [instant, show]);

  return entered;
}

/**
 * A picture pinned up mid-section.
 *
 * It is sized off the window rather than in pixels, like everything else on a
 * board: two pictures and a quotation have to share one viewport, and a fixed
 * height is what pushes a short screen into scrolling.
 */
function BoardPlate({
  plate,
  accent,
  instant,
  tall = false,
  band = false,
  className = "",
}: {
  plate: CourseBoardPlate;
  accent: string;
  instant: boolean;
  /**
   * True when the picture is standing beside the writing rather than over it,
   * and so has the whole height of the board to work with. A map is only as
   * readable as the space it is given, and half a board is not enough space.
   */
  tall?: boolean;
  /**
   * The picture is set into a band it shares with the column beside it; see
   * `composedMedia`. It takes the whole width of its column at its own ratio,
   * so its top and bottom edges are the band's rather than wherever fitting a
   * picture into a taller box happened to leave them.
   */
  band?: boolean;
  className?: string;
}) {
  const entered = useEntered(instant);
  /**
   * A picture wider than it is high, standing beside the writing.
   *
   * A portrait beside the writing is bounded by the height of the board and
   * asks for whatever width that leaves it. A diagram is the other way round:
   * it is bounded by the width, and the height follows. Sized like a portrait
   * it kept the full height of the board while its width was cut to fit, and
   * the frame stood off the picture at the top and bottom — the letterbox
   * `object-contain` leaves when a box is the wrong shape for what is in it.
   */
  const wide = tall && !band && plate.width > plate.height;

  return (
    <figure
      className={`flex min-h-0 min-w-0 flex-col items-center transition-all duration-700 ease-out ${
        // In a band the picture is the width of its column and takes its
        // height from that, so it neither grows into spare room nor gives any
        // back: the whole point of the band is that its edges are fixed.
        //
        // Beside the writing on a wide stage the picture is as wide as it is
        // tall enough to be, and no wider — but it gives that width back when
        // the board runs out of room. A diagram instead takes the width the
        // row can spare it, which is what bounds it. Stacked above the writing
        // — on a phone, or on a board that stacks by design — it shares the
        // row evenly. A diagram stands to its own height in the middle of the
        // row rather than being stretched down it, so its caption sits under
        // the picture instead of at the foot of an empty column.
        band
          ? "w-full shrink-0"
          : tall && !wide
            ? "flex-1 sm:flex-[0_1_auto]"
            : "flex-1"
      } ${wide ? "sm:self-center" : ""} ${className}`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(0.75rem)",
      }}
    >
      {/* The picture takes the height the row can spare, and the quotation
          below it takes what it needs: on a phone the two cannot both have
          what they would like, and it is the quotation that must be legible.

          Standing beside the writing it is also the thing that decides how
          wide this column is, and a picture cannot do that on its own: its
          height there is a share of the row, and a share is not a length a
          browser can work an aspect ratio back from, so the column fell back
          to the picture's own pixel width and stood a third wider than the
          picture in it — which is what pushed a single portrait off the
          middle of the board. The box is given the picture's ratio outright
          there, so the height it is allowed decides the width it asks for.
          The picture inside is then fitted to that box rather than made to
          fill it, so that when the board runs out of width first — two
          portraits on one board, or a board reprinted in the transcript's
          narrower column — it is the picture that shrinks and not the frame
          that stands off it. */}
      <div
        className={`flex min-h-0 items-center justify-center ${
          band || wide
            ? "w-full"
            : tall
              ? "w-auto max-w-full flex-1"
              : "w-full flex-1"
        }`}
        // The frame carries the ratio as well as the picture does, so the
        // column is the right width from the first frame. Left to the picture
        // alone the width came from what the browser had actually downloaded,
        // which is nothing at all until it arrives — so the column opened at
        // no width, and the board assembled itself sideways as each picture
        // landed. A diagram takes its width from the row instead, and needs no
        // ratio here: it is the height that follows.
        style={
          band || (tall && !wide)
            ? { aspectRatio: `${plate.width} / ${plate.height}` }
            : undefined
        }
      >
        <Image
          src={plate.src}
          alt={plate.alt}
          width={plate.width}
          height={plate.height}
          sizes={tall ? "(max-width: 640px) 90vw, 40vw" : "(max-width: 768px) 45vw, 320px"}
          className={`rounded-lg border object-contain ${
            band
              ? // The frame above already carries the picture's own ratio, so
                // filling it and fitting into it are the same thing — and
                // filling it is what puts the picture's edges on the band's.
                "h-full w-full"
              : wide
                ? // Fitted to the box rather than filling it, so the frame is
                  // always against the picture rather than standing off it —
                  // the letterbox `object-contain` leaves when a box is the
                  // wrong shape for what is in it. It takes the width the row
                  // gives it and the height follows, up to a share of the
                  // window: a diagram is drawn far wider than a board ever
                  // draws it, so there is nothing to lose by never enlarging
                  // it and a tall window must not push it off the stage.
                  "h-auto w-auto max-w-full max-h-[clamp(6rem,52vh,26rem)]"
                : tall
                  ? // Fitted to the box the ratio above reserved for it; see
                    // the note there.
                    "h-auto max-h-full w-auto max-w-full"
                  : "h-full w-auto max-w-full max-h-[clamp(4rem,36vh,19rem)]"
          }`}
          style={{ borderColor: `${accent}55` }}
        />
      </div>
      {plate.caption && (
        <figcaption
          className="mt-1.5 shrink-0 text-center text-[10px] leading-tight text-muted"
          // The caption is set to the width of the picture above it and takes
          // no part in deciding that width. A line of credit is longer than
          // most pictures are wide, and left to speak for itself it would
          // widen the whole column and push the picture off centre.
          style={
            band || (tall && !wide) ? { width: 0, minWidth: "100%" } : undefined
          }
        >
          {plate.caption}
          {plate.credit && (
            <span className="mt-0.5 block text-[9px] leading-tight text-muted/70">
              {plate.credit}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * One card in a lapped hand.
 *
 * The point of the arrangement is that the four read as a group: each card
 * slides under the one before it, tilted a little off square, with its name
 * set on the card itself rather than beneath it — four captions in a row
 * under overlapping cards would be four labels nothing could line up with.
 */
function BoardCard({
  plate,
  accent,
  instant,
  index,
  lapped,
  href,
  onAsk,
}: {
  plate: CourseBoardPlate;
  accent: string;
  instant: boolean;
  index: number;
  /** True while a later card covers this one's right-hand edge. */
  lapped: boolean;
  /** Where the card leads, once the board has decided it leads anywhere. */
  href?: string;
  /**
   * Put this card's question to the lecturer, for a card of somebody the app
   * cannot serve. Absent where the lesson has no way to ask — the transcript's
   * copy of the board, which is a record rather than a place to press.
   */
  onAsk?: () => void;
}) {
  const entered = useEntered(instant);
  // Whether this card is the one being looked at. A lapped hand is dealt left
  // to right, so every card after this one covers it — and the card under a
  // cursor has to come out from under them to be seen whole. Held in state
  // rather than left to `:hover`, because the stacking order is written into
  // the card's own style and a class cannot outrank it.
  const [raised, setRaised] = useState(false);
  // Dealt by hand, not by machine: a fixed cycle of small angles, so the same
  // card is always at the same tilt and the group never looks generated.
  const tilt = [-3.5, 2.5, -2, 3][index % 4];
  const settled = `rotate(${tilt}deg)`;
  const pressable = !!(href || onAsk);
  const lift = pressable && raised;

  const face = (
    <div
      className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border shadow-[0_12px_30px_rgba(0,0,0,0.55)] transition duration-200"
      style={{
        borderColor: lift ? accent : `${accent}66`,
        background: "#131317",
      }}
    >
      <Image
        src={plate.src}
        alt={plate.alt}
        width={plate.width}
        height={plate.height}
        sizes="(max-width: 768px) 30vw, 200px"
        className="h-full w-full object-cover object-top"
      />
      {plate.caption && (
        <figcaption
          // Set from the card's own width, not the window's: the name has to
          // fit the strip of card that is still showing.
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-1 pb-1 pt-4 text-center font-serif text-[clamp(0.5rem,calc(var(--course-card)*0.125),0.8rem)] leading-tight text-parchment"
          // Centred on what can actually be seen of the card, not on the
          // card: the strip under the next one is not somewhere a name can
          // be read — unless the card has been raised out from under it, in
          // which case the whole card is showing and the name belongs to the
          // middle of it.
          style={{ paddingRight: lapped && !lift ? "32%" : undefined }}
        >
          {plate.caption}
        </figcaption>
      )}
    </div>
  );

  const press = "block w-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

  return (
    <figure
      className={`relative shrink-0 transition-all ease-out ${
        // The entrance is a deal, and takes a deal's time. Once the card has
        // landed the same transition is what answers a cursor, and there it
        // has to be quick or the card looks reluctant.
        entered ? "duration-200" : "duration-700"
      }`}
      onMouseEnter={() => setRaised(true)}
      onMouseLeave={() => setRaised(false)}
      onFocus={() => setRaised(true)}
      onBlur={() => setRaised(false)}
      style={{
        width: "var(--course-card)",
        marginLeft: index === 0 ? 0 : "calc(var(--course-card) * -0.3)",
        zIndex: lift ? 40 : index + 1,
        opacity: entered ? 1 : 0,
        transform: entered
          ? lift
            ? `${settled} translateY(-0.5rem) scale(1.05)`
            : settled
          : `${settled} translateY(1rem) scale(0.94)`,
      }}
    >
      {href ? (
        // A new tab, like every other link on a board: following it in this
        // one would cost the student the lecture they are standing in.
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={press}
          style={{ outlineColor: accent }}
        >
          {face}
          {/* The name is on the card and in its alt text, so what is left to
              say is where pressing it goes. */}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : onAsk ? (
        // He is not on the roster, so there is no page to send anyone to. The
        // question goes to the lecturer instead, and is answered here.
        <button
          type="button"
          onClick={onAsk}
          className={`${press} text-left`}
          style={{ outlineColor: accent }}
        >
          {face}
          <span className="sr-only"> — ask about this influence</span>
        </button>
      ) : (
        face
      )}
    </figure>
  );
}

/**
 * A face pinned to the board.
 *
 * It slides in on its own mount rather than on the board's, because the two
 * are not always the same moment: a column held back until its first point is
 * written arrives long after the board did, and it should arrive whole —
 * heading, portrait and first line together.
 */
function BoardFigure({
  figure,
  accent,
  instant,
  enterFrom = "left",
  className = "",
}: {
  figure: CourseBoardFigure;
  accent: string;
  instant: boolean;
  /** Which side it slides in from; normally the side it ends up on. */
  enterFrom?: "left" | "right";
  className?: string;
}) {
  const entered = useEntered(instant);

  return (
    <figure
      className={`flex shrink-0 flex-col items-center transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered
          ? "none"
          : `translateX(${enterFrom === "left" ? "-" : ""}1.25rem)`,
      }}
    >
      <div
        className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border"
        style={{ borderColor: `${accent}66` }}
      >
        <Image
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          sizes="128px"
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption className="mt-1.5 shrink-0 text-center leading-tight">
        <span className="block font-serif text-[clamp(0.75rem,1.9vh,0.875rem)] text-parchment">
          {figure.label}
        </span>
        {figure.sublabel && (
          <span className="block text-[10px] text-muted">{figure.sublabel}</span>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * One book on the shelf: its cover, its name, the name it was published under,
 * and — where the app has something to open it against — a link to reading it
 * with him.
 *
 * The label is the whole of what the shelf says about a book, so the pseudonym
 * belongs in it rather than only in the talk: a shelf of pseudonymous books
 * where every cover is captioned with the author's real name would misdescribe
 * the thing it is showing.
 */
function BoardBook({
  book,
  accent,
  author,
  instant,
  standing = true,
  labelBelow = false,
  className = "w-[clamp(2.75rem,min(13vh,20vw),7rem)] shrink-0",
}: {
  book: CourseBoardBook;
  accent: string;
  author: string;
  instant: boolean;
  /**
   * False while the book is only holding its place in the row; see the shelf
   * in `CourseBoard`. It is laid out and not seen, exactly as an unwritten
   * point is, so the books already up do not move when the next one arrives.
   */
  standing?: boolean;
  /**
   * Hang the name out of the flow, under the cover, so the book measures as
   * the cover alone. A shelf standing on the floor of a shared band is level
   * with the picture beside it only if the thing standing on that floor is the
   * cover — a name in the flow puts two lines of type between the two and the
   * covers finish short of it; see `composedMedia`.
   */
  labelBelow?: boolean;
  /** How wide the slot is; a shelf that shares out the board sets its own. */
  className?: string;
}) {
  const entered = useEntered(instant, standing);

  const label = (
    <>
      <span className="mt-1.5 block break-words text-center font-serif text-[clamp(0.6rem,min(1.9vh,2.4vw),0.95rem)] leading-tight text-parchment">
        {book.title}
      </span>
      {book.pseudonym && (
        <span
          className="mt-0.5 block break-words text-center font-serif text-[clamp(0.5rem,min(1.5vh,2vw),0.8rem)] italic leading-tight"
          style={{ color: accent }}
        >
          {book.pseudonym}
        </span>
      )}
      {book.year && (
        <span className="block text-center text-[10px] leading-tight text-muted">
          {book.year}
        </span>
      )}
    </>
  );

  const cover = (
    <>
      <BookCover
        title={book.title}
        author={book.pseudonym ?? author}
        accent={accent}
        year={book.year}
      />
      {labelBelow ? (
        <span className="absolute inset-x-0 top-full block">{label}</span>
      ) : (
        label
      )}
    </>
  );

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        labelBelow ? "relative" : ""
      } ${className} ${
        // Hidden rather than absent, like an unwritten line: `visibility`
        // keeps the slot, takes the ink, and takes the link out of the tab
        // order with it.
        standing ? "" : "invisible"
      }`}
      aria-hidden={standing ? undefined : true}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(0.75rem)",
      }}
    >
      {!standing ? null : book.href ? (
        // A new tab, for the same reason the linked points open one: the
        // lecture cannot be paused by leaving the page.
        <a
          href={book.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-sm transition duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ outlineColor: accent }}
          tabIndex={standing ? undefined : -1}
        >
          {cover}
          <span className="sr-only"> — read this work with him (opens in a new tab)</span>
        </a>
      ) : (
        <div>{cover}</div>
      )}
    </div>
  );
}

export default function CourseBoard({
  board,
  revealed,
  accent,
  speaker = "",
  still = false,
  onExplainPoint,
  explainable,
  onAskAbout,
  standIn,
  reserveSpace = false,
  className = "",
}: CourseBoardProps) {
  /** The handler for one line, or nothing if that line has no explanation. */
  const explainer = (pointId: string) =>
    onExplainPoint && explainable?.has(pointId)
      ? () => onExplainPoint(pointId)
      : undefined;

  // Read once on mount: the reduced-motion preference decides how this board
  // behaves for its whole life, and re-reading it mid-write would restart the
  // typewriter it is meant to suppress.
  const [reduced] = useState(prefersReducedMotion);
  const instant = still || reduced;

  /** Written up by now — as opposed to merely holding its place. */
  const isWritten = (point: CourseBoardPoint) => revealed.has(point.id);
  const points = reserveSpace
    ? board.points
    : board.points.filter(isWritten);
  // A plate arrives with the board, with a line already written on it, or on a
  // beat of its own — and the last two are the same question of the same set.
  const plates = (board.plates ?? []).filter(
    (plate) => plate.withBoard || revealed.has(plate.withPoint ?? plate.id),
  );
  const books = (board.books ?? []).filter((book) => revealed.has(book.id));
  const columns = board.columns ?? [];
  // A half of the board held back until it is written on arrives when a line
  // is actually written there — a line still holding its place does not bring
  // its column up early.
  const columnIsWritten = (column: CourseBoardColumn) =>
    !board.revealColumnsAsWritten ||
    board.points.some(
      (point) => point.column === column.id && isWritten(point),
    );
  /**
   * A held-back half still takes up its space on a board laid out as the
   * finished board; see `reserveSpace`. Dropping it from the layout entirely
   * left the first half centred in the whole board and then walking upward as
   * the second arrived — every line the student had already read moving out
   * from under them. So on stage the half is laid out and simply not seen, and
   * only the transcript, which prints what was actually delivered, leaves it
   * out.
   */
  const visibleColumns =
    board.revealColumnsAsWritten && !reserveSpace
      ? columns.filter(columnIsWritten)
      : columns;
  const stackedColumns = board.columnLayout === "stacked";
  const ungroupedPoints = points.filter((point) => !point.column);

  /**
   * The quotation, as far as it has been spoken. Its opening mark goes on with
   * the first line and its closing mark with the last, so a half-written
   * quotation reads as one still being written rather than as a whole one.
   */
  const closingLines = (board.closing?.lines ?? []).filter((line) =>
    revealed.has(line.id),
  );
  const closingComplete =
    closingLines.length === (board.closing?.lines.length ?? 0);

  /**
   * The board has pictures coming and none of them yet. It is the only moment
   * the stage holds nothing but a heading, and it is where the speaker stands;
   * see `standIn`. He leaves as the first picture arrives, which is the point
   * at which the board has something of its own to show.
   */
  const standingIn = !!standIn && (board.plates ?? []).length > 0 &&
    plates.length === 0;

  /**
   * Nothing is written on this board: it is pictures and a quotation.
   *
   * While he is standing in, nothing is written on it yet either — and the
   * space the writing will need is not held. It is held everywhere else so
   * that a line already written never moves; here there is no such line, and
   * reserving it would push him off the middle of the stage he was standing in
   * the middle of a moment ago. The board is meant to go up around him, not
   * to move him.
   */
  const hasWriting =
    !standingIn &&
    (columns.length > 0 || board.points.length > 0 || !!board.figure);

  /**
   * A board that is mostly picture stands its picture beside the writing.
   * Only on a stage wide enough to divide: below that the two go back to a
   * stack, which is the only shape a phone has room for.
   */
  const beside =
    board.mediaLayout === "beside" &&
    plates.length > 0 &&
    board.plateLayout !== "overlap";
  const booksPlate = beside
    ? plates.find((plate) => plate.id === board.booksUnderPlate)
    : undefined;
  const rowPlates = booksPlate
    ? plates.filter((plate) => plate.id !== booksPlate.id)
    : plates;

  /**
   * A card is a door out only if the app can serve the person on it. The
   * roster is a fact about the deployment rather than about the lecture — a
   * philosopher named here may not be released — so it is settled at render
   * time, and a card that cannot be a door becomes a question instead.
   */
  const cardHref = (plate: CourseBoardPlate) =>
    plate.href &&
    (!plate.philosopherId || isDemoPhilosopherId(plate.philosopherId))
      ? plate.href
      : undefined;

  const plateRow = standingIn ? (
    // He takes the whole of the board rather than the strip the pictures will
    // use, so he is standing where he was standing before the board went up.
    <div
      data-board-standin=""
      className="flex min-h-0 flex-1 items-center justify-center"
    >
      {standIn}
    </div>
  ) : (
    rowPlates.length > 0 &&
    (board.plateLayout === "overlap" ? (
      <div
        className="mt-2 flex shrink-0 items-center justify-center"
        // One card width for the whole hand, off the smaller of the two
        // dimensions, with the lap set as a fraction of it — so the group
        // keeps its shape from a phone to a lecture hall.
        style={
          {
            "--course-card": "clamp(3.5rem, min(20vh, 19.5vw), 11rem)",
          } as CSSProperties
        }
      >
        {rowPlates.map((plate, dealt) => (
          <BoardCard
            key={plate.id}
            plate={plate}
            accent={accent}
            instant={instant}
            // Position in the declared hand, not in what has been dealt so
            // far: a card's tilt and the card it laps must not change when
            // the next one arrives.
            index={(board.plates ?? []).indexOf(plate)}
            lapped={dealt < rowPlates.length - 1}
            href={cardHref(plate)}
            onAsk={
              !cardHref(plate) && plate.askInstead && onAskAbout
                ? () => onAskAbout(plate.askInstead!)
                : undefined
            }
          />
        ))}
      </div>
    ) : (
      <div
        className={`flex min-h-0 flex-1 items-stretch justify-center gap-3 overflow-hidden sm:gap-5 ${
          // Beside the writing the pictures take only the width they need,
          // up to most of the board: two tall pictures asking for everything
          // would otherwise leave the writing a column an inch wide.
          beside ? "mt-2 sm:mt-0 sm:flex-[0_1_auto] sm:max-w-[62%]" : "mt-2"
        }`}
      >
        {rowPlates.map((plate) => (
          <BoardPlate
            key={plate.id}
            plate={plate}
            accent={accent}
            instant={instant}
            tall={beside}
          />
        ))}
      </div>
    ))
  );

  /**
   * The books, stood up as they are named.
   *
   * Beside the writing they stand with the picture rather than under the
   * board: a board about a man, with the book his argument with that man
   * became, reads as one thing — the shelf next to the face — and a row of
   * covers stranded below the writing did not.
   *
   * On a board of its own the shelf is the board, so it is shared out across
   * the whole width in equal slots rather than being a huddle of small covers
   * in the middle of a lot of empty stage. Every declared book takes its slot
   * from the moment the shelf goes up, whether or not he has reached it — a
   * row that grew a column per book would have resized and re-centred every
   * cover already standing each time a new one arrived, and the reading order
   * of a shelf is the argument here. The slots are as large as the board can
   * give them, capped so that a tall narrow window cannot push the row off the
   * bottom of the stage: a cover is two by three, so the width a slot may take
   * is the height it is allowed divided by one and a half.
   *
   * The empty slots are held for the same reason the unwritten lines are, and
   * so on the same terms; see `reserveSpace`. The transcript keeps none of
   * them: a section left half-heard should print the books he actually took
   * down, not a shelf with gaps in it.
   *
   * The shelf does not scroll on its own. It sized itself to the stage, so a
   * scroller of its own only ever caught the wheel over the covers and moved
   * the row a few pixels instead of letting the page scroll up into the
   * transcript — the one thing scrolling on a lecture is for. The row is
   * bounded by the stage instead: the slot cap keeps a cover inside 48vh, and
   * anything past the stage is clipped by the board, as with everything else
   * on it.
   */
  const shelved = reserveSpace ? board.books ?? [] : books;
  const bookShelf = books.length > 0 && !booksPlate && (
    <div
      className={
        beside
          ? "flex shrink-0 flex-row items-center justify-center gap-2.5 sm:flex-col sm:gap-3"
          : "mx-auto mt-3 grid min-h-0 w-full shrink items-start"
      }
      style={
        beside
          ? undefined
          : ({
              "--book-gap": "clamp(0.4rem, 1.6vw, 1.25rem)",
              "--book-height": "clamp(5rem, 48vh, 22rem)",
              gap: "var(--book-gap)",
              gridTemplateColumns: `repeat(${shelved.length}, minmax(0, 1fr))`,
              maxWidth: `calc(${shelved.length} * (var(--book-height) / 1.5) + ${
                shelved.length - 1
              } * var(--book-gap))`,
            } as CSSProperties)
      }
    >
      {(beside ? books : shelved).map((book) => (
        <BoardBook
          key={book.id}
          book={book}
          accent={accent}
          author={speaker}
          instant={instant}
          standing={revealed.has(book.id)}
          className={beside ? undefined : "w-full min-w-0"}
        />
      ))}
    </div>
  );

  /**
   * One balanced media pair: the portrait in the first column, and in the
   * second the diagram with the books it belongs to standing under it.
   *
   * The three pictures are squared off against a single band — the top of the
   * diagram on the top of the portrait, the feet of the covers on the foot of
   * it, the outer edges of the two covers on the outer edges of the diagram —
   * because three pictures set to one rectangle read as one plate, and a
   * portrait floating in the middle of a column beside them reads as a
   * mistake.
   *
   * Nothing here measures its neighbour, because CSS cannot: the alignment is
   * arithmetic instead. The columns are held in a fixed proportion, so the
   * portrait's width, and with it the height it stands to at its own ratio,
   * are both known multiples of the second column's width — which is what the
   * band is given as a ratio of its own. Everything in the second column is
   * then width-driven and lands inside a height that is already the
   * portrait's: the diagram at the top, the covers on the floor, and whatever
   * is left over as the gap between them.
   *
   * `PORTRAIT_SHARE` is what has to be true for that gap to exist at all. The
   * second column's pictures come to about 1.31 of its width — a 16:9 diagram
   * over a pair of 2:3 covers — and the caption under the diagram is a line of
   * type on top of that, so a share much below 1.4 leaves the band shorter
   * than the things standing in it.
   */
  const booksUnderPlate = reserveSpace ? board.books ?? [] : books;
  const bandPlate = rowPlates[0];
  const composedMedia = booksPlate && bandPlate && (
    <div
      data-board-media-composition=""
      // The width is capped against the window's height as well as the
      // board's width: the band is a share of this box's width and there is
      // no way back from a band too tall for the stage, so a short window has
      // to be answered before it is laid out rather than clipped afterwards.
      // The two columns hold at every width. Stacking them is what the rest of
      // the board does on a phone, but here it would put a portrait as wide as
      // the screen above a diagram above a shelf, which is three screens of
      // pictures — and the band, being a share of the width, simply gets
      // smaller instead.
      className="mt-2 grid min-h-0 min-w-0 flex-1 items-start gap-3 overflow-hidden [grid-template-columns:var(--board-media-columns)] sm:mt-0 sm:h-full sm:max-w-[min(62%,52rem,76vh)] sm:flex-[0_1_52rem] sm:gap-5"
      style={
        {
          "--board-media-columns": `${PORTRAIT_SHARE}fr 1fr`,
        } as CSSProperties
      }
    >
      <div
        data-board-media-panel="portrait"
        className="flex min-h-0 min-w-0 justify-center"
      >
        <BoardPlate
          plate={bandPlate}
          accent={accent}
          instant={instant}
          band
        />
      </div>
      <div
        data-board-media-stack=""
        data-board-media-panel="diagram-and-books"
        // The names hang out of the band rather than standing in it; see
        // `labelBelow`. Out of the flow they measure as nothing, so the column
        // holds the room for them here — two lines of the title, the year, and
        // the space above them, set in the clamp the title itself is set in so
        // that the reserve tracks the type it is reserving for. The board
        // clips what overflows it, and a book whose name is cut in half is
        // worse than a board that is a little short.
        className="flex min-h-0 min-w-0 flex-col pb-[calc(3.2*clamp(0.6rem,min(1.9vh,2.4vw),0.95rem)+1.2rem)]"
      >
        <div
          data-board-media-band=""
          // Height from width, at the ratio that makes it the portrait's; see
          // above. `min-h-0` because a flex item is otherwise floored at the
          // height of what is in it, and the band's whole job is to be the
          // portrait's height and not its contents'.
          className="relative flex min-h-0 w-full flex-col [aspect-ratio:var(--board-band)]"
          style={{
            "--board-band": `${bandPlate.width} / ${
              PORTRAIT_SHARE * bandPlate.height
            }`,
          } as CSSProperties}
        >
          <BoardPlate
            plate={booksPlate}
            accent={accent}
            instant={instant}
            band
          />
          {books.length > 0 && (
            <div
              data-board-book-row=""
              // Each cover fills its half of the row, so the pair spans
              // exactly what the diagram above them spans, and the row stands
              // on the floor of the band rather than on whatever the diagram
              // and its caption left over — a caption that wraps onto a second
              // line must move the gap above the shelf, not the shelf. Their
              // names hang below the row, out of the flow, so the row itself
              // is the covers and its foot is the foot of the band.
              className="absolute inset-x-0 bottom-0 grid w-full grid-cols-2 items-end gap-2 sm:gap-3"
            >
              {booksUnderPlate.map((book) => (
                <BoardBook
                  key={book.id}
                  book={book}
                  accent={accent}
                  author={speaker}
                  instant={instant}
                  standing={revealed.has(book.id)}
                  labelBelow
                  className="w-full min-w-0"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /** One written line, in the single shape every list of them uses. */
  const line = (point: CourseBoardPoint) => (
    <BoardPoint
      key={point.id}
      id={point.id}
      written={isWritten(point)}
      text={point.text}
      accent={accent}
      instant={instant}
      href={point.href}
      sub={point.sub}
      onExplain={explainer(point.id)}
    />
  );

  /**
   * The writing: the lines in the columns they were declared in, or a plain
   * list where the board declares none.
   *
   * It is the same writing wherever it stands. A board with a picture beside it
   * puts this in the column left over; a board without one gives it the width
   * of the stage. What it must not do is change shape between the two — a
   * comparison is still a comparison next to a portrait, and a board that
   * quietly flattened its two halves into one list when a picture arrived
   * would be saying something the lecture is not.
   */
  const writing =
    columns.length > 0 ? (
      <>
        {ungroupedPoints.length > 0 && (
          // Two abreast where the board is wide, one where it is the strip
          // beside a picture: two columns of an inch each are not two columns.
          <ul
            className={`mb-2 grid grid-cols-1 gap-1 ${
              beside ? "" : "sm:grid-cols-2 sm:gap-x-4"
            }`}
          >
            {ungroupedPoints.map(line)}
          </ul>
        )}
        <div
          data-board-layout={stackedColumns ? "stacked" : "side-by-side"}
          className="grid min-h-0 gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: stackedColumns
              ? "minmax(0, 1fr)"
              : `repeat(${visibleColumns.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleColumns.map((column, i) => (
            <section
              key={column.id}
              data-board-section={column.id}
              data-written={columnIsWritten(column)}
              // Held back but laid out: `visibility` takes the heading, the
              // rule and the face along with it, and leaves the box. The lines
              // inside are holding their own places already.
              aria-hidden={columnIsWritten(column) ? undefined : true}
              // Divided by a single rule rather than boxed. A teacher splitting
              // a board draws one line down it; two panels with rounded corners
              // are a slide deck's idea of the same thing. The rule is only
              // ever between columns, so the first has none.
              className={`flex min-w-0 gap-3 sm:gap-4 ${
                columnIsWritten(column) ? "" : "invisible"
              } ${
                i === 0
                  ? ""
                  : stackedColumns
                    ? "border-t border-ink-800/70 pt-2 sm:pt-2.5"
                    : "border-l border-ink-800/70 pl-2 sm:pl-3"
              }`}
            >
              <div className="min-w-0 flex-1">
                <h5
                  className={`font-serif text-[clamp(0.9rem,2.1vh,1.1rem)] ${
                    stackedColumns ? "text-left" : "text-center"
                  }`}
                  style={{ color: accent }}
                >
                  {column.heading}
                </h5>
                <ul className="mt-2 space-y-2">
                  {points
                    .filter((point) => point.column === column.id)
                    .map(line)}
                </ul>
              </div>
              {column.figure && (
                // Pinned on the right of the half it belongs to, so the two
                // faces sit down the same edge of a stacked board and read as a
                // pair rather than as two unrelated pictures.
                <BoardFigure
                  figure={column.figure}
                  accent={accent}
                  instant={instant}
                  enterFrom="right"
                  // Sized off the window, like the writing beside it: two faces
                  // on a stacked board are the tallest thing on it, and a fixed
                  // size is what pushes a short screen into scrolling. Wide
                  // enough to hold the longest name it has to caption, since
                  // the board no longer has a panel to spill that name into.
                  className="w-[clamp(3.5rem,11vh,6.5rem)] self-start"
                />
              )}
            </section>
          ))}
        </div>
      </>
    ) : (
      <ul
        className={`min-w-0 ${beside ? "w-full space-y-2" : "flex-1 space-y-1.5"}`}
      >
        {points.map(line)}
      </ul>
    );

  return (
    // No frame, no panel, no border. A board is the surface he writes on, not
    // a card sitting on the stage — the heading, the pictures and the writing
    // are the whole of it, and a box drawn around them made the lecture look
    // like a slide.
    <section
      aria-label={board.heading}
      // Standing in, the board takes the whole stage rather than the height of
      // what is on it: the heading goes up at the top and he keeps the middle,
      // which is exactly where he was before the board arrived.
      className={`flex max-h-full w-full flex-col overflow-hidden ${
        standingIn ? "h-full" : ""
      } ${className}`}
    >
      <header className="shrink-0">
        <h4
          className="text-xs uppercase tracking-[0.25em]"
          style={{ color: accent }}
        >
          {board.heading}
        </h4>
        {board.quote && (
          // Centred across the top rather than ruled off down the left. It is
          // the thesis the whole board is about — both halves of a comparison
          // answer to it — and a line pinned to the left margin read as a note
          // belonging to whatever was under it on that side.
          <blockquote className="mx-auto mt-1.5 max-w-[46ch] text-center">
            <p className="font-serif text-[clamp(1rem,2.3vh,1.3rem)] leading-snug text-parchment">
              “{board.quote.text}”
            </p>
            {board.quote.cite && (
              <cite className="mt-0.5 block text-[10px] not-italic text-muted">
                {board.quote.cite}
              </cite>
            )}
          </blockquote>
        )}
      </header>

      {board.diagram && (
        <figure className="mt-1.5 flex min-h-0 shrink justify-center overflow-hidden">
          <Image
            src={board.diagram.src}
            alt={board.diagram.alt}
            width={board.diagram.width}
            height={board.diagram.height}
            sizes="(max-width: 768px) 70vw, 480px"
            className="h-auto max-h-[clamp(4.5rem,16vh,8rem)] w-auto max-w-full rounded-lg object-contain"
          />
          <figcaption className="sr-only">{board.diagram.caption}</figcaption>
        </figure>
      )}

      {beside ? (
        // Picture and writing stand next to each other and are centred on the
        // board as one thing, rather than each being centred in a half of it —
        // a single portrait in a half-board sat left of centre with the
        // writing stranded off to the right, and the board read as crooked.
        // The writing sits centred against the height of the picture rather
        // than starting at the top of it, too: two or three short headings
        // against a tall portrait read as a caption to it, not as a column
        // that ran out.
        <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-2 sm:flex-row sm:items-stretch sm:justify-center sm:gap-5">
          {composedMedia ?? (
            <>
              {plateRow}
              {bookShelf}
            </>
          )}
          {hasWriting && (
            // Wider where the writing is divided: a column and a half of
            // headings needs more room than a list of four short notes, and
            // the picture beside it gives that room back rather than taking it.
            <div
              className={`flex min-w-0 flex-1 flex-col justify-center overflow-y-auto overflow-x-hidden sm:flex-[0_1_auto] sm:min-w-[11rem] ${
                columns.length > 0 ? "sm:max-w-[28rem]" : "sm:max-w-[24rem]"
              }`}
            >
              {writing}
            </div>
          )}
        </div>
      ) : (
        <>
          {plateRow}

          {bookShelf}

          {!hasWriting ? null : columns.length > 0 ? (
            // Scrolls rather than clips: on a short window the last line
            // written is the one being spoken, and it must not be lost.
            <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {writing}
            </div>
          ) : (
            <div className="mt-2.5 flex min-h-0 flex-1 gap-3 sm:gap-5">
              {board.figure && (
                <BoardFigure
                  figure={board.figure}
                  accent={accent}
                  instant={instant}
                  className="w-16 sm:w-20"
                />
              )}

              {writing}
            </div>
          )}
        </>
      )}

      {/* The line the board arrives at, under everything else and larger than
          it. It is written last and never comes down, so it is what is left in
          front of the student once he has stopped talking. */}
      {closingLines.length > 0 && (
        <blockquote className="mt-2.5 shrink-0 overflow-y-auto text-center">
          {/* Sized off the narrower of the two dimensions: a quotation set from
              the window's height alone is unreadably large on a phone, where
              the board is a narrow column. */}
          <p className="font-serif text-[clamp(0.85rem,min(2.4vh,4vw),1.4rem)] leading-snug text-parchment">
            {closingLines.map((line, i) => {
              const last = i === closingLines.length - 1 && closingComplete;
              return (
                <Written
                  key={line.id}
                  text={`${i === 0 ? "“" : " "}${line.text}${last ? "”" : ""}`}
                  accent={accent}
                  instant={instant}
                />
              );
            })}
          </p>
          {closingComplete && board.closing?.cite && (
            <cite className="mt-1 block text-[10px] not-italic text-muted">
              {board.closing.cite}
            </cite>
          )}
        </blockquote>
      )}
    </section>
  );
}
