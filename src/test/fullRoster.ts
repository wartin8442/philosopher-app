/**
 * Test-only: release every written philosopher.
 *
 * The public roster is deliberately narrow, but the held-back philosophers are
 * still real code that should keep passing its tests so they can be released
 * by a one-line roster edit. A test file whose fixtures use one of them opts
 * in with:
 *
 *   vi.mock("@/lib/demoRoster", (importOriginal) =>
 *     import("@/test/fullRoster").then((m) => m.fullRoster(importOriginal)),
 *   );
 *
 * Tests about the gate itself (philosophers.test.ts) must not do this.
 */
import type * as DemoRoster from "@/lib/demoRoster";

export async function fullRoster(
  importOriginal: () => Promise<unknown>,
): Promise<typeof DemoRoster> {
  const actual = (await importOriginal()) as typeof DemoRoster;
  const all: ReadonlySet<string> = new Set(actual.WRITTEN_PHILOSOPHER_IDS);
  return {
    ...actual,
    DEMO_ROSTER_IDS: actual.WRITTEN_PHILOSOPHER_IDS as never,
    DEMO_ROSTER: all,
    isDemoPhilosopherId: (id: string) => all.has(id),
  };
}
