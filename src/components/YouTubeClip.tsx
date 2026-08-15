"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WhyPhilosophyVideoClip } from "@/lib/whyPhilosophy";

const PLAYER_ORIGIN = "https://www.youtube-nocookie.com";

/**
 * The `end` parameter on a YouTube embed URL is advisory at best — it is
 * ignored outright often enough that a clip reliably runs past its end point
 * and into the rest of the talk. So the stop is enforced here instead.
 *
 * Rather than pull in YouTube's iframe_api script (which would mean widening
 * `script-src` in the CSP to allow youtube.com), this speaks the same
 * postMessage protocol that script speaks. With `enablejsapi=1` the player
 * answers a "listening" handshake with a stream of `infoDelivery` messages
 * carrying `currentTime`, and accepts `command` messages back. That is the
 * whole API surface needed to watch the clock and pause on the mark.
 */
const HANDSHAKE_INTERVAL_MS = 250;
/** Give up re-handshaking after ~10s; by then the player is never answering. */
const HANDSHAKE_MAX_ATTEMPTS = 40;

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function buildEmbedUrl(clip: WhyPhilosophyVideoClip) {
  const params = new URLSearchParams({
    start: String(clip.startSeconds),
    // Kept even though it is unreliable: when the player does honour it, it
    // stops a beat sooner than the postMessage clock can.
    end: String(clip.endSeconds),
    autoplay: "1",
    controls: "1",
    playsinline: "1",
    rel: "0",
    enablejsapi: "1",
  });
  if (typeof window !== "undefined") {
    params.set("origin", window.location.origin);
  }
  return `${PLAYER_ORIGIN}/embed/${clip.youtubeId}?${params.toString()}`;
}

export default function YouTubeClip({
  clip,
  personName,
}: {
  clip: WhyPhilosophyVideoClip;
  personName: string;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "ended">("idle");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Mirrored in a ref because the message handler runs outside React's render
  // cycle and must not act twice on the same overshoot.
  const hasEndedRef = useRef(false);

  const duration = formatDuration(clip.endSeconds - clip.startSeconds);
  const embedUrl = useMemo(() => buildEmbedUrl(clip), [clip]);
  const fullVideoUrl = `https://www.youtube.com/watch?v=${clip.youtubeId}&t=${clip.startSeconds}s`;
  const isMounted = phase !== "idle";

  const sendToPlayer = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ ...message, id: 1, channel: "widget" }),
      PLAYER_ORIGIN,
    );
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let attempts = 0;
    let handshake: number | undefined;
    const stopHandshake = () => {
      if (handshake !== undefined) {
        window.clearInterval(handshake);
        handshake = undefined;
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== PLAYER_ORIGIN) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      let payload: unknown;
      try {
        payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!payload || typeof payload !== "object") return;

      // Any reply at all means the player heard us; stop re-announcing.
      stopHandshake();

      const info = (payload as { info?: { currentTime?: unknown } }).info;
      const currentTime = info?.currentTime;
      if (typeof currentTime !== "number") return;
      if (hasEndedRef.current || currentTime < clip.endSeconds) return;

      hasEndedRef.current = true;
      sendToPlayer({ event: "command", func: "pauseVideo", args: [] });
      setPhase("ended");
    };

    window.addEventListener("message", handleMessage);
    const announce = () => {
      attempts += 1;
      if (attempts > HANDSHAKE_MAX_ATTEMPTS) {
        stopHandshake();
        return;
      }
      sendToPlayer({ event: "listening" });
    };
    announce();
    handshake = window.setInterval(announce, HANDSHAKE_INTERVAL_MS);

    return () => {
      window.removeEventListener("message", handleMessage);
      stopHandshake();
    };
  }, [isMounted, clip.endSeconds, sendToPlayer]);

  const replay = () => {
    hasEndedRef.current = false;
    setPhase("playing");
    sendToPlayer({
      event: "command",
      func: "seekTo",
      args: [clip.startSeconds, true],
    });
    sendToPlayer({ event: "command", func: "playVideo", args: [] });
  };

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
        <div className="relative aspect-video">
          {isMounted ? (
            <iframe
              ref={iframeRef}
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
              onClick={() => setPhase("playing")}
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

          {/* Covering the player once the excerpt is over is what keeps it
              over: YouTube's own play button would resume straight past the
              end point, so the only ways forward are a replay or the full
              video. */}
          {phase === "ended" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/80 px-6 text-center backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.22em] text-parchment">
                End of excerpt
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={replay}
                  className="rounded-full border border-[#c9a24b]/70 bg-[#c9a24b]/10 px-5 py-2 text-sm text-[#d5b765] transition hover:bg-[#c9a24b]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a24b]"
                  aria-label={`Replay ${duration} excerpt: ${clip.label}`}
                >
                  ▶ Replay excerpt
                </button>
                <a
                  href={fullVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/20 px-5 py-2 text-sm text-parchment/75 transition hover:border-parchment hover:text-parchment"
                >
                  Keep watching on YouTube ↗
                </a>
              </div>
            </div>
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
