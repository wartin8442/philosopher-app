import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({
  stream: vi.fn(),
}));

vi.mock("@/lib/providers/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/providers/llm")>();
  return {
    ...actual,
    getLLMProvider: () => ({
      name: "test",
      complete: vi.fn(),
      stream: provider.stream,
    }),
  };
});

vi.mock("@/lib/retrieval", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/retrieval")>();
  return {
    ...actual,
    retrieveSources: vi.fn().mockResolvedValue([]),
  };
});

import { POST } from "./route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    provider.stream.mockReset();
    provider.stream.mockImplementation(async function* () {
      yield "Mimetic ";
      yield "desire.";
    });
  });

  it("generates a streamed response with Girard's persona", async () => {
    const request = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        philosopherId: "girard",
        answerLevel: "beginner",
        messages: [{ role: "user", content: "What is mimetic desire?" }],
      }),
    });

    const response = await POST(request);
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));

    expect(response.status).toBe(200);
    expect(events).toEqual([
      expect.objectContaining({ type: "sources", sources: [] }),
      { type: "text", text: "Mimetic " },
      { type: "text", text: "desire." },
      { type: "done" },
    ]);
    expect(provider.stream).toHaveBeenCalledOnce();
    expect(provider.stream.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        system: expect.stringContaining("You are René Girard"),
        messages: [
          { role: "user", content: "What is mimetic desire?" },
        ],
      }),
    );
  });
});
