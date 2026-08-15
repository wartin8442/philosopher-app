/**
 * Re-fetch every philosopher portrait from Wikimedia Commons and regenerate the
 * two sizes the app ships.
 *
 * The point of this script is that the portraits are *reproducible*. Before it
 * existed, `public/philosophers/` held images of unknown provenance that could
 * not be traced back to a licence, which meant they could not be shipped. Now
 * every file is derived from a named Commons file recorded in
 * `src/lib/imageCredits.ts`, and running this script rebuilds them all.
 *
 *   npm run portraits:fetch            # rebuild everything
 *   npm run portraits:fetch -- sartre  # rebuild only the ids given
 *
 * Two outputs per philosopher:
 *   - `public/philosophers/<id>.<ext>`        card portrait, square, ≤640px
 *   - `public/philosophers/heroes/<id>.webp`  profile hero, ≤1024px wide
 *
 * Neither output is upscaled past its source, so a small Commons original
 * yields a small file rather than a blurry large one.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import {
  DEFAULT_CARD_CROP,
  PORTRAIT_CREDITS,
  type PortraitCredit,
} from "../src/lib/imageCredits";

const USER_AGENT =
  "AIPhilosophyProject/1.0 (portrait provenance audit; willmartin8442@gmail.com)";
const CARD_DIR = path.join(process.cwd(), "public", "philosophers");
const HERO_DIR = path.join(CARD_DIR, "heroes");

const CARD_SIZE = 640;
const HERO_WIDTH = 1024;
/** Width we ask Commons for. Ample for both outputs without pulling 50MB TIFFs. */
const SOURCE_WIDTH = 1600;

interface CommonsImage {
  url: string;
  width: number;
  height: number;
}

/**
 * Ask Commons for a scaled rendition rather than the original: several sources
 * are 5000px+ or TIFFs, and the thumbnailer hands back a normalised JPEG.
 */
async function resolveImageUrl(credit: PortraitCredit): Promise<CommonsImage> {
  // Ask for a proportionally larger rendition when only part of it survives the
  // crop, so a cropped portrait is no smaller than an uncropped one.
  const requestWidth = Math.min(
    4000,
    Math.round(SOURCE_WIDTH / (credit.sourceCrop?.width ?? 1)),
  );

  const params = new URLSearchParams({
    format: "json",
    action: "query",
    prop: "imageinfo",
    iiprop: "url|size",
    iiurlwidth: String(requestWidth),
    titles: `File:${credit.commonsFile}`,
  });

  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  if (!response.ok) {
    throw new Error(`Commons API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    query?: { pages?: Record<string, { imageinfo?: unknown[] }> };
  };
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0] as
    | { url: string; thumburl?: string; width: number; height: number }
    | undefined;

  if (!info) {
    throw new Error(`no such file on Commons: ${credit.commonsFile}`);
  }

  // Take the original whenever we asked for at least its full width. Besides
  // being pointless to scale up, the thumbnailer silently caps some formats —
  // a TIFF comes back as a 500px JPEG while still *reporting* the width we
  // asked for, which would quietly cost us most of the resolution.
  const useOriginal = !info.thumburl || requestWidth >= info.width;

  return {
    url: useOriginal ? info.url : info.thumburl!,
    width: info.width,
    height: info.height,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Downloads are cached under `node_modules/.cache` (already git-ignored) so
 * that re-running to adjust a crop costs nothing and does not hammer
 * Wikimedia. Delete the directory to force a genuine re-fetch.
 */
const CACHE_DIR = path.join(process.cwd(), "node_modules", ".cache", "portraits");

async function cachedDownload(url: string): Promise<Buffer> {
  const key = createHash("sha1").update(url).digest("hex");
  const cached = path.join(CACHE_DIR, key);
  if (existsSync(cached)) return readFile(cached);

  const buffer = await download(url);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cached, buffer);
  return buffer;
}

/**
 * Wikimedia rate-limits a burst of full-size thumbnail requests with a 429, so
 * back off and retry rather than dropping the portrait.
 */
async function download(url: string): Promise<Buffer> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await sleep(2000 * 2 ** (attempt - 1));
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    lastStatus = response.status;
    if (response.status !== 429 && response.status < 500) break;
  }
  throw new Error(`download failed with ${lastStatus}: ${url}`);
}

/**
 * Apply the recorded `sourceCrop` so the card and the hero are both cut from
 * the same corrected image — no point framing the card past a picture frame
 * only for the hero to show it.
 */
async function applyCrop(credit: PortraitCredit, source: Buffer): Promise<Buffer> {
  if (!credit.sourceCrop) return source;

  const { width = 0, height = 0 } = await sharp(source).metadata();
  const crop = credit.sourceCrop;
  return sharp(source)
    .extract({
      left: Math.round(crop.left * width),
      top: Math.round(crop.top * height),
      width: Math.round(crop.width * width),
      height: Math.round(crop.height * height),
    })
    .toBuffer();
}

async function writeOutputs(credit: PortraitCredit, source: Buffer) {
  const { width = 0, height = 0 } = await sharp(source).metadata();

  // Card: a square centred on the head. Centring is non-negotiable — a square
  // pinned against an edge puts the face off-centre, which is the thing we are
  // trying to avoid — so an overhanging square is resolved one of two ways.
  // By default the square shrinks to whatever room the head has around it. For
  // the sources marked `padToFit`, it instead grows the canvas, because those
  // are cropped so close that no square containing the whole head fits inside
  // them and shrinking would slice the head instead.
  const crop = credit.cardCrop ?? DEFAULT_CARD_CROP;
  let cardSource = source;
  let cardWidth = width;
  let cardHeight = height;
  let headX = crop.x * width;
  let headY = crop.y * height;

  if (credit.padToFit) {
    const half = (crop.size * width) / 2;
    const pad = {
      left: Math.max(0, Math.ceil(half - headX)),
      right: Math.max(0, Math.ceil(half - (width - headX))),
      top: Math.max(0, Math.ceil(half - headY)),
      bottom: Math.max(0, Math.ceil(half - (height - headY))),
    };
    if (pad.left || pad.right || pad.top || pad.bottom) {
      // `copy` replicates the outermost row/column of pixels. On the plain
      // backgrounds this is gated to, that is indistinguishable from more of
      // the same background.
      cardSource = await sharp(source)
        .extend({ ...pad, extendWith: "copy" })
        .toBuffer();
      cardWidth += pad.left + pad.right;
      cardHeight += pad.top + pad.bottom;
      headX += pad.left;
      headY += pad.top;
    }
  }

  const square = Math.round(
    Math.min(
      crop.size * width,
      2 *
        Math.min(headX, cardWidth - headX, headY, cardHeight - headY),
    ),
  );

  const cardSize = Math.min(CARD_SIZE, square);
  const cardPath = path.join(CARD_DIR, `${credit.id}.${credit.cardExt}`);
  const card = sharp(cardSource)
    .extract({
      left: Math.round(headX - square / 2),
      top: Math.round(headY - square / 2),
      width: square,
      height: square,
    })
    .resize(cardSize, cardSize);
  await (credit.cardExt === "webp"
    ? card.webp({ quality: 82 })
    : card.jpeg({ quality: 86, mozjpeg: true })
  ).toFile(cardPath);

  // Hero: uncropped, so the per-profile `heroFocus` object-position keeps
  // control of the framing. Skipped where the hero is the project's own
  // artwork — regenerating it from Commons would silently overwrite a file
  // this script did not create and cannot recreate.
  const heroPath = path.join(HERO_DIR, `${credit.id}.webp`);
  if (!credit.heroIsOriginalArt) {
    await sharp(source)
      .resize({ width: Math.min(HERO_WIDTH, width), withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(heroPath);
  }

  const cardMeta = await sharp(cardPath).metadata();
  const heroMeta = await sharp(heroPath).metadata();
  return {
    card: `${cardMeta.width}x${cardMeta.height}`,
    hero: credit.heroIsOriginalArt
      ? `${heroMeta.width}x${heroMeta.height} (kept)`
      : `${heroMeta.width}x${heroMeta.height}`,
    source: `${width}x${height}`,
  };
}

async function main() {
  const only = new Set(process.argv.slice(2));
  const targets = only.size
    ? PORTRAIT_CREDITS.filter((credit) => only.has(credit.id))
    : PORTRAIT_CREDITS;

  if (!targets.length) {
    throw new Error(`no portraits matched: ${[...only].join(", ")}`);
  }

  await mkdir(HERO_DIR, { recursive: true });

  const failures: string[] = [];
  for (const credit of targets) {
    try {
      const image = await resolveImageUrl(credit);
      const downloaded = await cachedDownload(image.url);
      const source = await applyCrop(credit, downloaded);
      const sizes = await writeOutputs(credit, source);
      console.log(
        `ok   ${credit.id.padEnd(16)} src ${sizes.source.padEnd(11)} card ${sizes.card.padEnd(9)} hero ${sizes.hero.padEnd(10)} ${credit.licence}`,
      );
    } catch (error) {
      failures.push(credit.id);
      console.error(`FAIL ${credit.id.padEnd(16)} ${(error as Error).message}`);
    }
    await sleep(600);
  }

  if (failures.length) {
    console.error(`\n${failures.length} portrait(s) failed: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

void main();
