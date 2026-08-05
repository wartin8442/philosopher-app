# Image credits and provenance

Every image shipped in `public/` needs a recorded source and licence. This file
is the record. If you add an image without an entry here, it should not ship.

Attribution for the Creative Commons portraits is **rendered in the app**, not
just recorded here — attribution is a condition of those licences, so it has to
be visible to the person looking at the photo:

- `/why-philosophy` — one combined credit line under the three portrait cards.
- `/why-philosophy/<person>` — a per-photo credit in the corner of the hero.

The credit text is generated from the `imageCredit` field on each person in
`src/lib/whyPhilosophy.ts`, so a portrait cannot be swapped without its credit
travelling with it.

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

## Book covers

Fetched at runtime from **Open Library** (`covers.openlibrary.org`) and not
stored in the repo. Cover art remains the copyright of the respective
publishers and is shown to identify each edition; the courtesy link back that
Open Library asks for is rendered on each philosopher page.

## Still outstanding

**`public/philosophers/*` has no provenance record.** Portraits of philosophers
who died long ago are very likely public-domain artworks, but two are not
safely assumed:

- `sartre.jpg` (d. 1980) and `camus.jpg` (d. 1960) — photographs of both are
  very likely still in copyright. These should be re-sourced from Commons the
  same way as the contemporary figures above, or replaced with public-domain
  artwork, and recorded here.

The remaining portraits and the `heroes/` crops should each get a row here as
they are verified.
