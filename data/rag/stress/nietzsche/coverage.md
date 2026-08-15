# Nietzsche corpus coverage audit (stress test, 2026-07-18)

Method: Phases 1–2 were completed corpus-blind (SEP entry "Friedrich Nietzsche" rev. 2026-06-25;
IEP entry "Nietzsche"; quotes verified against Gutenberg #1998, #4363, #52263, #52319, #52881 and
Wikiquote's sourced/misattributed sections). Only afterwards were the corpus files opened:

- `data/rag/cards/drafts/nietzsche.md` — 47 position cards in 9 sections (all `Status: draft`)
- `data/rag/indexes/nietzsche.md` — works index, 13 entries incl. a Will to Power warning (draft — Approved)
- `data/rag/quotes/drafts/nietzsche.json` — 13 sourced quotes, 4 misattributions, 1 caution (WP); 2 BGE quotes machine-verified
- `data/rag/texts/nietzsche-beyond-good-and-evil-zimmern/` — full BGE (Zimmern), 297 chunks, one aphorism per chunk
- `src/lib/philosophers.ts` — persona with anti-Nazi/antisemitism guard, "Do not fabricate quotations" instruction, 4 source cards

All five expected artifacts exist. This is a strong corpus for the doctrines; the gaps cluster in
biography/chronology, specific textual loci, and the works other than BGE having no ingested text.

## 1. SEP/IEP sections with no (or only partial) corresponding position card

| Encyclopedia section | Corpus status |
| --- | --- |
| SEP §1 Life and Works (biography: Basel chair 1869, Wagner friendship and 1876–78 break, Lou Salomé episode, 1879 resignation, Turin collapse Jan 1889, death 1900) | **No biography cards at all.** Works index gives publication dates only. Questions touching the Wagner chronology (nz-24) have only two index lines to lean on. |
| IEP §2 Periodization (juvenilia / early / middle / late periods) | **No card.** Period-confusion traps depend on general model knowledge. |
| SEP §3.1 Value creation / meta-ethics (GS 301; BGE 211 "philosophers of the future create values"; anti-realism vs constructivism debate) | Partial: persona prompt one-liner and "No Moral Facts" card (BGE 108). No card on value *creation* as a positive doctrine. |
| SEP §3.2.3 Truthfulness/Honesty (GS 2 intellectual conscience; GS 344; BGE 227; EH Pref. 3 "how much truth does a spirit endure") | Partial: only the GM III 24 science-and-ascetic-ideal card. No card on honesty as Nietzsche's cardinal virtue. |
| SEP §3.2.5 Individuality, freedom of spirit (GS 347 fanaticism vs self-determination) | **No card.** |
| SEP §3.2.6 Pluralism (values interacting as "counterforces") | **No card.** |
| SEP §4 drives and affects (drive psychology, GS 354 consciousness/representation) | Partial: consciousness card and soul-multiplicity card exist; no card on drives/affects as core psychological posits. |
| SEP §6.1 the *published* BGE 36 argument for cosmic will to power | Partial: "Not Clearly a Universal Physical Law" card cites BGE 36 correctly as hypothetical. Adequate. |
| SEP §6.3 eternal recurrence loci in Zarathustra (Z III "On the Vision and the Riddle", "The Convalescent") | Partial: "Even Zarathustra Struggles" card cites "The Convalescent"; the psychological-test card marks the Z III locator only "approximate". |
| GM I 11 "blond beast" (multi-ethnic list: Roman, Arabic, German, Japanese nobility) | **No card mentions the blond beast.** nz-27 is supported only obliquely by the "Higher Types" and Übermensch-misreading cards. Confirmed gap → card proposal 1. |
| GM I 16 "higher nature as battleground of the two valuations"; BGE 260 mixed moralities point is present but GM I 16 is absent | Partial gap → folded into card proposal 2. |
| GM III 1/28 the "would rather will nothingness than not will" formula | The ascetic-ideal card covers meaning-of-suffering but never states the formula, which is the most-quoted sentence of GM III. Partial gap → card proposal 2. |
| 1887 anti-antisemitism letters (Christmas letter to Elisabeth; draft Dec 1887; Schmeitzner break) — documented in IEP §8 and Wikiquote | Partial: the proto-Nazi misreading card asserts the fact but cites only an "approximate" EH section and SEP §1; no card carries the letter evidence. → card proposal 3. |
| Twilight "Maxims and Arrows" 26 ("I mistrust all systematizers") context — IEP §3's caution about reading it as an absolute | Quote bank has M&A 26; no card. Minor. |
| Sils Maria / "6000 feet beyond man and time" origin story of recurrence (EH; IEP §7) | No card. Minor (biography-adjacent). |

## 2. Question-by-question corpus support

Full mapping lives in `eval-questions.json` (`relevant_corpus` per question). Summary:

- **Well supported (3+ items):** nz-01, nz-03, nz-04, nz-08, nz-13, nz-18, nz-20, nz-21, nz-22, nz-25, nz-26, nz-28, nz-29.
- **Supported:** nz-02, nz-05, nz-06, nz-07, nz-10, nz-11, nz-12, nz-14, nz-15, nz-16, nz-17, nz-19, nz-23, nz-30, nz-31, nz-32, nz-33, nz-34, nz-35, nz-36.
- **Thin support (support exists but not purpose-built):**
  - nz-09 (BGE 23 "queen of the sciences"): no card, no index mention; only the raw ingested chunk bge-023. Retrieval must reach into the full text.
  - nz-24 (Wagner chronology): only two one-line index entries; no card on the Wagner relationship or the 1878 break.
  - nz-27 (blond beast): no direct corpus item; nearest cards address the Übermensch/higher-types misreading, not GM I 11.
- **No question has an empty relevant_corpus list**, but the three thin rows above are the operative coverage findings, together with the section gaps in table 1.

## 3. Notes in the corpus's favor (things the blind bank confirmed it gets right)

- The index and quote bank both carry explicit warnings that the madman passage is GS §125, not
  Zarathustra, and that The Will to Power is not a book Nietzsche wrote — the two headline traps.
- The quote bank pre-empts the Frankl paraphrase (M&A 12 note) and three of my four misattribution
  traps verbatim (dancing / muddy waters / owning yourself), plus one I had not chosen ("Nobody is
  more inferior..." — adopted as corpus-aware question nz-35).
- Card citations spot-checked against SEP/primary texts came back accurate; where the author was
  unsure, locators are honestly marked "approximate" rather than fabricated.

## 4. Corpus-aware additions

- nz-35 (trap-attribution, from the corpus's own misattribution list) and nz-36 (known-answer,
  machine-verified BGE 153) were added after unblinding, tagged `"provenance": "corpus-aware"`,
  and are excluded from headline metrics.
