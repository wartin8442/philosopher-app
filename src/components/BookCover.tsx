"use client";

import { useState } from "react";

interface BookCoverProps {
  title: string;
  author: string;
  accent: string;
  /** Remote cover image; when missing or broken, a typographic cover renders instead. */
  src?: string;
}

/**
 * A book cover for the Major Works section. Renders the real edition cover
 * when `src` loads; otherwise falls back to a quiet typographic cover in the
 * philosopher's accent color, so the shelf never shows a broken image.
 *
 * A plain <img> (not next/image) on purpose: covers load from
 * covers.openlibrary.org, and this avoids adding a remote-image allowlist to
 * next.config for what is essentially decorative content with a fallback.
 */
export default function BookCover({ title, author, accent, src }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className="relative aspect-[2/3] w-full overflow-hidden rounded-sm border border-ink-700 bg-ink-900 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      style={{ borderColor: showImage ? undefined : `${accent}55` }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={`Cover of ${title}`}
          className="flex h-full w-full flex-col justify-between p-3 text-left"
          style={{
            background: `linear-gradient(160deg, ${accent}26, #131317 70%)`,
          }}
        >
          <div
            className="border-t pt-2 text-[10px] uppercase tracking-[0.2em]"
            style={{ borderColor: `${accent}66`, color: accent }}
          >
            {author}
          </div>
          <div className="font-serif text-sm leading-snug text-parchment">
            {title}
          </div>
          <div className="border-b pb-2" style={{ borderColor: `${accent}66` }} />
        </div>
      )}
    </div>
  );
}
