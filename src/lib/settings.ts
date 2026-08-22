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
  /**
   * Version of the first-visit level prompt completed for a philosopher.
   * This lets a newly released or materially replaced persona ask once even
   * when an earlier development build already stored a level under its id.
   */
  levelPromptVersions: Record<string, number>;
  voiceEnabled: boolean;
  /** Show the optional grounding/sources panel in text mode. */
  showSources: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  answerLevel: "intermediate",
  philosopherLevels: {},
  levelPromptVersions: {},
  voiceEnabled: true,
  showSources: false,
};

const CURRENT_LEVEL_PROMPT_VERSIONS: Readonly<Record<string, number>> = {
  // Girard replaced James. Force the released Girard persona's first-visit
  // prompt once even if a pre-release Girard chat left a level in storage.
  girard: 1,
};

/** Whether this philosopher still needs the first-visit level choice. */
export function needsAnswerLevelChoice(
  settings: Settings,
  philosopherId: string,
): boolean {
  if (!settings.philosopherLevels[philosopherId]) return true;
  const currentVersion = CURRENT_LEVEL_PROMPT_VERSIONS[philosopherId];
  if (!currentVersion) return false;
  return (settings.levelPromptVersions?.[philosopherId] ?? 0) < currentVersion;
}

/** Records completion of any versioned first-visit prompt for this persona. */
export function completedLevelPromptVersions(
  settings: Settings,
  philosopherId: string,
): Record<string, number> {
  const currentVersion = CURRENT_LEVEL_PROMPT_VERSIONS[philosopherId];
  if (!currentVersion) return settings.levelPromptVersions ?? {};
  return {
    ...(settings.levelPromptVersions ?? {}),
    [philosopherId]: currentVersion,
  };
}

/** The level a conversation with this philosopher actually runs at. */
export function effectiveAnswerLevel(
  settings: Settings,
  philosopherId: string,
): AnswerLevel {
  return settings.philosopherLevels[philosopherId] ?? settings.answerLevel;
}

/**
 * The level questions asked *during a course* are answered at.
 *
 * A course is where someone starts, so it falls back to beginner rather than
 * the global intermediate default. The lecture script assumes no philosophical
 * background at all; an answer that quietly assumed some would undo that in a
 * single turn, and the student who most needs to interrupt is exactly the one
 * who never set a level. An explicit choice for this philosopher still wins —
 * someone who set themselves to advanced did not mean "except in lessons".
 */
export function courseAnswerLevel(
  settings: Settings,
  philosopherId: string,
): AnswerLevel {
  return settings.philosopherLevels[philosopherId] ?? "beginner";
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
