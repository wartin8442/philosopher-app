/**
 * Answer-level comparison harness.
 *
 * Sends the same questions to /api/chat at every answer level and writes a
 * side-by-side markdown report, so changes to ANSWER_LEVEL_INSTRUCTIONS can be
 * judged against real outputs instead of intuition.
 *
 * Usage (dev server must be running):
 *   npx tsx scripts/level-compare.ts
 *   npx tsx scripts/level-compare.ts --base-url=http://127.0.0.1:3000 --out=report.md
 */
import { writeFileSync } from "node:fs";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

/** One substantive question + one self-intro question per philosopher. */
const CASES: { philosopherId: string; questions: string[] }[] = [
  {
    philosopherId: "nietzsche",
    questions: ["Tell me who you are.", "What did you mean when you said God is dead?"],
  },
  {
    philosopherId: "kierkegaard",
    questions: ["Tell me who you are.", "What is the leap of faith?"],
  },
];

function argValue(name: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : fallback;
}

async function askChat(
  baseUrl: string,
  philosopherId: string,
  answerLevel: string,
  question: string,
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      philosopherId,
      answerLevel,
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`/api/chat ${res.status} for ${philosopherId}/${answerLevel}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as { type?: string; text?: string; error?: string };
      if (event.type === "text" && event.text) text += event.text;
      if (event.type === "error") throw new Error(event.error ?? "Stream error");
    }
  }
  return text.trim();
}

function sentenceCount(text: string): number {
  return (text.match(/[.!?](\s|$)/g) ?? []).length;
}

async function main() {
  const baseUrl = argValue("base-url", "http://127.0.0.1:3000").replace(/\/$/, "");
  const outPath = argValue("out", "level-compare-report.md");

  const sections: string[] = [
    "# Answer-level comparison",
    "",
    `Generated ${new Date().toISOString()} against ${baseUrl}`,
    "",
    "Read each question's three answers side by side and ask: could you tell which level",
    "each came from with the labels hidden? Note what actually differs — vocabulary,",
    "assumed background, name-dropping — and what doesn't.",
    "",
  ];

  for (const { philosopherId, questions } of CASES) {
    for (const question of questions) {
      sections.push(`## ${philosopherId}: "${question}"`, "");
      for (const level of LEVELS) {
        process.stderr.write(`${philosopherId} / ${level} / "${question}"...\n`);
        const answer = await askChat(baseUrl, philosopherId, level, question);
        sections.push(
          `### ${level} (${answer.split(/\s+/).length} words, ~${sentenceCount(answer)} sentences)`,
          "",
          answer,
          "",
        );
      }
    }
  }

  writeFileSync(outPath, sections.join("\n"), "utf8");
  console.log(`Report written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
