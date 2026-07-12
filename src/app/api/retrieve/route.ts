import { NextRequest, NextResponse } from "next/server";
import { getPhilosopher } from "@/lib/philosophers";
import { retrieveSources } from "@/lib/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RetrieveBody {
  philosopherId: string;
  query: string;
}

/**
 * Prefetch endpoint: the client calls this with the *interim* speech
 * transcript while the user is still talking. The real work is the side
 * effect — retrieveSources() scores and caches the results — so that the
 * /api/chat request for the final transcript finds them already cached and
 * pays zero retrieval latency.
 */
export async function POST(req: NextRequest) {
  let body: RetrieveBody;
  try {
    body = (await req.json()) as RetrieveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { philosopherId, query } = body;
  const philosopher = getPhilosopher(philosopherId);
  if (!philosopher) {
    return NextResponse.json(
      { error: `Unknown philosopher: ${philosopherId}` },
      { status: 404 },
    );
  }
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  const sources = await retrieveSources(philosopher, query.trim());
  return NextResponse.json({
    sources: sources.map(({ label, text }) => ({ label, text })),
  });
}
