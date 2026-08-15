/**
 * Next.js runs `register()` once when the server process starts. Warming the
 * embedding model here means the first user request finds it already loaded
 * (~2s of model load paid at boot, not during someone's question).
 * Fire-and-forget: retrieval falls back to keyword scoring until it is ready,
 * so a slow load never delays serving.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warmEmbedder } = await import("./lib/embeddings");
    void warmEmbedder();
    // Fire-and-forget: this polls for the server to accept connections and
    // then compiles every route, so it must not block register() returning
    // (the server does not start listening until it does).
    if (process.env.NODE_ENV === "development") {
      void warmDevRoutes();
    }
  }
}

/**
 * Dev only: `next dev` compiles each route the first time it is requested,
 * so the first visit to every page sits on a multi-second compile and the
 * buttons that navigate there feel dead until it finishes. Requesting every
 * route once at boot pays that cost before the browser is even open. The
 * dynamic routes only need one representative id — the compile is per-route,
 * not per-param — and the API routes are POST-only, so a warmup GET compiles
 * the module and harmlessly returns 405.
 */
async function warmDevRoutes() {
  const base = `http://127.0.0.1:${process.env.PORT || "3000"}`;
  const warm = async (path: string) => {
    try {
      await fetch(base + path);
      return true;
    } catch {
      return false;
    }
  };
  // register() runs before the server accepts connections; poll the landing
  // page until it responds (which also compiles it), then do the rest.
  let up = false;
  for (let attempt = 0; attempt < 30 && !up; attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
    up = await warm("/");
  }
  if (!up) return; // non-default port or host — skip quietly
  // Sequentially, so warming never starves a real request of CPU.
  for (const path of [
    "/explore",
    "/start",
    "/why-philosophy",
    "/why-philosophy/jordan-peterson",
    "/duel",
    "/philosopher/aquinas",
    "/conversation/aquinas",
    "/api/chat",
    "/api/tts",
    "/api/duel",
    "/api/retrieve",
  ]) {
    await warm(path);
  }
  console.log("[dev-warmup] all routes compiled");
}
