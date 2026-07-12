/**
 * Proof-of-concept: watch LLM tokens arrive as a stream.
 *
 * Run from the project root:  npx tsx scripts/stream-demo.ts
 *
 * Prints each text fragment the moment it arrives, with timing markers for
 * the first fragment (time-to-first-token) vs. the complete reply. The gap
 * between those two numbers is the silence the streaming pipeline removes.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getLLMProvider } from "../src/lib/providers/llm";

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
  const provider = getLLMProvider();
  console.log(`Provider: ${provider.name}. Asking a question...\n`);

  const start = Date.now();
  let firstFragmentMs: number | null = null;

  const fragments = provider.stream({
    system:
      "You are Marcus Aurelius speaking aloud in a voice conversation. First person, warm, plainspoken, one short paragraph.",
    messages: [{ role: "user", content: "Why should I not fear death?" }],
    maxTokens: 300,
  });

  for await (const fragment of fragments) {
    if (firstFragmentMs === null) {
      firstFragmentMs = Date.now() - start;
      console.log(`--- first fragment after ${firstFragmentMs}ms ---`);
    }
    process.stdout.write(fragment);
  }

  const totalMs = Date.now() - start;
  console.log(`\n--- complete after ${totalMs}ms ---`);
  console.log(
    `\nWith the old complete() call, the user would have heard NOTHING for ${totalMs}ms.` +
      `\nWith streaming, usable text existed after ${firstFragmentMs}ms.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
