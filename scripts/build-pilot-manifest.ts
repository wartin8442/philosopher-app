import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildPilotManifest } from "./pilot-manifest";

const projectRoot = path.join(__dirname, "..");
const outputPath = path.join(projectRoot, "data", "rag", "eval", "pilot-manifest.json");
const manifest = buildPilotManifest(projectRoot);
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (existsSync(outputPath)) {
  const frozen = readFileSync(outputPath, "utf8");
  if (frozen !== serialized) {
    throw new Error(
      `Refusing to overwrite frozen pilot manifest ${outputPath}; review the discrepancy and version it explicitly.`,
    );
  }
} else {
  writeFileSync(outputPath, serialized, { flag: "wx" });
}
console.log(
  `Verified frozen ${manifest.pilot_id}: ${manifest.summary.selected_questions} questions; ` +
    `${manifest.summary.relevant_corpus_empty} empty-support; ${manifest.projected_usage.total_external_calls} projected external calls.`,
);
