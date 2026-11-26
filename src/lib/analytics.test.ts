import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  __loaded: false,
  init: vi.fn(),
  capture: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: sdk }));

async function load(key: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", key);
  return import("./analytics");
}

const lesson = { philosopher_id: "sartre", module_id: "m1", lesson_number: 1 };

describe("analytics", () => {
  beforeEach(() => {
    sdk.__loaded = false;
    sdk.init.mockReset();
    sdk.capture.mockReset();
  });

  it("does not load PostHog when no key is configured", async () => {
    const { initAnalytics } = await load("");
    initAnalytics();
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it("initialises cookieless, same-origin, with recording off and text masked", async () => {
    // These options are what keep the privacy notice true; see analytics.ts.
    const { initAnalytics } = await load("phc_test");
    initAnalytics();
    expect(sdk.init).toHaveBeenCalledOnce();
    const [key, config] = sdk.init.mock.calls[0];
    expect(key).toBe("phc_test");
    expect(config).toMatchObject({
      api_host: "/ingest",
      cookieless_mode: "always",
      disable_session_recording: true,
      mask_all_text: true,
    });
  });

  it("track is a no-op until the SDK has loaded", async () => {
    const { track } = await load("");
    track("lesson_started", lesson);
    expect(sdk.capture).not.toHaveBeenCalled();
  });

  it("track forwards the event once loaded", async () => {
    const { track } = await load("phc_test");
    sdk.__loaded = true;
    track("lesson_started", lesson);
    expect(sdk.capture).toHaveBeenCalledWith("lesson_started", lesson);
  });

  it("never lets an SDK failure escape into the caller", async () => {
    const { track } = await load("phc_test");
    sdk.__loaded = true;
    sdk.capture.mockImplementation(() => {
      throw new Error("boom");
    });
    expect(() => track("lesson_completed", lesson)).not.toThrow();
  });
});
