"use client";

import { useState } from "react";
import Image from "next/image";
import { Philosopher } from "@/lib/types";

interface PortraitProps {
  initials: string;
  accent: string;
  size?: number;
  active?: boolean;
  imageSrc?: string;
  /** Per-image crop tuning; see Philosopher.imageCrop. */
  crop?: Philosopher["imageCrop"];
  /**
   * Fetch the image immediately instead of next/image's default lazy
   * loading. Needed for offscreen carousel cards, which must already be
   * loaded by the time they scroll into view.
   */
  eager?: boolean;
  /**
   * Fetch this portrait ahead of everything else on the page. For the one
   * portrait that is the point of the screen — the speaker in a conversation —
   * so it is on screen with the rest of the layout rather than after it.
   */
  priority?: boolean;
}

/**
 * Circular portrait. Renders a real photo when `imageSrc` is provided and
 * loads successfully; otherwise falls back to an initials disc in the
 * philosopher's accent color. Pulses softly when `active` (currently speaking).
 */
export default function Portrait({
  initials,
  accent,
  size = 96,
  active = false,
  imageSrc,
  crop,
  eager = false,
  priority = false,
}: PortraitProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = imageSrc && !imageFailed;

  // Zoom magnifies around the face at (focusX, focusY) and re-centers that
  // point in the circle: scale about the focus (transform-origin keeps it
  // fixed), then translate it to the center. Percentages are of the image
  // element, which matches the source image for the square-photo case zoom
  // exists for.
  const focusX = crop?.focusX ?? 0.5;
  const focusY = crop?.focusY ?? 0.5;
  const zoomStyle =
    crop?.zoom && crop.zoom !== 1
      ? {
          transform: `translate(${(0.5 - focusX) * 100}%, ${
            (0.5 - focusY) * 100
          }%) scale(${crop.zoom})`,
          transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
        }
      : undefined;

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      {active && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
      )}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-full border font-serif select-none"
        style={{
          width: size,
          height: size,
          borderColor: accent,
          background: showImage
            ? "#131317"
            : `radial-gradient(circle at 30% 25%, ${accent}33, #131317 70%)`,
          color: accent,
          fontSize: size * 0.34,
          boxShadow: active ? `0 0 24px ${accent}66` : "none",
        }}
      >
        {showImage ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            priority={priority}
            loading={eager && !priority ? "eager" : undefined}
            sizes={`${size}px`}
            className="object-cover"
            style={{ objectPosition: crop?.position, ...zoomStyle }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          initials
        )}
      </div>
    </div>
  );
}
