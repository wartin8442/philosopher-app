import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveVoice, voiceSeed } from "./tts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveVoice", () => {
  it("uses Girard's custom ElevenLabs voice and French delivery prompt", () => {
    expect(resolveVoice("girard", "Hello", "eleven_turbo_v2_5")).toEqual({
      voiceId: "gssq6MF322ZdHKu6lYoN",
      model: "eleven_v3",
      text: "[French accent] Hello",
    });
  });

  it("drops the accent tag when the accent model cannot read tags", () => {
    vi.stubEnv("ELEVENLABS_ACCENT_MODEL", "eleven_multilingual_v2");
    expect(resolveVoice("girard", "Hello", "eleven_turbo_v2_5")).toEqual({
      voiceId: "gssq6MF322ZdHKu6lYoN",
      model: "eleven_multilingual_v2",
      text: "Hello",
    });
  });

  it("leaves unaccented philosophers on the default model", () => {
    expect(resolveVoice("camus", "Hello", "eleven_flash_v2_5").model).toBe(
      "eleven_flash_v2_5",
    );
  });
});

describe("voiceSeed", () => {
  it("is stable per philosopher and distinct between them", () => {
    expect(voiceSeed("nietzsche")).toBe(voiceSeed("nietzsche"));
    expect(voiceSeed("nietzsche")).not.toBe(voiceSeed("sartre"));
  });

  it("stays inside ElevenLabs' unsigned 32-bit seed range", () => {
    for (const id of ["a", "marcus-aurelius", "wittgenstein"]) {
      const seed = voiceSeed(id);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(4_294_967_295);
    }
  });
});
