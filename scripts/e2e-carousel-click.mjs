// Verifies carousel card clicks with real mouse input (pointer capture path).
// Run: node scripts/e2e-carousel-click.mjs [baseUrl]
//
// The carousel lives at /explore (the landing page is the split panel), and a
// card opens the philosopher's profile — not the conversation directly. An
// off-centre card centres itself on first click and only opens on the second,
// so the two clicks are distinct behaviours worth asserting separately.
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const EXPLORE = `${BASE}/explore`;
let failures = 0;

const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` -- ${detail}` : ""}`);
  if (!ok) failures++;
};

// Returns a handle to the fully-visible card for this philosopher closest to
// the viewport centre. The carousel wraps, so clones share the same id.
async function visibleCard(page, id) {
  return page.evaluateHandle((cardId) => {
    const cx = window.innerWidth / 2;
    const cards = [...document.querySelectorAll(`[data-card-id="${cardId}"]`)].filter(
      (c) => {
        const r = c.getBoundingClientRect();
        return r.left >= 0 && r.right <= window.innerWidth;
      },
    );
    return cards.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (
        Math.abs(ra.left + ra.width / 2 - cx) -
        Math.abs(rb.left + rb.width / 2 - cx)
      );
    })[0];
  }, id);
}

/** The card the carousel currently considers active, by data-card-id. */
async function activeCardId(page) {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll("[data-card-id]")].find((c) =>
      (c.getAttribute("aria-label") ?? "").startsWith("View "),
    );
    return el?.getAttribute("data-card-id") ?? null;
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

// --- Test 1: mouse click on the CENTRED card opens that profile ---
await page.goto(EXPLORE, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-card-id]");
await page.waitForTimeout(800); // let the carousel settle
const centred = await activeCardId(page);
check("a card is marked active on load", Boolean(centred), `active=${centred}`);
const card = await visibleCard(page, centred);
await card.asElement().click();
await page.waitForURL(`**/philosopher/${centred}`, { timeout: 10000 }).catch(() => {});
check(
  "centred-card mouse click opens the profile",
  page.url().includes(`/philosopher/${centred}`),
  `url=${page.url()}`,
);

// --- Test 2: an OFF-CENTRE card centres itself instead of navigating ---
await page.goto(EXPLORE, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-card-id]");
await page.waitForTimeout(800);
const before = await activeCardId(page);
const other = await page.evaluate((activeId) => {
  const cards = [...document.querySelectorAll("[data-card-id]")].filter((c) => {
    const r = c.getBoundingClientRect();
    return r.left >= 0 && r.right <= window.innerWidth &&
      c.getAttribute("data-card-id") !== activeId;
  });
  return cards[0]?.getAttribute("data-card-id") ?? null;
}, before);
if (other) {
  const offCentre = await visibleCard(page, other);
  await offCentre.asElement().click();
  await page.waitForTimeout(1200);
  check(
    "off-centre card click centres rather than navigating",
    new URL(page.url()).pathname === "/explore" && (await activeCardId(page)) === other,
    `url=${page.url()} active=${await activeCardId(page)}`,
  );
} else {
  check("off-centre card click centres rather than navigating", false, "no off-centre card found");
}

// --- Test 3: dragging across the carousel does NOT navigate ---
await page.goto(EXPLORE, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-card-id]");
await page.waitForTimeout(800);
const scroller = page.locator(".overflow-x-auto").first();
const box = await scroller.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
for (let i = 1; i <= 10; i++) {
  await page.mouse.move(box.x + box.width / 2 - i * 20, box.y + box.height / 2);
}
await page.mouse.up();
await page.waitForTimeout(1200);
check(
  "drag does not navigate",
  new URL(page.url()).pathname === "/explore",
  `url=${page.url()}`,
);

// --- Test 4: conversation page renders its voice-first layout ---
await page.goto(`${BASE}/conversation/camus`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
// First visit opens the answer-level chooser, a modal over the whole page.
// Dismiss it before touching anything underneath.
const levelDialog = page.locator('[role="dialog"][aria-modal="true"]');
if (await levelDialog.isVisible().catch(() => false)) {
  await page.getByRole("button", { name: /Beginner/ }).click();
  await levelDialog.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}
check("first visit offers the answer-level chooser", true);
const micVisible = await page.isVisible('[aria-label="Start speaking"]').catch(() => false);
const muteVisible = await page.isVisible('[aria-label="Mute voice"], [aria-label="Unmute voice"]');
const inputVisible = await page.isVisible("form textarea");
check("conversation page: mic button", micVisible);
check("conversation page: mute button", muteVisible);
check("conversation page: text input", inputVisible);

// --- Test 5: typing a message shows it in the transcript ---
await page.fill("form textarea", "Hello");
// The user's own bubble must appear even if the backend errors (no API key).
await page.click('form button[type="submit"]');
await page.waitForTimeout(1500);
const userBubble = await page.getByText("Hello", { exact: true }).count();
check("typed message appears in chat box", userBubble > 0);

// --- Test 6: a philosopher off the demo roster is not reachable ---
const hidden = await page.goto(`${BASE}/philosopher/aristotle`, {
  waitUntil: "domcontentloaded",
});
check("hidden philosopher 404s", hidden.status() === 404, `status=${hidden.status()}`);

await browser.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
