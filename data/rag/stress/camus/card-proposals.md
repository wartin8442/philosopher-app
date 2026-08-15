# Camus — Position Card Proposals (stress test, 2026-07-19)

Draft cards for gaps the baseline interrogation confirmed. Format follows
`data/rag/cards/TEMPLATE.md`. These go to the human-verification queue; they are NOT to be
added to `cards/drafts/` by the stress agent. Questions that motivated a card carry
`"inspired_card": true` in this run's eval-questions.json (contamination tag for the
merged bank).

---

### The Rebel's Definition of the Nihilist

**Claim:** In The Rebel, Camus defines the nihilist not as one who believes in nothing but as one who does not believe in what exists.

**Explanation:** Camus's definition is deliberately surprising: the nihilist's failure is not an empty belief-ledger but a refusal to grant value to what actually exists — this life, this world, the living person in front of you — in favor of an abstraction such as History, a future utopia, or nothingness itself. That is why, for Camus, the revolutionary who sacrifices living people to a promised tomorrow is a nihilist even though he believes fervently in something. The rebel is the contrast case: his "no" affirms the value of something that exists — a limit, a dignity in himself shared with all. Summaries that render the nihilist merely as "one who thinks everything is permitted" give a consequence Camus discusses, not his definition.

**Citations:**
- The Rebel (1951), Part One (locator approximate — verify against Bower translation before promotion)

**Misreadings (optional):** Flattening the definition into "believes in nothing" or "thinks everything is permitted" — the baseline system produced exactly the latter substitution.

**Provenance:** Trap appendix quote ('A nihilist is not one who believes in nothing, but one who does not believe in what exists'); SEP §4.1–4.2 context (revolt affirms life as the one necessary good). Motivated by: cam-25 (failed 2026-07-19).

**Status:** draft (stress-test proposal)

---

### The Just Assassins: Kaliayev in History and on Stage

**Claim:** Camus's Kaliayev refuses to bomb the Grand Duke's carriage out of conscience, where the historical Kaliayev's refusal was a practical political calculation.

**Explanation:** The Just Assassins (Les Justes, 1950) dramatizes the 1905 assassination of Grand Duke Sergei Alexandrovich by Ivan Kalyayev of the Socialist Revolutionary Combat Organization. The historical Kalyayev passed up his first opportunity because the Duke's wife and two young nephews were in the carriage — by his own lights a purely practical decision, since murdering children would set back the revolution — and he later welcomed execution on similarly political grounds. Camus reworks both moments: his Kaliayev is unnerved by the children themselves and refuses from conscience, and he embraces his own death almost as penance, a metaphysical requirement of the justice he has violated. The gap between the two figures is the point: Camus moves the limit from tactics into ethics.

**Citations:**
- The Just Assassins (Les Justes, 1950)
- The Rebel (1951), the chapter on the "fastidious assassins" / scrupulous murderers (locator approximate)

**Misreadings (optional):** Treating the play as a faithful transcript of 1905 ("the difference is emphasis, not fact") — the baseline system asserted exactly this.

**Provenance:** IEP §4.b (The Just Assassins, detailed historical contrast). Motivated by: cam-30 (failed 2026-07-19); supports cam-05. Also fixes the works-index omission of the play.

**Status:** draft (stress-test proposal)

---

### From Pacifist to Résistant: Camus's Early-War Turn

**Claim:** Camus began World War II as a pacifist opposing French entry into the war, and only later, under the Occupation, joined the Resistance as editor of Combat.

**Explanation:** In 1939–40, at Le Soir républicain with his mentor Pascal Pia, Camus opposed the urgency of fighting Nazism and advocated a negotiated peace that would partly reverse the humiliations of Versailles — while still reporting for military service out of solidarity (tuberculosis disqualified him). Living in occupied France he changed course, worked for the underground press, and in 1944 succeeded Pia as editor of Combat, the main paper of the non-Communist resistance left. The development matters doubly: it shows his mature position on violence (never legitimate as doctrine, sometimes inescapable within limits) was won against his own earlier pacifism, and it blocks both wrong stories — "lifelong pacifist" and "always a résistant."

**Citations:**
- Letters to a German Friend (1943–1945)
- Camus at Combat: Writings 1944–47 (Princeton, 2006)

**Misreadings (optional):** Either absolutizing him into a pacifist (see the misattributed "no causes worth killing for" quote) or erasing the pacifist period entirely — the baseline system did the latter.

**Provenance:** SEP §4 (Le Soir républicain pacifism; Combat editorship March 1944, succeeding Pia; Letters to a German Friend on killing within strict limits). Motivated by: cam-36 (failed 2026-07-19); supports cam-24, cam-17.

**Status:** draft (stress-test proposal)

---

### The 1936 Dissertation: Plotinus and Augustine

**Claim:** Camus's 1936 University of Algiers dissertation, "Christian Metaphysics and Neoplatonism," examined the relation of Plotinus and Greek thought to St. Augustine and early Christianity.

**Explanation:** For his diplôme d'études supérieures Camus wrote a sympathetic study of how Greek philosophy — Plotinus and Neoplatonism above all — met and was transformed by Christian thought, with Augustine, a fellow North African, at the center. His advisor's verdict, "more a writer than a philosopher," is part of the story of why he never pursued an academic career (tuberculosis barred the agrégation path). The thesis matters for his later work: the tension it maps between Greek measure and love of the visible world and Christian orientation toward salvation beyond it recurs throughout his mature philosophy, and his lifelong, respectful-but-unpersuaded engagement with Christianity starts here.

**Citations:**
- "Christian Metaphysics and Neoplatonism" (1936), tr. in McBride, Albert Camus: Philosopher and Littérateur (1992)

**Provenance:** SEP §2 (graduate thesis on Plotinus/Augustine); IEP §1 (1936 dissertation), §5 (advisor's penciled remark). Motivated by: cam-07 (no corpus support; passed on base knowledge 2026-07-19 — card is insurance, biography layer absent).

**Status:** draft (stress-test proposal)

---

### Where Camus Criticizes Marxism — and Where He Doesn't

**Claim:** The Myth of Sisyphus contains no discussion of Marxism; Camus's critique of Marxism appears in "Neither Victims nor Executioners" (1946) and, fully, in The Rebel (1951).

**Explanation:** Users and models alike tend to project the famous anti-Marxism backward into the absurd period. In fact The Myth of Sisyphus is silent on Marxism — it treats suicide, the absurd, and the leap, not politics. The critique of historical materialism as a substitute religion ("the cult of history"), of revolutionary violence, and of the end-justifies-the-means maxim belongs to the postwar essays: "Neither Victims nor Executioners," where Camus calls himself a socialist but not a Marxist, and The Rebel, whose reception ended the friendship with Sartre. A card recording this negative fact protects the system from inventing a nonexistent section when asked to locate one.

**Citations:**
- The Myth of Sisyphus (1942) — absence claim; no section on Marxism exists
- "Neither Victims nor Executioners" (1946)
- The Rebel (1951)

**Provenance:** SEP §4.2 ("making no mention of Marxism, The Myth of Sisyphus is eloquently silent..."). Motivated by: cam-23 (no corpus support; passed on base knowledge 2026-07-19).

**Status:** draft (stress-test proposal)

---

### The Plague: Who Is Actually in the Novel

**Claim:** The Plague's principal characters are Dr. Rieux, Tarrou, Rambert, Grand, Cottard, Father Paneloux, and Judge Othon; Cottard is the profiteer who thrives under the epidemic.

**Explanation:** A grounding card for character references. Rieux narrates and doctors; Tarrou organizes the sanitary squads and refuses complicity with any death sentence; Rambert is the journalist who first tries to escape to his lover and then stays; Grand is the modest clerk endlessly rewriting one sentence; Cottard, under threat of arrest before the outbreak, flourishes during it as a smuggler and dreads the plague's end; Paneloux is the Jesuit whose two sermons move from plague-as-punishment to a demand for total faith, and who joins the squads; Othon is the magistrate whose son's death from the plague is the novel's cruelest scene. There is no character named "Paty" — references to one are fabrication.

**Citations:**
- The Plague (1947) (chapter-level locators to be added at verification)

**Misreadings (optional):** Inventing or garbling minor characters when discussing collaboration themes — the baseline system produced a nonexistent "Paty."

**Provenance:** IEP §4.a; SEP §4 and §6 (Rieux, Tarrou, Paneloux, sanitary squads); character roster to be human-verified against the novel before promotion. Motivated by: cam-31 (suspected fabrication, 2026-07-19).

**Status:** draft (stress-test proposal)

---

## Non-card recommendations (for the maintainers, not the card queue)

1. **Wire retrieval to the draft corpus.** All 40 probes retrieved only the four persona
   source blurbs from `src/lib/philosophers.ts`; the cards, works index, and quote bank
   never surfaced (report F-6). The existing "Free Speech and Abolishing Execution" card
   would have prevented the cam-29 failure had it been retrieved.
2. **Works index additions:** Nuptials (1938), Betwixt and Between (1937), The Just
   Assassins (1950), Summer / L'Été (1954, incl. "Return to Tipasa"), "Reflections on the
   Guillotine" (1957), Algerian Chronicles (1958).
