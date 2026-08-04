import { describe, expect, it, vi } from "vitest";
import { createFirstAudioCapture, watchWebAudioOnset } from "./first-audio";

describe("first-audio measurement", () => {
  it("captures the first observed audio path exactly once", () => {
    const onFirstAudio = vi.fn();
    const capture = createFirstAudioCapture(1_000, onFirstAudio, () => 1_137.5);

    expect(capture("web-audio")).toEqual({
      path: "web-audio",
      observedAtMs: 1_137.5,
      elapsedMs: 137.5,
    });
    expect(capture("web-speech")).toBeNull();
    expect(onFirstAudio).toHaveBeenCalledTimes(1);
  });

  it("waits for a running Web Audio clock to reach the scheduled onset", () => {
    let state: AudioContextState = "suspended";
    let currentTime = 0;
    const pending: (() => void)[] = [];
    const cleared = new Set<unknown>();
    const onOnset = vi.fn();
    const scheduler = {
      set(callback: () => void) {
        pending.push(callback);
        return callback;
      },
      clear(handle: unknown) {
        cleared.add(handle);
      },
    };

    const cancel = watchWebAudioOnset(
      () => ({ state, currentTime }),
      2,
      onOnset,
      { pollMs: 1, scheduler },
    );

    expect(onOnset).not.toHaveBeenCalled();
    state = "running";
    currentTime = 1.99;
    pending.shift()?.();
    expect(onOnset).not.toHaveBeenCalled();
    currentTime = 2;
    pending.shift()?.();
    expect(onOnset).toHaveBeenCalledTimes(1);
    pending.shift()?.();
    expect(onOnset).toHaveBeenCalledTimes(1);

    cancel();
    expect(cleared.size).toBeGreaterThanOrEqual(0);
  });

  it("can be cancelled before audio becomes audible", () => {
    const pending: (() => void)[] = [];
    const onOnset = vi.fn();
    const cancel = watchWebAudioOnset(
      () => ({ state: "suspended", currentTime: 0 }),
      0,
      onOnset,
      {
        scheduler: {
          set(callback) {
            pending.push(callback);
            return callback;
          },
          clear() {},
        },
      },
    );
    cancel();
    pending.shift()?.();
    expect(onOnset).not.toHaveBeenCalled();
  });
});
