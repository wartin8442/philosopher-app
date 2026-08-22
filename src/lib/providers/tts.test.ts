import { describe, expect, it } from "vitest";
import { resolveVoice } from "./tts";

describe("resolveVoice", () => {
  it("uses Girard's custom ElevenLabs voice and French delivery prompt", () => {
    expect(resolveVoice("girard", "Hello", "eleven_turbo_v2_5")).toEqual({
      voiceId: "gssq6MF322ZdHKu6lYoN",
      model: "eleven_v3",
      text: "[French accent] Hello",
    });
  });
});
