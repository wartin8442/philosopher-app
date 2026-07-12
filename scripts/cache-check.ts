/**
 * Proof that Anthropic prompt caching engages for the persona prefix.
 *
 * Run from the project root:  npx tsx scripts/cache-check.ts
 *
 * Sends two requests with the same stable persona prefix but a different
 * question and a different grounding suffix (exactly what production traffic
 * looks like). If caching works, call 1 reports cache_written > 0 and call 2
 * reports cache_read > 0 — meaning the persona was processed once, not twice.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "../src/lib/providers/llm";
import { getPhilosopher } from "../src/lib/philosophers";

// Next.js loads .env.local into process.env automatically when the app runs;
// standalone scripts have to do it themselves.
const envFile = path.join(process.cwd(), ".env.local");
for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const match = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.LLM_MODEL || "claude-opus-4-8";
  const philosopher = getPhilosopher("aquinas")!;
  const { system } = buildSystemPrompt({
    philosopher,
    answerLevel: "intermediate",
  });

  const call = async (label: string, question: string, grounding: string) => {
    const res = await client.messages.create({
      model,
      max_tokens: 32,
      system: [
        { type: "text", text: system, cache_control: { type: "ephemeral" } },
        { type: "text", text: grounding },
      ],
      messages: [{ role: "user", content: question }],
    });
    const u = res.usage;
    console.log(
      `${label}: input=${u.input_tokens} cache_written=${u.cache_creation_input_tokens} cache_read=${u.cache_read_input_tokens}`,
    );
  };

  await call("call 1", "What is virtue?", "Grounding note A: virtue as habit.");
  await call("call 2", "What is law?", "Grounding note B: the four kinds of law.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
