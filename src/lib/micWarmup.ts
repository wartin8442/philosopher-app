"use client";

/**
 * One microphone, opened ahead of the press and shared by every voice surface.
 *
 * Pressing the mic button used to pay for the whole chain in series:
 * `getUserMedia` (permission lookup, then the OS opening the capture device —
 * hundreds of milliseconds on a built-in mic, seconds on a Bluetooth headset)
 * and only *then* `recognition.start()` and its handshake with the speech
 * service. Both stalls landed at the one moment the user had already started
 * talking, and the recognizer drops everything said before `audiostart`.
 *
 * The device half of that can be paid earlier, while the user is still reading
 * the greeting. What is left at press time is the recognizer handshake alone.
 *
 * Two things make this a module singleton rather than hook state:
 *
 *  - It has to survive a client-side navigation. The warm-up starts on the
 *    profile page's "talk to" button and has to still be there when the
 *    conversation route mounts a moment later.
 *  - Two surfaces briefly overlap during a route change (and React's dev
 *    double-mount does the same), and the one going away must not take the
 *    microphone from the one arriving.
 *
 * The counterweight is that an open microphone lights the browser's recording
 * indicator and costs battery, so the stream is not held indefinitely: see the
 * release rules below.
 */

/**
 * A surface is mounted but nobody has spoken for this long — most likely a
 * lecture playing out with no interruption, or a tab left open. Drop the
 * microphone; the next press pays the device open again, which is far cheaper
 * the second time now that permission is granted.
 *
 * Five minutes rather than one, because the clock restarts when the user
 * *stops* talking and the philosopher's reply is what fills the gap: at the
 * advanced answer level a spoken reply plus the reader's own thinking time
 * runs well past a minute, and expiring in the middle of that would reintroduce
 * the exact stall this file exists to remove. It still bounds a twenty-minute
 * lecture to its first five minutes, which is the case that matters — before
 * this, the device was held from first use until the page was left.
 */
const IDLE_RELEASE_MS = 300_000;

/**
 * Every voice surface has unmounted. Short, but not zero: a route change
 * between two voice surfaces unmounts the old one before mounting the new,
 * and dropping the device in that gap would undo the warm-up we just did.
 */
const UNMOUNTED_GRACE_MS = 2_000;

let stream: MediaStream | null = null;
let pending: Promise<void> | null = null;
/** Mounted voice surfaces. */
let surfaces = 0;
/** Surfaces actively capturing right now. */
let holds = 0;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function cancelRelease(): void {
  if (!releaseTimer) return;
  clearTimeout(releaseTimer);
  releaseTimer = null;
}

function stopStream(): void {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}

/**
 * Re-decide when the microphone should be dropped. Called after anything that
 * changes the answer; the rules are in one place so they cannot drift apart.
 */
function armRelease(): void {
  cancelRelease();
  if (!stream && !pending) return;
  // Someone is mid-sentence. Nothing is dropped out from under them.
  if (holds > 0) return;
  const delay = surfaces > 0 ? IDLE_RELEASE_MS : UNMOUNTED_GRACE_MS;
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    if (holds > 0) return;
    stopStream();
  }, delay);
}

/** True once the device is open and the next press skips straight to the recognizer. */
export function isMicrophoneWarm(): boolean {
  return stream !== null;
}

/**
 * Open the microphone, prompting for permission if it has not been granted
 * yet. Safe to call repeatedly — concurrent callers share the one request.
 *
 * This is the deliberate path: call it from a user gesture, or the permission
 * prompt arrives out of nowhere. `prewarmMicrophone` is the speculative one.
 */
export function warmMicrophone(): Promise<void> {
  cancelRelease();
  if (stream) return Promise.resolve();
  if (pending) return pending;
  if (typeof navigator === "undefined") return Promise.resolve();
  const getUserMedia = navigator.mediaDevices?.getUserMedia;
  if (!getUserMedia) return Promise.resolve();

  pending = getUserMedia
    .call(navigator.mediaDevices, { audio: true })
    .then((opened) => {
      stream = opened;
    })
    .catch(() => {
      // Denied, or no input device. Left alone deliberately: the press-time
      // `recognition.start()` is what surfaces the failure to the user, and a
      // speculative warm-up must never be the thing that reports an error.
    })
    .finally(() => {
      pending = null;
      // The page may have moved on while the OS was opening the device.
      armRelease();
    });
  return pending;
}

/**
 * Warm the microphone *only* if permission has already been granted, so this
 * can never raise a permission prompt the user did not ask for. Cheap enough
 * to call on hover, on mount, or on any other hint that speech is coming.
 */
export async function prewarmMicrophone(): Promise<void> {
  if (typeof navigator === "undefined") return;

  if (!stream && !pending) {
    let state: PermissionState | undefined;
    try {
      const status = await navigator.permissions?.query({
        name: "microphone" as PermissionName,
      });
      state = status?.state;
    } catch {
      // Firefox and Safari do not expose "microphone" to the Permissions API
      // and throw here. With no way to know whether a prompt would appear,
      // the only safe answer is to do nothing and leave those browsers on the
      // press-time path they have today.
      return;
    }
    if (state !== "granted") return;
  }

  await warmMicrophone();
  armRelease();
}

/** A voice surface mounted and may want the microphone before long. */
export function retainMicrophoneSurface(): void {
  surfaces += 1;
  armRelease();
}

/** A voice surface unmounted. The last one out starts the countdown. */
export function releaseMicrophoneSurface(): void {
  surfaces = Math.max(0, surfaces - 1);
  armRelease();
}

/** Capture is starting — pin the stream open until it stops. */
export function holdMicrophone(): void {
  holds += 1;
  cancelRelease();
}

/** Capture stopped. Stays warm for the next turn, then ages out. */
export function unholdMicrophone(): void {
  holds = Math.max(0, holds - 1);
  armRelease();
}

/** Test seam: drop the singleton so each case starts from a cold microphone. */
export function __resetMicrophoneForTests(): void {
  cancelRelease();
  stopStream();
  pending = null;
  surfaces = 0;
  holds = 0;
}
