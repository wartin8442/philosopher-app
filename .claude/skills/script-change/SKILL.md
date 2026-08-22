---
name: script-change
description: Apply a wording change to a scripted course lecture in src/lib/courses.ts. Use ONLY when Will explicitly invokes it — /script-change, or "script change". The prompt is a location followed by the old text and the new text, e.g. `Introduction, Hegel, Dialectic, "[old]", "[new]"`. Do NOT trigger on ordinary requests to edit the course script.
---

# Script Change

Will names a place in a lecture, the text there he wants gone, and what
should stand in its place. Find it, change it, keep the lecture legal.

## The prompt

```
<module>, <part>, <section>, "<old text>", "<new text>"
```

The location is a path from the module down, as specific as it needs to be
to be unambiguous — `Introduction, Hegel, Dialectic` is module `introduction`,
the Hegel group inside its biography, the "The dialectic" section. Fewer steps
are fine (`Introduction, Upbringing`) when they already name one section.
Match loosely: Will writes the titles as he remembers them, not as they are
spelled in the file.

The last two quoted strings are old and new. Either may be a fragment of a
line rather than a whole line — replace exactly the span he quoted, leaving
the rest of the sentence alone.

## Finding it

Everything is in `src/lib/courses.ts`. The path resolves as:

- **module** — `Course.modules[].id` / `.title` (`introduction`, `the-self`, …)
- **part** — a `CourseSectionGroup`: `group` on a section (`BIOGRAPHY`), or
  `subgroup` for a group inside one (`HEGEL`)
- **section** — `CourseSection.id` / `.title`

Then search that section for the old text. It can be in any of:

| Where | What it is |
|---|---|
| `beats[].text` | a spoken sentence — the usual case |
| `handoff` | the spoken question the section ends on |
| `continueLabel` | the button that answers the handoff |
| `keyPoints[]` | study notes, written not spoken |
| the section's board, in `visuals` | `points[].text`, `plates[].caption`, `closing.lines[].text`, `books[].title` |
| `points[].deepDive[].text` | the scripted aside behind a written line |

If the quoted text is not there verbatim, find the nearest match, show Will
what you found, and ask before changing it. If it appears more than once in
the named section, ask which.

## The rules the file holds you to

`src/lib/courses.test.ts` enforces these — breaking one fails the suite:

- **A beat is exactly one sentence.** The narrator reveals subtitles from the
  speech engine's own sentence boundaries, so two sentences in one beat light
  the subtitle a sentence early. If Will's replacement is two sentences, split
  it into two beats and say you did.
- **A spoken line is under 400 characters.**
- **A board point is a note, not a sentence** — twelve words at most.
- **Point ids are the wiring.** `boardPoint` on a beat names a point by id, and
  ids are unique across a module. Change the `text`, never the `id`, unless
  you update every beat that writes it.
- **Everything declared on a board must be written by some beat**, and a beat
  may only write onto the board that is on stage.

## After the edit

1. Read the surrounding beats. A changed sentence has to still follow from the
   one before it and lead into the one after — if it no longer does, say so
   rather than leaving a seam.
2. Check whether the same wording is echoed in that section's `keyPoints`, in
   its `handoff`, or in a board point. Tell Will what you found and update it
   too unless he said otherwise.
3. Run the tests:

   ```
   npx vitest run --pool=threads src/lib/courses.test.ts
   ```

   (`--pool=threads` because the default forks pool times out on this machine.)

4. Report the change as `file:line`, plus anything you changed beyond what he
   asked for and why.

Nothing else in the lecture moves. This skill changes wording — it does not
re-cut sections, re-order beats, or redesign a board unless Will asks.
