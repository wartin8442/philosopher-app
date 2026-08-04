export type FirstAudioPath = "web-audio" | "web-speech";

export interface FirstAudioMeasurement {
  path: FirstAudioPath;
  observedAtMs: number;
  elapsedMs: number;
}

export function createFirstAudioCapture(
  startedAtMs: number,
  onFirstAudio?: (measurement: FirstAudioMeasurement) => void,
  now: () => number = () => performance.now(),
): (path: FirstAudioPath) => FirstAudioMeasurement | null {
  let captured: FirstAudioMeasurement | null = null;
  return (path) => {
    if (captured) return null;
    const observedAtMs = now();
    captured = {
      path,
      observedAtMs,
      elapsedMs: Math.max(0, observedAtMs - startedAtMs),
    };
    onFirstAudio?.(captured);
    return captured;
  };
}

interface AudioClockSample {
  state: AudioContextState;
  currentTime: number;
}

interface TimerScheduler {
  set(callback: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

const browserScheduler: TimerScheduler = {
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Observe the Web Audio clock, not merely source.start(), so suspended audio
 * contexts do not report sound before playback can actually begin.
 */
export function watchWebAudioOnset(
  readClock: () => AudioClockSample,
  scheduledAtSeconds: number,
  onOnset: () => void,
  options: { pollMs?: number; scheduler?: TimerScheduler } = {},
): () => void {
  const pollMs = options.pollMs ?? 5;
  const scheduler = options.scheduler ?? browserScheduler;
  let cancelled = false;
  let fired = false;
  let handle: unknown;

  const poll = () => {
    if (cancelled || fired) return;
    const clock = readClock();
    if (clock.state === "running" && clock.currentTime >= scheduledAtSeconds) {
      fired = true;
      onOnset();
      return;
    }
    handle = scheduler.set(poll, pollMs);
  };
  poll();
  return () => {
    cancelled = true;
    if (handle !== undefined) scheduler.clear(handle);
  };
}
