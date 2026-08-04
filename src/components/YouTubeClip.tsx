"use client";

import { useState } from "react";
import type { WhyPhilosophyVideoClip } from "@/lib/whyPhilosophy";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function YouTubeClip({
  clip,
  personName,
}: {
  clip: WhyPhilosophyVideoClip;
  personName: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const duration = formatDuration(clip.endSeconds - clip.startSeconds);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${clip.youtubeId}?start=${clip.startSeconds}&end=${clip.endSeconds}&autoplay=1&controls=1&playsinline=1&rel=0`;
  const fullVideoUrl = `https://www.youtube.com/watch?v=${clip.youtubeId}&t=${clip.startSeconds}s`;

  return (
    <section
      data-video-clip
      className="mt-12"
      aria-labelledby={`clip-${clip.youtubeId}`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-[#c9a24b]">
        Hear him explain it
      </p>
      <h2
        id={`clip-${clip.youtubeId}`}
        className="mt-3 font-serif text-3xl text-parchment sm:text-4xl"
      >
        {clip.label}
      </h2>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl shadow-black/30">
        <div className="aspect-video">
          {isPlaying ? (
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title={`${personName}: ${clip.label}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="group flex h-full w-full flex-col items-center justify-center gap-5 bg-[radial-gradient(circle_at_center,_rgba(201,162,75,0.14),_transparent_55%)] px-6 text-center transition hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#c9a24b]"
              aria-label={`Play ${duration} excerpt: ${clip.label}`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a24b]/70 bg-[#c9a24b]/10 text-2xl text-[#d5b765] transition group-hover:scale-105 group-hover:bg-[#c9a24b]/20">
                <span className="ml-1" aria-hidden>
                  ▶
                </span>
              </span>
              <span>
                <span className="block text-sm uppercase tracking-[0.22em] text-parchment">
                  Play excerpt
                </span>
                <span className="mt-2 block text-sm text-parchment/55">
                  {duration}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      <a
        href={fullVideoUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-sm text-parchment/55 underline decoration-white/20 underline-offset-4 transition hover:text-parchment"
      >
        Watch the full conversation on YouTube ↗
      </a>
    </section>
  );
}
