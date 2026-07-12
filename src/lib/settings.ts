"use client";

import { useCallback, useEffect, useState } from "react";
import { AnswerLevel } from "./types";

/**
 * Session-persistent settings (localStorage). No accounts, no server storage —
 * just the user's preferences for this browser.
 */
export interface Settings {
  answerLevel: AnswerLevel;
  voiceEnabled: boolean;
  /** Auto-listen again after the philosopher finishes speaking (hands-free). */
  autoListen: boolean;
  /** Show the optional grounding/sources panel in text mode. */
  showSources: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  answerLevel: "intermediate",
  voiceEnabled: true,
  autoListen: false,
  showSources: false,
};

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
