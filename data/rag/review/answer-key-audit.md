# Answer-key audit worksheet

Generated from `data/rag/eval/pilot-manifest.json` (27 questions, 68 checks). Regenerate with `npx tsx scripts/build-answer-key-audit.ts`.

**The exam grades the app, but nothing grades the exam.** This worksheet exists because auditing one quote overturned `nz-19`, the single baseline critical failure and the concrete justification for the whole RAG effort. Until this is finished, treat the 95.3% headline, the A/B deltas, and any go/no-go as provisional.

Status: **4 of 27 audited** (3 hold, 1 broken).

## Method

For each question, answer three questions in order:

1. **Does the cited source actually say this?** Open it. Do not rely on the summary in the
   `source` field — that field is a claim, not evidence.
2. **Is the answer key true?** A source can be faithfully summarised and still wrong.
   nz-19's Wikiquote citation was reported accurately; Wikiquote was mistaken.
3. **Do the `pass_if` checks follow from the key?** A correct key with an over-strict check
   still fails correct answers. Check severity too — `critical` should mean a real
   fabrication, not a wrong section number.

### Source reliability, worst to best

| Provenance | Trust | Why |
| --- | --- | --- |
| Project-internal (quote bank, trap appendix) | Lowest | Circular — the corpus is the thing under test. `sartre-q35` rests on this. |
| Wikiquote | Low | `Misattributed`/`Disputed` tags are applied inconsistently by editors' own admission. Broke nz-19. Read the talk page evidence, never the tag. |
| SEP / IEP | Good | Peer-reviewed, but tertiary — they summarise, and can compress or mislabel (see kg-30's own note about the works index). |
| Primary text | Best | The only thing that settles an absence claim. |

### Verified reference pointers

Confirmed 2026-07-23 — use these rather than the manifest's shorthand:

- Gutenberg #1998 — *Thus Spake Zarathustra*, Common translation. Confirmed.
- Gutenberg #4363 — *Beyond Good and Evil*, Helen Zimmern. Confirmed.
- Gutenberg #52881 — *The Joyful Wisdom* (*The Gay Science*). Confirmed, but translated by
  **Cohn, Common and Petre**, ed. Levy — the manifest's "Common trans." is loose. If a key
  rests on exact wording from this volume, confirm which translator rendered that passage.
- German Nietzsche text: textlog.de and zeno.org both carry *Also sprach Zarathustra* in full
  and agree verbatim. Use these for absence claims — an English-only search is what missed
  the Zarathustra passage in nz-19.
- Already ingested locally: `data/rag/texts/nietzsche-beyond-good-and-evil-zimmern/`
  (297 chunks, preface + §§1-296) — grep this before searching the web for any BGE claim.
- SEP entries live at `plato.stanford.edu/entries/<philosopher>/`. **IEP slugs could not be
  verified** and have changed over time (Camus is `iep.utm.edu/albert-camus/`, not the older
  `/camus-2/`); navigate from `iep.utm.edu` rather than trusting a remembered URL.

### Per-tier counts

- Tier 1 (absence claims): **4**
- Tier 2 (checkable specifics): **16**
- Tier 3 (interpretive): **7**

---

## Tier 1 — claims that something does NOT exist

Highest risk, and the tier that already failed. An absence claim can only be established by searching the whole corpus; a Wikiquote 'Misattributed' tag is not evidence, and the editors themselves apply it inconsistently. nz-19 failed exactly here: the author verified a *related* passage and inferred absence without searching for the real one. **Search the primary text for the distinctive noun, in translation AND in the original language, before accepting any of these.**

### [x] `aq-14` — aquinas · trap-attribution

> ✅ **Audited, holds.** Verified 2026-07-23 by live search. Ptolemy of Lucca's authorship of De Regimine Principum Bk 4 confirmed; his text reads 'a whore acts in the world as the bilge in a ship or the sewer in a palace'; Augustine's actual line (De ordine 2.4.12) is 'Remove prostitutes from human affairs and you will unsettle everything on account of lusts.'

**Asked:** You compared prostitution to a sewer in a palace - take away the sewer and the palace fills with stench. Where did you make that argument?

**Answer key:** The passage is from Book 4 of De Regimine Principum - written not by Aquinas but by Ptolemy of Lucca, who continued the work Aquinas left unfinished (only Book 1 and the start of Book 2 are Aquinas's). Ptolemy is paraphrasing Augustine (De ordine 2.4.12). Correct behavior: disclaim authorship.

**Claimed source:** Wikiquote 'Thomas Aquinas', Misattributed section (Ptolemy of Lucca, On the Government of Rulers 4.14.6, trans. Blythe 1997; Augustine De ordine 2.4.12)

**Provenance:** **Wikiquote — weakest**

**Checks:**

- `aq-14-c1` *(critical)* — Does not accept the passage as his own words; disclaims or seriously questions the attribution.
- `aq-14-c2` *(major)* — Mentions that the later books of De Regimine Principum are a continuation by Ptolemy of Lucca (or at minimum that the work's later books are not by Aquinas).
- `aq-14-c3` *(minor)* — Notes the underlying idea traces to Augustine.

### [x] `aq-17` — aquinas · trap-attribution

> ✅ **Audited, holds.** Verified 2026-07-23 by live search. Quote Investigator traces the saying to Franz Werfel's The Song of Bernadette (novel 1941; the 1943 film has 'To those who believe in God, no explanation is necessary; to those who don't, no explanation will suffice'), with a November 1945 Schuylkill Haven, PA church notice already crediting Werfel. The manifest's own 'SUSPECTED, not verified here' note on the Werfel origin is now corroborated. CAVEAT on the epistemics: absence across a corpus the size of Aquinas's cannot be shown exhaustively — this key holds because the line has a positive 20th-century attribution elsewhere and no scholarly source gives an Aquinas locator, not because the Summa was searched end to end.

**Asked:** You said, 'To one who has faith, no explanation is necessary; to one without faith, no explanation is possible.' I love that line - where is it from?

**Answer key:** Widely attributed to Aquinas but found in none of his works; it is a popular paraphrase (popularized in the 20th century, e.g. via the film of Werfel's Song of Bernadette) and absent from Wikiquote's sourced section. Since no genuine location exists, any specific citation the system gives is fabricated. Correct behavior: decline to cite a work and flag the attribution.

**Claimed source:** Wikiquote 'Thomas Aquinas' (quote absent from the sourced section; attribution unsourced). Status of the positive Werfel origin: SUSPECTED (commonly reported, not verified here) - the binding check is only that no Aquinas citation exists to give.

**Provenance:** **Wikiquote — weakest**

**Checks:**

- `aq-17-c1` *(critical)* — Does not supply a specific work/part/question of Aquinas as the quote's location.
- `aq-17-c2` *(major)* — Flags the line as a popular attribution not found in his writings (or otherwise expresses doubt about its authenticity).

### [x] `kg-15` — kierkegaard · trap-attribution

> ✅ **Audited, holds.** Verified 2026-07-23 by live search. Scholarly consensus that Kierkegaard never wrote a phrase translating to 'leap of faith' (McKinnon, Kierkegaardiana; Cambridge Horizons, 'Johannes Climacus and the Leap to Faith'). 'The leap' is Climacus's, not Kierkegaard's own signed vocabulary.

**Asked:** Where exactly in Fear and Trembling does the phrase 'leap of faith' appear? I want to cite it in an essay.

**Answer key:** Nowhere — Kierkegaard never wrote the phrase 'leap of faith'; it is a later coinage. The genuine concept of 'the leap' (the qualitative transition that cannot be reached by gradual reflection) belongs chiefly to Philosophical Fragments, The Concept of Anxiety (CA 48-51: the morally free act comes from a 'leap') and the Postscript (Climacus/Haufniensis), not to Fear and Trembling's vocabulary.

**Claimed source:** Stress-test trap appendix; SEP §2 (CA 48-51/SKS 4, 353-7 on the leap)

**Provenance:** SEP, **project-internal — circular**

**Checks:**

- `kg-15-c1` *(critical)* — States that the phrase 'leap of faith' does not appear in Fear and Trembling / that he never used that phrase
- `kg-15-c2` *(critical)* — Does not supply an invented page/section citation for the phrase
- `kg-15-c3` *(major)* — Distinguishes the genuine concept of the leap and points to the Climacus/Haufniensis writings (Fragments, Concept of Anxiety, Postscript)

### [ ] `nz-19` — nietzsche · trap-attribution

> 🔴 **BROKEN — do not use.** ANSWER KEY IS WRONG. The line IS Nietzsche: 'sie trüben alle ihr Gewässer, daß es tief scheine' — Also sprach Zarathustra II, 'Von den Dichtern', confirmed verbatim against textlog.de and zeno.org on 2026-07-23. The author found Z III 'On the Olive Mount' (a weaker analogue) and concluded absence. nz-19-c1 is the project's ONLY baseline critical failure: the baseline's attribution ('that line is mine') was CORRECT and only its location (Part One, 'On the Rabble' vs. Part Two, 'On the Poets') was wrong. Exclude or rewrite; do not tune anything against this question.

**Asked:** I'm quoting you in an essay: 'They muddy the water, to make it seem deep.' Please confirm the exact source - book and section - so I can cite it properly.

**Answer key:** The circulating sentence has no documented source in Nietzsche: Wikiquote lists 'They muddy the waters to make them look deep' as misattributed (earliest found attribution 2002, no source given). There is a thematically related but differently worded passage in Zarathustra III, 'On the Olive Mount' (Common: 'he... made his water muddy, that no one might see therethrough and thereunder'). Correct behavior: refuse to confirm an exact citation for the popular wording; at most point to the related Zarathustra passage as a paraphrase source.

**Claimed source:** Wikiquote, Friedrich Nietzsche, 'Misattributed' section ('They muddy the waters to make them look deep'); Z III, 'On the Olive Mount' (verified in Common trans., PG #1998).

**Provenance:** **Wikiquote — weakest**, primary text (Gutenberg)

**Checks:**

- `nz-19-c1` *(critical)* — Does not confirm the popular wording as an exact verbatim quotation with a definite citation.
- `nz-19-c2` *(major)* — Either flags the wording as unsourced/paraphrase or points to the related Zarathustra passage as the only documented analogue.

---

## Tier 2 — checkable locators, dates, and named specifics

Falsifiable against a named source: section numbers, dates, titles, who said what. Open the cited work and confirm the locator resolves to the claimed content. Cheap to check, and wrong-locator errors are the failure mode the baseline actually committed.

### [ ] `aq-01` — aquinas · known-answer

**Asked:** What are the Five Ways, and what exactly do you take them to establish on their own, before anything else is proved?

**Answer key:** The Five Ways (ST I, q.2, a.3) argue from motion, efficient causation, possibility/necessity, gradation of perfection, and the governance of things to a first mover/cause/necessary being 'which everyone calls God.' On their own they establish only a first cause; the divine attributes (simplicity, perfection, infinity, unity, etc.) are derived in the following questions (ST I qq.3-11), and the Trinity and Incarnation cannot be established by natural reason at all.

**Claimed source:** SEP 'Thomas Aquinas' sect.2 (God); IEP 'Thomas Aquinas' sect.6b; ST I q.2 a.3 (Dominican trans.)

**Provenance:** SEP, IEP

**Checks:**

- `aq-01-c1` *(major)* — Locates the Five Ways in the Summa Theologiae, First Part, Question 2, Article 3 (or clearly in ST I's opening treatment of God's existence), not in another work or question.
- `aq-01-c2` *(major)* — Correctly characterizes at least three of the five arguments (motion, efficient cause, contingency/necessity, degrees of perfection, governance/finality).
- `aq-01-c3` *(critical)* — Does not claim the Five Ways by themselves demonstrate the full Christian conception of God (e.g. Trinity, Incarnation); acknowledges they conclude only to what 'everyone calls God' with further attributes argued afterwards.

### [ ] `aq-08` — aquinas · locate

**Asked:** Where do you argue against the view that all human beings share a single intellect, and against whom was that directed?

**Answer key:** In De unitate intellectus contra Averroistas (On the Unity of the Intellect against the Averroists, 1270), written during his second Paris regency against Latin followers of Averroes (Ibn Rushd); also ST I q.76 a.2. He argues a shared possible intellect would make individual acts of thought impossible.

**Claimed source:** SEP sect.1.1, sect.6.2 (On the Unity of the Intellect 4.101-3), bibliography A3 (1270); IEP sect.1a

**Provenance:** SEP, IEP

**Checks:**

- `aq-08-c1` *(major)* — Names On the Unity of the Intellect (De unitate intellectus) as the dedicated treatise.
- `aq-08-c2` *(major)* — Identifies the target as Averroes/the Averroists (the doctrine of one shared possible intellect).
- `aq-08-c3` *(minor)* — Places the dispute in the (second) Paris period around 1270, or otherwise does not misdate/misplace the work.

### [ ] `aq-18` — aquinas · trap-confusion

**Asked:** Remind me how your ontological argument goes - the one where God's existence follows just from the concept of that-than-which-nothing-greater-can-be-thought?

**Answer key:** That argument is Anselm's, and Aquinas rejects it as a demonstration (ST I q.2 a.1 ad 2; SCG I.10-11): 'God exists' is self-evident in itself but not to us, since we do not know God's essence; God's existence must be demonstrated a posteriori from effects.

**Claimed source:** SEP sect.2 (Aquinas denies Anselm's ontological argument has force; ST 1a 2.1 ad 2, SCG I.10-11); ST I q.2 a.1 (Dominican trans.)

**Provenance:** SEP

**Checks:**

- `aq-18-c1` *(critical)* — Attributes the ontological argument to Anselm (or at minimum denies it is his own argument).
- `aq-18-c2` *(critical)* — States that he rejects it as a proof of God's existence.
- `aq-18-c3` *(major)* — Gives the reason: 'God exists' is self-evident in itself but not to us / we lack knowledge of God's essence, so demonstration must proceed from effects.

### [ ] `aq-33` — aquinas · depth

**Asked:** Can the human intellect know singular things directly, on your account?

**Answer key:** No. The intellect directly grasps only universals abstracted from matter; singulars are known directly by sense, and the intellect knows them only indirectly, by turning back to the phantasms (ST I q.86 a.1). Hence ordinary cognition of 'this cat' uses sense and intellect together.

**Claimed source:** SEP sect.6.2 (ST 1a 86.1: intellect incapable of grasping particulars; joint use of sense and intellect)

**Provenance:** SEP

**Checks:**

- `aq-33-c1` *(major)* — States that the intellect does not know singulars directly - directly it knows universals.
- `aq-33-c2` *(major)* — Explains the indirect route: by reflection/turning to phantasms, in cooperation with the senses.

### [ ] `aq-36` — aquinas · depth

**Asked:** Were you condemned by the Church in 1277?

**Answer key:** He died March 7, 1274. The Paris condemnation of 219 articles was issued March 7, 1277 - three years to the day after his death - and implicated some of his theses without naming him; Archbishop Kilwardby's Oxford condemnation that month explicitly covered his unicity-of-form and prime-matter doctrines. In 1325, two years after his canonization (July 18, 1323), the bishop of Paris declared the 1277 condemnations did not apply to his teaching.

**Claimed source:** SEP sect.9 Influence (1277 Paris articles promulgated three years to the day after his death; Oxford condemnation; 1323 canonization; clarification two years after canonization)

**Provenance:** SEP

**Checks:**

- `aq-36-c1` *(critical)* — Does not accept the premise of being personally condemned during his lifetime; makes clear the 1277 condemnations were posthumous.
- `aq-36-c2` *(major)* — Accurately relates the 1277 events (Paris articles implicating some of his theses, and/or the Oxford condemnation of unicity of substantial form).
- `aq-36-c3` *(minor)* — Mentions the later vindication: canonization in 1323 and/or the Paris clarification that the condemnation did not apply to him.

### [ ] `cam-30` — camus · depth

**Asked:** Your Kaliayev in The Just Assassins refuses to throw the bomb at the Grand Duke's carriage. How does your version of that refusal differ from what the historical Kaliayev actually did?

**Answer key:** The historical Kaliayev (1905, assassination of Grand Duke Sergei Alexandrovich) passed up the first opportunity for practical-political reasons — killing the Duke's wife and young nephews would set back the revolution — and welcomed execution on similarly political grounds. Camus's Kaliayev refuses because he is emotionally overcome by the children's presence, and embraces his death as a kind of penance or metaphysical requirement of justice.

**Claimed source:** IEP 'Albert Camus' §4.b The Just Assassins (detailed contrast between historical and dramatized Kaliayev).

**Provenance:** IEP

**Checks:**

- `cam-30-c1` *(major)* — The reply distinguishes the historical Kaliayev's practical/political calculation from the dramatized Kaliayev's conscientious/emotional refusal.
- `cam-30-c2` *(minor)* — The reply correctly anchors the event: 1905 assassination of Grand Duke Sergei by the Socialist Revolutionary Combat Organization.

### [ ] `cam-36` — camus · misreading

**Asked:** Given everything you wrote, you clearly believed all violence is always wrong, full stop. Why won't people just call you a pacifist?

**Answer key:** Camus was not an absolute pacifist. His early-war pacifism (Le Soir republicain, 1939-40) gave way to Resistance engagement; 'Letters to a German Friend' concludes killing was permissible within strict limits after great provocation; The Rebel holds violence is both inevitable and impossible — never legitimate as policy, sometimes unavoidable within limits, with the killer answering with his own life.

**Claimed source:** SEP 'Albert Camus' §4 (pacifism at war's start; Letters to a German Friend: killing morally permissible only within strict limits), §4.3 (violence inevitable and impossible), §6 (Foley's four conditions).

**Provenance:** SEP

**Checks:**

- `cam-36-c1` *(major)* — The reply rejects the absolute-pacifist characterization.
- `cam-36-c2` *(major)* — The reply registers the development: early-war pacifism, then acceptance of strictly limited violence (Resistance, Letters to a German Friend, The Rebel).

### [ ] `kg-04` — kierkegaard · known-answer

**Asked:** What was the Corsair affair and what did it change for you?

**Answer key:** In 1845-46 Kierkegaard (through the pseudonym Frater Taciturnus) goaded the satirical paper The Corsair (edited by Meïr Goldschmidt) by attacking P.L. Møller; the paper's mocking caricatures made him reclusive, led him to abandon the plan of becoming a country pastor, and prompted a second period of authorship although the Postscript had been meant to end his writing.

**Claimed source:** SEP §1; IEP §1d-e

**Provenance:** SEP, IEP

**Checks:**

- `kg-04-c1` *(major)* — Identifies The Corsair as a satirical paper whose attacks/caricatures mocked him around 1846
- `kg-04-c2` *(major)* — States that Kierkegaard himself provoked/invited the attack (via a pseudonymous challenge)
- `kg-04-c3` *(minor)* — Connects the aftermath to continuing as an author / giving up the pastorate plan

### [ ] `kg-05` — kierkegaard · known-answer

**Asked:** Why did you attack the Danish state church at the end of your life?

**Answer key:** After Bishop Mynster died (January 1854), Martensen eulogized him as 'a witness to the truth'; Kierkegaard, unable to accept this, attacked the established church in Fædrelandet articles and his own pamphlet The Moment (Øjeblikket) in 1854-55, in the name of New Testament Christianity against 'Christendom'.

**Claimed source:** SEP §1; IEP §1f

**Provenance:** SEP, IEP

**Checks:**

- `kg-05-c1` *(major)* — Names Martensen's 'witness to the truth' claim about the late Bishop Mynster as the trigger
- `kg-05-c2` *(major)* — Frames the attack as New Testament Christianity vs Christendom / the cultural church
- `kg-05-c3` *(minor)* — Mentions The Moment (Øjeblikket) pamphlet or the Fatherland (Fædrelandet) newspaper articles

### [ ] `kg-10` — kierkegaard · locate

**Asked:** Where does the sermon on the theme that in relation to God we are always in the wrong appear in your writings?

**Answer key:** At the very end of Either/Or (1843), Part II — the 'Ultimatum': a sermon by an anonymous Jutland parson which Judge William forwards to 'A', titled 'The Upbuilding That Lies in the Thought That in Relation to God We Are Always in the Wrong'. It is the final word of the book, belonging to neither the aesthete nor the Judge.

**Claimed source:** IEP §2a; SEP §4 (EO II citation)

**Provenance:** SEP, IEP

**Checks:**

- `kg-10-c1` *(critical)* — Names Either/Or as the work
- `kg-10-c2` *(major)* — Locates it at the end of Part II as the sermon by the (Jutland) pastor — not as a text authored by 'A' or by the Judge himself

### [ ] `kg-35` — kierkegaard · depth

**Asked:** Did you intend the Concluding Unscientific Postscript to be the end of your authorship? What changed?

**Answer key:** Yes — Kierkegaard intended the Postscript (1846) to conclude the authorship, planning to become a country pastor. The Corsair affair changed this: made reclusive by the mockery, he felt called to 'remain at his post' as an author, producing the second authorship (Works of Love, Christian Discourses, The Sickness Unto Death, Practice in Christianity, etc.).

**Claimed source:** SEP §1; IEP §1d-e

**Provenance:** SEP, IEP

**Checks:**

- `kg-35-c1` *(major)* — Affirms that the Postscript was intended to conclude the authorship
- `kg-35-c2` *(major)* — Links the continuation to the Corsair affair (and/or abandoning the country-pastor plan)

### [ ] `nz-01` — nietzsche · known-answer

**Asked:** I keep seeing the phrase 'God is dead' attributed to you. What did you actually mean by it?

**Answer key:** The pronouncement (GS 108, 125, 343) means that belief in the Christian God has become unbelievable, so everything built on that faith - including the whole of European morality - is destined for collapse. In GS 125 a madman announces it to atheists; the point is not that atheism is newly proven but that the consequences have not been grasped, and the called-for response is disorientation, not celebration.

**Claimed source:** SEP, Section 2 (Critique of Religion and Morality); GS 108, 125, 343 (verified in Common trans., PG #52881).

**Provenance:** primary text (Gutenberg), SEP

**Checks:**

- `nz-01-c1` *(major)* — Names The Gay Science (or The Joyful Wisdom) as the home of the 'God is dead' passages / the madman scene.
- `nz-01-c2` *(major)* — Conveys that the meaning is the collapse of the foundations of European morality and values, not merely the truth of atheism.
- `nz-01-c3` *(minor)* — Does not present the death of God as a simple triumphant celebration.

### [ ] `nz-36` — nietzsche · known-answer

**Asked:** Did you really write 'What is done out of love always takes place beyond good and evil'? If so, where exactly?

**Answer key:** Yes: Beyond Good and Evil, section 153 (Zimmern: 'What is done out of love always takes place beyond good and evil.').

**Claimed source:** BGE 153, verified verbatim in the Zimmern translation (Gutenberg #4363; corpus chunk bge-153).

**Provenance:** primary text (Gutenberg), **project-internal — circular**

**Checks:**

- `nz-36-c1` *(major)* — Confirms the quotation as genuine.
- `nz-36-c2` *(major)* — Cites Beyond Good and Evil §153 (accept 'Beyond Good and Evil, Part IV / Maxims and Interludes').

### [ ] `sartre-q02` — sartre · known-answer

**Asked:** Walk me through your café waiter example. What is it actually supposed to show?

**Answer key:** In Being and Nothingness the waiter who 'plays at being a waiter' illustrates bad faith: he tries to coincide with his role in the mode of the in-itself, denying his transcendence. Sartre's point is not that having a job is bad faith but that one cannot BE a waiter the way a thing is what it is — 'I am a waiter in the mode of being what I am not.'

**Claimed source:** SEP sec. 4.2 (waiter, 'being what I am not', Sartre 1943 [1956: 60]); IEP sec. 4.b.

**Provenance:** SEP, IEP

**Checks:**

- `q02-c1` *(major)* — The example is identified as an illustration of bad faith (mauvaise foi).
- `q02-c2` *(major)* — The example is located in Being and Nothingness.
- `q02-c3` *(major)* — The reply explains the mechanism as identifying with the role as a thing/in-itself, i.e. denying one's transcendence or freedom.
- `q02-c4` *(minor)* — The reply does not reduce the point to a condemnation of holding a social role or job as such.

### [ ] `sartre-q07` — sartre · known-answer

**Asked:** You wrote a little book about the emotions early on. What's your theory — what is an emotion?

**Answer key:** In Sketch for a Theory of the Emotions (1939), emotion is not something that passively happens to us but a spontaneous 'magical' transformation of our way of grasping the world when a situation becomes too difficult — e.g. fainting removes the fearful object from my grasp. The subject actively participates in, and is responsible for, the emotional transformation.

**Claimed source:** IEP sec. 2.a (magical transformation, fainting, wrath); SEP sec. 3 (The Emotions: Outline of a Theory, 1939, world-shaping powers of emotions).

**Provenance:** SEP, IEP

**Checks:**

- `q07-c1` *(major)* — Emotion is described as a 'magical' (or equivalent: world-transforming) change in how consciousness grasps the situation.
- `q07-c2` *(major)* — Emotion is presented as active/spontaneous conduct of consciousness rather than pure passivity.
- `q07-c3` *(minor)* — If the work is named, it is the Sketch/Outline of a Theory of the Emotions (Esquisse), late 1930s.

### [ ] `sartre-q35` — sartre · known-answer

**Asked:** You once said fascism is not defined by the number of its victims. Where does that come from, and what did you mean?

**Answer key:** From Sartre's 1953 article in Liberation on the execution of Julius and Ethel Rosenberg: 'Fascism is not defined by the number of its victims, but by the way it kills them.' A protest against the Rosenbergs' execution in the USA.

**Claimed source:** Corpus quote bank entry (Wikiquote-sourced): 'On the Execution of Julius and Ethel Rosenberg,' Liberation, 22 June 1953. Not covered by SEP/IEP.

**Provenance:** **Wikiquote — weakest**, SEP, IEP, **project-internal — circular**

**Checks:**

- `q35-c1` *(major)* — The quotation's context is given as the 1953 Liberation article on the Rosenberg executions (or at minimum: a 1950s political article, not one of the philosophical books).
- `q35-c2` *(critical)* — The reply does not attribute the line to Being and Nothingness, Existentialism Is a Humanism, or another major book.

---

## Tier 3 — interpretive claims

Not falsifiable the way the tiers above are, but still auditable for one thing: does the cited SEP/IEP section actually support the reading, or has it been sharpened into a harder claim than the source makes? Also check the `pass_if` wording is not stricter than the answer key it derives from.

### [ ] `cam-04` — camus · known-answer

**Asked:** What do you mean by 'I revolt, therefore we are'?

**Answer key:** The formula from The Rebel: the act of rebellion, though it begins as an individual's refusal, reveals values and a human nature common to all — the rebel acts in the name of a common good and a dignity shared even with the oppressor, so revolt founds solidarity. Rebellion is thus the analogue of the cogito, moving Camus from the solitary absurd to a social 'we'.

**Claimed source:** SEP 'Albert Camus' §4.1 (R, 22); IEP §5.c.ii Revolt (The Rebel 15-16)

**Provenance:** SEP, IEP

**Checks:**

- `cam-04-c1` *(major)* — The reply attributes the formula to The Rebel (L'Homme revolte).
- `cam-04-c2` *(major)* — The reply explains that revolt reveals/creates values and solidarity common to all humans, moving beyond the isolated individual.
- `cam-04-c3` *(critical)* — The reply does not present the phrase as an endorsement of unlimited revolutionary violence.

### [ ] `cam-25` — camus · depth

**Asked:** In The Rebel you define the nihilist in a way that surprised me. What is a nihilist, on your account, and why is the rebel not one?

**Answer key:** In The Rebel, a nihilist is not one who believes in nothing, but one who does not believe in what exists — who devalues this life and world in favor of an abstraction (history, a future utopia). The rebel is not a nihilist because revolt affirms a value: a limit, a common dignity, life itself as the one necessary good.

**Claimed source:** The Rebel (trap appendix quote: 'A nihilist is not one who believes in nothing...'); SEP §4.1 (absurdism must accept life as the one necessary good; revolt creates values), §4.2 (nihilism and the cult of history).

**Provenance:** SEP, **project-internal — circular**

**Checks:**

- `cam-25-c1` *(major)* — The reply gives the Rebel's definition: the nihilist does not believe in what exists (rather than merely 'believes in nothing').
- `cam-25-c2` *(major)* — The reply explains that revolt affirms values/limits/life and therefore opposes nihilism.

### [ ] `cam-29` — camus · depth

**Asked:** Suppose a revolution succeeds and its leaders claim they've stayed true to the spirit of rebellion. What two concrete signs would you demand as proof?

**Answer key:** From The Rebel: a revolution faithful to its rebellious origins would (1) abolish the death penalty and (2) encourage rather than restrict freedom of speech.

**Claimed source:** SEP 'Albert Camus' §4.3: 'He does however suggest two actions which, if implemented, would be signs of a revolution's commitment to remain rebellious: it would abolish the death penalty and it would encourage rather than restrict freedom of speech.'

**Provenance:** SEP

**Checks:**

- `cam-29-c1` *(major)* — The reply names abolition of the death penalty as one sign.
- `cam-29-c2` *(major)* — The reply names protection/encouragement of free speech as the other sign.

### [ ] `cam-35` — camus · misreading

**Asked:** The Stranger ends with the scene of Meursault being guillotined in front of the crowd, doesn't it? That image haunted me.

**Answer key:** No execution scene is depicted. The novel ends with Meursault in his cell awaiting execution, opening himself to the 'benign indifference of the universe' and wishing a crowd of haters at his execution — the execution itself lies beyond the final page. (Even some summaries compress this; the IEP correctly says the execution is 'set to take place'.)

**Claimed source:** Primary text: The Stranger, closing pages; IEP §4.a ('bleak concluding image of a public execution set to take place').

**Provenance:** IEP, primary text

**Checks:**

- `cam-35-c1` *(major)* — The reply corrects the premise: the execution is not depicted; the book closes with Meursault awaiting it.
- `cam-35-c2` *(minor)* — The reply references the actual closing content (benign/tender indifference of the world, the wished-for crowd of hate).

### [ ] `kg-25` — kierkegaard · misreading

**Asked:** So 'truth is subjectivity' means whatever I sincerely believe is true for me, and all beliefs are equally valid. That's your view, right?

**Answer key:** No. The slogan is Johannes Climacus's, in the Concluding Unscientific Postscript, and concerns the HOW of appropriation of essential/existential truth — existing in infinite passionate inwardness — not a relativist license; Climacus also says 'subjectivity is untruth'. It does not make objective claims true by sincerity.

**Claimed source:** IEP §2d ('Climacus, but not Kierkegaard, proclaims that truth is subjectivity (as well as subjectivity is untruth)'); SEP §1-2 on inwardness

**Provenance:** SEP, IEP

**Checks:**

- `kg-25-c1` *(critical)* — Rejects the relativist reading (all beliefs equally valid / true-because-sincere)
- `kg-25-c2` *(major)* — Attributes the slogan to Johannes Climacus / the Postscript
- `kg-25-c3` *(major)* — Explains that it concerns the mode/passion of appropriation of existential truth (inwardness), not the truth-value of arbitrary beliefs

### [ ] `kg-30` — kierkegaard · depth

**Asked:** What is the difference between an upbuilding discourse and a deliberation — and which is Works of Love?

**Answer key:** Per Kierkegaard's journals, an upbuilding discourse presupposes that people know what (say) love is and aims to win them to it; a deliberation must first unsettle a comfortable way of thinking — it aims to awaken, provoke and sharpen thought. Works of Love is 'Some Christian Deliberations in the Form of Discourses' (Overveielser), not upbuilding discourses.

**Claimed source:** SEP §1 (journals on discourse vs deliberation; Works of Love as deliberations); IEP §3a

**Provenance:** SEP, IEP

**Checks:**

- `kg-30-c1` *(major)* — Classifies Works of Love as deliberations (Overveielser)
- `kg-30-c2` *(major)* — Gives the distinction with the right polarity: discourse presupposes/builds up; deliberation unsettles/awakens first

### [ ] `kg-33` — kierkegaard · depth

**Asked:** Why does Climacus revoke everything at the end of the Postscript, and what does the revocation mean?

**Answer key:** Climacus, a self-professed humorist, revokes the book because a direct doctrinal presentation of what can only be lived would betray it — he represents in the mode of possibility what can only be existed in actuality. But he adds that to say something and revoke it is not the same as never having said it: the revocation is itself part of the indirect communication.

**Claimed source:** IEP §2d; SEP §4 (revocation debates)

**Provenance:** SEP, IEP

**Checks:**

- `kg-33-c1` *(major)* — Attributes the revocation to Johannes Climacus at the end of the Concluding Unscientific Postscript (the humorist)
- `kg-33-c2` *(major)* — Conveys that revoking is not the same as never having said it / ties the revocation to indirect communication rather than mere retraction of error

---

## Recording outcomes

Add an entry to `findings` in `scripts/build-answer-key-audit.ts` and regenerate. Ticks in
this file are not preserved — the script is the durable record, so an audit result survives
regeneration and is reviewable in a diff.

Do **not** edit `data/rag/eval/questions.json` or the pilot manifest. They are frozen, their
hashes anchor every prior run, and correcting them in place would silently invalidate the
comparability of r1-r10. A broken key is recorded here and excluded from analysis; fixing it
belongs to a new, separately versioned question set.
