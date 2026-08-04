"use client";

import { RefObject, useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  /** Canvas is a square of this many CSS pixels, centered on the portrait. */
  size: number;
  /** Bars start just outside this radius (portrait radius + a small gap). */
  innerRadius: number;
  accent: string;
  /** Whether the philosopher is currently speaking. */
  active: boolean;
  /**
   * Analyser tapping the TTS output. May be null (browser speechSynthesis
   * fallback has no audio graph); then an idle "breathing" wave is drawn
   * while active so the ring still reads as speech.
   */
  analyserRef: RefObject<AnalyserNode | null>;
}

const BAR_COUNT = 72;

/**
 * Audio-reactive ring of radial bars around the portrait. The portrait itself
 * stays still; only the ring moves. Levels ease toward their targets each
 * frame, so bars rise with the voice and settle softly to nothing when it
 * stops.
 */
export default function VoiceVisualizer({
  size,
  innerRadius,
  accent,
  active,
  analyserRef,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const maxBarLength = center - innerRadius - 4;
    const levels = new Float32Array(BAR_COUNT);
    const freqData = new Uint8Array(128);
    let t = 0;
    let raf: number;

    if (!active) {
      ctx.clearRect(0, 0, size, size);
      return;
    }

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 1;
      const analyser = analyserRef.current;
      const speakingNow = active;
      if (speakingNow && analyser) analyser.getByteFrequencyData(freqData);

      for (let i = 0; i < BAR_COUNT; i++) {
        let target = 0;
        if (speakingNow) {
          if (analyser) {
            // Mirror the low half of the spectrum around the circle so the
            // ring is symmetric; voice energy lives in the low bins.
            const half = BAR_COUNT / 2;
            const mirrored = i < half ? i : BAR_COUNT - 1 - i;
            const bin = Math.floor((mirrored / half) * 48);
            target = freqData[bin] / 255;
          } else {
            // No analyser (browser speech fallback): synthesize a gentle,
            // organic wave so the ring still moves with "speech."
            target =
              0.25 +
              0.2 * Math.sin(t * 0.11 + i * 0.6) * Math.sin(t * 0.053) +
              0.12 * Math.sin(t * 0.023 + i * 1.7);
            target = Math.max(0, target);
          }
        }
        // Fast attack, slow release — reads as reactive without flicker.
        levels[i] += (target - levels[i]) * (target > levels[i] ? 0.4 : 0.12);
      }

      ctx.clearRect(0, 0, size, size);

      // Skip drawing entirely once the ring has fully settled.
      let energy = 0;
      for (let i = 0; i < BAR_COUNT; i++) energy += levels[i];
      if (energy < 0.01) return;

      // Soft glow behind the ring, scaled by overall energy.
      const avg = energy / BAR_COUNT;
      const glow = ctx.createRadialGradient(
        center,
        center,
        innerRadius,
        center,
        center,
        center,
      );
      glow.addColorStop(0, `${accent}${Math.round(avg * 64).toString(16).padStart(2, "0")}`);
      glow.addColorStop(1, `${accent}00`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
        const len = 2 + levels[i] * maxBarLength;
        const x0 = center + Math.cos(angle) * innerRadius;
        const y0 = center + Math.sin(angle) * innerRadius;
        const x1 = center + Math.cos(angle) * (innerRadius + len);
        const y1 = center + Math.sin(angle) * (innerRadius + len);
        const alpha = Math.round((0.35 + levels[i] * 0.65) * 255)
          .toString(16)
          .padStart(2, "0");
        ctx.strokeStyle = `${accent}${alpha}`;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, innerRadius, accent, analyserRef, active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
    />
  );
}
