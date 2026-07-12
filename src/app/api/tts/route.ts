import { NextRequest, NextResponse } from "next/server";
import { getTTSProvider } from "@/lib/providers/tts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TTSBody {
  text: string;
  philosopherId: string;
}

/**
 * Synthesizes speech with the configured provider (ElevenLabs by default).
 *
 * When no provider is configured, returns 501 so the client knows to fall back
 * to the browser's Web Speech API. This keeps voice output working with no
 * setup, and high-quality with a key.
 */
export async function POST(req: NextRequest) {
  const provider = getTTSProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "TTS provider not configured; use browser speech fallback." },
      { status: 501 },
    );
  }

  let body: TTSBody;
  try {
    body = (await req.json()) as TTSBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { text, philosopherId } = body;
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }

  try {
    const { audio, contentType } = await provider.synthesize(
      text,
      philosopherId,
    );
    return new NextResponse(audio, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/tts]", message);
    // Signal the client to fall back to Web Speech rather than failing hard.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
