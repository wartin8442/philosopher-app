/**
 * Builds data/rag/stress/dashboard.html from every per-philosopher
 * results*.json plus the merged question bank (data/rag/eval/questions.json).
 *
 * Run:  npx tsx scripts/build-stress-dashboard.ts
 *
 * The dashboard is one self-contained file (inline CSS/JS, no external
 * requests) that opens straight from disk. Everything is keyed by run
 * condition: when later runs (RAG, hardened-prompt) drop additional
 * results.json files — any file matching data/rag/stress/<philosopher>/
 * results*.json with its own run.condition — they render as side-by-side
 * condition columns with no code changes here.
 *
 * dashboard.html is generated output — rebuild it, never hand-edit it.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..");
const STRESS_DIR = path.join(ROOT, "data", "rag", "stress");
const BANK_PATH = path.join(ROOT, "data", "rag", "eval", "questions.json");
const OUT_PATH = path.join(STRESS_DIR, "dashboard.html");

const SEVERITY_WEIGHTS: Record<string, number> = { critical: 5, major: 2, minor: 1 };

interface BankCheck { id: string; pass_if: string; severity: string }
interface BankQuestion {
  id: string; philosopher: string; question: string; category: string;
  provenance: string; answer_level: string; answer_key: string; source: string;
  checks: BankCheck[]; relevant_corpus: unknown[]; inspired_card: boolean;
  failed_on: string | null;
}
interface ResultCheck {
  id: string; verdict: "pass" | "fail"; evidence_span: string | null;
  why: string; correction_source?: string;
}
interface ProbeResult {
  question_id: string; question_as_asked: string; answer_level: string;
  reply: string; retrieved_sources: { label: string; text: string }[];
  latency_ms: number; checks: ResultCheck[];
}
interface RunFile {
  run: { condition: string; date: string; model: string };
  results: ProbeResult[];
}

// ---- load ----
const bankFile = JSON.parse(readFileSync(BANK_PATH, "utf8"));
const bank: BankQuestion[] = Array.isArray(bankFile) ? bankFile : bankFile.questions;
const bankById = new Map(bank.map((q) => [q.id, q]));

interface LoadedRun { philosopher: string; run: RunFile["run"]; results: ProbeResult[] }
const runs: LoadedRun[] = [];
for (const entry of readdirSync(STRESS_DIR)) {
  const dir = path.join(STRESS_DIR, entry);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) {
    if (!/^results.*\.json$/.test(f)) continue;
    const parsed: RunFile = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    runs.push({ philosopher: entry, run: parsed.run, results: parsed.results });
  }
}
if (runs.length === 0) throw new Error("No results*.json files found under data/rag/stress/*/");

// Conditions become the side-by-side columns; dates/models are annotations.
const conditions = [...new Set(runs.map((r) => r.run.condition))];
const conditionMeta = new Map<string, { dates: Set<string>; models: Set<string> }>();
for (const r of runs) {
  const m = conditionMeta.get(r.run.condition) ?? { dates: new Set(), models: new Set() };
  m.dates.add(r.run.date); m.models.add(r.run.model);
  conditionMeta.set(r.run.condition, m);
}

// ---- assemble per-question view model ----
interface QuestionVM {
  id: string; philosopher: string; category: string; provenance: string;
  answer_level: string; question: string; answer_key: string; source: string;
  inspired_card: boolean;
  perCondition: Record<string, {
    reply: string; latency_ms: number; retrieved_sources: { label: string; text: string }[];
    checks: (ResultCheck & { pass_if: string; severity: string })[];
    anyFail: boolean; worstSeverity: string | null;
  }>;
}
const questions: QuestionVM[] = [];
const missingFromBank: string[] = [];
for (const q of bank) {
  questions.push({
    id: q.id, philosopher: q.philosopher, category: q.category, provenance: q.provenance,
    answer_level: q.answer_level, question: q.question, answer_key: q.answer_key,
    source: q.source, inspired_card: q.inspired_card, perCondition: {},
  });
}
const vmById = new Map(questions.map((q) => [q.id, q]));
const sevRank: Record<string, number> = { critical: 0, major: 1, minor: 2 };
for (const r of runs) {
  for (const res of r.results) {
    const vm = vmById.get(res.question_id);
    const bq = bankById.get(res.question_id);
    if (!vm || !bq) { missingFromBank.push(res.question_id); continue; }
    const checkMeta = new Map(bq.checks.map((c) => [c.id, c]));
    const checks = res.checks.map((c) => ({
      ...c,
      pass_if: checkMeta.get(c.id)?.pass_if ?? "",
      severity: checkMeta.get(c.id)?.severity ?? "minor",
    }));
    const fails = checks.filter((c) => c.verdict === "fail");
    vm.perCondition[r.run.condition] = {
      reply: res.reply, latency_ms: res.latency_ms, retrieved_sources: res.retrieved_sources,
      checks,
      anyFail: fails.length > 0,
      worstSeverity: fails.length
        ? fails.reduce((w, c) => (sevRank[c.severity] < sevRank[w] ? c.severity : w), fails[0].severity)
        : null,
    };
  }
}
if (missingFromBank.length) {
  console.warn(`WARNING: ${missingFromBank.length} results have no bank entry: ${missingFromBank.join(", ")}`);
}

// ---- overview stats ----
interface Tally { pass: number; fail: number }
type SevTally = Record<string, Tally>;
function emptySev(): SevTally { return { critical: { pass: 0, fail: 0 }, major: { pass: 0, fail: 0 }, minor: { pass: 0, fail: 0 } }; }
const philosophers = [...new Set(bank.map((q) => q.philosopher))];
const overview: Record<string, Record<string, { bySev: SevTally; byCat: Record<string, Tally> }>> = {};
for (const cond of conditions) {
  overview[cond] = {};
  for (const p of [...philosophers, "TOTAL"]) overview[cond][p] = { bySev: emptySev(), byCat: {} };
  for (const q of questions) {
    const pc = q.perCondition[cond];
    if (!pc) continue;
    for (const c of pc.checks) {
      const key = c.verdict === "pass" ? "pass" : "fail";
      for (const p of [q.philosopher, "TOTAL"]) {
        overview[cond][p].bySev[c.severity][key]++;
        overview[cond][p].byCat[q.category] = overview[cond][p].byCat[q.category] ?? { pass: 0, fail: 0 };
        overview[cond][p].byCat[q.category][key]++;
      }
    }
  }
}
function weighted(t: SevTally): number {
  let pw = 0, tw = 0;
  for (const [sev, w] of Object.entries(SEVERITY_WEIGHTS)) {
    pw += (t[sev]?.pass ?? 0) * w;
    tw += ((t[sev]?.pass ?? 0) + (t[sev]?.fail ?? 0)) * w;
  }
  return tw ? (100 * pw) / tw : 0;
}

const payload = {
  generated: new Date().toISOString(),
  conditions: conditions.map((c) => ({
    condition: c,
    dates: [...conditionMeta.get(c)!.dates].sort(),
    models: [...conditionMeta.get(c)!.models],
  })),
  philosophers,
  overview,
  weights: SEVERITY_WEIGHTS,
  questions,
};

// ---- render ----
// JSON inside a <script> must not contain a closing tag sequence.
const dataJson = JSON.stringify(payload).replace(/</g, "\\u003c");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Philosopher stress-test dashboard</title>
<style>
  :root {
    --bg: #ffffff; --fg: #1a1a1a; --muted: #666; --line: #ddd;
    --card: #f7f7f7; --mark: #ffd6d6; --mark-fg: #8a0000;
    --pass: #1a7f37; --fail: #b42318; --critical: #b42318; --major: #b25b00; --minor: #8a7000;
    --accent: #2456b0;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14161a; --fg: #e6e6e6; --muted: #9a9a9a; --line: #333;
      --card: #1d2127; --mark: #5a1f1f; --mark-fg: #ffb3b3;
      --pass: #4ac26b; --fail: #ff7b6e; --critical: #ff7b6e; --major: #f0a35c; --minor: #d6c25a;
      --accent: #7aa5f0;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 1.5rem; background: var(--bg); color: var(--fg);
         font: 15px/1.5 system-ui, sans-serif; }
  h1 { font-size: 1.4rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.1rem; margin: 2rem 0 .5rem; }
  .meta { color: var(--muted); font-size: .85rem; margin-bottom: 1rem; }
  .tablewrap { overflow-x: auto; }
  table { border-collapse: collapse; font-size: .85rem; min-width: 100%; }
  th, td { border: 1px solid var(--line); padding: .35rem .6rem; text-align: left; white-space: nowrap; }
  th { background: var(--card); }
  .score { font-weight: 700; }
  .pass { color: var(--pass); } .fail { color: var(--fail); font-weight: 600; }
  .sev-critical { color: var(--critical); font-weight: 700; }
  .sev-major { color: var(--major); font-weight: 600; }
  .sev-minor { color: var(--minor); }
  .filters { display: flex; flex-wrap: wrap; gap: .6rem 1.2rem; margin: .75rem 0 1rem;
             padding: .75rem; background: var(--card); border: 1px solid var(--line); border-radius: 8px; }
  .filters label { font-size: .8rem; color: var(--muted); display: block; }
  .filters select { font: inherit; background: var(--bg); color: var(--fg);
                    border: 1px solid var(--line); border-radius: 4px; padding: .15rem .3rem; }
  .count { color: var(--muted); font-size: .85rem; margin: .5rem 0; }
  details.q { border: 1px solid var(--line); border-radius: 8px; margin: .6rem 0; background: var(--bg); }
  details.q > summary { cursor: pointer; padding: .6rem .8rem; display: flex; flex-wrap: wrap;
                        gap: .5rem; align-items: baseline; list-style: none; }
  details.q > summary::-webkit-details-marker { display: none; }
  details.q[open] > summary { border-bottom: 1px solid var(--line); }
  .qid { font-family: ui-monospace, monospace; color: var(--accent); }
  .tag { font-size: .72rem; border: 1px solid var(--line); border-radius: 999px;
         padding: .05rem .5rem; color: var(--muted); }
  .tag.failtag { border-color: var(--fail); color: var(--fail); font-weight: 600; }
  .tag.contam { border-color: var(--major); color: var(--major); }
  .qtext { flex: 1 1 100%; }
  .body { padding: .8rem; }
  .cond { border: 1px solid var(--line); border-radius: 6px; margin: .6rem 0; }
  .cond > .condhead { padding: .4rem .7rem; background: var(--card); font-size: .8rem;
                      display: flex; gap: 1rem; flex-wrap: wrap; }
  .cols { display: flex; flex-wrap: wrap; gap: 1rem; padding: .7rem; }
  .reply { flex: 2 1 26rem; min-width: 0; white-space: pre-wrap; overflow-wrap: break-word;
           background: var(--card); border-radius: 6px; padding: .7rem; font-size: .9rem; }
  .reply mark { background: var(--mark); color: var(--mark-fg); border-radius: 3px; padding: 0 2px; }
  .checks { flex: 1 1 20rem; min-width: 0; font-size: .82rem; }
  .check { border-left: 3px solid var(--line); padding: .3rem .6rem; margin: .4rem 0; }
  .check.fail { border-left-color: var(--fail); }
  .check.pass { border-left-color: var(--pass); }
  .check .why { color: var(--muted); }
  .check .missing { color: var(--fail); }
  .check .src { color: var(--muted); font-style: italic; }
  .keybox, .sources { font-size: .82rem; color: var(--muted); margin: .3rem 0 .5rem; }
  .keybox b { color: var(--fg); }
  code { font-family: ui-monospace, monospace; font-size: .85em; }
</style>
</head>
<body>
<h1>Philosopher stress-test dashboard</h1>
<div class="meta" id="meta"></div>

<h2>Overview</h2>
<div class="tablewrap" id="overview"></div>
<div class="tablewrap" id="categories" style="margin-top:1rem"></div>

<h2>Questions</h2>
<div class="filters" id="filters"></div>
<div class="count" id="count"></div>
<div id="list"></div>

<script id="data" type="application/json">${dataJson}</script>
<script>
const DATA = JSON.parse(document.getElementById("data").textContent);
const SEVS = ["critical", "major", "minor"];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function weighted(t) {
  let pw = 0, tw = 0;
  for (const s of SEVS) {
    const w = DATA.weights[s], x = t[s] || { pass: 0, fail: 0 };
    pw += x.pass * w; tw += (x.pass + x.fail) * w;
  }
  return tw ? (100 * pw / tw).toFixed(1) + "%" : "–";
}

// ---- meta ----
document.getElementById("meta").textContent =
  "Generated " + DATA.generated + " · conditions: " +
  DATA.conditions.map(c => c.condition + " (" + c.dates.join(", ") + "; " + c.models.join(", ") + ")").join(" · ") +
  " · severity weights c/m/n = " + SEVS.map(s => DATA.weights[s]).join("/");

// ---- overview table: rows philosophers, per-condition column groups ----
(function renderOverview() {
  const conds = DATA.conditions.map(c => c.condition);
  let h = "<table><thead><tr><th rowspan=2>Philosopher</th>";
  for (const c of conds) h += '<th colspan="5">' + esc(c) + "</th>";
  h += "</tr><tr>";
  for (const c of conds) h += "<th>critical</th><th>major</th><th>minor</th><th>total</th><th>weighted</th>";
  h += "</tr></thead><tbody>";
  for (const p of [...DATA.philosophers, "TOTAL"]) {
    h += "<tr><td" + (p === "TOTAL" ? ' style="font-weight:700"' : "") + ">" + esc(p) + "</td>";
    for (const c of conds) {
      const o = DATA.overview[c][p];
      let tp = 0, tf = 0;
      for (const s of SEVS) {
        const x = o.bySev[s];
        tp += x.pass; tf += x.fail;
        h += "<td><span class=pass>" + x.pass + "</span>/<span class=" + (x.fail ? "fail" : "pass") + ">" + (x.pass + x.fail) + "</span></td>";
      }
      h += "<td>" + tp + "/" + (tp + tf) + "</td><td class=score>" + weighted(o.bySev) + "</td>";
    }
    h += "</tr>";
  }
  h += "</tbody></table>";
  document.getElementById("overview").innerHTML = h;
})();

// ---- category breakdown table ----
(function renderCats() {
  const conds = DATA.conditions.map(c => c.condition);
  const cats = [...new Set(DATA.questions.map(q => q.category))];
  let h = "<table><thead><tr><th>Philosopher</th>";
  for (const c of conds) for (const cat of cats) h += "<th>" + esc(cat) + (conds.length > 1 ? "<br><small>" + esc(c) + "</small>" : "") + "</th>";
  h += "</tr></thead><tbody>";
  for (const p of [...DATA.philosophers, "TOTAL"]) {
    h += "<tr><td" + (p === "TOTAL" ? ' style="font-weight:700"' : "") + ">" + esc(p) + "</td>";
    for (const c of conds) for (const cat of cats) {
      const x = DATA.overview[c][p].byCat[cat];
      h += x ? "<td><span class=pass>" + x.pass + "</span>/<span class=" + (x.fail ? "fail" : "pass") + ">" + (x.pass + x.fail) + "</span></td>" : "<td>–</td>";
    }
    h += "</tr>";
  }
  h += "</tbody></table><div class=count>Cells are checks passed / total per category.</div>";
  document.getElementById("categories").innerHTML = h;
})();

// ---- filters ----
const state = { philosopher: "", category: "", verdict: "", severity: "", provenance: "", condition: "" };
(function renderFilters() {
  const defs = [
    ["philosopher", ["", ...DATA.philosophers]],
    ["category", ["", ...new Set(DATA.questions.map(q => q.category))]],
    ["verdict", ["", "fail", "pass"]],
    ["severity", ["", ...SEVS]],
    ["provenance", ["", ...new Set(DATA.questions.map(q => q.provenance))]],
    ["condition", ["", ...DATA.conditions.map(c => c.condition)]],
  ];
  const wrap = document.getElementById("filters");
  for (const [name, opts] of defs) {
    const lab = document.createElement("label");
    lab.textContent = name + (name === "severity" ? " (of failures)" : "");
    const sel = document.createElement("select");
    for (const o of opts) {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o === "" ? "all" : o;
      sel.appendChild(opt);
    }
    sel.onchange = () => { state[name] = sel.value; renderList(); };
    lab.appendChild(sel);
    wrap.appendChild(lab);
  }
})();

function highlight(reply, spans) {
  // Highlight each failed evidence span in place (first occurrence).
  const marks = []; // [start, end]
  for (const sp of spans) {
    if (!sp) continue;
    const i = reply.indexOf(sp);
    if (i >= 0) marks.push([i, i + sp.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  let out = "", pos = 0;
  for (const [s, e] of marks) {
    if (s < pos) continue; // overlapping — skip
    out += esc(reply.slice(pos, s)) + "<mark>" + esc(reply.slice(s, e)) + "</mark>";
    pos = e;
  }
  return out + esc(reply.slice(pos));
}

function condBlock(q, cond) {
  const pc = q.perCondition[cond];
  if (!pc) return "";
  const failSpans = pc.checks.filter(c => c.verdict === "fail").map(c => c.evidence_span);
  let h = '<div class="cond"><div class="condhead"><span><b>' + esc(cond) + "</b></span>" +
    "<span>latency " + pc.latency_ms + " ms</span>" +
    "<span>sources: " + (pc.retrieved_sources.length ? esc(pc.retrieved_sources.map(s => s.label).join("; ")) : "<i>none retrieved</i>") + "</span></div>";
  h += '<div class="cols"><div class="reply">' + highlight(pc.reply, failSpans) + "</div>";
  h += '<div class="checks">';
  for (const c of pc.checks) {
    h += '<div class="check ' + c.verdict + '"><div><b class="' + (c.verdict === "fail" ? "fail" : "pass") + '">' +
      c.verdict.toUpperCase() + "</b> <span class=\\"sev-" + esc(c.severity) + "\\">[" + esc(c.severity) + "]</span> " +
      "<code>" + esc(c.id) + "</code></div>" +
      "<div>" + esc(c.pass_if) + "</div>" +
      '<div class="why">' + esc(c.why) + "</div>";
    if (c.verdict === "fail" && c.evidence_span == null)
      h += '<div class="missing">Omission — the reply never states the required fact (see “why” above).</div>';
    if (c.verdict === "fail" && c.correction_source)
      h += '<div class="src">Correction source: ' + esc(c.correction_source) + "</div>";
    h += "</div>";
  }
  h += "</div></div></div>";
  return h;
}

function renderList() {
  const conds = state.condition ? [state.condition] : DATA.conditions.map(c => c.condition);
  const shown = DATA.questions.filter(q => {
    if (state.philosopher && q.philosopher !== state.philosopher) return false;
    if (state.category && q.category !== state.category) return false;
    if (state.provenance && q.provenance !== state.provenance) return false;
    const pcs = conds.map(c => q.perCondition[c]).filter(Boolean);
    if (!pcs.length) return false;
    if (state.verdict === "fail" && !pcs.some(pc => pc.anyFail)) return false;
    if (state.verdict === "pass" && pcs.some(pc => pc.anyFail)) return false;
    if (state.severity && !pcs.some(pc => pc.checks.some(c => c.verdict === "fail" && c.severity === state.severity))) return false;
    return true;
  });
  const anyFail = (q) => conds.some(c => q.perCondition[c] && q.perCondition[c].anyFail);
  document.getElementById("count").textContent =
    shown.length + " question(s) · " + shown.filter(anyFail).length + " with failures (expanded by default)";
  const out = [];
  for (const q of shown) {
    const failed = anyFail(q);
    const worst = conds.map(c => q.perCondition[c]?.worstSeverity).filter(Boolean)
      .sort((a, b) => SEVS.indexOf(a) - SEVS.indexOf(b))[0];
    out.push('<details class="q"' + (failed ? " open" : "") + ">" +
      '<summary><span class="qid">' + esc(q.id) + "</span>" +
      '<span class="tag">' + esc(q.philosopher) + "</span>" +
      '<span class="tag">' + esc(q.category) + "</span>" +
      '<span class="tag">' + esc(q.provenance) + "</span>" +
      '<span class="tag">' + esc(q.answer_level) + "</span>" +
      (q.inspired_card ? '<span class="tag contam">inspired_card</span>' : "") +
      (failed ? '<span class="tag failtag">FAIL' + (worst ? " · " + esc(worst) : "") + "</span>" : '<span class="tag">all pass</span>') +
      '<span class="qtext">' + esc(q.question) + "</span></summary>" +
      '<div class="body"><div class="keybox"><b>Answer key:</b> ' + esc(q.answer_key) +
      " <b>Source:</b> " + esc(q.source) + "</div>" +
      conds.map(c => condBlock(q, c)).join("") +
      "</div></details>");
  }
  document.getElementById("list").innerHTML = out.join("");
}
renderList();
</script>
</body>
</html>
`;

writeFileSync(OUT_PATH, html);
const failCount = questions.filter((q) => Object.values(q.perCondition).some((pc) => pc.anyFail)).length;
console.log(`dashboard.html written (${(statSync(OUT_PATH).size / 1024).toFixed(0)} KB)`);
console.log(`conditions: ${conditions.join(", ")} · questions: ${questions.length} · with failures: ${failCount}`);
