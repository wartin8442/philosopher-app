/**
 * Human-review dashboard for pilot/probe records — the finalizing authority
 * over the automated blind judge.
 *
 *   npx tsx scripts/review-server.ts [run-label]
 *   (or set PILOT_RUN_LABEL; defaults to the runner's committed label)
 *
 * A local `node:http` server rather than a generated static file, because
 * decisions must persist the moment they are made — a static page cannot write
 * `data/rag/review/decisions/<label>.json`, and a download-then-merge step is
 * exactly the kind of ceremony this refactor is removing. No new dependency,
 * no external network, one command.
 *
 * One record at a time, keyboard-driven. Per check the reviewer answers two
 * separate questions (agree with the verdict / is the evidence probative) —
 * see the rationale in scripts/review-records.ts.
 */
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadPilotManifest } from "./pilot-harness";
import {
  buildReviewRecords,
  decisionKey,
  decisionsPath,
  loadDecisions,
  summarizeProgress,
  validateDecision,
  type DecisionFile,
} from "./review-records";

const PROJECT_ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data", "rag", "eval", "pilot-manifest.json");
const RUN_LABEL = process.argv[2] ?? process.env.PILOT_RUN_LABEL ?? "rag-gate3-pilot-v1-r10";
const PORT = Number(process.env.REVIEW_PORT ?? 4321);

function saveDecisions(decisions: DecisionFile): void {
  const target = decisionsPath(PROJECT_ROOT, RUN_LABEL);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(decisions, null, 2)}\n`, "utf8");
}

function payload() {
  const manifest = loadPilotManifest(MANIFEST_PATH);
  const records = buildReviewRecords(PROJECT_ROOT, RUN_LABEL, manifest);
  return { runLabel: RUN_LABEL, records, progress: summarizeProgress(records) };
}

const PAGE = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pilot human review</title>
<style>
  :root { color-scheme: light dark; --line:#8883; --deny:#c0392b; --ok:#1e8449; }
  * { box-sizing: border-box; }
  body { font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 1.5rem;
         max-width: 60rem; margin-inline: auto; }
  header { display:flex; gap:1rem; align-items:baseline; flex-wrap:wrap;
           border-bottom:1px solid var(--line); padding-bottom:.75rem; margin-bottom:1rem; }
  h1 { font-size:1.1rem; margin:0; }
  .muted { opacity:.65; font-size:.85rem; }
  nav { display:flex; gap:.5rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap; }
  button { font:inherit; padding:.35rem .7rem; border:1px solid var(--line); border-radius:6px;
           background:transparent; color:inherit; cursor:pointer; }
  button[aria-pressed="true"] { border-color:currentColor; font-weight:600; }
  button.deny[aria-pressed="true"] { color:var(--deny); }
  button.ok[aria-pressed="true"] { color:var(--ok); }
  section { border:1px solid var(--line); border-radius:8px; padding:1rem; margin-bottom:1rem; }
  .reply { white-space:pre-wrap; background:#8881; padding:.75rem; border-radius:6px;
           max-height:22rem; overflow:auto; }
  mark { background:#f5c34288; color:inherit; }
  .check { border-top:1px solid var(--line); padding-top:.85rem; margin-top:.85rem; }
  .row { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; margin:.4rem 0; }
  .row > span:first-child { min-width:9rem; opacity:.7; font-size:.85rem; }
  .verdict { font-weight:600; }
  .fail { color:var(--deny); } .pass { color:var(--ok); }
  textarea { width:100%; font:inherit; padding:.4rem; border:1px solid var(--line);
             border-radius:6px; background:transparent; color:inherit; min-height:3rem; }
  .pending { outline:2px solid #f5c34288; }
  .none { opacity:.6; font-style:italic; }
</style></head><body>
<header>
  <h1>Human review</h1>
  <span class="muted" id="label"></span>
  <span class="muted" id="progress"></span>
</header>
<nav>
  <button id="prev">&larr; Prev</button>
  <span class="muted" id="position"></span>
  <button id="next">Next &rarr;</button>
  <button id="nextUndecided">Next undecided</button>
</nav>
<div id="root"></div>
<script>
let data = { records: [], progress: {} }, index = 0;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => (
  { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));

function highlight(reply, spans) {
  let html = esc(reply);
  for (const span of spans.filter(Boolean)) {
    const needle = esc(span);
    if (needle && html.includes(needle)) html = html.split(needle).join("<mark>" + needle + "</mark>");
  }
  return html;
}

function render() {
  const record = data.records[index];
  const root = document.getElementById("root");
  document.getElementById("label").textContent = data.runLabel;
  const p = data.progress;
  document.getElementById("progress").textContent =
    p.decided + "/" + p.checks + " checks decided · " + p.disagreed +
    " verdicts disputed · " + p.not_probative + " evidence spans rejected";
  if (!record) { root.innerHTML = "<p class='none'>No cached records found for this run label.</p>"; return; }
  document.getElementById("position").textContent = (index + 1) + " of " + data.records.length;

  root.innerHTML =
    "<section>" +
      "<div class='muted'>" + esc(record.record_id) + " · condition " + esc(record.condition) +
        " · " + esc(record.philosopher) +
        " · retrieved: " + (record.retrieved_source_ids.length
          ? esc(record.retrieved_source_ids.join(", ")) : "<span class='none'>nothing</span>") +
      "</div>" +
      "<p><strong>Q.</strong> " + esc(record.question) + "</p>" +
      "<div class='reply'>" + highlight(record.reply, record.checks.map((c) => c.evidence_span)) + "</div>" +
      record.checks.map(renderCheck).join("") +
    "</section>";

  for (const button of root.querySelectorAll("button[data-check]")) {
    button.addEventListener("click", () => choose(button));
  }
}

function renderCheck(check, i) {
  const d = check.decision || {};
  const pressed = (field, value) => d[field] === value ? ' aria-pressed="true"' : ' aria-pressed="false"';
  return "<div class='check" + (check.decision ? "" : " pending") + "' data-i='" + i + "'>" +
    "<div><strong>" + esc(check.id) + "</strong> <span class='muted'>(" + esc(check.severity) + ")</span></div>" +
    "<div class='muted'>Passes if: " + esc(check.pass_if) + "</div>" +
    "<div class='row'><span>Judge said</span> <span class='verdict " + check.judge_verdict + "'>" +
      check.judge_verdict.toUpperCase() + "</span> <span class='muted'>" + esc(check.judge_why) + "</span></div>" +
    "<div class='row'><span>Evidence span</span> " + (check.evidence_span
      ? "<code>" + esc(check.evidence_span) + "</code>"
      : "<span class='none'>none supplied</span>") + "</div>" +
    "<div class='row'><span>1. The verdict is</span>" +
      "<button class='ok' data-check='" + esc(check.id) + "' data-field='verdict' data-value='agree'" +
        pressed("verdict", "agree") + ">Correct</button>" +
      "<button class='deny' data-check='" + esc(check.id) + "' data-field='verdict' data-value='disagree'" +
        pressed("verdict", "disagree") + ">Wrong</button></div>" +
    "<div class='row'><span>2. The evidence is</span>" +
      "<button class='ok' data-check='" + esc(check.id) + "' data-field='evidence' data-value='probative'" +
        pressed("evidence", "probative") + ">Actually probative</button>" +
      "<button class='deny' data-check='" + esc(check.id) + "' data-field='evidence' data-value='not_probative'" +
        pressed("evidence", "not_probative") + ">Real text, doesn't support the check</button>" +
      "<button data-check='" + esc(check.id) + "' data-field='evidence' data-value='no_span'" +
        pressed("evidence", "no_span") + ">No span to judge</button></div>" +
    "<textarea data-reason='" + esc(check.id) + "' placeholder='Reason (required to record any denial)'>" +
      esc(d.reason || "") + "</textarea>" +
  "</div>";
}

function choose(button) {
  const record = data.records[index];
  const check = record.checks.find((c) => c.id === button.dataset.check);
  check.decision = Object.assign({ verdict: null, evidence: null, reason: "" }, check.decision);
  check.decision[button.dataset.field] = button.dataset.value;
  const box = document.querySelector("[data-reason='" + button.dataset.check + "']");
  check.decision.reason = box ? box.value : "";
  render();
  if (check.decision.verdict && check.decision.evidence) submit(record.record_id, check);
}

async function submit(recordId, check) {
  const response = await fetch("/api/decision", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record_id: recordId, check_id: check.id, ...check.decision }),
  });
  if (!response.ok) { alert(await response.text()); return; }
  data.progress = (await response.json()).progress;
  render();
}

async function load() {
  data = await (await fetch("/api/records")).json();
  render();
}

const move = (delta) => {
  index = Math.min(data.records.length - 1, Math.max(0, index + delta));
  render();
};
document.getElementById("prev").onclick = () => move(-1);
document.getElementById("next").onclick = () => move(1);
document.getElementById("nextUndecided").onclick = () => {
  const at = data.records.findIndex((r, i) => i > index && r.checks.some((c) => !c.decision));
  if (at >= 0) { index = at; render(); } else { alert("No undecided record after this one."); }
};
document.addEventListener("keydown", (event) => {
  if (event.target.tagName === "TEXTAREA") return;
  if (event.key === "ArrowLeft") move(-1);
  if (event.key === "ArrowRight") move(1);
});
load();
</script></body></html>`;

function readBody(request: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && (request.url === "/" || request.url === "/index.html")) {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return response.end(PAGE);
    }
    if (request.method === "GET" && request.url === "/api/records") {
      response.writeHead(200, { "Content-Type": "application/json" });
      return response.end(JSON.stringify(payload()));
    }
    if (request.method === "POST" && request.url === "/api/decision") {
      const body = JSON.parse(await readBody(request)) as {
        record_id?: string; check_id?: string;
      } & Parameters<typeof validateDecision>[0];
      if (!body.record_id || !body.check_id) throw new Error("record_id and check_id are required");
      const decisions = loadDecisions(PROJECT_ROOT, RUN_LABEL);
      decisions[decisionKey(body.record_id, body.check_id)] = validateDecision(body);
      saveDecisions(decisions);
      response.writeHead(200, { "Content-Type": "application/json" });
      return response.end(JSON.stringify({ ok: true, progress: payload().progress }));
    }
    response.writeHead(404).end("Not found");
  } catch (error) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : String(error));
  }
});

// Loopback only: this serves un-redacted pilot replies off the local disk.
server.listen(PORT, "127.0.0.1", () => {
  const { records, progress } = payload();
  console.log(`Human review for ${RUN_LABEL}: http://127.0.0.1:${PORT}`);
  console.log(`${records.length} cached records, ${progress.decided}/${progress.checks} checks already decided.`);
  console.log(`Decisions are written to ${path.relative(PROJECT_ROOT, decisionsPath(PROJECT_ROOT, RUN_LABEL))}`);
});
