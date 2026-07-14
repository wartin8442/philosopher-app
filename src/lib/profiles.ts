import { PhilosopherProfile, PhilosopherWork } from "./types";

/**
 * Profile-page content for each philosopher: hero portrait, an accessible
 * 5–7 sentence introduction, and 3–5 major works.
 *
 * Cover images come from the Open Library covers API
 * (https://covers.openlibrary.org) — publicly served scans of real editions.
 * Each URL was verified to resolve at the time it was added; `?default=false`
 * makes a missing cover fail loudly (HTTP 404) so the <BookCover> fallback
 * can take over instead of rendering Open Library's blank placeholder.
 * If higher-fidelity or licensed cover art is sourced later, swap `coverUrl`
 * (or point it at a local file under /public) — nothing else changes.
 */

const cover = (id: number) =>
  `https://covers.openlibrary.org/b/id/${id}-L.jpg?default=false`;
const coverIsbn = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

export const PROFILES: PhilosopherProfile[] = [
  {
    id: "aquinas",
    shortName: "Aquinas",
    heroImage: "/philosophers/heroes/aquinas.png",
    heroFocus: "50% 12%",
    intro: [
      "Thomas Aquinas was a Dominican friar and theologian working in the bustling universities of thirteenth-century Europe, above all Paris. At a moment when the rediscovered works of Aristotle seemed to threaten Christian teaching, he undertook the boldest synthesis of his age: joining Greek philosophy to the doctrines of the Church. He argued that faith and reason cannot truly conflict, since both descend from the same divine source.",
      "From this conviction came his famous Five Ways — arguments for the existence of God drawn from motion, causation, contingency, perfection, and order — and a moral philosophy grounded in natural law, the participation of rational creatures in God's eternal ordering of things. The questions he pressed, whether God's existence can be demonstrated, what makes a law just, how grace relates to nature, remain live questions. Eight centuries on, his Summa still anchors Catholic theology and shapes debates in metaphysics, ethics, and the philosophy of religion.",
    ],
    works: [
      {
        title: "Summa Theologiae",
        year: "1265–1274",
        description:
          "Aquinas's vast summary of theology, organized as thousands of disputed questions, objections, and replies. It moves from God and creation through human action and virtue to Christ, containing the Five Ways and the treatise on natural law. Unfinished at his death, it remains the central work of scholastic philosophy.",
        coverUrl: coverIsbn("9780870610639"),
        coverEdition: "Christian Classics five-volume set",
      },
      {
        title: "Summa contra Gentiles",
        year: "1259–1265",
        description:
          "A four-book defense of Christian wisdom addressed to those who do not accept Scripture's authority, and so argued as far as possible from reason alone. It treats God's existence and nature, creation, providence, and the end of human life. It is Aquinas's most sustained exercise in purely philosophical argument.",
        coverUrl: coverIsbn("9780268016784"),
        coverEdition: "University of Notre Dame Press (Pegis translation)",
      },
      {
        title: "On Being and Essence",
        year: "c. 1252–1256",
        description:
          "A short early treatise on what things are and what it means for them to exist. Here Aquinas draws his famous distinction between essence and existence — identical only in God — laying the metaphysical foundation for everything that follows.",
        coverUrl: cover(5404022),
        coverEdition: "PIMS (Maurer translation)",
      },
    ],
  },
  {
    id: "nietzsche",
    shortName: "Nietzsche",
    heroImage: "/philosophers/heroes/nietzsche.png",
    heroFocus: "50% 14%",
    intro: [
      "Friedrich Nietzsche was a brilliant young philologist who abandoned a professorship at Basel to become the nineteenth century's most unsettling philosopher. Writing in solitude across Switzerland, Italy, and France, he produced books that read less like treatises than like detonations — aphoristic, personal, and merciless. His diagnosis was that \"God is dead\": the Christian-moral picture of the world had lost its authority, and Europe had not yet faced the nihilism that would follow.",
      "Against this he called for a revaluation of all values — an attempt to create meaning out of one's own strength rather than inherit it secondhand. He asked where our morals actually come from, what it would take to affirm life without illusion, and whether we could will our own lives eternally repeated. Misread by nationalists and moralists alike, he remains the essential critic of comfortable belief, and nearly every strand of modern thought — existentialism, psychoanalysis, postmodernism — carries his fingerprints.",
    ],
    works: [
      {
        title: "Thus Spoke Zarathustra",
        year: "1883–1885",
        description:
          "A philosophical prose-poem in which the prophet Zarathustra descends from his mountain to teach the Übermensch and the meaning of the earth. It contains Nietzsche's most famous images — the last man, the tightrope walker, eternal recurrence. He considered it his deepest and most personal book.",
        coverUrl: coverIsbn("9780140441185"),
        coverEdition: "Penguin Classics",
      },
      {
        title: "Beyond Good and Evil",
        year: "1886",
        description:
          "A sweeping critique of past philosophers for mistaking their prejudices for truths, and a \"prelude to a philosophy of the future.\" It develops perspectivism, the will to power, and the contrast between master and slave morality in taut, dangerous aphorisms.",
        coverUrl: coverIsbn("9780140449235"),
        coverEdition: "Penguin Classics",
      },
      {
        title: "On the Genealogy of Morality",
        year: "1887",
        description:
          "Three connected essays tracing where our moral concepts actually come from: the slave revolt that inverted \"good and bad\" into \"good and evil,\" the origins of guilt and bad conscience, and the meaning of ascetic ideals. It is Nietzsche's most systematic and most influential book.",
        coverUrl: cover(119371),
        coverEdition: "Oxford World's Classics",
      },
      {
        title: "The Gay Science",
        year: "1882",
        description:
          "Aphorisms on knowledge, art, and the joyful discipline of thinking, written in convalescent high spirits. It announces the death of God through the parable of the madman, and poses eternal recurrence as a test: could you affirm your life if it repeated forever?",
        coverUrl: cover(351123),
        coverEdition: "Cambridge Texts in the History of Philosophy",
      },
    ],
  },
  {
    id: "kierkegaard",
    shortName: "Kierkegaard",
    heroImage: "/philosophers/heroes/kierkegaard.png",
    heroFocus: "50% 20%",
    intro: [
      "Søren Kierkegaard spent his short life almost entirely in Copenhagen, writing at a furious pace against the complacency of his age. Trained in theology and steeped in the Danish Golden Age, he turned philosophy inward, toward the single individual who must actually live a life rather than merely theorize about one. Against Hegel's grand System he insisted that existence cannot be captured in concepts — it must be chosen, with fear and trembling.",
      "He mapped anxiety and despair with a psychologist's precision, and described faith not as doctrine but as a passionate leap over objective uncertainty. Much of this he wrote under a chorus of pseudonyms, each embodying a way of life: the aesthete, the ethicist, the man of faith. His questions — how to become a self, what one is willing to stake one's life on — are as pressing now as in 1843, and he is remembered as the father of existentialism and Christianity's most searching modern critic from within.",
    ],
    works: [
      {
        title: "Fear and Trembling",
        year: "1843",
        description:
          "A meditation on Abraham, commanded to sacrifice his son, written under the pseudonym Johannes de Silentio. It asks whether there can be a \"teleological suspension of the ethical\" and what faith costs the one who has it. Its portrait of the knight of faith remains existentialism's founding image.",
        coverUrl: cover(104000),
        coverEdition: "Penguin Classics",
      },
      {
        title: "Either/Or",
        year: "1843",
        description:
          "A sprawling double volume contrasting two ways of life: the aesthete's pursuit of mood and possibility, and the judge's defense of marriage, choice, and commitment. Between the seducer's diary and the ethicist's letters, the reader is forced to confront the book's title as a personal question.",
        coverUrl: cover(104126),
        coverEdition: "Penguin Classics",
      },
      {
        title: "The Concept of Anxiety",
        year: "1844",
        description:
          "A dense psychological study of anxiety as \"the dizziness of freedom\" — the vertigo that comes with possibility itself. Connecting dread, innocence, and freedom's first stirring, it anticipates modern psychology by half a century.",
        coverUrl: cover(12196222),
        coverEdition: "Liveright (Hannay translation)",
      },
      {
        title: "The Sickness unto Death",
        year: "1849",
        description:
          "Anti-Climacus's anatomy of despair: the ways a self can fail to be itself, from unconscious drifting to open defiance. Its cure — resting transparently in the power that established the self — is Kierkegaard's most concentrated statement of faith.",
        coverUrl: cover(442072),
        coverEdition: "Princeton (Hong translation)",
      },
    ],
  },
  {
    id: "sartre",
    shortName: "Sartre",
    heroImage: "/philosophers/heroes/sartre.png",
    heroFocus: "50% 16%",
    intro: [
      "Jean-Paul Sartre was the commanding figure of twentieth-century French philosophy — phenomenologist, novelist, playwright, and public intellectual of postwar Paris. Writing through the Occupation and its aftermath, he built existentialism into a complete philosophy of freedom. Its core claim is that existence precedes essence: there is no fixed human nature, so we are what we make of ourselves, and we are wholly responsible for it.",
      "He exposed the ways we flee that responsibility — the self-deception he called bad faith — and described how the gaze of others threatens to fix us like objects. His questions are direct ones: What are you doing with your freedom? What excuses are you hiding behind? Declining the Nobel Prize and marching with radicals into old age, he made philosophy a public act, and his account of freedom and responsibility still frames how we argue about authenticity today.",
    ],
    works: [
      {
        title: "Being and Nothingness",
        year: "1943",
        description:
          "Sartre's phenomenological masterwork on consciousness, freedom, and self-deception. Through famous set pieces — the café waiter, the gaze, the woman on a date — it argues that we are \"condemned to be free\" and responsible without excuse. It made existentialism a philosophy.",
        coverUrl: coverIsbn("9780671867805"),
        coverEdition: "Washington Square Press",
      },
      {
        title: "Nausea",
        year: "1938",
        description:
          "A philosophical novel in diary form: Antoine Roquentin discovers the raw, contingent existence of things beneath our tidy labels — and it sickens him. Sartre's central ideas arrive here first, as lived experience rather than argument.",
        coverUrl: coverIsbn("9780811201889"),
        coverEdition: "New Directions",
      },
      {
        title: "No Exit and Three Other Plays",
        year: "1944",
        description:
          "The drama in which three strangers, locked forever in a drawing room, become one another's torturers. Its famous line — \"hell is other people\" — dramatizes Sartre's account of the gaze and being-for-others.",
        coverUrl: coverIsbn("9780679725169"),
        coverEdition: "Vintage International",
      },
      {
        title: "Existentialism Is a Humanism",
        year: "1946",
        description:
          "The famous public lecture defending existentialism against its critics: if existence precedes essence, then man is nothing but what he makes of himself. Short, direct, and the best gateway into Sartre's thought.",
        coverUrl: cover(2355635),
        coverEdition: "Yale University Press",
      },
    ],
  },
  {
    id: "camus",
    shortName: "Camus",
    heroImage: "/philosophers/heroes/camus.png",
    heroFocus: "50% 22%",
    intro: [
      "Albert Camus grew up poor in French Algeria, between Mediterranean sunlight and working-class silence, and carried both into everything he wrote. Novelist, playwright, wartime Resistance editor, and reluctant philosopher, he confronted what he called the absurd: the collision between our demand for meaning and the unreasonable silence of the universe. His answer was neither despair nor religious consolation but revolt — a lucid persistence that keeps its eyes open and refuses false hope.",
      "In novels and essays he asked whether life is worth living once its meaning is in question, and what limits a just rebellion must respect. Breaking with Sartre over revolutionary violence, he defended measure, solidarity, and common decency when ideology demanded terror. He won the Nobel Prize at forty-four and died in a car crash three years later; his insistence that clarity is itself a moral act keeps him among the most read — and most loved — of modern writers.",
    ],
    works: [
      {
        title: "The Myth of Sisyphus",
        year: "1942",
        description:
          "The essay that begins from \"the one truly serious philosophical problem\" — suicide — and builds Camus's account of the absurd. Its answer is revolt without appeal, crowned by the image of Sisyphus, whom we must imagine happy.",
        coverUrl: cover(12726570),
        coverEdition: "Knopf",
      },
      {
        title: "The Stranger",
        year: "1942",
        description:
          "The novel of Meursault, who kills a man on an Algerian beach and is condemned as much for failing to weep at his mother's funeral. Its flat, sunstruck prose made the absurd a lived atmosphere rather than a thesis.",
        coverUrl: cover(13151269),
        coverEdition: "Gallimard first edition (L'Étranger)",
      },
      {
        title: "The Plague",
        year: "1947",
        description:
          "A chronicle of a quarantined city, where a doctor fights an epidemic he cannot defeat. At once a realist novel and an allegory of occupied Europe, it stakes out Camus's ethic of solidarity and common decency without metaphysical hope.",
        coverUrl: cover(13151272),
        coverEdition: "Le Livre de Poche (La Peste)",
      },
      {
        title: "The Rebel",
        year: "1951",
        description:
          "Camus's study of rebellion from the Greeks to the gulags, asking how revolt against injustice becomes a justification for murder. \"I rebel, therefore we are\" — but rebellion must honor limits. The book cost him his friendship with Sartre.",
        coverUrl: coverIsbn("9780679733843"),
        coverEdition: "Vintage International",
      },
    ],
  },
];

export const PROFILE_BY_ID: Record<string, PhilosopherProfile> =
  Object.fromEntries(PROFILES.map((p) => [p.id, p]));

export function getProfile(id: string): PhilosopherProfile | undefined {
  return PROFILE_BY_ID[id];
}

/**
 * URL-safe identifier for a work, derived from its title so the works data
 * doesn't need a hand-maintained slug field: "Thus Spoke Zarathustra" →
 * "thus-spoke-zarathustra". Used by the "Explore this work" links
 * (/conversation/[id]?work=<slug>) and re-resolved on both ends. Titles are
 * plain ASCII; any non-alphanumeric run collapses to a single hyphen.
 */
export function workSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve a work by its slug within one philosopher's profile. */
export function getWorkBySlug(
  philosopherId: string,
  slug: string,
): PhilosopherWork | undefined {
  return getProfile(philosopherId)?.works.find((w) => workSlug(w.title) === slug);
}
