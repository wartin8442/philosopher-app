import type { RateRule } from "./config";

/**
 * Adaptive fixed-window rate limiter.
 *
 * Backing store is chosen at runtime with zero configuration:
 *   - If Upstash Redis REST env vars are present, limits are enforced in Redis
 *     so they hold ACROSS serverless instances (the correct behavior on
 *     Vercel, where many function instances serve traffic concurrently).
 *   - Otherwise an in-process Map is used. This is best-effort — a limit is
 *     per instance and resets on cold start — but adds no dependency and keeps
 *     the app protected out of the box, including in local dev and on a single
 *     long-lived instance.
 *
 * The Redis path talks to Upstash's REST API directly with `fetch`, so no npm
 * package is required. On any Redis transport error we fall back to the
 * in-memory limiter for that call rather than failing the request — abuse
 * protection must never take the whole app down.
 *
 * Fixed-window (INCR + EXPIRE) is used for simplicity and low cost (one round
 * trip). Its known weakness is a burst straddling a window boundary allowing
 * up to ~2x the limit briefly; that is acceptable here because the limits are
 * a cost/DoS backstop, not a precise quota, and the coarse global limit plus
 * per-request size caps bound the damage regardless.
 */

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets (for Retry-After). */
  resetSeconds: number;
}

// ---- In-memory fixed window -------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

// Survives across route bundles / hot reloads by living on globalThis.
const memStore: Map<string, Bucket> = ((
  globalThis as { __rlStore?: Map<string, Bucket> }
).__rlStore ??= new Map());

let lastSweep = 0;
function sweep(now: number): void {
  // Amortized cleanup of expired buckets so the map cannot grow unbounded
  // under a spray of unique keys (e.g. spoofed identities in an unproxied
  // deployment). Runs at most once every 30s.
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [key, bucket] of memStore) {
    if (bucket.resetAt <= now) memStore.delete(key);
  }
}

function memoryLimit(key: string, rule: RateRule): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const windowMs = rule.windowSec * 1000;
  const existing = memStore.get(key);
  if (!existing || existing.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit: rule.limit, remaining: rule.limit - 1, resetSeconds: rule.windowSec };
  }
  existing.count += 1;
  const remaining = Math.max(0, rule.limit - existing.count);
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return { ok: existing.count <= rule.limit, limit: rule.limit, remaining, resetSeconds };
}

// ---- Upstash Redis REST -----------------------------------------------------

interface UpstashConfig {
  url: string;
  token: string;
}

/** Upstash creds, from either the Upstash or Vercel-KV env var conventions. */
function upstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

async function redisLimit(
  cfg: UpstashConfig,
  key: string,
  rule: RateRule,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowIndex = Math.floor(now / (rule.windowSec * 1000));
  const winKey = `rl:${key}:${windowIndex}`;
  const resetSeconds = Math.max(
    1,
    Math.ceil(((windowIndex + 1) * rule.windowSec * 1000 - now) / 1000),
  );

  // One pipeline round trip: increment the window counter and (re)set its TTL
  // so the key self-expires. EXPIRE every call is harmless and cheap.
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", winKey],
      ["EXPIRE", winKey, rule.windowSec],
    ]),
    // Never let a slow Redis stall the request path.
    signal: AbortSignal.timeout(1_000),
  });

  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const body = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = body[0]?.result;
  if (typeof count !== "number") throw new Error("Upstash malformed response");

  const remaining = Math.max(0, rule.limit - count);
  return { ok: count <= rule.limit, limit: rule.limit, remaining, resetSeconds };
}

// ---- Public API -------------------------------------------------------------

/**
 * Consume one unit from `key`'s budget under `rule`. `key` should already be
 * namespaced (e.g. `chat:1.2.3.4`) so different routes don't share a counter.
 */
export async function rateLimit(
  key: string,
  rule: RateRule,
): Promise<RateLimitResult> {
  const cfg = upstashConfig();
  if (cfg) {
    try {
      return await redisLimit(cfg, key, rule);
    } catch (err) {
      // Redis unreachable/slow: degrade to the in-memory limiter rather than
      // failing open (unlimited) or failing the user's request.
      console.warn(
        "[rateLimit] Redis unavailable, using in-memory fallback:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return memoryLimit(key, rule);
}

/** True when a durable cross-instance store is configured. */
export function hasDurableRateStore(): boolean {
  return upstashConfig() !== null;
}
