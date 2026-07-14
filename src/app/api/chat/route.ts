import { NextRequest, NextResponse } from "next/server";
import { getPhilosopher } from "@/lib/philosophers";
import { getWorkBySlug } from "@/lib/profiles";
import {
  buildSystemPrompt,
  getLLMProvider,
  workFocusInstruction,
} from "@/lib/providers/llm";
import { formatGrounding, retrieveSources } from "@/lib/retrieval";
import { AnswerLevel, ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  philosopherId: string;
  messages: ChatMessage[];
  answerLevel?: AnswerLevel;
  /** Slug of one of the philosopher's works to focus the conversation on. */
  workSlug?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { philosopherId, messages, answerLevel = "intermediate" } = body;

  const philosopher = getPhilosopher(philosopherId);
  if (!philosopher) {
    return NextResponse.json(
      { error: `Unknown philosopher: ${philosopherId}` },
      { status: 404 },
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array." },
      { status: 400 },
    );
  }

  // Optional work focus ("Explore this work"): must name a real work of this
  // philosopher. The client only sends slugs it resolved itself, so a miss is
  // a bug or a tampered request — reject rather than silently going general.
  const work = body.workSlug
    ? getWorkBySlug(philosopherId, body.workSlug)
    : undefined;
  if (body.workSlug && !work) {
    return NextResponse.json(
      { error: `Unknown work for ${philosopherId}: ${body.workSlug}` },
      { status: 400 },
    );
  }

  // Lightweight retrieval on the latest user turn only (hybrid approach): used
  // to ground potentially risky/niche questions, not on every token.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const retrieved = lastUser
    ? await retrieveSources(philosopher, lastUser.content)
    : [];
  const grounding = formatGrounding(retrieved);

  // `system` is the stable, cacheable persona; the grounding and the
  // (dismissable) work focus ride in `systemSuffix` after the cache marker so
  // they can change every turn.
  const { system, systemSuffix } = buildSystemPrompt({
    philosopher,
    answerLevel,
    grounding,
    extra: work ? workFocusInstruction(work.title) : undefined,
  });

  let provider;
  try {
    provider = getLLMProvider();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Stream the reply as NDJSON events (one JSON object per line) so the client
  // can render/speak the beginning of the answer while the rest generates.
  // Once streaming starts the 200 status is already sent, so mid-stream
  // failures are delivered in-band as an "error" event.
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      // Sources are known before generation begins — send them immediately so
      // the grounding panel never waits on the model. Never read aloud.
      emit({
        type: "sources",
        sources: retrieved.map(({ label, text }) => ({ label, text })),
      });

      try {
        for await (const text of provider.stream({
          system,
          systemSuffix,
          messages,
          maxTokens: 1024,
        })) {
          emit({ type: "text", text });
        }
        emit({ type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[/api/chat]", message);
        emit({ type: "error", error: message });
      }
      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
