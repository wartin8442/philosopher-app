# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` holds the style, naming, and PR conventions and is not repeated here. `docs/ARCHITECTURE.md` is the deep reference for the conversation/duel pipeline; this file covers what you need before reading it, plus the parts that are not documented anywhere else.

## Commands

```bash
npx next dev --turbopack     # dev server on :3000 (do NOT use `npm run dev` - see Running the app locally)
npm test                     # full Vitest suite, jsdom, single run
npm test -- src/lib/courses  # one file or directory (path substring match)
npm test -- src/lib/courses.test.ts -t "one sentence"   # one test by name
npx tsc --noEmit             # typecheck (there is no npm script for it)
npm run build                # prebuild regenerates embeddings, then next build
npx next build               # build WITHOUT regenerating embeddings (use this to get a fast local server)
npm run build:embeddings     # regenerate src/data/source-embeddings.json alone
```

Evaluation and operational harnesses live in `scripts/` and are wired up as `npm run check:security`, `check:latency:local` (needs a server already running), and `check:levels`. Most other scripts there are run directly with `tsx`.

**Do not run `npm run lint`.** It calls the deprecated `next lint`, which drops into an interactive ESLint setup prompt and hangs a non-interactive session. Use `npx tsc --noEmit` for mechanical checking.

### Baseline: green

`npm test` and `npx tsc --noEmit` should both come back clean. Anything failing is yours.

This section used to record two failures in `scripts/rag-corpus.test.ts`, plus a matching `tsc` error, caused by the committed `src/data/source-embeddings.json` still being the older `{model, dims, sources}` shape while `scripts/rag-corpus.ts` expected `{version, dims, sources, corpusSources}`. Regenerating the embeddings for the Girard release rewrote the file in the current shape and cleared all three. Noted here because that baseline was cited for a long time as "not a regression you caused" — that excuse no longer exists.

## Architecture

### The governing constraint

Everything about the conversation pipeline follows from one rule: **a voice conversation cannot tolerate dead air.** Retrieval is prefetched while the user is still speaking, the LLM streams, and TTS is synthesized per sentence so speech starts after the *first* sentence rather than the whole reply. Before changing anything in that path, read `docs/ARCHITECTURE.md` — several non-obvious decisions there are reversals of earlier ones and are load-bearing.

### Two different products share the codebase

- **Conversation / duel** — the model decides what to say. `src/app/conversation/[id]/`, `src/app/duel/`, backed by `/api/chat` and `/api/duel`.
- **Course** — a fixed, human-written lecture. The model is reached *only* for questions the student interrupts with. `src/app/course/[id]/[moduleId]/`, script data in `src/lib/courses.ts`.

These have opposite failure modes and should not be refactored toward each other. A conversation may paraphrase; a lecture must deliver identical words to every student.

Note that **`src/app/course/` is entirely untracked in git** and the course subsystem is absent from `docs/ARCHITECTURE.md`. Treat `src/lib/courses.ts`'s own header comment as its spec.

### The demo roster gate

`DEMO_ROSTER_IDS` in `src/lib/demoRoster.ts` is the single list controlling which philosophers are publicly reachable. The carousel, landing rail, duel picker, profile and conversation pages, and every `/api/*` handler derive from it; ~18 implemented philosophers are held back behind it and 404 . Adding an id is all it takes to release one. Adding a philosopher from scratch is a different job — `docs/ADDING_A_PHILOSOPHER.md`.

### Course script invariants

- **A beat is exactly one sentence.** Subtitles are revealed from the TTS engine's own sentence boundaries, so a two-sentence beat lights its subtitle a sentence early. `src/lib/courses.test.ts` enforces this.
- `src/lib/courses.ts` is **data only and ships to the browser** — that is intended, the script is what the student came to read. The server-only prompt telling the model how to answer questions *inside* a lesson lives in `src/lib/providers/llm.ts` with the rest of the prompt material. Do not move prompt text into `courses.ts`.
- `CourseLesson.tsx` keeps two layers in step: a scripted lecture on a timer or audio clock, and a student interruption that must stop it and resume on exactly the line it stopped on. State is mirrored in refs alongside React state because async narration and fetch callbacks need to read the position they started from. The extensive comments there explain *why* each branch exists; read them before rearranging phases.
- `.claude/skills/script-change/` is a skill for wording changes to lectures, invoked explicitly as `/script-change`. Do not trigger it for ordinary edits.

### Provider adapters

`src/lib/providers/llm.ts` (Anthropic default, plus OpenAI-compatible and Ollama, chosen by `LLM_PROVIDER`) and `tts.ts` (ElevenLabs or none). Keep provider-specific behavior behind these. Two things that are easy to break:

- `buildSystemPrompt` deliberately returns **two** parts. The stable `system` half carries Anthropic's `cache_control` marker; the per-turn `systemSuffix` (grounding excerpts, duel phase) rides *after* it so it never invalidates the cache. Moving per-turn content into `system` silently costs ~10× on every turn.
- `/api/tts` returns `501` when no provider is configured, and the client falls back to browser Web Speech. Voice must keep working with zero configuration.

### Retrieval

Hybrid semantic + keyword scoring over curated excerpts, with no vector DB — 20 excerpts in a JSON file score in microseconds. Embeddings are built at build time; each carries a content hash checked against `philosophers.ts`, and stale vectors, a cold model, or a >150ms budget overrun all fall back to keyword scoring rather than stalling. The embedder's state lives on `globalThis` because Next.js compiles instrumentation and routes into separate bundles with separate module-level variables.

### Streaming protocol

`/api/chat` and `/api/duel` return newline-delimited JSON: `{type:"sources"}` first (chat only), then `{type:"text"}` deltas, then `{type:"done"}`. Because the 200 is committed as soon as streaming starts, **mid-stream failures arrive in-band as `{type:"error"}`** while pre-stream failures are ordinary HTTP error statuses. Both client paths must handle both.

### Security layer

`src/middleware.ts` applies security headers and a coarse cross-route rate limit to every `/api/*` request, and rewrites `/conversation/<non-roster-id>` onto `/philosopher/<id>` so a hidden philosopher gets a real 404 instead of a soft one from a streamed client route. Per-route limits and body/field caps are centralized in `src/lib/security/config.ts` — change the numbers there, not in route handlers. The CSP allows `unsafe-eval` only outside production (Next dev's HMR needs it).

`scripts/protected-integrity.ts` hashes evaluation inputs that a pilot run must never mutate (`data/rag/eval/`, `src/data/source-embeddings.json`, stress results). If you regenerate embeddings, expect this baseline to need re-recording.

## Environment

Copy `.env.example` to `.env.local`. An Anthropic key is required; ElevenLabs is optional and only upgrades voice quality.

## Running the app locally

**`npm run dev` is the wrong tool for testing this app.** It works, but it is
slow enough to distort exactly the thing this project cares about — whether the
voice path feels immediate. Measured cold on this machine (Windows, repo under
OneDrive), boot to first `200` on `/` and then per-route request time:

| How it's started | Boot | Route hits (cold → warm) |
| --- | --- | --- |
| `next dev` (webpack, what `npm run dev` does) | 38.5s | 4.0–22s → **1.7–7.4s** |
| `next dev --turbopack` | 33.5s | 2.0–6.3s → **1.0–2.8s** |
| `next build` once, then `next start` | 10.1s | 0.06–0.50s → **0.05–0.24s** |

A *warm* page under `next dev` costs seconds, on every navigation, forever. That
is the lag; it is not the app being slow. The webpack run also 500s on a cold
`/philosopher/[id]` (see the `.next` trap below), which Turbopack did not do.

So pick by what you are doing:

- **Testing how it feels — voice, latency, dead air, a demo, screenshots:** use a
  production server. This is the mode to default to here.
  ```bash
  npx next build      # ~2m10s; use npx, NOT `npm run build` — see below
  npx next start       # ready in ~10s, routes in tens of ms
  ```
- **Iterating on UI with hot reload:** `npx next dev --turbopack`. Never bare
  `npm run dev` — Turbopack is strictly faster here and avoids the cold-compile
  500s. Accept that warm navigations still cost ~1–2s.

Use **`npx next build`, not `npm run build`**, unless you actually want new
embeddings: `prebuild` regenerates `src/data/source-embeddings.json`, which
invalidates the `scripts/protected-integrity.ts` baseline and touches a tracked
file for no reason when all you wanted was a server.

`src/instrumentation.ts` already warm-compiles every route at dev boot, so a dev
server is busy for ~30s after it reports ready. Timings taken during that window
are meaningless — wait for `[dev-warmup] all routes compiled` in the log.

### Why it is slow: the repo lives in OneDrive

The project root, `node_modules`, `src`, and `.next` are all OneDrive cloud
placeholders (`fsutil reparsepoint query .next` → tag `0x9000601a`). Every file
webpack touches goes through the OneDrive filter driver, and OneDrive then tries
to sync the build output back up. The OneDrive process had burned **~9 CPU-hours
over 8 days** when this was audited. This is the root cause of the numbers above
and of most of the `.next` corruption below — `.next` was observed vanishing
outright mid-session.

The durable fix is to get build output off the synced path, either by moving the
repo out of `OneDrive\Documents` or by pointing `.next` at a junction outside it
(`distDir` in `next.config.mjs`, or `mklink /J`). Until that happens, prefer the
production server, which touches `.next` once instead of on every request.

### Check for orphaned servers before blaming the code

Stale servers accumulate here and are a leading cause of "it got slow." At the
start of this audit **two** servers from eight days earlier were both bound to
port 3000 — a `next dev` and a `next start -H 127.0.0.1` — silently racing each
other and fighting over `.next`. Nothing in the UI says this is happening.

```powershell
# What is actually on 3000, and what is it?
Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object {
  (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.OwningProcess)").CommandLine }

# Kill every project node process, then verify none remain
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -like '*AI Philosophy Project*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false }
```

More than one `OwningProcess` on 3000 means more than one server, whatever the
ports say. Kill all of them *before* deleting `.next`, not after.

## The `.next` corruption trap

A whole family of "routing bugs" here are really one thing: something other than the running dev server wrote to, locked, or deleted files under `.next`. Symptoms seen in practice, all from this cause:

- `ChunkLoadError: Loading chunk app/<route>/page failed` — the chunk 404s at `/_next/static/chunks/...`
- `EBUSY: resource busy or locked, open '.next\server\vendor-chunks\next.js'`
- `ENOENT ... rename '.next\cache\webpack\...\N.pack.gz_' -> 'N.pack.gz'`
- `PageNotFoundError: Cannot find module for page` / missing `routes-manifest.json`, served as a 500

The trap is that the damage surfaces on the *next navigation that needs a new chunk*, not where it happened — so it reads as a bug in whatever link was clicked. A page already open in the browser keeps working fine, which makes it look even more like that one link is broken.

Three things cause it, in rough order of likelihood:

1. **More than one dev server running at once.** Easy to accumulate: `npm run dev` spawns an npm wrapper *and* a child `next` process, and killing the wrapper (or a harness reporting it as "exited") leaves the child alive holding port 3000 and writing to `.next`. Check with `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like '*AI Philosophy Project*' } | Select-Object ProcessId, ParentProcessId` — a healthy single server is **one parent/child pair**. Two pairs with different parents means two servers fighting over `.next`, whatever the ports say.
2. **`next build` while `next dev` is up.** Both use `.next`; the build wipes it out from under the dev server.
3. **OneDrive.** The repo lives under `OneDrive\Documents` and `.next` is not excluded from sync, so files can be locked or dehydrated mid-write.

The cure is always the same, and the order matters: kill *every* project node process, verify none remain, `rm -rf .next`, then start exactly one server. Wiping `.next` while a server still holds it just recreates the problem.

Before debugging any navigation error, check whether the route 500s on a cold request — `curl -o /dev/null -w "%{http_code}" http://localhost:3000/<route>`. If it does, it is the build directory, not the code.

### Do not run the dev server as an agent background task

Starting `npm run dev` as a tool-harness background task does not survive that task being stopped. When the task ends, the server's stdout/IPC pipes close and Next dies on `write EPIPE`, which takes out its worker pool. It then **degrades rather than exits** — already-compiled routes like `/` keep returning 200 while anything needing the static-path worker (`/course/[id]`, `/course/[id]/[moduleId]`) returns 500 with `WorkerError`. A health check that only pings `/` will call this server healthy when it is not; always probe a dynamic route.

If a long-lived server is needed, launch it genuinely detached so its lifetime is not tied to the agent session:

```powershell
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" `
  -WorkingDirectory "<repo>" -WindowStyle Hidden `
  -RedirectStandardOutput <log> -RedirectStandardError <errlog>
```

Otherwise just ask the user to run `npm run dev` in their own terminal. Either way, verify with a course route, not the home page.
