/**
 * Security stress test — drives a RUNNING server and asserts the abuse
 * protections actually fire end-to-end.
 *
 *   npm run dev                     # in one terminal
 *   npx tsx scripts/security-stress.ts [--base-url=http://127.0.0.1:3000]
 *
 * By design this never triggers a paid model/TTS call: every probe is shaped
 * to be rejected by the security layer (rate limit, size cap, validation)
 * before it can reach a provider. The rate-limit probe floods with malformed
 * bodies, which are counted against the limit but cost nothing downstream.
 *
 * Exit code is non-zero if any check fails, so it can gate CI.
 */

const baseUrl =
  process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ??
  process.env.STRESS_BASE_URL ??
  "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;

function ok(name: string, detail = ""): void {
  passed++;
  console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
}
function bad(name: string, detail = ""): void {
  failed++;
  console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
}
function check(name: string, cond: boolean, detail = ""): void {
  (cond ? ok : bad)(name, detail);
}

function post(path: string, body: BodyInit, headers: Record<string, string> = {}) {
  return fetch(baseUrl + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

async function bodyText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// ---- Checks -----------------------------------------------------------------

async function checkSecurityHeaders(): Promise<void> {
  console.log("\n▶ Security response headers");
  const res = await fetch(baseUrl + "/", { method: "GET" });
  const h = res.headers;
  check("X-Frame-Options: DENY", h.get("x-frame-options") === "DENY");
  check("X-Content-Type-Options: nosniff", h.get("x-content-type-options") === "nosniff");
  check("Content-Security-Policy present", !!h.get("content-security-policy"));
  check(
    "CSP forbids framing (frame-ancestors 'none')",
    (h.get("content-security-policy") ?? "").includes("frame-ancestors 'none'"),
  );
  check("Referrer-Policy set", !!h.get("referrer-policy"));
  check("HSTS set", !!h.get("strict-transport-security"));
}

async function checkValidation(): Promise<void> {
  console.log("\n▶ Input validation (rejected before any provider call)");

  const malformed = await post("/api/chat", "{ not json");
  check("malformed JSON → 400", malformed.status === 400, `got ${malformed.status}`);

  const badRole = await post(
    "/api/chat",
    JSON.stringify({ philosopherId: "camus", messages: [{ role: "system", content: "x" }] }),
  );
  check("invalid message role → 400", badRole.status === 400, `got ${badRole.status}`);

  const emptyMsgs = await post(
    "/api/chat",
    JSON.stringify({ philosopherId: "camus", messages: [] }),
  );
  check("empty messages → 400", emptyMsgs.status === 400, `got ${emptyMsgs.status}`);

  const unknownPhil = await post(
    "/api/chat",
    JSON.stringify({ philosopherId: "socrates-9000", messages: [{ role: "user", content: "hi" }] }),
  );
  check("unknown philosopher → 404", unknownPhil.status === 404, `got ${unknownPhil.status}`);

  const badPhase = await post(
    "/api/duel",
    JSON.stringify({ speakerId: "camus", opponentId: "sartre", topic: "x", phase: "pwn", transcript: [] }),
  );
  check("invalid duel phase → 400", badPhase.status === 400, `got ${badPhase.status}`);
}

async function checkSizeCaps(): Promise<void> {
  console.log("\n▶ Payload size caps (cost-exhaustion guard)");

  // >64KB raw body.
  const huge = JSON.stringify({
    philosopherId: "camus",
    messages: [{ role: "user", content: "a".repeat(70_000) }],
  });
  const res = await post("/api/chat", huge);
  check("64KB+ body → 413", res.status === 413, `got ${res.status}`);

  // Oversized single message under the body cap but over the per-message cap.
  const longMsg = JSON.stringify({
    philosopherId: "camus",
    messages: [{ role: "user", content: "b".repeat(9_000) }],
  });
  const res2 = await post("/api/chat", longMsg);
  check("over-long message → 413", res2.status === 413, `got ${res2.status}`);

  // TTS char cap: 413 when a provider is configured, 501 when it isn't (no
  // synthesis reached either way — both are safe outcomes).
  const longTts = JSON.stringify({ philosopherId: "camus", text: "c".repeat(5_000) });
  const res3 = await post("/api/tts", longTts);
  check(
    "over-long TTS text → 413 or 501 (no synthesis)",
    res3.status === 413 || res3.status === 501,
    `got ${res3.status}`,
  );
}

async function checkErrorSanitization(): Promise<void> {
  console.log("\n▶ Error sanitization (no internal leakage)");
  const res = await post("/api/chat", "{ still not json");
  const text = await bodyText(res);
  const leaky = /stack|node_modules|SyntaxError|at Object|ANTHROPIC|api[_-]?key/i.test(text);
  check("error body carries no stack/provider/secret text", !leaky, text.slice(0, 80));
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  check(
    "error body is a clean { error } object",
    !!json && typeof (json as { error?: unknown }).error === "string",
  );
}

async function checkRateLimit(): Promise<void> {
  console.log("\n▶ Rate limiting (flood of malformed bodies → 429)");
  // Malformed bodies are rejected at 400 but still consumed against the limit,
  // so this trips the limiter without any downstream cost. chat limit is 20/min.
  let sawLimited = false;
  let retryAfterSeen = false;
  let firstBlockAt = -1;
  for (let i = 0; i < 60; i++) {
    const res = await post("/api/chat", "{bad");
    if (res.status === 429) {
      sawLimited = true;
      if (firstBlockAt < 0) firstBlockAt = i + 1;
      if (res.headers.get("retry-after")) retryAfterSeen = true;
      break;
    }
  }
  check("flood eventually returns 429", sawLimited, firstBlockAt > 0 ? `blocked at request #${firstBlockAt}` : "no 429 in 60 requests");
  check("429 includes Retry-After header", retryAfterSeen);
}

async function checkMethodGuard(): Promise<void> {
  console.log("\n▶ Method guard");
  const res = await fetch(baseUrl + "/api/chat", { method: "GET" });
  check("GET on POST-only route → 405", res.status === 405, `got ${res.status}`);
}

// ---- Runner -----------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`Security stress test against ${baseUrl}`);
  try {
    await fetch(baseUrl + "/", { method: "GET" });
  } catch {
    console.error(`\n\x1b[31mCannot reach ${baseUrl}. Start the dev server first (npm run dev).\x1b[0m`);
    process.exit(2);
  }

  await checkSecurityHeaders();
  await checkValidation();
  await checkSizeCaps();
  await checkErrorSanitization();
  await checkMethodGuard();
  // Rate-limit check LAST: it consumes the chat budget for the window, which
  // would otherwise 429 the validation/size probes above.
  await checkRateLimit();

  console.log(`\n${failed === 0 ? "\x1b[32m" : "\x1b[31m"}${passed} passed, ${failed} failed\x1b[0m`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
