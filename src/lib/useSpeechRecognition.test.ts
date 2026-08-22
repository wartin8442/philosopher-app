import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetMicrophoneForTests, isMicrophoneWarm } from "./micWarmup";
import { useSpeechRecognition } from "./useSpeechRecognition";

/**
 * Where the microphone gets opened, relative to the press.
 *
 * The recognizer discards everything said before `audiostart`, so the device
 * open used to sit directly in front of the user's first words. These cover
 * the seam between the hook and the shared warm-up: that arriving on a voice
 * surface is enough to start opening the device, that the press then has
 * nothing left to open, and that leaving takes the microphone back.
 */

const UNMOUNTED_GRACE_MS = 2_000;

/** The recognizer, reduced to the four things this hook actually drives. */
class FakeRecognition implements Partial<SpeechRecognition> {
  static last: FakeRecognition | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onstart: ((event: Event) => void) | null = null;
  onaudiostart: ((event: Event) => void) | null = null;
  start = vi.fn(() => {
    // Real capture begins a beat after start(); that gap is the thing the
    // warm-up shrinks, so the fake keeps it as a separate turn.
    setTimeout(() => this.onaudiostart?.(new Event("audiostart")), 0);
  });
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    FakeRecognition.last = this;
  }
}

let getUserMedia: ReturnType<typeof vi.fn>;
let permissionState: PermissionState;

beforeEach(() => {
  vi.useFakeTimers();
  permissionState = "granted";
  getUserMedia = vi.fn(
    async () =>
      ({ getTracks: () => [{ stop: vi.fn() }] }) as unknown as MediaStream,
  );

  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: { query: async () => ({ state: permissionState }) },
  });
  window.SpeechRecognition =
    FakeRecognition as unknown as typeof SpeechRecognition;
});

afterEach(() => {
  __resetMicrophoneForTests();
  FakeRecognition.last = null;
  delete window.SpeechRecognition;
  vi.useRealTimers();
});

describe("useSpeechRecognition", () => {
  it("starts opening the microphone as soon as the surface mounts", async () => {
    renderHook(() => useSpeechRecognition(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(isMicrophoneWarm()).toBe(true);
  });

  it("leaves a first-time visitor's prompt for the press", async () => {
    permissionState = "prompt";
    const { result } = renderHook(() => useSpeechRecognition(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(getUserMedia).not.toHaveBeenCalled();

    act(() => result.current.start());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("has nothing left to open by the time the button is pressed", async () => {
    const { result } = renderHook(() => useSpeechRecognition(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => result.current.start());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(FakeRecognition.last?.start).toHaveBeenCalledTimes(1);
    expect(result.current.listening).toBe(true);
  });

  it("hands the microphone back when the surface unmounts", async () => {
    const { unmount } = renderHook(() => useSpeechRecognition(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(isMicrophoneWarm()).toBe(true);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNMOUNTED_GRACE_MS);
    });

    expect(isMicrophoneWarm()).toBe(false);
  });

  it("still reaches the recognizer when the device cannot be opened", async () => {
    getUserMedia.mockRejectedValue(new Error("NotAllowedError"));
    const { result } = renderHook(() => useSpeechRecognition(() => {}));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    act(() => result.current.start());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // start() is what surfaces a refusal to the user, so it must be reached
    // rather than short-circuited by the failed warm-up.
    expect(FakeRecognition.last?.start).toHaveBeenCalledTimes(1);
  });
});
