/**
 * Dead-air latency smoke check.
 *
 * Provider-only:
 *   npx tsx scripts/dead-air-check.ts
 *
 * With a running app server:
 *   npx tsx scripts/dead-air-check.ts --base-url=http://127.0.0.1:3000
 *   BASE_URL=http://127.0.0.1:3000 npx tsx scripts/dead-air-check.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getPhilosopher } from "../src/lib/philosophers";
import { getLLMProvider } from "../src/lib/providers/llm";
import { retrieveSources } from "../src/lib/retrieval";
import { warmEmbedder } from "../src/lib/embeddings";

function loadEnvLocal() {
  const envFile = path.join(process.cwd(), ".env.local");
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function baseUrlArg(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--base-url="));
  const value = arg ? arg.slice("--base-url=".length) : process.env.BASE_URL;
  return value ? value.replace(/\/$/, "") : null;
}

async function measureProviderStream() {
  const provider = getLLMProvider();
  const started = Date.now();
  let firstTokenMs: number | null = null;
  let text = "";

  for await (const fragment of provider.stream({
    system:
      "You are Albert Camus speaking aloud in a voice conversation. First person, plainspoken, one short paragraph.",
    messages: [
      {
        role: "user",
        content: "Is life worth living? Answer in two sentences.",
      },
    ],
    maxTokens: 220,
  })) {
    if (firstTokenMs === null) firstTokenMs = Date.now() - started;
    text += fragment;
  }

  return {
    provider: provider.name,
    firstTokenMs,
    totalMs: Date.now() - started,
    chars: text.length,
  };
}

async function checkRetrieval() {
  await warmEmbedder();
  const philosopher = getPhilosopher("camus");
  if (!philosopher) throw new Error("Missing Camus profile.");
  const started = Date.now();
  const sources = await retrieveSources(philosopher, "Is life worth living?");
  return {
    ms: Date.now() - started,
    sources: sources.map((s) => s.label),
  };
}

interface StreamProbe {
  status: number;
  firstTextMs: number | null;
  totalMs: number;
  eventTypes: string[];
  errors: string[];
}

async function readNdjson(res: Response): Promise<StreamProbe> {
  if (!res.body) {
    return {
      status: res.status,
      firstTextMs: null,
      totalMs: 0,
      eventTypes: [],
      errors: ["Response has no body."],
    };
  }

  const started = Date.now();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let firstTextMs: number | null = null;
  const eventTypes: string[] = [];
  const errors: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as {
        type?: string;
        text?: string;
        error?: string;
      };
      eventTypes.push(event.type ?? "unknown");
      if (event.type === "text" && firstTextMs === null) {
        firstTextMs = Date.now() - started;
      }
      if (event.type === "error") {
        errors.push(event.error ?? "Unknown stream error.");
      }
    }
  }

  return {
    status: res.status,
    firstTextMs,
    totalMs: Date.now() - started,
    eventTypes,
    errors,
  };
}

async function postJson(baseUrl: string, pathName: string, body: object) {
  return fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function checkApi(baseUrl: string) {
  const chat = await readNdjson(
    await postJson(baseUrl, "/api/chat", {
      philosopherId: "camus",
      answerLevel: "beginner",
      messages: [
        {
          role: "user",
          content: "Is life worth living? Answer in two sentences.",
        },
      ],
    }),
  );

  const duelOpening = await readNdjson(
    await postJson(baseUrl, "/api/duel", {
      speakerId: "camus",
      opponentId: "nietzsche",
      topic: "Is life worth living?",
      phase: "opening",
      transcript: [],
      answerLevel: "beginner",
    }),
  );

  const ttsStarted = Date.now();
  const tts = await postJson(baseUrl, "/api/tts", {
    philosopherId: "camus",
    text: "One must imagine Sisyphus happy.",
  });

  return {
    chat,
    duelOpening,
    tts: {
      status: tts.status,
      ms: Date.now() - ttsStarted,
      expectedFallback: !process.env.ELEVENLABS_API_KEY && tts.status === 501,
    },
  };
}

async function main() {
  loadEnvLocal();
  const baseUrl = baseUrlArg();
  const output: Record<string, unknown> = {
    providerStream: await measureProviderStream(),
    retrieval: await checkRetrieval(),
  };

  if (baseUrl) {
    output.api = await checkApi(baseUrl);
  } else {
    output.api = "Skipped. Pass --base-url=http://127.0.0.1:3000 to probe app routes.";
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
