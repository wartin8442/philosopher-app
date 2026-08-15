import type { CSSProperties } from "react";

interface BookCoverProps {
  title: string;
  author: string;
  accent: string;
  year?: string;
}

const MOTIFS = 6;

/** Stable variation without storing or fetching artwork for every title. */
function coverSeed(value: string): number {
  let seed = 0;
  for (let index = 0; index < value.length; index++) {
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  }
  return seed;
}

function coverBackground(accent: string, seed: number): string {
  const angle = 18 + (seed % 54);
  const x = 22 + (seed % 57);
  const y = 20 + ((seed >>> 3) % 61);

  switch (seed % MOTIFS) {
    case 0:
      return `radial-gradient(circle at ${x}% ${y}%, ${accent}66 0 13%, transparent 14%), radial-gradient(circle at ${100 - x}% ${100 - y}%, ${accent}2e 0 24%, transparent 25%), linear-gradient(155deg, ${accent}20, #111116 72%)`;
    case 1:
      return `repeating-linear-gradient(${angle}deg, transparent 0 14px, ${accent}26 15px 16px), linear-gradient(145deg, ${accent}24, #111116 68%)`;
    case 2:
      return `linear-gradient(${angle}deg, transparent 0 43%, ${accent}70 44% 48%, transparent 49%), linear-gradient(${angle + 90}deg, transparent 0 58%, ${accent}35 59% 62%, transparent 63%), linear-gradient(150deg, ${accent}1f, #111116 70%)`;
    case 3:
      return `radial-gradient(ellipse at 50% 112%, transparent 0 37%, ${accent}5c 38% 40%, transparent 41% 50%, ${accent}2e 51% 53%, transparent 54%), linear-gradient(160deg, ${accent}24, #111116 72%)`;
    case 4:
      return `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${accent}48, transparent 18% 48%, ${accent}22 50% 66%, transparent 68%), linear-gradient(150deg, ${accent}20, #111116 72%)`;
    default:
      return `linear-gradient(90deg, transparent 0 17%, ${accent}42 18% 20%, transparent 21% 79%, ${accent}42 80% 82%, transparent 83%), radial-gradient(circle at 50% 38%, ${accent}42 0 18%, transparent 19%), linear-gradient(155deg, ${accent}1f, #111116 72%)`;
  }
}

/**
 * An original, typography-led cover for a work in the app.
 *
 * It deliberately uses only bibliographic facts, plain type, and basic
 * geometric ornament. No publisher jacket, illustration, logo, photograph,
 * remote image, or third-party asset is reproduced. The rendered cover
 * designs are dedicated to the public domain under CC0; see
 * docs/IMAGE_CREDITS.md.
 */
export default function BookCover({
  title,
  author,
  accent,
  year,
}: BookCoverProps) {
  const seed = coverSeed(`${author}:${title}`);
  const titleSize =
    title.length > 42 ? "text-xs" : title.length > 27 ? "text-sm" : "text-base";
  const style = {
    "--cover-accent": accent,
    background: coverBackground(accent, seed),
  } as CSSProperties;

  return (
    <div
      role="img"
      aria-label={`Original cover design for ${title} by ${author}`}
      data-cover-origin="original-cc0"
      className="relative aspect-[2/3] w-full overflow-hidden rounded-sm border bg-ink-900 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      style={{ ...style, borderColor: `${accent}70` }}
    >
      <span
        aria-hidden
        className="absolute inset-[7px] border"
        style={{ borderColor: `${accent}42` }}
      />
      <span
        aria-hidden
        className="absolute left-3 top-3 h-px w-8"
        style={{ backgroundColor: accent }}
      />

      <div className="relative flex h-full flex-col p-3.5 text-left">
        <p
          className="max-w-full text-[9px] uppercase leading-tight tracking-[0.16em]"
          style={{ color: accent }}
        >
          {author}
        </p>

        <div className="flex flex-1 items-center py-4">
          <p
            className={`max-w-full text-balance font-serif font-medium leading-[1.08] text-parchment ${titleSize}`}
          >
            {title}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: `${accent}55` }}>
          <span className="text-[8px] uppercase tracking-[0.14em] text-parchment/45">
            A major work
          </span>
          {year && (
            <span className="shrink-0 text-[9px] tracking-wide" style={{ color: accent }}>
              {year}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
