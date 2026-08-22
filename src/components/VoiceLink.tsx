"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { prewarmMicrophone } from "@/lib/micWarmup";

type VoiceLinkProps = ComponentProps<typeof Link>;

/**
 * A `Link` into a voice surface that starts opening the microphone as the user
 * reaches for it, so the device is already warm by the time the conversation
 * route mounts and asks for it.
 *
 * The alternative — warming on the profile page itself — would light the
 * browser's recording indicator over a page meant for reading. Hover, focus
 * and press are the points where the user has told us what they intend.
 *
 * `prewarmMicrophone` is silent unless permission is already granted, so this
 * never turns a hover into a permission prompt.
 */
export default function VoiceLink(props: VoiceLinkProps) {
  const hint = () => void prewarmMicrophone();
  return (
    <Link
      {...props}
      onPointerEnter={(event) => {
        props.onPointerEnter?.(event);
        hint();
      }}
      onFocus={(event) => {
        props.onFocus?.(event);
        hint();
      }}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        hint();
      }}
    />
  );
}
