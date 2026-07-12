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
  }
}
