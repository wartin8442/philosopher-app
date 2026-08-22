/**
 * Provenance and licence for every philosopher portrait shipped in `public/`.
 *
 * This is the single source of truth for two things that must never drift
 * apart: the app's rendered attribution, and the record in
 * `docs/IMAGE_CREDITS.md`. `scripts/fetch-portraits.ts` also reads it, so the
 * exact file each portrait came from is re-fetchable rather than remembered.
 *
 * The rule this file exists to enforce: **no portrait ships without a row
 * here.** A portrait whose source cannot be named is a portrait we cannot show.
 *
 * Attribution is rendered on the profile-page hero rather than only recorded
 * here, because CC BY and CC BY-SA both make credit a condition of the licence
 * — it has to be visible to the person looking at the photograph. Public-domain
 * works carry no such condition, but they are credited the same way: it costs
 * nothing and it keeps the provenance honest and checkable.
 */

export interface PortraitCredit {
  /** Philosopher id, matching `Philosopher.id` and `PhilosopherProfile.id`. */
  id: string;
  /** File name on Wikimedia Commons, without the `File:` prefix. */
  commonsFile: string;
  /** Creator, as named on the Commons file page. */
  author: string;
  /** Licence short name, e.g. "CC BY-SA 3.0" or "Public domain". */
  licence: string;
  /** Deed URL. Empty for public-domain works, which have no licence deed. */
  licenceUrl: string;
  /** Container format of the card portrait under `/public/philosophers/`. */
  cardExt: "jpg" | "webp";
  /**
   * Region of the Commons original to keep, as fractions of its width/height.
   *
   * Several sources are the whole artwork rather than a portrait — an
   * altarpiece panel, a fresco with the sitter off to one side, a framed
   * painting photographed frame and all, a library catalogue card with the
   * caption still attached. Cropping happens here, on the source, so the card
   * and the hero are both cut from the same corrected image.
   *
   * Omitted when the original is already a portrait.
   */
  sourceCrop?: { left: number; top: number; width: number; height: number };
  /**
   * How to cut the square card, measured off the (already `sourceCrop`ped)
   * image:
   *
   * - `x`, `y` — the centre of the head, as fractions of width and height.
   *   The card is centred here, so every face lands in the middle of the
   *   circular avatar. That consistency is the whole point: you see the roster
   *   as a row of circles, and one face riding high reads as a mistake.
   * - `size` — the square's side, as a fraction of the image width, chosen so
   *   the head fills roughly 78% of the card. The script shrinks this if a
   *   square that big could not stay centred inside the image, because
   *   centring matters more than framing width — unless `padToFit` is set.
   *
   * 78% is the figure for a head taller than it is wide, which most of these
   * are. The card is displayed as a circle, and a circle takes back the corners
   * of the square: a head as wide as it is tall (Foucault straight-on, Beauvoir
   * with her hair up) touches the arc at the crown and the chin at that fill
   * and comes out sliced. Those get 62–68% instead, which is what "the whole
   * head, comfortably inside the circle" costs.
   *
   * Every number here is the head's *measured* extent: `x`/`y` bisect the head
   * box, and `size` is its larger side divided by the target fill. Automatic
   * saliency cropping was tried first and consistently missed — it chases
   * contrast, so it framed Hume's red coat and Marx's beard rather than either
   * man's face. Measured numbers are boring and correct.
   */
  cardCrop?: { x: number; y: number; size: number };
  /**
   * Grow the canvas with edge-replicated pixels when the card square would
   * overhang, instead of shrinking the square to fit.
   *
   * Six sources are cropped so tightly around the sitter that *no* square
   * containing the whole head fits inside them — Plato's bust is taller than
   * the photograph is wide. Shrinking there does not produce a smaller frame,
   * it produces a sliced head: Plato lost his beard, Sartre
   * and Foucault lost the tops of their skulls. Padding keeps the head whole
   * and centred; `size` may exceed 1 as a result.
   *
   * Only set this where the background along the padded edges is plain — flat
   * sky, seamless studio backdrop, blank newsprint, or a crowd thrown far
   * enough out of focus to read as one. Replicating an edge that runs through
   * detail smears it into a streak.
   */
  padToFit?: boolean;
  /**
   * True when `heroes/<id>.webp` is the project's own commissioned artwork
   * rather than a rendition of `commonsFile`.
   *
   * This matters for more than bookkeeping. The credit rendered on the profile
   * page would otherwise name the Commons author beside a picture they did not
   * make — a false attribution, and a worse problem than no attribution. So
   * the credit is always worded as crediting the *carousel portrait*, which is
   * the image `commonsFile` actually produced, and `npm run portraits:fetch`
   * leaves these hero files alone.
   */
  heroIsOriginalArt?: boolean;
  /** Why this file is free to use, plus anything a future reviewer should know. */
  note: string;
}

/** Full width, centred a little high — a sane guess for a tight portrait. */
export const DEFAULT_CARD_CROP = { x: 0.5, y: 0.42, size: 1 };

export const PORTRAIT_CREDITS: PortraitCredit[] = [
  {
    id: "aquinas",
    commonsFile: "St-thomas-aquinas.jpg",
    author: "Carlo Crivelli",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.492, y: 0.489, size: 0.757 },
    sourceCrop: { left: 0.16, top: 0.06, width: 0.66, height: 0.46 },
    heroIsOriginalArt: true,
    note: "Painting, c. 1476 (National Gallery, London). PD-Art — the painter died in 1495.",
  },
  {
    id: "aristotle",
    commonsFile: "Portrait of Aristotle, set on a restored bust, Colosseum.jpg",
    author: "Roman copy of a Greek original; photograph by Szilas",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.498, y: 0.23, size: 0.544 },
    heroIsOriginalArt: true,
    note: "PD-art-100 for the ancient sculpture, plus PD-self — the photographer released the photograph into the public domain.",
  },
  {
    id: "augustine",
    commonsFile: "Augustine of Hippo Sandro Botticelli.jpg",
    author: "Sandro Botticelli",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.557, y: 0.46, size: 0.535 },
    sourceCrop: { left: 0.42, top: 0.02, width: 0.58, height: 0.6 },
    heroIsOriginalArt: true,
    note: "Fresco, 1480 (Ognissanti, Florence). PD-Art — the painter died in 1510.",
  },
  {
    id: "beauvoir",
    commonsFile: "Simone de Beauvoir in Beijing 1955.jpg",
    author: "Liu Dong'ao",
    licence: "CC0 1.0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    cardExt: "jpg",
    // `x` bisects the whole head including the bun at the back, not just the
    // face — measuring the face alone put the square left of centre and cut
    // the bun off, while the square that fitted around it clipped her chin.
    //
    // She stands close to the top of the frame, so the square that holds the
    // head at this fill overhangs by ~26px and `padToFit` supplies them. The
    // crowd behind her is far enough out of focus that replicating that strip
    // upward is indistinguishable from more of the same blur.
    cardCrop: { x: 0.47, y: 0.235, size: 0.77 },
    sourceCrop: { left: 0.1, top: 0, width: 0.9, height: 0.85 },
    padToFit: true,
    heroIsOriginalArt: true,
    note: "Beijing, 1955. Dedicated to the public domain under CC0 by the rights holder, so no attribution is strictly required — we render it anyway.",
  },
  {
    id: "camus",
    commonsFile:
      "Albert Camus, gagnant de prix Nobel, portrait en buste, posé au bureau, faisant face à gauche, cigarette de tabagisme.jpg",
    author: "United Press International",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.525, y: 0.25, size: 0.78 },
    heroIsOriginalArt: true,
    note: "1957 press photograph held by the Library of Congress Prints & Photographs division. PD-US: published in the United States without a copyright notice and not renewed.",
  },
  {
    id: "descartes",
    commonsFile: "Frans Hals, Portrait of René Descartes.jpg",
    author: "Frans Hals",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.485, y: 0.307, size: 0.693 },
    heroIsOriginalArt: true,
    note: "Painting after Frans Hals, c. 1649 (Louvre). PD-Art — Hals died in 1666.",
  },
  {
    id: "epicurus",
    commonsFile: "Marble Bust of Epicurus, Roman Copy.jpg",
    author: "Roman copy of a Greek original; photograph by Gary Todd",
    licence: "CC0 1.0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    cardExt: "jpg",
    cardCrop: { x: 0.5, y: 0.36, size: 1 },
    sourceCrop: { left: 0.26, top: 0.03, width: 0.5, height: 0.48 },
    heroIsOriginalArt: true,
    note: "The photographer dedicated the photograph to the public domain under CC0; the sculpture itself is ancient.",
  },
  {
    id: "foucault",
    commonsFile: "Michel Foucault c. 1968.jpg",
    author: "Unknown (Diário de Lisboa, 25 April 1968)",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.53, y: 0.399, size: 1.35 },
    // Runs the full width of the halftone rather than stopping at 0.9, which
    // cut through his glasses — and `padToFit` then smeared that cut sideways.
    //
    // `height` reaches past the head to his collar for the same reason in the
    // other axis: at 0.62 the square ran off the bottom and the replicated rows
    // streaked his suit down through the arc of the circle. 0.66 is real pixels
    // instead, and leaves the padding entirely to the blank newsprint sides.
    sourceCrop: { left: 0.02, top: 0.02, width: 0.98, height: 0.66 },
    padToFit: true,
    heroIsOriginalArt: true,
    note: "PD-Portugal-URAA: an anonymous work published in Portugal in 1968. This is the weakest public-domain claim in the set — it rests on the author being genuinely unidentified — and the source is a coarse newsprint halftone. Re-check both before any commercial use.",
  },
  {
    id: "hegel",
    commonsFile: "Jakob Schlesinger - Hegel 1831.jpg",
    author: "Jakob Schlesinger",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.475, y: 0.422, size: 0.897 },
    heroIsOriginalArt: true,
    note: "Painting, 1831 (Alte Nationalgalerie, Berlin). PD-Art — the painter died in 1855.",
  },
  {
    id: "heidegger",
    commonsFile: "Heidegger 2 (1960).jpg",
    author: "Willy Pragher",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    cardExt: "webp",
    cardCrop: { x: 0.41, y: 0.325, size: 1 },
    heroIsOriginalArt: true,
    note: "1960, from the Landesarchiv Baden-Württemberg. Attribution and share-alike are licence conditions, so the credit must stay rendered.",
  },
  {
    id: "hume",
    commonsFile:
      "Allan Ramsay - David Hume, 1711 - 1776. Historian and philosopher - PG 3521 - National Galleries of Scotland.jpg",
    author: "Allan Ramsay",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.49, y: 0.28, size: 0.79 },
    heroIsOriginalArt: true,
    note: "Painting, 1766 (National Galleries Scotland). PD-Art — the painter died in 1784.",
  },
  {
    id: "girard",
    commonsFile: "René Girard.jpg",
    author: "Vicq",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.523, y: 0.323, size: 0.741 },
    heroIsOriginalArt: true,
    note: "Photograph by Vicq at a 2007 Paris colloquium. The photographer dedicated it to the public domain worldwide.",
  },
  {
    id: "kant",
    commonsFile: "Immanuel Kant by Johann Christoph Frisch.jpg",
    author: "Johann Christoph Frisch",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.45, y: 0.315, size: 0.73 },
    heroIsOriginalArt: true,
    note: "Painting, 1789. PD-Art — the painter died in 1815.",
  },
  {
    id: "kierkegaard",
    commonsFile: "Soeren kierkegaard 5627.jpg",
    author: "Niels Christian Kierkegaard",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.502, y: 0.375, size: 0.903 },
    heroIsOriginalArt: true,
    note: "Unfinished sketch, c. 1840, by the sitter's cousin. PD-old-100. Chosen over the Luplau Janssen paintings, which show him in profile at a writing desk and crop badly to a portrait.",
  },
  {
    id: "locke",
    commonsFile: "Godfrey Kneller - Portrait of John Locke (Hermitage).jpg",
    author: "Godfrey Kneller",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "webp",
    cardCrop: { x: 0.515, y: 0.305, size: 0.69 },
    heroIsOriginalArt: true,
    note: "Painting, 1697 (Hermitage Museum). PD-Art. Chosen over the National Portrait Gallery copy of the same sitter, which carries a third-party copyright claim on Commons.",
  },
  {
    id: "marcus-aurelius",
    commonsFile: "Head Marcus Aurelius archmus Heraklion.jpg",
    author: "Roman original; photograph by Jebulon",
    licence: "CC0 1.0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    cardExt: "jpg",
    cardCrop: { x: 0.51, y: 0.41, size: 1 },
    heroIsOriginalArt: true,
    note: "Archaeological Museum of Heraklion. The photographer dedicated the photograph to the public domain under CC0.",
  },
  {
    id: "marx",
    commonsFile: "Karl Marx Portrait.jpg",
    author: "John Jabez Edwin Mayall",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.565, y: 0.305, size: 0.81 },
    heroIsOriginalArt: true,
    note: "Photograph, 1875, from the International Institute of Social History. PD-old. Chosen over the higher-resolution Mayall scans, which carry a non-copyright 'communist symbols' restriction flag on Commons.",
  },
  {
    id: "mill",
    commonsFile: "John Stuart Mill, M.P. LCCN2004672081.tif",
    author: "Unknown; Library of Congress, Prints & Photographs (cph.3a06524)",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "webp",
    cardCrop: { x: 0.575, y: 0.455, size: 0.667 },
    sourceCrop: { left: 0.1, top: 0.08, width: 0.62, height: 0.48 },
    heroIsOriginalArt: true,
    note: "Photograph, c. 1870. The Library of Congress records no known restrictions on publication. Cropped away from the catalogue card's border and printed caption.",
  },
  {
    id: "nietzsche",
    commonsFile: "Nietzsche1882.jpg",
    author: "Gustav-Adolf Schultze",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.435, y: 0.31, size: 0.9 },
    heroIsOriginalArt: true,
    note: "Photograph, 1882. PD-old-100 — the photographer died in 1897.",
  },
  {
    id: "plato",
    commonsFile: "Plato Silanion Musei Capitolini MC1377.jpg",
    author: "Roman copy after Silanion; photograph by Marie-Lan Nguyen",
    licence: "CC BY 2.5",
    licenceUrl: "https://creativecommons.org/licenses/by/2.5",
    cardExt: "jpg",
    cardCrop: { x: 0.5, y: 0.515, size: 1.534 },
    padToFit: true,
    heroIsOriginalArt: true,
    note: "Musei Capitolini, Rome. Attribution is a licence condition, so the credit must stay rendered.",
  },
  {
    id: "sartre",
    commonsFile: "Jean-Paul Sartre 1967 (cropped).jpg",
    author: "Moshe Milner / Government Press Office (Israel)",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    cardExt: "jpg",
    cardCrop: { x: 0.502, y: 0.395, size: 1.201 },
    heroIsOriginalArt: true,
    padToFit: true,
    note: "Lod airport, 14 March 1967, arriving in Israel with Beauvoir. Released by the Israeli Government Press Office and backed by a VRT permission ticket (#2012112010011362). Attribution and share-alike are licence conditions, so the credit must stay rendered.",
  },
  {
    id: "spinoza",
    commonsFile: "Spinoza.jpg",
    author: "Anonymous, c. 1665",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "jpg",
    cardCrop: { x: 0.51, y: 0.242, size: 0.544 },
    heroIsOriginalArt: true,
    note: "Painting held by the Herzog August Bibliothek Wolfenbüttel. PD-Art. This is the cropped plate; the full HAB scan on Commons includes the gilt frame and a colour calibration strip.",
  },
  {
    id: "wittgenstein",
    commonsFile: "Ludwig Wittgenstein.jpg",
    author: "Moritz Nähr",
    licence: "Public domain",
    licenceUrl: "",
    cardExt: "webp",
    cardCrop: { x: 0.405, y: 0.293, size: 0.942 },
    padToFit: true,
    heroIsOriginalArt: true,
    note: "Photograph, 1930, Austrian National Library. PD-old-100 — the photographer died in 1945.",
  },
];

const BY_ID = new Map(PORTRAIT_CREDITS.map((credit) => [credit.id, credit]));

export function getPortraitCredit(id: string): PortraitCredit | undefined {
  return BY_ID.get(id);
}

/** The Commons file page, which is the canonical source link for a portrait. */
export function commonsPageUrl(credit: PortraitCredit): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(
    credit.commonsFile.replace(/ /g, "_"),
  )}`;
}
