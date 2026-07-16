"use client";

import { useCallback, useEffect, useState } from "react";
import { AnswerLevel } from "./types";

/**
 * Session-persistent settings (localStorage). No accounts, no server storage —
 * just the user's preferences for this browser.
 */
export interface Settings {
  answerLevel: AnswerLevel;
  /**
   * Level chosen for a specific philosopher (the first-visit prompt, or a
   * later settings change made inside that conversation). A user can be
   * advanced on Nietzsche and a beginner on Aquinas. Falls back to
   * `answerLevel` when a philosopher has no entry.
   */
  philosopherLevels: Record<string, AnswerLevel>;
  voiceEnabled: boolean;
  /** Show the optional grounding/sources panel in text mode. */
  showSources: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  answerLevel: "intermediate",
  philosopherLevels: {},
  voiceEnabled: true,
  showSources: false,
};

/** The level a conversation with this philosopher actually runs at. */
export function effectiveAnswerLevel(
  settings: Settings,
  philosopherId: string,
): AnswerLevel {
  return settings.philosopherLevels[philosopherId] ?? settings.answerLevel;
}

const STORAGE_KEY = "philosopher-app-settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch {
      /* ignore malformed storage */
    }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  return { settings, update, loaded };
}
