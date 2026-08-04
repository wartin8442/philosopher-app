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
    heroImage: "/philosophers/heroes/aquinas.webp",
    heroFocus: "50% 12%",
    intro: [
      "Thomas Aquinas was a Dominican friar, philosopher, and theologian who became one of the most important intellectual figures of the thirteenth century. He studied and taught in the developing European university system, particularly at the University of Paris. During this period, Western scholars were gaining access to a much larger collection of Aristotle’s writings, many of which had been preserved and interpreted by Muslim and Jewish philosophers. These works offered a comprehensive philosophical account of nature, human beings, ethics, and reality, but some Aristotelian ideas appeared to conflict with Christian teachings about creation, divine providence, and the immortality of the individual soul.",
      "Aquinas became the leading figure in the effort to reconcile Aristotle’s philosophy with Christian theology. He did not accept Aristotle uncritically, but adopted and modified concepts such as act and potency, matter and form, causation, virtue, and the natural purposes of living things. Aquinas argued that faith and reason cannot truly contradict one another because both ultimately come from God. Philosophers outside Christianity, including Aristotle, could therefore discover genuine truths through observation and rational argument. However, Aquinas also maintained that certain truths—such as the Trinity, the Incarnation, and humanity’s supernatural union with God—could be known only through divine revelation.",
      "From this synthesis came Aquinas’s Five Ways, which use features of the observable world such as motion, causation, contingency, degrees of perfection, and natural order to argue for the existence of God. He also developed a moral philosophy grounded in natural law, according to which human reason can recognize basic moral principles by understanding human nature and its proper ends. His Summa Theologiae brought these philosophical and theological ideas together into a systematic account of God, creation, morality, law, grace, and human fulfillment. Aquinas’s synthesis of Aristotelian philosophy and Christian theology remains foundational to Catholic thought and continues to influence debates in metaphysics, ethics, natural law, and the philosophy of religion.",
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
    heroImage: "/philosophers/heroes/nietzsche.webp",
    heroFocus: "50% 14%",
    intro: [
      "Friedrich Nietzsche was a German philosopher and classical philologist (the study of language, literature, and historical texts) who became one of the most influential critics of Western religion, morality, and culture.  Nietzsche specialized in the literature and culture of ancient Greece and Rome and became a professor of classical philology at the University of Basel at only twenty-four years old. Persistent health problems eventually forced him to resign, after which he spent much of his life traveling through Switzerland, Italy, and France and writing independently.",
      "Nietzsche believed that European civilization was entering a crisis caused by the decline of Christianity and its traditional moral authority. He expressed this through the declaration that “God is dead,” which did not simply mean that he personally rejected belief in God. It meant that Christian explanations of reality and morality were losing their power over European society, while no new system of values had yet replaced them. Nietzsche warned that this collapse could lead to nihilism: the belief that life has no objective meaning, purpose, or value.",
      "In response, Nietzsche called for a “revaluation of all values.” He examined how moral ideas developed historically and argued that many traditional values arose from weakness, resentment, and hostility toward human strength and excellence. Rather than passively inheriting these values, individuals should critically examine them and develop life-affirming values of their own. His ideas of the will to power, the Übermensch, and eternal recurrence explored self-overcoming, the creation of values, and the challenge of affirming life even with its suffering. Nietzsche’s critique of Christianity, morality, truth, and modern culture strongly influenced existentialism, psychology, literary theory, and later continental philosophy.",
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
    heroImage: "/philosophers/heroes/kierkegaard.webp",
    heroFocus: "50% 20%",
    intro: [
      "Søren Kierkegaard spent most of his life in Copenhagen, where he studied theology and became a sharp critic of the intellectual and religious culture of nineteenth-century Denmark. He wrote in opposition to the influence of G. W. F. Hegel, whose philosophical system sought to explain reality, history, and human development through a comprehensive rational framework. Kierkegaard believed that this approach overlooked the concrete individual who must make choices and live through uncertainty rather than merely understand existence in abstract terms.",
      "He therefore turned philosophy inward, focusing on the individual’s subjective experience of anxiety, despair, freedom, faith, and personal responsibility. Against Christian Hegelianism and the established Danish Church, he argued that Christianity was not simply a set of doctrines that could be rationally understood or inherited through membership in society. It required a passionate personal commitment that had to be lived despite uncertainty. Through pseudonymous works presenting different ways of life—the aesthetic, the ethical, and the religious—Kierkegaard explored how a person becomes a self and develops an authentic relationship with God. Because of this emphasis on individual existence, choice, and lived experience, he is widely regarded as the Father of Existentialism.",
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
    heroImage: "/philosophers/heroes/sartre.webp",
    heroFocus: "50% 16%",
    intro: [
      "Jean-Paul Sartre was a French philosopher, novelist, and playwright who became one of the leading intellectual figures of twentieth-century Europe. During World War II, he served in the French Army before being captured by German forces in 1940 and held in a prisoner-of-war camp. While imprisoned, Sartre studied Martin Heidegger’s Being and Time, which greatly influenced the development of his own philosophy. After returning to Paris, he helped form Socialisme et Liberté, a short-lived intellectual group associated with the French Resistance. Building on the phenomenology of Heidegger and Edmund Husserl, Sartre developed an atheistic form of existentialism centered on human freedom.",
      "His most famous claim, “existence precedes essence,” means that human beings are not born with a predetermined nature or purpose. Instead, people define themselves through their choices and actions and are therefore responsible for the lives they create. Sartre explored the difficulty of accepting this freedom and the ways people attempt to escape from it. He called this self-deception “bad faith,” which occurs when individuals treat their identities, circumstances, or social roles as if they completely determine what they must do. He also examined how being observed and judged by others can cause people to see themselves as fixed objects rather than free individuals. Through his philosophical works, novels, and plays, Sartre became the most influential representative of twentieth-century existentialism.",
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
    heroImage: "/philosophers/heroes/camus.webp",
    heroFocus: "50% 22%",
    intro: [
      "Albert Camus was a French-Algerian novelist, essayist, and playwright who became one of the most influential writers of the twentieth century. He grew up in a working-class family in French Algeria and later moved to France, where he participated in the French Resistance and served as an editor of the underground newspaper Combat during World War II. Although often associated with existentialism, Camus rejected the label and developed his philosophy around what he called the absurd.",
      "For Camus, the absurd arises from the conflict between the human desire for meaning, order, and purpose and an indifferent, godless universe that provides no clear answers. In The Myth of Sisyphus, he argued that the absurd should lead neither to suicide nor to religious or philosophical explanations that impose a false meaning on life. Instead, a person should live with full awareness of the absurd and respond through revolt: the continuing decision to live, act, and create without pretending that life possesses an ultimate purpose.",
      "Camus later extended this idea into political and moral philosophy. In The Rebel, he examined how rebellion against injustice can become destructive when it abandons moral limits and attempts to justify violence in the name of a perfect future. This position contributed to his public disagreement with Jean-Paul Sartre over revolutionary violence and communism. Camus instead emphasized moderation, solidarity, individual dignity, and resistance to injustice.",
      "Camus intended to follow his explorations of the absurd and revolt with a third stage of his work centered on love. However, this final stage was never completed. He died in a car accident in 1960, and the handwritten draft of his unfinished autobiographical novel The First Man was recovered from his satchel at the crash site. The novel, which explores his childhood in Algeria and his love for his mother, was not published until 1994. Because Camus died before completing this work and the broader cycle it was associated with, his final ideas about love remained unfinished.",
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
  {
    id: "hume",
    shortName: "Hume",
    intro: [
      "David Hume was a central figure of the Scottish Enlightenment: a philosopher, essayist, and bestselling historian who wanted to build an experimental science of human nature. He asked how finite creatures actually form beliefs, make moral judgments, and sustain social institutions. His unsettling answer was that many convictions credited to pure reason depend instead on experience, imagination, custom, passion, and social life.",
      "Hume argued that repeated experience teaches us to expect causes and effects without revealing any necessary connection between them. Yet his skepticism was practical rather than nihilistic: sensible people proportion belief to evidence, then return from the study to friendship and ordinary affairs. In ethics he located moral approval in sentiment informed by sympathy and a shared human standpoint, and he explained justice and government as useful conventions rather than products of an original contract. His critiques of religion and metaphysics remain influential, while his writings on race, gender, class, and empire expose serious limits and contradictions within his humane philosophy.",
    ],
    works: [
      {
        title: "A Treatise of Human Nature",
        year: "1739–1740",
        description:
          "Hume's ambitious early system of the understanding, passions, and morals. It develops his accounts of impressions and ideas, causal inference, personal identity, motivation, sympathy, and the conventions supporting justice.",
      },
      {
        title: "An Enquiry Concerning Human Understanding",
        year: "1748",
        description:
          "A polished reconstruction of Hume's philosophy of knowledge. Through compact arguments about causation, induction, testimony, miracles, liberty, and skepticism, it asks what human beings may reasonably claim to know.",
      },
      {
        title: "An Enquiry Concerning the Principles of Morals",
        year: "1751",
        description:
          "Hume's mature account of moral judgment, grounded in sentiment but disciplined by facts, consequences, sympathy, and a general point of view. He regarded it as the best of his writings.",
      },
      {
        title: "Dialogues Concerning Natural Religion",
        year: "1779",
        description:
          "A posthumously published dialogue in which Cleanthes, Demea, and Philo test arguments about design, divine attributes, evil, and the limits of analogy. Its dramatic form makes Hume's final position deliberately difficult to reduce to one speaker.",
      },
    ],
  },
  {
    id: "plato",
    shortName: "Plato",
    intro: [
      "Plato was an Athenian philosopher who founded the Academy, the institution that gave Western higher education its name and format. He wrote no treatises. His surviving work consists of some three dozen dialogues in which Socrates and others argue, and in which Plato himself never speaks — a fact that makes attributing positions to him a genuine interpretive problem rather than a formality.",
      "His central claim is that the objects of knowledge are not the changing particulars we perceive but the stable realities they imitate: the Forms. A just act may or may not be just depending on circumstance, but Justice itself does not vary, and it is Justice itself that we must grasp if our judgments are to be more than opinion. From this follow the doctrines he is best known for — the tripartite soul, in which justice consists of reason, spirit, and appetite each doing its own work; the parallel account of the just city; the theory that learning is recollection of what the soul knew before birth; and the images of the Cave, the Sun, and the Divided Line, which map the ascent from appearance to understanding. His later dialogues, particularly the Parmenides, raise damaging objections to the theory of Forms that he leaves unresolved.",
    ],
    works: [
      {
        title: "Republic",
        year: "c. 375 BC",
        description:
          "An extended argument about what justice is and whether the just life is better for the person living it. It contains the tripartite soul, the ideal city and its philosopher-rulers, the critique of poetry, and the images of the Sun, the Divided Line, and the Cave.",
      },
      {
        title: "Phaedo",
        year: "c. 380 BC",
        description:
          "Set on the day of Socrates' execution, it presents several arguments for the immortality of the soul, including the theory that learning is recollection. It is the dialogue in which the Forms are most explicitly introduced as separate realities.",
      },
      {
        title: "Symposium",
        year: "c. 385 BC",
        description:
          "A series of speeches on love at a drinking party, ending with Socrates' report of Diotima's teaching that erotic desire, properly educated, ascends from individual beauty to Beauty itself.",
      },
      {
        title: "Parmenides",
        year: "c. 370 BC",
        description:
          "The elderly Parmenides presses a young Socrates with objections to the theory of Forms, including the regress known as the Third Man. Plato records the difficulties without answering them, and the dialogue marks a turn in his later method.",
      },
    ],
  },
  {
    id: "aristotle",
    shortName: "Aristotle",
    intro: [
      "Aristotle studied under Plato for twenty years, tutored Alexander of Macedon, and founded his own school, the Lyceum. His surviving writings are not polished works but lecture notes, and they cover an extraordinary range: logic, physics, biology, metaphysics, psychology, ethics, politics, rhetoric, and poetics. He effectively invented formal logic and much of the vocabulary philosophy still uses.",
      "Against Plato, he argued that the form of a thing is not a separate reality but the organizing principle of the particular thing itself: this bronze and this shape together make this statue. Explanation accordingly proceeds by identifying four causes — material, formal, efficient, and final — and nature is understood as acting for ends. In ethics he held that the human good is eudaimonia, activity of the soul in accordance with virtue over a complete life, and that virtue is a stable disposition lying at a mean between excess and deficiency, acquired by habituation rather than instruction and applied by practical wisdom to the case at hand. In politics he treated the human being as a creature that by nature lives in a city, and studied actual constitutions comparatively. His defence of natural slavery and his claims about women are integral to those texts rather than incidental to them.",
    ],
    works: [
      {
        title: "Nicomachean Ethics",
        year: "c. 340 BC",
        description:
          "Aristotle's account of the human good, developed through the function argument, the doctrine of the mean, and extended treatments of practical wisdom, weakness of will, friendship, and pleasure. It remains the founding text of virtue ethics.",
      },
      {
        title: "Metaphysics",
        year: "c. 340 BC",
        description:
          "A collection of studies on being as such, substance, potentiality and actuality, and the first causes of things. It includes his sustained criticism of Plato's Forms and the argument for an unmoved mover.",
      },
      {
        title: "Politics",
        year: "c. 335 BC",
        description:
          "An examination of the city as a natural association aimed at living well, with a comparative survey of constitutions, an analysis of how regimes change and fail, and a proposal for the best practicable state.",
      },
      {
        title: "Physics",
        year: "c. 350 BC",
        description:
          "Aristotle's general theory of nature: change, matter and form, the four causes, place, time, infinity, and motion. It supplies the conceptual framework presupposed by most of his other scientific work.",
      },
    ],
  },
  {
    id: "epicurus",
    shortName: "Epicurus",
    intro: [
      "Epicurus taught in a garden outside Athens in a community that, unusually for its time, admitted women and slaves. He wrote prolifically, but almost all of it is lost: what survives is three letters, two collections of maxims, and quotations in later authors. His philosophy was explicitly therapeutic — he compared it to medicine, and held that an argument that does not relieve suffering is worthless.",
      "He held that the universe consists of nothing but atoms and void, that the soul is itself material and disperses at death, and that the gods, though real, take no interest in human affairs. From these physical claims he drew his practical conclusions. Death is nothing to us, because where death is we are not; fear of divine punishment rests on a misunderstanding of what gods are. Pleasure is the good, but pleasure properly understood means the absence of bodily pain and mental disturbance, not the accumulation of sensation — a state that can be reached with very little, since desires that are natural and necessary are easily met while empty desires such as fame and unlimited wealth have no limit at all. Justice, on his account, is not a fact about the world but a mutual agreement not to harm, binding only so long as it remains useful. The popular association of his name with luxury is a distortion that began with his ancient opponents.",
    ],
    works: [
      {
        title: "Letter to Menoeceus",
        year: "c. 300 BC",
        description:
          "A short summary of Epicurean ethics addressed to a student, covering the gods, death, the classification of desires, and the role of prudence. It contains the argument that death is nothing to us.",
      },
      {
        title: "Principal Doctrines",
        year: "c. 300 BC",
        description:
          "Forty maxims collecting the core of the system in memorizable form, including the limits of pleasure, the conditions of security, and the account of justice as a compact of mutual advantage.",
      },
      {
        title: "Letter to Herodotus",
        year: "c. 300 BC",
        description:
          "A compressed statement of Epicurean physics: atoms and void, the infinity of the universe, the nature and mortality of the soul, and the method of explaining phenomena without recourse to divine agency.",
      },
      {
        title: "Vatican Sayings",
        year: "c. 300 BC",
        description:
          "A second collection of maxims, rediscovered in the Vatican Library in 1888, overlapping with the Principal Doctrines but adding material on friendship, self-sufficiency, and the management of desire.",
      },
    ],
  },
  {
    id: "marcus-aurelius",
    shortName: "Marcus Aurelius",
    intro: [
      "Marcus Aurelius ruled Rome from 161 to 180, through plague, financial strain, and near-continuous war on the northern frontier. The Meditations were written during those years in Greek, for himself, with no indication that he intended anyone else to read them. They are not a treatise but a working notebook: reminders, rebukes, and rehearsals of principles he was trying to hold on to.",
      "The philosophy is orthodox Stoicism, owed principally to Epictetus. Its core is the distinction between what is up to us — our judgments, impulses, and desires — and what is not, which includes health, reputation, and the actions of others. Distress arises not from events but from the opinions we add to them, and those opinions can be withdrawn. The cosmos is a single rational whole of which each person is a part, so what befalls the individual is not evil from the standpoint of the whole, and human beings are made for cooperation as naturally as hands or eyelids. Virtue is the only genuine good; everything else is at most preferred. Running through the notebook is a constant recollection of death, used not as a source of gloom but as a way of stripping ambition and grievance of their apparent importance. He was an emperor who owned slaves and prosecuted wars, and the text should be read as the private discipline of a Roman ruler rather than a modern humanitarian document.",
    ],
    works: [
      {
        title: "Meditations",
        year: "c. 170–180",
        description:
          "Twelve books of private notes on judgment, duty, mortality, and the discipline of assent. Book I is a catalogue of debts to family and teachers; the rest circles repeatedly over a small set of principles the author was trying to make habitual.",
      },
    ],
  },
  {
    id: "augustine",
    shortName: "Augustine",
    intro: [
      "Augustine was born in Roman North Africa, taught rhetoric in Carthage, Rome, and Milan, and became bishop of Hippo in 395. He spent nine years as a Manichaean before converting to Christianity at thirty-two, and the philosophical problems that occupied him afterwards — the origin of evil, the weakness of the will, the reliability of the mind — were problems he had lived through first.",
      "He argued that evil is not a substance or an opposing power but a privation, a lack of good in a nature that is good insofar as it exists at all; this answered the Manichaean dualism he had abandoned. His analysis of the will is his most original contribution: the difficulty is not that we cannot do what we will but that we do not wholly will it, and this internal division is what he means by sin. Against Pelagius he insisted that a will in that condition cannot repair itself, and that grace is prior and unearned — a position that hardened over his life into a severe doctrine of predestination. His treatment of time in the Confessions denies that past and future exist at all, locating them as memory and expectation within a present mind, and concludes that we measure not events but impressions. In the City of God he read history as the entanglement of two communities defined by what they love, neither identical with any earthly institution. His influence on Western philosophy and theology through the following millennium is difficult to overstate.",
    ],
    works: [
      {
        title: "Confessions",
        year: "c. 397–400",
        description:
          "An account of Augustine's life to his conversion, written as a sustained address to God rather than to a reader. The last books turn from narrative to philosophy, treating memory, time, and the interpretation of Genesis.",
      },
      {
        title: "City of God",
        year: "413–426",
        description:
          "Begun after the sack of Rome in 410 as a defence of Christianity against the charge that it had weakened the empire. It develops into a philosophy of history organized around two cities formed by two loves, and includes extensive criticism of Roman religion and philosophy.",
      },
      {
        title: "On Free Choice of the Will",
        year: "c. 388–395",
        description:
          "A dialogue asking how a good God can be the source of a world containing evil, locating the answer in the free movement of the created will. Augustine later judged parts of it too favourable to human capacity and qualified them.",
      },
      {
        title: "On Christian Teaching",
        year: "397–426",
        description:
          "A treatise on signs, meaning, and interpretation, setting out how a text is to be read and how the resources of classical rhetoric may legitimately be used. It shaped medieval theories of language and education.",
      },
    ],
  },
  {
    id: "spinoza",
    shortName: "Spinoza",
    intro: [
      "Baruch Spinoza was born into Amsterdam's Portuguese-Jewish community and expelled from it at twenty-three under a writ of unusual severity, for opinions the record does not specify. He supported himself grinding optical lenses, declined a chair at Heidelberg to protect his independence, and published almost nothing under his own name during his lifetime. The Ethics appeared only after his death.",
      "He argued that there is exactly one substance, infinite and self-caused, which may equally be called God or Nature. Everything else — minds, bodies, events — is a mode of that single substance rather than an independent thing, and mind and body are not two entities in interaction but one thing conceived under two different attributes. Since everything follows from the divine nature with the same necessity by which a triangle's properties follow from its definition, there is no contingency, no divine purpose, and no free will in the sense of an uncaused choice; people think themselves free because they are aware of their desires and ignorant of the causes producing them. His ethics follows from this. Each thing strives to persist in its being, and emotions are natural phenomena to be understood rather than condemned. We are passive to the extent that our ideas are inadequate, so freedom consists in understanding — acting from the necessity of one's own nature — and blessedness is not the reward of virtue but virtue itself. In the Theological-Political Treatise he argued that Scripture must be read as a historical document aimed at obedience rather than truth, and defended freedom of thought as both compatible with and necessary to a stable state.",
    ],
    works: [
      {
        title: "Ethics",
        year: "1677",
        description:
          "Spinoza's central work, set out in the manner of Euclid with definitions, axioms, and demonstrated propositions. Its five parts move from God and the nature of substance through mind, the emotions, and human bondage to the account of freedom and blessedness.",
      },
      {
        title: "Theological-Political Treatise",
        year: "1670",
        description:
          "Published anonymously and rapidly banned. It argues for the historical-critical reading of Scripture, denies that prophecy yields speculative knowledge, and defends freedom of philosophizing as necessary to the security of the state.",
      },
      {
        title: "Political Treatise",
        year: "1677",
        description:
          "An unfinished work analysing monarchy, aristocracy, and democracy in terms of what actually holds power stable, rather than what an ideal citizen ought to do. It begins from people as they are rather than as philosophers wish them to be.",
      },
      {
        title: "Treatise on the Emendation of the Intellect",
        year: "c. 1662",
        description:
          "An early, unfinished essay on method, opening with the question of what good is genuinely worth pursuing and proceeding to distinguish kinds of knowledge and the conditions of adequate ideas.",
      },
    ],
  },
  {
    id: "james",
    shortName: "James",
    intro: [
      "William James trained as a physician, taught physiology, psychology, and then philosophy at Harvard, and wrote the book that established psychology as an empirical discipline in America before turning to philosophy full time. He was the brother of the novelist Henry James, and shares something of his attention to the texture of inner life, expressed in far plainer prose.",
      "His pragmatism holds that the way to settle a dispute is to ask what practical difference it would make if one side were true rather than the other; where no difference can be traced, the dispute is idle. Applied to truth itself, this yields his most contested claim: that an idea is true insofar as believing it works — leads us satisfactorily through experience and squares with what follows. He denied that this reduces truth to convenience, and spent much of his later career saying so. His radical empiricism holds that relations between things are given in experience as directly as the things themselves, and his psychology describes consciousness not as a chain of discrete ideas but as a continuous, selective, personal stream. In The Will to Believe he argued that where a question is genuine, unavoidable, and momentous, yet cannot be settled on the available evidence, we are entitled to let our commitments decide it — an argument aimed at religious and moral belief, not at matters open to inquiry. Against absolute idealism he defended a pluralistic and unfinished universe in which what we do helps determine the outcome.",
    ],
    works: [
      {
        title: "The Principles of Psychology",
        year: "1890",
        description:
          "A two-volume work, twelve years in the writing, that founded scientific psychology in America. It contains the account of the stream of consciousness, the chapters on habit and the self, and the emotion theory now known as James-Lange.",
      },
      {
        title: "Pragmatism",
        year: "1907",
        description:
          "Eight lectures presenting pragmatism as both a method for settling disputes and a theory of truth, positioned as a middle way between tough-minded empiricism and tender-minded rationalism.",
      },
      {
        title: "The Varieties of Religious Experience",
        year: "1902",
        description:
          "The Gifford Lectures, treating conversion, mysticism, saintliness, and the divided self as psychological data to be examined on their own terms rather than explained away or defended doctrinally.",
      },
      {
        title: "The Will to Believe",
        year: "1897",
        description:
          "A collection of essays defending the legitimacy of belief in advance of evidence where the question is living, forced, and momentous, together with pieces on determinism, rationality, and moral philosophy.",
      },
    ],
  },
  {
    id: "beauvoir",
    shortName: "Beauvoir",
    intro: [
      "Simone de Beauvoir placed second to Sartre in the 1929 agrégation in philosophy, the youngest candidate ever to pass it. She wrote novels, memoirs, essays, and philosophy across five decades, and was long read as an interpreter of Sartre's existentialism — a description her own work does not support, since the ethics she developed is one Being and Nothingness never supplied and her account of freedom is considerably more concrete than his.",
      "The Second Sex begins from the observation that man has been posited as the human norm and woman defined in relation to him, as the inessential Other, and that women have been unable to constitute themselves as a countervailing group because they are dispersed among men and attached to them. Her central claim is that this is not a natural fact: one is not born but becomes a woman, through an accumulation of upbringing, myth, law, and economic arrangement acting on a body. She distinguishes transcendence, the surpassing of oneself through projects, from immanence, confinement to repetition and maintenance, and treats the systematic consignment of women to the latter as an injustice rather than a destiny — while refusing the simplification that women are merely passive victims, since the situation offers real inducements to consent. The Ethics of Ambiguity grounds this politically: because my projects require others free to take them up, willing my own freedom commits me to willing everyone's. Her later study of old age applies the same method to a different subjection. Her treatment of race, colonialism, and working-class women has been criticized as limited, and the criticism is largely fair.",
    ],
    works: [
      {
        title: "The Second Sex",
        year: "1949",
        description:
          "A two-volume study of how women have been constituted as the Other, drawing on biology, psychoanalysis, historical materialism, myth, and extensive first-person testimony. It is the founding text of modern feminist philosophy.",
      },
      {
        title: "The Ethics of Ambiguity",
        year: "1947",
        description:
          "Beauvoir's attempt to derive an ethics from existentialist premises, arguing that human beings are neither pure freedom nor mere things, and that one's own freedom is realised only in willing the freedom of others.",
      },
      {
        title: "The Coming of Age",
        year: "1970",
        description:
          "A study of old age as a condition constructed and imposed by society rather than a natural fate, examining how cultures treat people once they cease to be economically productive.",
      },
      {
        title: "Memoirs of a Dutiful Daughter",
        year: "1958",
        description:
          "The first volume of her autobiography, tracing her bourgeois Catholic upbringing, her loss of faith, and her intellectual formation. It is also a case study in the process The Second Sex analyses.",
      },
    ],
  },
  {
    id: "foucault",
    shortName: "Foucault",
    intro: [
      "Michel Foucault held a chair at the Collège de France under a title he chose himself: History of Systems of Thought. He worked from archives — asylum records, prison regulations, medical treatises, manuals of confession — and consistently refused the labels attached to him, including structuralist and philosopher. He was also an active campaigner on prisons, psychiatry, and immigration, and died of AIDS-related illness in 1984.",
      "His method has two phases. Archaeology describes the underlying rules that determine what can count as knowledge in a given period; genealogy, adapted from Nietzsche, traces the contingent and often coercive descent of practices that present themselves as natural. Both are aimed at showing that what seems necessary has a history and therefore could be otherwise. His account of power is the part most often misread: power is not simply prohibition, and it is not a possession of the state or a class, but a relational and productive force that generates kinds of knowledge, kinds of person, and kinds of pleasure. Discipline and Punish traces the spread of techniques — timetable, examination, hierarchical observation, normalizing judgment — from prisons into schools, hospitals, barracks, and factories, and argues that the prison's apparent failure to reduce crime is precisely how it functions, by producing a manageable class of delinquents. The History of Sexuality attacks the assumption that modern societies repressed sex, arguing instead that they incited endless discourse about it and made sexuality the supposed truth of the self. His final work turned to how individuals form themselves as subjects, through ancient practices of self-discipline and frank speech.",
    ],
    works: [
      {
        title: "Discipline and Punish",
        year: "1975",
        description:
          "A history of the shift from public torture to the modern prison, and of the disciplinary techniques that spread from it through the institutions of modern life. It contains the analysis of Bentham's Panopticon as a diagram of power.",
      },
      {
        title: "The History of Sexuality, Volume 1",
        year: "1976",
        description:
          "An attack on the assumption that the modern West repressed sexuality, arguing that it instead multiplied discourse about sex and constituted sexuality as the hidden truth of the subject. It introduces the concept of biopower.",
      },
      {
        title: "The Order of Things",
        year: "1966",
        description:
          "A study of the underlying orders of knowledge governing the Renaissance, classical, and modern periods, tracing the emergence of the human sciences and arguing that 'man' is a recent and possibly temporary object of knowledge.",
      },
      {
        title: "Madness and Civilization",
        year: "1961",
        description:
          "Foucault's doctoral thesis, a history of how madness was separated from reason and confined, and of how the asylum came to be understood as a humane advance rather than a new form of control.",
      },
    ],
  },
  {
    id: "descartes",
    shortName: "Descartes",
    intro: [
      "René Descartes was a French mathematician, natural philosopher, and metaphysician whose work helped set the agenda of early modern philosophy. Dissatisfied with the education he had received, he sought a method that would separate reliable judgment from inherited opinion. His famous doubt was therefore strategic rather than permanent: suspend any belief that can be seriously doubted, locate an indubitable starting point, and rebuild knowledge in a disciplined order.",
      "The certainty he found was the thinking self—if I doubt, I must exist while doubting. From there he argued for a non-deceiving God, the reliability of clear and distinct perception, and a real distinction between unextended mind and extended body. That dualism transformed debates about consciousness while creating the enduring problem of how mind and body interact, pressed most forcefully by Princess Elisabeth of Bohemia. Descartes also replaced much Aristotelian physics with mechanical explanation, made foundational contributions to analytic geometry and optics, and developed a practical philosophy in which passions are natural and judgment can be trained. Many details of his science failed, but the demand to justify the authority of reason, experience, and self-knowledge remains recognizably Cartesian.",
    ],
    works: [
      {
        title: "Discourse on the Method",
        year: "1637",
        description:
          "An intellectual autobiography setting out four rules of method, a provisional morality, the cogito, and samples of Descartes's scientific program. It presents his path as an example rather than a scholastic textbook.",
      },
      {
        title: "Meditations on First Philosophy",
        year: "1641",
        description:
          "Six staged meditations that move through radical doubt to the certainty of thought, arguments for God, the criterion of clear and distinct perception, and the distinction and union of mind and body.",
      },
      {
        title: "Principles of Philosophy",
        year: "1644",
        description:
          "A systematic, numbered presentation of Cartesian metaphysics and natural philosophy intended for teaching. It joins foundational claims about knowledge to an ambitious mechanical account of the physical universe.",
      },
      {
        title: "The Passions of the Soul",
        year: "1649",
        description:
          "Descartes's final book, written in the context of his correspondence with Princess Elisabeth. It treats emotions as natural bodily responses and asks how understanding, habit, judgment, and generosity can regulate them.",
      },
    ],
  },
  {
    id: "locke",
    shortName: "Locke",
    intro: [
      "John Locke was an English physician, political adviser, and philosopher who lived through civil war, restoration, religious conflict, exile, and the constitutional settlement of 1688. Those upheavals shaped a philosophy suspicious of both speculative certainty and unchecked authority. He wanted to determine what the human understanding can genuinely know, then show how reasonable judgment can guide life where certainty is unavailable.",
      "Locke denied that principles or ideas are innate: the mind receives its materials from sensation and reflection, then constructs complex ideas by combining and comparing them. Because our access to substances is limited to observable qualities, knowledge has stricter limits than philosophers often admit. His account of personal identity shifted attention from an underlying soul or body to continuity of consciousness, creating puzzles that still structure the debate. In politics he defended natural equality, rights to life, liberty, and property, government by consent, resistance to tyranny, and broad religious toleration. Yet his property theory emerged within colonial expansion, his toleration had explicit exclusions, and his financial and administrative ties to slavery complicate any simple portrait of him as the philosopher of universal liberty.",
    ],
    works: [
      {
        title: "An Essay Concerning Human Understanding",
        year: "1689",
        description:
          "A four-book investigation of the origin and composition of ideas, the nature of language and personal identity, and the scope and limits of knowledge. It is a founding text of British empiricism.",
      },
      {
        title: "Two Treatises of Government",
        year: "1689",
        description:
          "The first treatise attacks patriarchal divine-right monarchy; the second develops natural equality, property, consent, political trust, and a right of resistance when government betrays its purpose.",
      },
      {
        title: "A Letter Concerning Toleration",
        year: "1689",
        description:
          "An argument that civil force cannot produce sincere belief and that churches should be voluntary associations. Its defense of toleration is powerful but stops short of equal protection for every group.",
      },
      {
        title: "Some Thoughts Concerning Education",
        year: "1693",
        description:
          "Practical advice on forming judgment, character, health, and useful habits through experience rather than rote display. The book applies Locke's psychology to education, though chiefly for boys of the propertied class.",
      },
    ],
  },
  {
    id: "kant",
    shortName: "Kant",
    intro: [
      "Immanuel Kant spent nearly his whole life in Königsberg, but his philosophy attempted nothing less than a survey of the powers and limits of human reason. He sought to explain how Newtonian science can yield necessary knowledge while answering Hume's challenge that experience alone cannot disclose necessity. His proposed reversal was that the mind does not passively copy a ready-made world: any object we can experience must appear through forms and concepts supplied by our way of knowing.",
      "This transcendental idealism preserves objective knowledge of appearances while denying theoretical access to things as they are in themselves. It also limits speculative proofs about God, freedom, and the soul. In ethics Kant argued that rational agents are autonomous—capable of acting on principles they can will as universal laws—and must treat humanity always as an end, never merely as a means. His work on aesthetics, political right, history, and enlightenment extended the critical project into culture and public life. The universal language of dignity and equal moral law has been enormously influential, but it stands in severe tension with the racial hierarchies, sexism, and colonial judgments found elsewhere in his writings.",
    ],
    works: [
      {
        title: "Critique of Pure Reason",
        year: "1781/1787",
        description:
          "Kant's account of how a priori forms and concepts make experience possible, why mathematics and natural science can be objectively valid, and why theoretical reason generates illusions when it reaches beyond possible experience.",
      },
      {
        title: "Groundwork of the Metaphysics of Morals",
        year: "1785",
        description:
          "A compact search for morality's supreme principle. It develops the good will, action from duty, the formulations of the categorical imperative, autonomy, and the kingdom of ends.",
      },
      {
        title: "Critique of Practical Reason",
        year: "1788",
        description:
          "Kant's mature treatment of moral reason, freedom, respect for the law, and the postulates of God and immortality. It argues that practical reason has authority where theoretical knowledge reaches its limit.",
      },
      {
        title: "Critique of Judgment",
        year: "1790",
        description:
          "An inquiry into judgments of beauty and sublimity and into the purposive organization of living things. It tries to bridge the domains of nature and freedom established by the first two Critiques.",
      },
    ],
  },
  {
    id: "hegel",
    shortName: "Hegel",
    intro: [
      "G. W. F. Hegel came of age amid the French Revolution and believed philosophy had to comprehend a world in which inherited authorities were breaking apart. He rejected the picture of reason as a timeless set of rules applied from outside history. Concepts, practices, and forms of consciousness develop: each exposes tensions within itself, loses its claim to be complete, and is preserved in a richer form that can explain both its achievement and its failure.",
      "This dialectical movement is not the classroom formula of thesis, antithesis, and synthesis. It is an immanent test of a position by its own commitments. Hegel's Phenomenology follows consciousness from apparent certainty through skepticism, social recognition, religion, and self-knowledge; its lord–bondsman episode made mutual recognition central to modern social thought. His political philosophy argues that freedom becomes actual through institutions—family, civil society, law, and the state—rather than existing only as private choice. His system reshaped Marxism, existentialism, pragmatism, theology, and critical theory, while his Eurocentric philosophy of history and ambiguous defense of the modern state remain persistent sources of dispute.",
    ],
    works: [
      {
        title: "Phenomenology of Spirit",
        year: "1807",
        description:
          "A dramatic education of consciousness through successive claims to knowledge and freedom. It includes the analyses of sense-certainty, lordship and bondage, unhappy consciousness, reason, ethical life, religion, and absolute knowing.",
      },
      {
        title: "Science of Logic",
        year: "1812–1816",
        description:
          "Hegel's examination of the basic categories of thought and reality as they generate and transform one another. It moves from being through essence to the concept without relying on external examples as its engine.",
      },
      {
        title: "Encyclopaedia of the Philosophical Sciences",
        year: "1817–1830",
        description:
          "A compressed presentation of Hegel's whole system: logic, philosophy of nature, and philosophy of spirit. The successive editions and lecture additions made it the principal framework for his teaching.",
      },
      {
        title: "Elements of the Philosophy of Right",
        year: "1821",
        description:
          "An account of free will becoming concrete through property, morality, family, civil society, and political institutions. Its claims about poverty, corporations, monarchy, and the rational state remain heavily contested.",
      },
    ],
  },
  {
    id: "mill",
    shortName: "Mill",
    intro: [
      "John Stuart Mill was educated from early childhood as an experiment in rational reform, suffered a profound mental crisis in his twenties, and emerged with a philosophy more attentive than Bentham's to feeling, character, culture, and individuality. He worked for the East India Company, served in Parliament, campaigned for women's suffrage, and wrote across logic, economics, ethics, and political philosophy. Harriet Taylor Mill was his closest intellectual partner, though the precise authorship of their shared ideas remains debated.",
      "Mill defended utilitarianism while insisting that well-being cannot be measured as a flat sum of interchangeable pleasures: the exercise of higher capacities changes the quality of a life. In On Liberty he argued that competent adults should be free from coercion except to prevent harm to others, and that free discussion and experiments in living are conditions of personal and social development. He treated security and rights as exceptionally important parts of utility rather than obstacles to it, and made one of the century's strongest philosophical cases against women's subordination. His liberalism nevertheless contains paternalistic exceptions and imperial assumptions that complicate its universal aspirations.",
    ],
    works: [
      {
        title: "A System of Logic",
        year: "1843",
        description:
          "A large study of inference, induction, explanation, and the methods of the moral and social sciences. It established Mill's philosophical reputation and systematized methods later associated with causal inquiry.",
      },
      {
        title: "Principles of Political Economy",
        year: "1848",
        description:
          "A major synthesis of classical economics with extensive discussions of institutions, distribution, worker cooperatives, population, taxation, and the possibility of a stationary economy.",
      },
      {
        title: "On Liberty",
        year: "1859",
        description:
          "Mill's defense of freedom of thought, discussion, association, and self-directed experiments in living. It formulates the harm principle and warns against social as well as governmental tyranny.",
      },
      {
        title: "Utilitarianism",
        year: "1861",
        description:
          "A concise defense of the greatest-happiness principle, qualitative differences among pleasures, moral motivation, justice, and rights. It distinguishes Mill's utilitarianism from simpler hedonistic calculation.",
      },
      {
        title: "The Subjection of Women",
        year: "1869",
        description:
          "An argument that women's legal and social inequality is unjust and blocks human improvement. Mill attacks appeals to natural sex difference as conclusions drawn from conditions designed to prevent a fair test.",
      },
    ],
  },
  {
    id: "marx",
    shortName: "Marx",
    intro: [
      "Karl Marx trained in philosophy, became a radical journalist, and spent much of his adult life in exile studying the political economy of capitalism. With Friedrich Engels he participated in revolutionary movements while developing a critique meant to expose social arrangements that present themselves as timeless facts of nature. His central subject was not inequality in the abstract but a historically specific mode of production organized around wage labor, commodity exchange, private control of productive assets, and the expansion of capital.",
      "Marx argued that workers can be legally free and exchange labor-power at its value while still being exploited, because their work produces more value than the cost of reproducing their capacity to work. Commodity fetishism hides these social relations by making the products of labor seem to possess value independently and confront their makers as an alien power. His earlier writings describe labor estranged from its product, activity, community, and human capacities; his mature work traces accumulation, competition, technological upheaval, and crisis. Marx expected emancipation to require collective transformation rather than moral appeal alone, but he left no detailed blueprint for communist society. Later states and movements drew incompatible programs from his work, and his own Eurocentric expectations changed but never disappeared completely.",
    ],
    works: [
      {
        title: "Economic and Philosophic Manuscripts of 1844",
        year: "1844",
        description:
          "Unpublished notes combining political economy with a philosophical account of alienated labor, private property, human capacities, and communism. Their humanist vocabulary became central to twentieth-century interpretations of Marx.",
      },
      {
        title: "The German Ideology",
        year: "1845–1846",
        description:
          "A sprawling manuscript written with Engels that attacks post-Hegelian philosophy and sketches a materialist approach beginning from real people, productive activity, social relations, and historically formed consciousness.",
      },
      {
        title: "The Communist Manifesto",
        year: "1848",
        description:
          "A short political intervention with Engels describing capitalism's revolutionary transformation of the world, the polarization of class relations, and a program for organized communist struggle.",
      },
      {
        title: "Capital, Volume I",
        year: "1867",
        description:
          "Marx's principal published work of political economy, moving from commodities and money through labor-power, surplus value, machinery, accumulation, and the historical creation of a wage-dependent working class.",
      },
    ],
  },
  {
    id: "heidegger",
    shortName: "Heidegger",
    intro: [
      "Martin Heidegger transformed twentieth-century philosophy by reopening a question he believed the Western tradition had forgotten: what does it mean for anything to be? Rather than begin from a mind representing external objects, Being and Time starts from Dasein, the human way of existing as already involved in a meaningful world of tools, tasks, places, histories, and other people. Detached observation is not our most basic relation to things but a special mode that often emerges when ordinary involvement breaks down.",
      "Heidegger describes existence as care: we are thrown into conditions we did not choose, project possibilities ahead of ourselves, and usually take our bearings from the anonymous expectations of the 'they.' Anxiety and being-toward-death can disclose this finite structure and make a more owned, authentic life possible. His later writings turn toward language, art, and technology, arguing that modern technology reveals everything—including people—as resources available for ordering and use. Heidegger joined the Nazi Party, served as rector under the regime, expressed antisemitic ideas, and never gave an adequate public account of that commitment. The relation between those facts and his philosophy is not a detachable biographical footnote but an essential problem for reading him.",
    ],
    works: [
      {
        title: "Being and Time",
        year: "1927",
        description:
          "Heidegger's unfinished masterwork analyzing being-in-the-world, equipment, being-with others, mood, understanding, care, anxiety, death, conscience, authenticity, history, and temporality.",
      },
      {
        title: "Kant and the Problem of Metaphysics",
        year: "1929",
        description:
          "A controversial interpretation of Kant that makes finite imagination central to the possibility of metaphysics. It also clarifies how Heidegger understood his own project immediately after Being and Time.",
      },
      {
        title: "The Origin of the Work of Art",
        year: "1935–1936",
        description:
          "An essay arguing that great art is not merely an object with aesthetic properties but an event in which a world of meaning is opened and the usual concealment of beings is disrupted.",
      },
      {
        title: "The Question Concerning Technology",
        year: "1954",
        description:
          "Heidegger's analysis of modern technology as enframing, a mode of disclosure that orders beings as standing reserve. The essay seeks a freer relation to technology rather than simple rejection of devices.",
      },
    ],
  },
  {
    id: "wittgenstein",
    shortName: "Wittgenstein",
    intro: [
      "Ludwig Wittgenstein was born into one of Vienna's wealthiest families, studied engineering, and turned to logic under Bertrand Russell at Cambridge. He wrote two bodies of work so different that they are often called the early and later philosophies. The early Tractatus tried to draw the limit of meaningful language by showing how propositions picture possible facts through a shared logical form; ethics, value, and the sense of the world lay at the limit of what factual propositions can state.",
      "After years away from academic philosophy, Wittgenstein returned and criticized his own earlier demand for a single logical essence of language. The Philosophical Investigations treats words as tools whose meanings lie in use within varied language-games and forms of life. Its discussions of rules, private language, sensation, and understanding aim less to construct theories than to diagnose pictures that make ordinary language appear mysterious. Philosophy becomes therapeutic: assemble reminders, compare cases, and let a problem dissolve once the words return to the practices that give them sense. His compressed examples invite incompatible interpretations, and neither phase can be reduced safely to a handful of slogans.",
    ],
    works: [
      {
        title: "Tractatus Logico-Philosophicus",
        year: "1921",
        description:
          "Seven numbered propositions and their remarks on world, fact, picture, proposition, logic, science, value, and the limits of language. Its crystalline structure is both an argument and an exercise in elucidation.",
      },
      {
        title: "Philosophical Investigations",
        year: "1953",
        description:
          "A posthumous sequence of remarks on language-games, family resemblance, rule-following, private language, understanding, sensation, and philosophical method. It is the central text of Wittgenstein's later philosophy.",
      },
      {
        title: "The Blue and Brown Books",
        year: "1933–1935",
        description:
          "Dictated notes for students that document the transition toward the later method. Their concrete examples introduce language-games and examine meaning, explanation, intention, and first-person psychological language.",
      },
      {
        title: "On Certainty",
        year: "1950–1951",
        description:
          "Late remarks prompted by G. E. Moore on doubt, knowledge, evidence, and the untested certainties that form the practical background of inquiry. The notes were written during the final eighteen months of Wittgenstein's life.",
      },
    ],
  },
];

/**
 * Profiles reached from editorial stories without adding those philosophers
 * to the main Explore carousel.
 */
export const CONTEXTUAL_PROFILES: PhilosopherProfile[] = [
  {
    id: "girard",
    shortName: "Girard",
    intro: [
      "René Girard was a French historian, literary critic, and social theorist whose work joined literature, anthropology, religion, and philosophy. His central claim is that human desire is often mimetic: we learn what to want by observing what others want. A model of desire can therefore become a rival, and rivalry can intensify until the original object matters less than defeating the other person.",
      "Girard argued that communities caught in spreading reciprocal conflict can restore temporary order by converging against a single victim. The victim is expelled or killed, and the restored peace makes that victim appear both guilty of the crisis and powerful enough to end it. Girard called this the scapegoat mechanism. He later argued that myths usually conceal this collective violence, while biblical texts increasingly disclose the innocence of the victim. His theory is ambitious and controversial, but it remains influential in literary studies, anthropology, theology, psychology, and accounts of modern competition.",
    ],
    works: [
      {
        title: "Deceit, Desire and the Novel",
        year: "1961",
        description:
          "Girard develops the triangular structure of desire through Cervantes, Stendhal, Flaubert, Proust, and Dostoevsky: a subject learns to desire an object through a model or mediator.",
      },
      {
        title: "Violence and the Sacred",
        year: "1972",
        description:
          "An anthropological account of how mimetic rivalry can spread through a community and how sacrifice redirects reciprocal violence toward a selected victim.",
      },
      {
        title: "Things Hidden Since the Foundation of the World",
        year: "1978",
        description:
          "A wide-ranging dialogue that connects mimetic desire, the scapegoat mechanism, myth, ritual, and Girard's interpretation of biblical revelation.",
      },
      {
        title: "I See Satan Fall Like Lightning",
        year: "1999",
        description:
          "Girard's concise mature presentation of mimetic theory and his argument that biblical texts expose collective persecution from the victim's perspective.",
      },
    ],
  },
];

export const ALL_PROFILES: PhilosopherProfile[] = [
  ...PROFILES,
  ...CONTEXTUAL_PROFILES,
];

export const PROFILE_BY_ID: Record<string, PhilosopherProfile> =
  Object.fromEntries(ALL_PROFILES.map((p) => [p.id, p]));

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
