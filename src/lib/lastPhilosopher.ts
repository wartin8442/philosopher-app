/**
 * Remembers the philosopher the user most recently visited, so the landing
 * page carousel can re-center on them when the user comes back (instead of
 * resetting to the first philosopher). sessionStorage on purpose: the memory
 * is per-tab and forgotten when the tab closes.
 *
 * The storage key is also read by the carousel's pre-hydration inline script,
 * which is why it's exported as a constant.
 */
export const LAST_PHILOSOPHER_STORAGE_KEY = "lastPhilosopherId";

export function rememberLastPhilosopher(id: string) {
  try {
    sessionStorage.setItem(LAST_PHILOSOPHER_STORAGE_KEY, id);
  } catch {
    // Storage can be unavailable (privacy modes); losing the memory is fine.
  }
}

export function getLastPhilosopherId(): string | null {
  try {
    return sessionStorage.getItem(LAST_PHILOSOPHER_STORAGE_KEY);
  } catch {
    return null;
  }
}
