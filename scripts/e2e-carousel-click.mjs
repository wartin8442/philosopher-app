// Verifies carousel card clicks with real mouse input (pointer capture path).
// Run: node e2e-carousel-click.mjs [baseUrl]
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
let failures = 0;

const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` -- ${detail}` : ""}`);
  if (!ok) failures++;
};

// Returns a handle to the fully-visible card with this aria-label that is
// closest to the viewport center (clones can match the same label).
async function visibleCard(page, label) {
  return page.evaluateHandle((lbl) => {
    const cx = window.innerWidth / 2;
    const cards = [...document.querySelectorAll(`[aria-label="${lbl}"]`)].filter(
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
  }, label);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

// --- Test 1: mouse click on the CENTERED card navigates ---
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector('[aria-label="Enter conversation with Thomas Aquinas"]');
await page.waitForTimeout(500); // let the carousel settle
const aquinas = await visibleCard(page, "Enter conversation with Thomas Aquinas");
await aquinas.asElement().click();
await page.waitForURL("**/conversation/aquinas", { timeout: 5000 }).catch(() => {});
check(
  "centered-card mouse click navigates",
  page.url().includes("/conversation/aquinas"),
  `url=${page.url()}`,
);

// --- Test 2: mouse click on an OFF-CENTER card navigates to that philosopher ---
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector('[aria-label="Enter conversation with Friedrich Nietzsche"]');
await page.waitForTimeout(500);
const nietzsche = await visibleCard(page, "Enter conversation with Friedrich Nietzsche");
await nietzsche.asElement().click();
await page.waitForURL("**/conversation/nietzsche", { timeout: 5000 }).catch(() => {});
check(
  "off-center card mouse click navigates",
  page.url().includes("/conversation/nietzsche"),
  `url=${page.url()}`,
);

// --- Test 3: dragging across the carousel does NOT navigate ---
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector('[aria-label="Enter conversation with Thomas Aquinas"]');
await page.waitForTimeout(500);
const scroller = page.locator(".overflow-x-auto").first();
const box = await scroller.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
for (let i = 1; i <= 10; i++) {
  await page.mouse.move(box.x + box.width / 2 - i * 20, box.y + box.height / 2);
}
await page.mouse.up();
await page.waitForTimeout(1200);
check("drag does not navigate", new URL(page.url()).pathname === "/", `url=${page.url()}`);

// --- Test 4: conversation page renders its voice-first layout ---
await page.goto(`${BASE}/conversation/camus`, { waitUntil: "networkidle" });
const micVisible = await page.isVisible('[aria-label="Start speaking"]').catch(() => false);
const muteVisible = await page.isVisible('[aria-label="Mute voice"], [aria-label="Unmute voice"]');
const inputVisible = await page.isVisible("form input");
check("conversation page: mic button", micVisible);
check("conversation page: mute button", muteVisible);
check("conversation page: text input", inputVisible);

// --- Test 5: typing a message shows it in the transcript ---
await page.fill("form input", "Hello");
// The user's own bubble must appear even if the backend errors (no API key).
await page.click('form button[type="submit"]');
await page.waitForTimeout(1000);
const userBubble = await page.getByText("Hello", { exact: true }).count();
check("typed message appears in chat box", userBubble > 0);

await browser.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
