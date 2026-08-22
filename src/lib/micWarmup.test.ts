import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMicrophoneForTests,
  holdMicrophone,
  isMicrophoneWarm,
  prewarmMicrophone,
  releaseMicrophoneSurface,
  retainMicrophoneSurface,
  unholdMicrophone,
  warmMicrophone,
} from "./micWarmup";

/**
 * What the warm-up is allowed to do on its own.
 *
 * The whole point is to open the capture device before the user presses the
 * mic button, and the whole risk is doing that too eagerly: a permission
 * prompt nobody asked for, or a recording indicator burning on a page the user
 * is only reading. So these cover both halves — that the speculative path
 * really does stay silent until permission is already granted, and that a
 * microphone opened on spec is actually given back.
 */

/** Mirrors the constants in micWarmup.ts. */
const IDLE_RELEASE_MS = 300_000;
const UNMOUNTED_GRACE_MS = 2_000;

interface FakeTrack {
  stop: ReturnType<typeof vi.fn>;
}

let tracks: FakeTrack[] = [];
let getUserMedia: ReturnType<typeof vi.fn>;
let permissionState: PermissionState | "throw";

function newStream(): MediaStream {
  const track: FakeTrack = { stop: vi.fn() };
  tracks.push(track);
  return { getTracks: () => [track] } as unknown as MediaStream;
}

/** Every track ever handed out has been stopped. */
function allTracksStopped(): boolean {
  return tracks.length > 0 && tracks.every((t) => t.stop.mock.calls.length > 0);
}

beforeEach(() => {
  vi.useFakeTimers();
  tracks = [];
  permissionState = "granted";
  getUserMedia = vi.fn(async () => newStream());

  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: {
      query: async () => {
        if (permissionState === "throw") {
          // Firefox and Safari reject "microphone" outright.
          throw new TypeError("unsupported permission name");
        }
        return { state: permissionState };
      },
    },
  });
});

afterEach(() => {
  __resetMicrophoneForTests();
  vi.useRealTimers();
});

describe("speculative prewarm", () => {
  it("opens the microphone when permission is already granted", async () => {
    retainMicrophoneSurface();
    await prewarmMicrophone();

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(isMicrophoneWarm()).toBe(true);
  });

  it("stays silent when permission has not been granted yet", async () => {
    permissionState = "prompt";
    retainMicrophoneSurface();
    await prewarmMicrophone();

    // The first-time visitor must meet the permission prompt at the press,
    // where it is something they just asked for.
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(isMicrophoneWarm()).toBe(false);
  });

  it("stays silent when the browser hides the permission state", async () => {
    permissionState = "throw";
    retainMicrophoneSurface();
    await prewarmMicrophone();

    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("stays silent when permission was refused", async () => {
    permissionState = "denied";
    retainMicrophoneSurface();
    await prewarmMicrophone();

    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

describe("the press", () => {
  it("asks for permission even when the prewarm would not have", async () => {
    permissionState = "prompt";
    retainMicrophoneSurface();
    await prewarmMicrophone();
    expect(getUserMedia).not.toHaveBeenCalled();

    await warmMicrophone();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("reuses the prewarmed device instead of opening a second one", async () => {
    retainMicrophoneSurface();
    await prewarmMicrophone();
    await warmMicrophone();

    // This is the saving the whole feature exists for: at press time there is
    // nothing left to wait for but the recognizer's own handshake.
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("collapses concurrent callers into one request", async () => {
    retainMicrophoneSurface();
    await Promise.all([
      prewarmMicrophone(),
      warmMicrophone(),
      prewarmMicrophone(),
    ]);

    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("does not reject when the microphone cannot be opened", async () => {
    getUserMedia.mockRejectedValue(new Error("NotAllowedError"));
    retainMicrophoneSurface();

    // Reporting the failure is `recognition.start()`'s job, not the warm-up's.
    await expect(warmMicrophone()).resolves.toBeUndefined();
    expect(isMicrophoneWarm()).toBe(false);
  });
});

describe("giving the microphone back", () => {
  it("drops a device nobody used, so the indicator does not burn all lesson", async () => {
    retainMicrophoneSurface();
    await prewarmMicrophone();
    expect(isMicrophoneWarm()).toBe(true);

    await vi.advanceTimersByTimeAsync(IDLE_RELEASE_MS);

    expect(isMicrophoneWarm()).toBe(false);
    expect(allTracksStopped()).toBe(true);
  });

  it("never reclaims the device mid-sentence", async () => {
    retainMicrophoneSurface();
    await prewarmMicrophone();
    holdMicrophone();

    await vi.advanceTimersByTimeAsync(IDLE_RELEASE_MS * 3);
    expect(isMicrophoneWarm()).toBe(true);

    // Once capture stops it stays warm for the next turn, then ages out.
    unholdMicrophone();
    await vi.advanceTimersByTimeAsync(IDLE_RELEASE_MS - 1);
    expect(isMicrophoneWarm()).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(isMicrophoneWarm()).toBe(false);
  });

  it("drops the device quickly once every voice surface is gone", async () => {
    retainMicrophoneSurface();
    await prewarmMicrophone();

    releaseMicrophoneSurface();
    await vi.advanceTimersByTimeAsync(UNMOUNTED_GRACE_MS);

    expect(isMicrophoneWarm()).toBe(false);
  });

  it("survives the gap between two voice surfaces during a route change", async () => {
    // The profile page hints on the way out...
    await prewarmMicrophone();
    expect(isMicrophoneWarm()).toBe(true);

    // ...and the conversation route mounts a beat later. Nothing has held the
    // device in between, and it must still be there when it arrives.
    await vi.advanceTimersByTimeAsync(UNMOUNTED_GRACE_MS - 1);
    retainMicrophoneSurface();
    await vi.advanceTimersByTimeAsync(UNMOUNTED_GRACE_MS);

    expect(isMicrophoneWarm()).toBe(true);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("keeps the device while one of two overlapping surfaces unmounts", async () => {
    retainMicrophoneSurface();
    retainMicrophoneSurface();
    await prewarmMicrophone();

    releaseMicrophoneSurface();
    await vi.advanceTimersByTimeAsync(UNMOUNTED_GRACE_MS * 2);

    expect(isMicrophoneWarm()).toBe(true);
  });

  it("re-opens the device after an idle release", async () => {
    retainMicrophoneSurface();
    await prewarmMicrophone();
    await vi.advanceTimersByTimeAsync(IDLE_RELEASE_MS);
    expect(isMicrophoneWarm()).toBe(false);

    await warmMicrophone();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(isMicrophoneWarm()).toBe(true);
  });
});

describe("browsers without the API", () => {
  it("does nothing when getUserMedia is unavailable", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });

    await expect(warmMicrophone()).resolves.toBeUndefined();
    expect(isMicrophoneWarm()).toBe(false);
  });

  it("does nothing when the Permissions API is unavailable", async () => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: undefined,
    });

    await prewarmMicrophone();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
