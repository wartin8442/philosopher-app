/**
 * Generates the answer-key audit worksheet from the frozen pilot manifest.
 *
 *   npx tsx scripts/build-answer-key-audit.ts
 *   -> data/rag/review/answer-key-audit.md
 *
 * Why this exists: the exam's ground truth has never been independently
 * checked, and auditing exactly one quote (nz-19) overturned the single most
 * load-bearing question in it — the project's only baseline critical failure.
 * Every downstream number inherits whatever else is wrong in there.
 *
 * Generated rather than hand-written because transcribing 27 answer keys by
 * hand is the same error class being audited. Reads the frozen manifest and
 * mutates nothing.
 *
 * Ticks are NOT preserved across regeneration — record outcomes in
 * `findings` below, which is the durable record.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PilotManifest, FrozenQuestion } from "./pilot-manifest";

const PROJECT_ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data", "rag", "eval", "pilot-manifest.json");
const OUT_PATH = path.join(PROJECT_ROOT, "data", "rag", "review", "answer-key-audit.md");

type Verdict = "holds" | "broken" | "open";

interface Finding {
  verdict: Verdict;
  note: string;
}

/** Audit outcomes established so far. Everything else is untouched. */
const findings: Record<string, Finding> = {
  "aq-14": {
    verdict: "holds",
    note:
      "Verified 2026-07-23 by live search. Ptolemy of Lucca's authorship of De Regimine " +
      "Principum Bk 4 confirmed; his text reads 'a whore acts in the world as the bilge in a " +
      "ship or the sewer in a palace'; Augustine's actual line (De ordine 2.4.12) is 'Remove " +
      "prostitutes from human affairs and you will unsettle everything on account of lusts.'",
  },
  "aq-17": {
    verdict: "holds",
    note:
      "Verified 2026-07-23 by live search. Quote Investigator traces the saying to Franz " +
      "Werfel's The Song of Bernadette (novel 1941; the 1943 film has 'To those who believe in " +
      "God, no explanation is necessary; to those who don't, no explanation will suffice'), with " +
      "a November 1945 Schuylkill Haven, PA church notice already crediting Werfel. The " +
      "manifest's own 'SUSPECTED, not verified here' note on the Werfel origin is now " +
      "corroborated. CAVEAT on the epistemics: absence across a corpus the size of Aquinas's " +
      "cannot be shown exhaustively — this key holds because the line has a positive 20th-century " +
      "attribution elsewhere and no scholarly source gives an Aquinas locator, not because the " +
      "Summa was searched end to end.",
  },
  "kg-15": {
    verdict: "holds",
    note:
      "Verified 2026-07-23 by live search. Scholarly consensus that Kierkegaard never wrote a " +
      "phrase translating to 'leap of faith' (McKinnon, Kierkegaardiana; Cambridge Horizons, " +
      "'Johannes Climacus and the Leap to Faith'). 'The leap' is Climacus's, not Kierkegaard's " +
      "own signed vocabulary.",
  },
  "nz-19": {
    verdict: "broken",
    note:
      "ANSWER KEY IS WRONG. The line IS Nietzsche: 'sie trüben alle ihr Gewässer, daß es tief " +
      "scheine' — Also sprach Zarathustra II, 'Von den Dichtern', confirmed verbatim against " +
      "textlog.de and zeno.org on 2026-07-23. The author found Z III 'On the Olive Mount' (a " +
      "weaker analogue) and concluded absence. nz-19-c1 is the project's ONLY baseline critical " +
      "failure: the baseline's attribution ('that line is mine') was CORRECT and only its " +
      "location (Part One, 'On the Rabble' vs. Part Two, 'On the Poets') was wrong. Exclude or " +
      "rewrite; do not tune anything against this question.",
  },
};

const ABSENCE = /no documented source|not by |no source|never (wrote|uses|used)|misattribut|apocryphal|no occurrence|does not appear|fabricat|no genuine location|absent from/i;
const LOCATOR = /\b(q\.\s?\d|a\.\s?\d|§|ST I|SCG|Part [IVX]+|\d{4}|ch\.\s?\d|sec(?:tion)?\.?\s?\d)/;

function tierOf(question: FrozenQuestion): 1 | 2 | 3 {
  const haystack = `${question.answer_key} ${question.source}`;
  if (ABSENCE.test(haystack)) return 1;
  if (LOCATOR.test(haystack)) return 2;
  return 3;
}

function provenance(question: FrozenQuestion): string {
  const source = question.source ?? "";
  const tags: string[] = [];
  if (/wikiquote/i.test(source)) tags.push("**Wikiquote — weakest**");
  if (/\bPG\s?#?\d|Gutenberg/i.test(source)) tags.push("primary text (Gutenberg)");
  if (/\bSEP\b|Stanford/i.test(source)) tags.push("SEP");
  if (/\bIEP\b/i.test(source)) tags.push("IEP");
  if (/corpus|quote bank|trap appendix|stress-test/i.test(source)) tags.push("**project-internal — circular**");
  if (/primary text/i.test(source)) tags.push("primary text");
  return tags.length ? tags.join(", ") : "unclassified";
}

const TIER_HEADINGS: Record<number, { title: string; blurb: string }> = {
  1: {
    title: "Tier 1 — claims that something does NOT exist",
    blurb:
      "Highest risk, and the tier that already failed. An absence claim can only be established " +
      "by searching the whole corpus; a Wikiquote 'Misattributed' tag is not evidence, and the " +
      "editors themselves apply it inconsistently. nz-19 failed exactly here: the author " +
      "verified a *related* passage and inferred absence without searching for the real one. " +
      "**Search the primary text for the distinctive noun, in translation AND in the original " +
      "language, before accepting any of these.**",
  },
  2: {
    title: "Tier 2 — checkable locators, dates, and named specifics",
    blurb:
      "Falsifiable against a named source: section numbers, dates, titles, who said what. Open " +
      "the cited work and confirm the locator resolves to the claimed content. Cheap to check, " +
      "and wrong-locator errors are the failure mode the baseline actually committed.",
  },
  3: {
    title: "Tier 3 — interpretive claims",
    blurb:
      "Not falsifiable the way the tiers above are, but still auditable for one thing: does the " +
      "cited SEP/IEP section actually support the reading, or has it been sharpened into a " +
      "harder claim than the source makes? Also check the `pass_if` wording is not stricter " +
      "than the answer key it derives from.",
  },
};

function render(manifest: PilotManifest): string {
  const lines: string[] = [];
  const questions = [...manifest.questions].sort((left, right) => {
    const tierDelta = tierOf(left) - tierOf(right);
    return tierDelta !== 0 ? tierDelta : left.id.localeCompare(right.id);
  });

  const counts = { 1: 0, 2: 0, 3: 0 } as Record<number, number>;
  for (const question of questions) counts[tierOf(question)]++;
  const resolved = Object.keys(findings).length;

  lines.push(
    "# Answer-key audit worksheet",
    "",
    `Generated from \`data/rag/eval/pilot-manifest.json\` (${questions.length} questions, ` +
      `${questions.reduce((sum, q) => sum + q.checks.length, 0)} checks). ` +
      "Regenerate with `npx tsx scripts/build-answer-key-audit.ts`.",
    "",
    "**The exam grades the app, but nothing grades the exam.** This worksheet exists because " +
      "auditing one quote overturned `nz-19`, the single baseline critical failure and the " +
      "concrete justification for the whole RAG effort. Until this is finished, treat the " +
      "95.3% headline, the A/B deltas, and any go/no-go as provisional.",
    "",
    `Status: **${resolved} of ${questions.length} audited** ` +
      `(${Object.values(findings).filter((f) => f.verdict === "holds").length} hold, ` +
      `${Object.values(findings).filter((f) => f.verdict === "broken").length} broken).`,
    "",
    "## Method",
    "",
    "For each question, answer three questions in order:",
    "",
    "1. **Does the cited source actually say this?** Open it. Do not rely on the summary in the",
    "   `source` field — that field is a claim, not evidence.",
    "2. **Is the answer key true?** A source can be faithfully summarised and still wrong.",
    "   nz-19's Wikiquote citation was reported accurately; Wikiquote was mistaken.",
    "3. **Do the `pass_if` checks follow from the key?** A correct key with an over-strict check",
    "   still fails correct answers. Check severity too — `critical` should mean a real",
    "   fabrication, not a wrong section number.",
    "",
    "### Source reliability, worst to best",
    "",
    "| Provenance | Trust | Why |",
    "| --- | --- | --- |",
    "| Project-internal (quote bank, trap appendix) | Lowest | Circular — the corpus is the thing under test. `sartre-q35` rests on this. |",
    "| Wikiquote | Low | `Misattributed`/`Disputed` tags are applied inconsistently by editors' own admission. Broke nz-19. Read the talk page evidence, never the tag. |",
    "| SEP / IEP | Good | Peer-reviewed, but tertiary — they summarise, and can compress or mislabel (see kg-30's own note about the works index). |",
    "| Primary text | Best | The only thing that settles an absence claim. |",
    "",
    "### Verified reference pointers",
    "",
    "Confirmed 2026-07-23 — use these rather than the manifest's shorthand:",
    "",
    "- Gutenberg #1998 — *Thus Spake Zarathustra*, Common translation. Confirmed.",
    "- Gutenberg #4363 — *Beyond Good and Evil*, Helen Zimmern. Confirmed.",
    "- Gutenberg #52881 — *The Joyful Wisdom* (*The Gay Science*). Confirmed, but translated by",
    "  **Cohn, Common and Petre**, ed. Levy — the manifest's \"Common trans.\" is loose. If a key",
    "  rests on exact wording from this volume, confirm which translator rendered that passage.",
    "- German Nietzsche text: textlog.de and zeno.org both carry *Also sprach Zarathustra* in full",
    "  and agree verbatim. Use these for absence claims — an English-only search is what missed",
    "  the Zarathustra passage in nz-19.",
    "- Already ingested locally: `data/rag/texts/nietzsche-beyond-good-and-evil-zimmern/`",
    "  (297 chunks, preface + §§1-296) — grep this before searching the web for any BGE claim.",
    "- SEP entries live at `plato.stanford.edu/entries/<philosopher>/`. **IEP slugs could not be",
    "  verified** and have changed over time (Camus is `iep.utm.edu/albert-camus/`, not the older",
    "  `/camus-2/`); navigate from `iep.utm.edu` rather than trusting a remembered URL.",
    "",
    "### Per-tier counts",
    "",
    `- Tier 1 (absence claims): **${counts[1]}**`,
    `- Tier 2 (checkable specifics): **${counts[2]}**`,
    `- Tier 3 (interpretive): **${counts[3]}**`,
    "",
  );

  let currentTier = 0;
  for (const question of questions) {
    const tier = tierOf(question);
    if (tier !== currentTier) {
      currentTier = tier;
      lines.push("---", "", `## ${TIER_HEADINGS[tier].title}`, "", TIER_HEADINGS[tier].blurb, "");
    }

    const finding = findings[question.id];
    const mark = finding?.verdict === "holds" ? "x" : " ";
    const banner = finding
      ? finding.verdict === "broken"
        ? "> 🔴 **BROKEN — do not use.** "
        : "> ✅ **Audited, holds.** "
      : null;

    lines.push(
      `### [${mark}] \`${question.id}\` — ${question.philosopher} · ${question.category}`,
      "",
      ...(banner ? [`${banner}${finding!.note}`, ""] : []),
      `**Asked:** ${question.question}`,
      "",
      `**Answer key:** ${question.answer_key.replace(/\s+/g, " ")}`,
      "",
      `**Claimed source:** ${question.source}`,
      "",
      `**Provenance:** ${provenance(question)}`,
      "",
      "**Checks:**",
      "",
      ...question.checks.map((check) => `- \`${check.id}\` *(${check.severity})* — ${check.pass_if}`),
      "",
    );
  }

  lines.push(
    "---",
    "",
    "## Recording outcomes",
    "",
    "Add an entry to `findings` in `scripts/build-answer-key-audit.ts` and regenerate. Ticks in",
    "this file are not preserved — the script is the durable record, so an audit result survives",
    "regeneration and is reviewable in a diff.",
    "",
    "Do **not** edit `data/rag/eval/questions.json` or the pilot manifest. They are frozen, their",
    "hashes anchor every prior run, and correcting them in place would silently invalidate the",
    "comparability of r1-r10. A broken key is recorded here and excluded from analysis; fixing it",
    "belongs to a new, separately versioned question set.",
    "",
  );

  return lines.join("\n");
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as PilotManifest;
mkdirSync(path.dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, render(manifest), "utf8");
console.log(`Wrote ${path.relative(PROJECT_ROOT, OUT_PATH)}`);
