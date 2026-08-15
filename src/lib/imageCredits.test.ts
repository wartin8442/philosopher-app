import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  commonsPageUrl,
  getPortraitCredit,
  PORTRAIT_CREDITS,
} from "./imageCredits";
import { DEMO_ROSTER_IDS, getDemoPhilosopher } from "./philosophers";
import { getProfile } from "./profiles";

/**
 * These tests exist because `public/philosophers/` once held images whose
 * source nobody had recorded — which meant nobody could say whether they were
 * legal to ship. The rule they enforce is the fix: a portrait file and its
 * licence row travel together, or neither ships.
 */

const CARD_DIR = path.join(process.cwd(), "public", "philosophers");
const HERO_DIR = path.join(CARD_DIR, "heroes");

const imageFiles = (dir: string) =>
  readdirSync(dir).filter((file) => /\.(jpe?g|png|webp|avif|gif)$/i.test(file));

describe("portrait credits", () => {
  it("credits every philosopher on the released roster", () => {
    for (const id of DEMO_ROSTER_IDS) {
      expect(getPortraitCredit(id), id).toBeDefined();
    }
  });

  it("names a Commons file, an author and a licence for each portrait", () => {
    for (const credit of PORTRAIT_CREDITS) {
      expect(credit.commonsFile, credit.id).not.toBe("");
      expect(credit.author, credit.id).not.toBe("");
      expect(credit.licence, credit.id).not.toBe("");
      expect(credit.note, credit.id).not.toBe("");
      expect(getDemoPhilosopher(credit.id), credit.id).toBeDefined();
    }
  });

  it("gives every licence that requires attribution a deed URL to link to", () => {
    for (const credit of PORTRAIT_CREDITS) {
      // Public-domain works have no deed; everything else must link to one,
      // because the rendered credit is what satisfies the licence.
      const isPublicDomain = credit.licence === "Public domain";
      expect(credit.licenceUrl === "", `${credit.id} (${credit.licence})`).toBe(
        isPublicDomain,
      );
      if (!isPublicDomain) {
        expect(credit.licenceUrl, credit.id).toMatch(/^https:\/\//);
      }
    }
  });

  it("points at a real Commons file page", () => {
    const aquinas = getPortraitCredit("aquinas")!;
    expect(commonsPageUrl(aquinas)).toBe(
      "https://commons.wikimedia.org/wiki/File:St-thomas-aquinas.jpg",
    );
  });

  it("ships a card and a hero file for every credit", () => {
    for (const credit of PORTRAIT_CREDITS) {
      const card = path.join(CARD_DIR, `${credit.id}.${credit.cardExt}`);
      const hero = path.join(HERO_DIR, `${credit.id}.webp`);
      expect(existsSync(card), card).toBe(true);
      expect(existsSync(hero), hero).toBe(true);
      expect(getProfile(credit.id)?.heroImage, credit.id).toBe(
        `/philosophers/heroes/${credit.id}.webp`,
      );
    }
  });

  it("keeps a Commons source for every hero that is our own artwork", () => {
    // Every profile hero is bespoke tinted artwork, not a rendition of the
    // Commons file — the Commons sources are small black-and-white photographs
    // and busts, and no hero resembles one. The Commons file still backs the
    // carousel portrait, so the credit stays required; what the flag changes is
    // only that the fetch script must not regenerate the hero over the top of
    // the artwork.
    //
    // This was once pinned to five ids, and the other eighteen heroes were
    // therefore fair game for `npm run portraits:fetch` to overwrite with a
    // downscaled Commons photo. It is asserted over the whole list now so the
    // omission cannot come back one credit at a time.
    const originalArt = PORTRAIT_CREDITS.filter((c) => c.heroIsOriginalArt);
    expect(originalArt.map((c) => c.id).sort()).toEqual(
      PORTRAIT_CREDITS.map((c) => c.id).sort(),
    );

    for (const credit of originalArt) {
      expect(credit.commonsFile, credit.id).not.toBe("");
      expect(existsSync(path.join(HERO_DIR, `${credit.id}.webp`)), credit.id).toBe(
        true,
      );
    }
  });

  it("has no shipped portrait without a credit", () => {
    // The direction that actually caught the original problem: walk the files
    // on disk, not the list, so an image dropped into `public/` unrecorded
    // fails the build rather than shipping unattributed.
    const credited = new Set(
      PORTRAIT_CREDITS.flatMap((credit) => [
        `${credit.id}.${credit.cardExt}`,
        `${credit.id}.webp`,
      ]),
    );

    for (const file of imageFiles(CARD_DIR)) {
      expect(credited.has(file), `public/philosophers/${file}`).toBe(true);
    }
    for (const file of imageFiles(HERO_DIR)) {
      expect(credited.has(file), `public/philosophers/heroes/${file}`).toBe(true);
    }
  });
});
