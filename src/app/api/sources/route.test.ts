import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const picker = vi.hoisted(() => ({ complete: vi.fn() }));

vi.mock("@/lib/providers/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/providers/llm")>();
  return {
    ...actual,
    getSourcePickerProvider: () => ({
      name: "test",
      complete: picker.complete,
      stream: vi.fn(),
    }),
  };
});

import { pickerCandidates } from "@/lib/panel-sources";
import { getPhilosopher } from "@/lib/philosophers";
import { POST } from "./route";

function request(body: object): NextRequest {
  return new NextRequest("http://localhost/api/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const exchange = {
  philosopherId: "sartre",
  question: "What do you make of the transcendental I?",
  reply: "Husserl was wrong to put an I behind consciousness; the ego is out in the world.",
};

describe("POST /api/sources", () => {
  beforeEach(() => {
    picker.complete.mockReset();
  });

  it("returns the sources the picker chose, as full citations", async () => {
    const candidates = pickerCandidates(getPhilosopher("sartre")!);
    const ego = candidates.find((c) => c.label.includes("Formal Presence of the I"))!;
    picker.complete.mockResolvedValue(`["${ego.key}"]`);

    const response = await POST(request(exchange));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sources: [
        {
          id: ego.id,
          kind: "section_summary",
          label: ego.label,
          text: ego.text,
          status: "agent-verified",
        },
      ],
    });
  });

  it("gives the picker every candidate in the cacheable system half, and the exchange as data", async () => {
    picker.complete.mockResolvedValue("[]");
    await POST(request(exchange));

    const call = picker.complete.mock.calls[0][0];
    const candidates = pickerCandidates(getPhilosopher("sartre")!);
    for (const candidate of candidates) {
      expect(call.system).toContain(`[${candidate.key}] ${candidate.label}`);
    }
    // Per-call content stays out of `system`, so the cached prefix is stable.
    expect(call.system).not.toContain(exchange.question);
    expect(call.systemSuffix).toBeUndefined();
    expect(call.messages).toEqual([
      { role: "user", content: expect.stringContaining(exchange.reply) },
    ]);
  });

  it("shows no sources, rather than failing, when the picker errors", async () => {
    picker.complete.mockRejectedValue(new Error("upstream 529"));
    const response = await POST(request(exchange));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sources: [] });
  });

  it("rejects a philosopher outside the demo roster", async () => {
    const response = await POST(request({ ...exchange, philosopherId: "nobody" }));
    expect(response.status).toBe(404);
    expect(picker.complete).not.toHaveBeenCalled();
  });

  it("rejects a request without the reply to classify", async () => {
    const response = await POST(request({ philosopherId: "sartre", question: "Hi" }));
    expect(response.status).toBe(400);
    expect(picker.complete).not.toHaveBeenCalled();
  });
});
