Portrait files in this directory are **generated, not hand-placed.**

Every one is built by `npm run portraits:fetch` from a Wikimedia Commons file
recorded in `src/lib/imageCredits.ts`, which also carries the author, the
licence, and the reason the file is free to use. Two outputs per philosopher:

- `<id>.jpg` / `<id>.webp` — square card portrait, up to 640px
- `heroes/<id>.webp` — uncropped profile hero, up to 1024px wide

Do not drop an image in here by hand. An image whose source is not recorded
cannot be shown, because nobody can say whether it is legal to show — that is
exactly the state this directory used to be in. `src/lib/imageCredits.test.ts`
fails if a file appears here without a matching credit.

To add or change a portrait, follow "Adding a portrait" in
`docs/IMAGE_CREDITS.md`.
