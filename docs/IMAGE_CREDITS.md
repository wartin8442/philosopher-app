# Image credits and provenance

Every image shipped in `public/` needs a recorded source and licence. This file
is the record. If you add an image without an entry here, it should not ship.

Attribution for the Creative Commons works is **rendered in the app**, not just
recorded here — attribution is a condition of those licences, so it has to be
visible to the person looking at the image:

- `/why-philosophy` — one combined credit line under the three portrait cards.
- `/why-philosophy/<person>` — a per-photo credit in the corner of the hero.
- `/philosopher/<id>` — a per-portrait credit in the corner of the hero.

The credit text is generated from data, not retyped here: `imageCredit` on each
person in `src/lib/whyPhilosophy.ts` for the contemporary figures, and
`PORTRAIT_CREDITS` in `src/lib/imageCredits.ts` for the philosophers. A portrait
therefore cannot be swapped without its credit travelling with it, and
`src/lib/imageCredits.test.ts` fails the build if a file appears in
`public/philosophers/` without a matching row.

## Philosopher portraits — `public/philosophers/`

Two images ship per philosopher, and they are not the same thing:

- **Carousel portrait** — `public/philosophers/<id>.jpg|webp`, the circular
  image on `/explore`. All twenty-three are public-domain or freely licensed
  works from Wikimedia Commons, rebuilt by `npm run portraits:fetch` from the
  file names in `src/lib/imageCredits.ts`. Derivatives stay under the original
  licence.
- **Card picture** — `public/philosophers/heroes/<id>.webp`, the full-bleed
  image on `/philosopher/<id>`. Eighteen are uncropped renditions of the same
  Commons file. **Five (marked ✳) are the project's own commissioned artwork**
  — tinted drawings matching each philosopher's accent colour — and are not
  derived from Commons at all.

Six card pictures — Epicurus, Hume, Kant, Spinoza, Wittgenstein and Hegel —
carry extra background at the left and right, added by widening the canvas
rather than by cropping. Nothing is removed: the hero crops to roughly 2.5:1 on
a desktop, and how large a face reads there is set by its height in pixels
against the *source width*, so a portrait framed tightly on its subject cannot
fit that subject however `heroFocus` is tuned. The filler is the image's own
edge colour stretched sideways and feathered into the join, and it costs
nothing on a phone, where the hero is height-limited and crops the added margin
straight back off. Hegel's is one-sided, to centre a subject who sat right of
frame.

The table credits the **carousel portrait**. For the ✳ five, the named artist
made that image and *not* the card picture beside it, which is why the credit
rendered in the app reads "Portrait:" rather than "Photo:". Crediting a Commons
photographer for artwork they did not make would be a false attribution — a
worse failure than no attribution at all.

`npm run portraits:fetch` skips the ✳ heroes rather than overwriting artwork it
cannot recreate.

| File | Subject | Artist / photographer | Licence | Source |
| --- | --- | --- | --- | --- |
| `aquinas` ✳ | Thomas Aquinas | Carlo Crivelli | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:St-thomas-aquinas.jpg) |
| `aristotle` | Aristotle | Roman copy of a Greek original; photograph by Szilas | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Portrait_of_Aristotle%2C_set_on_a_restored_bust%2C_Colosseum.jpg) |
| `augustine` | Augustine of Hippo | Sandro Botticelli | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Augustine_of_Hippo_Sandro_Botticelli.jpg) |
| `beauvoir` | Simone de Beauvoir | Liu Dong'ao | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Simone_de_Beauvoir_in_Beijing_1955.jpg) |
| `camus` ✳ | Albert Camus | United Press International | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Albert_Camus%2C_gagnant_de_prix_Nobel%2C_portrait_en_buste%2C_pos%C3%A9_au_bureau%2C_faisant_face_%C3%A0_gauche%2C_cigarette_de_tabagisme.jpg) |
| `descartes` | René Descartes | Frans Hals | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Frans_Hals%2C_Portrait_of_Ren%C3%A9_Descartes.jpg) |
| `epicurus` | Epicurus | Roman copy of a Greek original; photograph by Gary Todd | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Marble_Bust_of_Epicurus%2C_Roman_Copy.jpg) |
| `foucault` | Michel Foucault | Unknown (Diário de Lisboa, 25 April 1968) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Michel_Foucault_c._1968.jpg) |
| `hegel` | G. W. F. Hegel | Jakob Schlesinger | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Jakob_Schlesinger_-_Hegel_1831.jpg) |
| `heidegger` | Martin Heidegger | Willy Pragher | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Heidegger_2_(1960).jpg) |
| `hume` | David Hume | Allan Ramsay | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Allan_Ramsay_-_David_Hume%2C_1711_-_1776._Historian_and_philosopher_-_PG_3521_-_National_Galleries_of_Scotland.jpg) |
| `girard` | René Girard | Vicq | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Ren%C3%A9_Girard.jpg) |
| `kant` | Immanuel Kant | Johann Christoph Frisch | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Immanuel_Kant_by_Johann_Christoph_Frisch.jpg) |
| `kierkegaard` ✳ | Søren Kierkegaard | Niels Christian Kierkegaard | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Soeren_kierkegaard_5627.jpg) |
| `locke` | John Locke | Godfrey Kneller | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Godfrey_Kneller_-_Portrait_of_John_Locke_(Hermitage).jpg) |
| `marcus-aurelius` | Marcus Aurelius | Roman original; photograph by Jebulon | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Head_Marcus_Aurelius_archmus_Heraklion.jpg) |
| `marx` | Karl Marx | John Jabez Edwin Mayall | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Karl_Marx_Portrait.jpg) |
| `mill` | John Stuart Mill | Unknown; Library of Congress, Prints & Photographs (cph.3a06524) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:John_Stuart_Mill%2C_M.P._LCCN2004672081.tif) |
| `nietzsche` ✳ | Friedrich Nietzsche | Gustav-Adolf Schultze | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Nietzsche1882.jpg) |
| `plato` | Plato | Roman copy after Silanion; photograph by Marie-Lan Nguyen | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5) | [Commons](https://commons.wikimedia.org/wiki/File:Plato_Silanion_Musei_Capitolini_MC1377.jpg) |
| `sartre` ✳ | Jean-Paul Sartre | Moshe Milner / Government Press Office (Israel) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Jean-Paul_Sartre_1967_(cropped).jpg) |
| `spinoza` | Baruch Spinoza | Anonymous, c. 1665 | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Spinoza.jpg) |
| `wittgenstein` | Ludwig Wittgenstein | Moritz Nähr | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Ludwig_Wittgenstein.jpg) |

The per-file reasoning — which public-domain rule applies, why one Commons file
was chosen over another — is in the `note` field of each entry in
`src/lib/imageCredits.ts`, next to the data it explains.

### What these replaced

Until this audit, `public/philosophers/` held portraits supplied without a
recorded source. None of them matched a Wikimedia Commons file by hash, and all
embedded metadata had been stripped by re-encoding, so their provenance could
not be established after the fact. Their `.jfif` and browser-`.webp` extensions
point at image-search results rather than a licensed source. They were replaced
rather than researched, because an image you cannot trace is one you cannot
ship. The originals remain outside the repo in
`New Philosopher Portraits and Cards/`.

The five ✳ card pictures are the exception, and were deliberately kept. They are
the project's own artwork rather than found images, so there is no third-party
copyright to trace: work generated without human authorship is not eligible for
copyright protection in the US, and commissioned work belongs to the project
either way. Two caveats worth knowing rather than discovering later — that
analysis is US-specific and other jurisdictions differ, and a generator's terms
of service can restrict commercial use whatever the copyright position.

### Three the reviewer should know about

Most of the table is unambiguous — paintings by artists centuries dead, ancient
sculpture, photographs from the 1880s. Three carry a caveat:

- **Foucault** rests on `PD-Portugal-URAA`: an anonymous work published in
  Portugal in 1968. That holds only as long as the photographer really is
  unidentified. It is also the poorest image in the set — a coarse newsprint
  halftone — because free photographs of Foucault are scarce. Worth revisiting
  if a better-licensed one appears.
- **Camus** is `PD-US`: a 1957 UPI press photograph published in the United
  States without a copyright notice and never renewed. Solid in the US; the
  Commons file page notes it may not be public domain everywhere else.
- **Heidegger** and **Sartre** are **CC BY-SA**. The share-alike term attaches
  to the photographs and to our resized copies of them, not to the pages that
  display them. Both credits are rendered on the profile page, which is what
  the licence requires. Sartre's is the Israeli Government Press Office
  photograph from Lod airport, 14 March 1967, taken as he and Beauvoir arrived
  in Israel; it carries a VRT permission ticket (#2012112010011362) on Commons,
  which makes it the best-evidenced release in the set.

## Contemporary figures — `public/images/why-philosophy/`

All three are Creative Commons works from Wikimedia Commons, chosen from files
carrying **no `personality` restriction** flag on Commons (several otherwise
suitable Nobel-week photographs of Hassabis do carry one, and were skipped for
that reason). Each was downscaled to 1800px tall and re-encoded as JPEG; the
resized files remain under the original licence.

| File | Subject | Photographer | Licence | Source |
| --- | --- | --- | --- | --- |
| `peter-thiel.jpg` | Peter Thiel | Gage Skidmore | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Peter_Thiel_by_Gage_Skidmore.jpg) |
| `jordan-peterson.jpg` | Jordan Peterson | Gage Skidmore | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Jordan_Peterson_by_Gage_Skidmore.jpg) |
| `demis-hassabis.jpg` | Demis Hassabis | Christopher Michel | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Demis_Hassabis_in_2025_by_Christopher_Michel.jpg) |

Note on **BY-SA**: the share-alike term attaches to the photograph and to
derivatives of it (our resized copies), not to the pages that display it. The
app crops these for the gateway cards with CSS `object-position` — display
framing, which does not modify the file.

These replaced earlier copies of unknown provenance (`Peter-Thiel.jpg`,
`Peter Thiel V2.jfif`, `Jordan Peterson.jpg`, `Demis Hassabis.webp`,
`demis-hassabis-fixed.png`), which were deleted from the repo.

## Course boards — `public/courses/<philosopher>/`

Two kinds of file live here, and only one of them has an outside source:

- **Diagrams** (`human-being.webp`, `synthesis-self-sketch.webp`) — drawn for
  this project. No third-party rights. `human-being.webp` is no longer on a
  board; the section it illustrated now carries its two poles as columns.
- **Plates** — pictures pinned to a lecture board by the beat that names them,
  declared as `plates` on the board in `src/lib/courses.ts`. All are free works
  from Wikimedia Commons, downscaled to the size the board draws them at (a
  tall plate to 820px high, a wide one to 1400px across) and re-encoded as
  webp; the resized files remain under the original terms.

| File | Subject | Artist / photographer | Licence | Source |
| --- | --- | --- | --- | --- |
| `kierkegaard/school-of-athens.webp` | Raphael, *The School of Athens* (1509–11), Stanza della Segnatura, Vatican | Raphael (d. 1520) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg) |
| `kierkegaard/kierkegaard-statue.webp` | Louis Hasselriis's statue of Kierkegaard, Royal Library Garden, Copenhagen | Photograph by Jebulon | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Kirkegaard_statue_Hasselriis_Copenhagen_Denmark.jpg) |
| `kierkegaard/michael-kierkegaard.webp` | Michael Pedersen Kierkegaard (1756–1838), the father | Daguerreotype, photographer unknown | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Mikael_Pedersen_Kierkegaard_b.jpg) |
| `kierkegaard/denmark-map.webp` ✳ | Map of Denmark marking Sædding and Copenhagen | The project's own artwork | — | Repo (`Map of Denmark (Saedding and Copenhagen).png`) |
| `kierkegaard/university-of-copenhagen.webp` | *Universitetet i Kjøbenhavn* — the university as it was when he enrolled | Søren Henrik Petersen (1788–1860) | Public domain | [SMK Open, KKSgb10408](https://open.smk.dk/en/artwork/image/KKSgb10408) |
| `kierkegaard/kierkegaard-walking.webp` | Kierkegaard walking, c. 1845 | P.C. Klæstrup (1820–1882); Frederiksborg Museum, via the Royal Danish Library | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Soeren_kierkegaard_royal_library.jpg) |
| `kierkegaard/regine-olsen.webp` | Regine Olsen | Emil Bærentzen, 1840 | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Regine_Olsen_(Emil_B%C3%A6rentzen).jpg) |
| `kierkegaard/kierkegaard-in-the-corsair.webp` | The Corsaren caricature, 27 August 1846 | Scan from P. Hansen, *Illustreret Dansk Litteraturhistorie*, 1902 | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:S%C3%B8ren_Kierkegaard_i_Corsaren.jpg) |
| `kierkegaard/mynster.webp` | Bishop Jacob Peter Mynster | Vilhelm Gertner, 1842 | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Jacob_Peter_Mynster.jpg) |
| `kierkegaard/frederiks-hospital.webp` | Frederik's Hospital, Amaliegade, where he died | Kristian Kongstad (1867–1929), from Otto Asmussen's *Kjøbenhavn*, 1914 | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Kj%C3%B8benhavn_-_Frederiks_Hospital.jpg) |
| `kierkegaard/emil-boesen.jpg` | Emil Ferdinand Boesen (1812–1881), the friend who sat with him in the hospital | Photograph by A. Lønborg; Den Gamle By's image collection | Public domain (copyright expired) | [AarhusWiki](https://aarhuswiki.dk/wiki/Fil:Emil_Ferdinand_Boesen,.jpeg) |
| `kierkegaard/kierkegaard-grave.webp` | The Kierkegaard family grave, Assistens Cemetery | Photographer unknown | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:S%C3%B8ren_Kierkegaard_grave_1.jpg) |

None of these carries an attribution condition: every one is either out of
copyright or a CC0 dedication, and ✳ is the project's own drawing. They are
credited anyway — in the caption under the picture, from the `credit` field on
the visual — because a lecture that shows a work should say whose it is. The
statue and the two portraits also raise no question of rights in the work
depicted: Hasselriis died in 1912, Bærentzen in 1868, Gertner in 1878.

The Impact board pins up no new files. It deals out four **card pictures**
already in `public/philosophers/heroes/`, whose provenance is the table above
in this document — all four are the project's own commissioned artwork.

Book covers on the Key works board use the original generated designs described
below.

## Book covers

Every cover shown by `BookCover` is generated locally from the work's title,
author, publication year, the philosopher's existing accent colour, plain type,
and basic geometric ornament. It contains no publisher jacket, logo,
illustration, photograph, scan, or remote image. Titles, author names, dates,
and basic geometric forms are not borrowed cover artwork.

To the extent that copyright can subsist in these generated cover designs, the
project dedicates them to the public domain under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
This dedication covers only the original cover presentation produced by this
project; it does not make the underlying books, translations, or third-party
material public domain.

Do not replace these designs with a publisher or bookseller image unless that
specific image has a documented licence permitting this app's use. Add any such
licence and provenance to this file before the image is introduced.

## Adding a portrait

1. Find a public-domain or CC-licensed file on Wikimedia Commons. Prefer public
   domain and CC0; check the file page for a `personality` or other
   non-copyright restriction and skip anything that carries one.
2. Add a row to `PORTRAIT_CREDITS` in `src/lib/imageCredits.ts`, including the
   `note` explaining why the file is free to use. Add a `sourceCrop` if the
   original is a whole artwork rather than a portrait.
3. Run `npm run portraits:fetch -- <id>`, then look at the carousel portrait.
   If the face is not centred, set `cardCrop` — `x`/`y` are the head's centre
   as fractions of the source, `size` is the square's side as a fraction of the
   width. Measure the head box off the source rather than guessing: `x`/`y`
   bisect it, and `size` is its larger side over ~0.78, the share of the card a
   head should fill. Re-run; downloads are cached, so iterating is cheap.
   If the head is so large in the source that no square holding all of it fits
   inside — Plato's bust is taller than his photograph is wide — add
   `padToFit: true`, which grows the canvas with edge-replicated pixels instead
   of shrinking the square into the head. Only where the padded edges are plain
   background; check the result, because replicating an edge that runs through
   detail smears it.
4. If the card picture is bespoke artwork rather than the Commons image, set
   `heroIsOriginalArt: true` so the fetch script leaves it alone, and mark the
   row ✳ below.
5. Add the row to the table above.

`npm test` will fail if step 2 is skipped.
