import posthog from "posthog-js";

/**
 * Product analytics (PostHog), configured to keep the promises the privacy
 * notice makes. Read this before changing any option below — several are
 * there because turning them on would make `PrivacyNotice.tsx` untrue.
 *
 * - **Optional.** With no `NEXT_PUBLIC_POSTHOG_KEY` nothing loads and `track()`
 *   is a no-op, so local dev, tests and forks need zero configuration.
 * - **Cookieless.** `cookieless_mode: "always"` sets no cookies and writes
 *   nothing to local/session storage. PostHog counts unique visitors with a
 *   server-side hash whose salt rotates daily — the same model as the Vercel
 *   Web Analytics already disclosed. A persistent identifier would need a
 *   consent banner *before* loading; this avoids needing one. The PostHog
 *   project must have cookieless mode switched on, or these events are dropped.
 * - **Never what was said.** No session recording (it would film the
 *   transcript), no surveys, and `mask_all_text` so autocaptured clicks on a
 *   message bubble carry no text. Custom events below carry ids only — never a
 *   message, question, or debate topic.
 * - **Same-origin.** Requests go to `/ingest`, which `next.config.mjs`
 *   rewrites to PostHog. That keeps the CSP at `connect-src 'self'` /
 *   `script-src 'self'` and stops ad blockers from silently undercounting.
 */

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

/** "us" or "eu": must match the region the PostHog project was created in. */
export const POSTHOG_REGION =
  process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

export function initAnalytics(): void {
  if (!POSTHOG_KEY || typeof window === "undefined" || posthog.__loaded) return;
  posthog.init(POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: `https://${POSTHOG_REGION}.posthog.com`,
    defaults: "2026-01-30",
    cookieless_mode: "always",
    // App Router navigations are client-side; count each as a pageview.
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    mask_all_text: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
  });
}

/**
 * The custom events, in one place so the full list of what is sent is easy to
 * audit. Properties are ids, counts and flags — never user-written text.
 */
export interface AnalyticsEvents {
  conversation_message_sent: {
    philosopher_id: string;
    /** 1 for the opening message, 2 for the first follow-up, … */
    turn: number;
    voice_enabled: boolean;
  };
  duel_started: { philosopher_a: string; philosopher_b: string };
  lesson_started: LessonProps;
  lesson_completed: LessonProps;
  lesson_question_asked: LessonProps;
}

interface LessonProps {
  philosopher_id: string;
  module_id: string;
  lesson_number: number;
}

export function track<E extends keyof AnalyticsEvents>(
  event: E,
  properties: AnalyticsEvents[E],
): void {
  // Not loaded = no key configured (or a test). Analytics must never throw
  // into the voice path, so swallow anything the SDK does.
  if (!posthog.__loaded) return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* analytics is best-effort */
  }
}
