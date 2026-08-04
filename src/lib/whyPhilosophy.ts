/**
 * Editorial content for the "Why should I care about philosophy?" journey.
 *
 * Keeping the editorial material in one data file makes it straightforward to
 * revise the copy and tune portrait crops without touching the page layouts.
 */

export interface WhyPhilosophyConnection {
  philosopherId: string;
  philosopherName: string;
  label: string;
  description: string;
  promptId: string;
}

export interface WhyPhilosophyReference {
  /** Exact forms that should become links, longest form first. */
  labels: string[];
  philosopherId: string;
  promptId: string;
}

export interface WhyPhilosophyVideoClip {
  label: string;
  youtubeId: string;
  startSeconds: number;
  endSeconds: number;
}

export interface WhyPhilosophyPerson {
  id: string;
  name: string;
  /** Add the final image under /public and put its root-relative path here. */
  image?: string;
  /** CSS object-position used for both the gateway crop and full hero. */
  imageFocus?: string;
  videoClip: WhyPhilosophyVideoClip;
  summary: string;
  story: string[];
  references: WhyPhilosophyReference[];
  connections: WhyPhilosophyConnection[];
}

export const WHY_PHILOSOPHY_INTRO = [
  "Philosophy at its core is about asking the big questions about the world and life- does God exist, who am I as a person, how do I know what is true, what does it mean to live a good life? Philosophy is not something that solves all our problems or answers all of our questions, but is a way to get exposure to the deepest ideas of great people throughout history so that we can think intensely (and sometimes even be challenged by) their thoughts, take what we find to be impactful, create our own philosophies of living, and lead better, more aware lives.",
];

export const WHY_PHILOSOPHY_PEOPLE: WhyPhilosophyPerson[] = [
  {
    id: "peter-thiel",
    name: "Peter Thiel",
    image: "/images/why-philosophy/peter-thiel.jpg",
    imageFocus: "54% 30%",
    videoClip: {
      label: "Competition and imitation",
      youtubeId: "3Fx5Q8xGU8k",
      startSeconds: 2220,
      endSeconds: 2325,
    },
    summary:
      "Peter Thiel credits René Girard’s mimetic theory with significantly shaping how he understands competition, contrarian thinking, and innovation.",
    story: [
      "René Girard was a French philosopher who theorized about the origin of human desire through his mimetic theory. Mimetic theory proposes that human desire originates from imitating others; in other words, humans want to pursue certain things because they see others pursuing them. The pursuit of the same objects leads to competition and eventually violence as the pursuers lose sight of the original objective and begin to focus more on the competition itself—on beating their rivals.",
      "While teaching at Stanford University from 1981 to 1995, Girard became an important intellectual figure and mentor for Peter Thiel, who was then pursuing his undergraduate degree and later his JD. Thiel has said that Girard had a significant impact on his thinking and approach to business.",
      "In an interview with Business Insider, when asked how Girard influenced his approach to competition, Thiel said: “According to Girard, imitation is inescapable. As a rule, we do what we do just because other people are doing it, too. That’s why we end up competing for the same things: the same schools, the same jobs, the same markets.”",
      "In his book Zero to One, Thiel discusses how competition leads people to lose sight of their original objective and focus instead on beating their rivals: “Inside a firm, people become obsessed with their competitors for career advancement. Then the firms themselves become obsessed with their competitors in the marketplace. Amid all the human drama, people lose sight of what matters and focus on their rivals instead.”",
      "To avoid this trap of mimetic competition, Thiel employs what he calls contrarian thinking, arriving at conclusions independently rather than according to convention or popular sentiment. This kind of thinking is best summarized in his contrarian question, “What important truth do very few people agree with you on?” Applied to business, the question becomes, “What valuable company is nobody building?” In Thiel’s view, thinking in this way spurs innovation and thus advances society, while conventional thinking and competition lead to stagnation.",
    ],
    // Girard is written and ready (see contextualPhilosophers.ts) but is not
    // part of the demo roster, so the prose runs unlinked. Restore the Girard
    // reference here once his id is added to DEMO_ROSTER_IDS.
    references: [],
    connections: [],
  },
  {
    id: "demis-hassabis",
    name: "Demis Hassabis",
    image: "/images/why-philosophy/demis-hassabis-fixed.png",
    imageFocus: "48% 30%",
    videoClip: {
      label: "Goal of life, question he would ask AGI",
      youtubeId: "Gfr50f6ZBvo",
      startSeconds: 7541,
      endSeconds: 7711,
    },
    summary:
      "Demis Hassabis sees artificial intelligence not only as a technology, but as a tool for discovering the underlying principles of reality.",
    story: [
      "Demis Hassabis is the co-founder of Google’s AI lab DeepMind and a Nobel Prize winner in Chemistry for DeepMind’s AlphaFold. Since childhood, Hassabis has said that he has always been interested in how the world operates, which led to an initial interest in physics. However, Hassabis became disillusioned with what he perceived as a lack of progress in physics toward understanding the world and began to believe that artificial intelligence could be used to go beyond conventional human capabilities and discover the underlying principles of the universe.",
      "In Sebastian Mallaby’s book The Infinity Machine, Mallaby describes an interview with Hassabis in which this exact topic is discussed. Mallaby asks Hassabis whether he believes that, despite the “irregular and fuzzy” appearance of the world, there are underlying principles unifying it. “That’s the main reason why I’m building AGI,” Hassabis responds. Human beings may be unable to decipher those rules, “but maybe an infinity machine [AI] capable of finding an infinity of data could learn to discover them.”",
      "Hassabis’s quest to use artificial intelligence to understand the world is deeply philosophical. Metaphysics is the branch of philosophy concerned with discovering the foundational principles of the universe. Since Aristotle’s Metaphysics, philosophers have attempted to move past appearances to understand the fundamental, unifying essence of the universe. In particular, Hassabis has said that the 17th-century Dutch thinker Baruch Spinoza is one of his favorite philosophers because Spinoza turned a scientific understanding of the universe into a philosophical—and, some would say, religious—understanding of humanity’s place within it, something that resonates deeply with Hassabis.",
      "In addition, Hassabis is deeply interested in the relationship between the human mind and the world, and in the mind’s limitations in understanding the world. This is the branch of philosophy called epistemology, which is concerned with how knowledge comes to be. Hassabis has said that he agrees with the 18th-century philosopher Immanuel Kant’s assertion that parts of reality are constructed by the mind rather than the mind being a passive interpreter of the world.",
    ],
    // Aristotle, Spinoza, and Kant are outside the demo roster, so their
    // mentions stay as prose. Restore these references once those ids are
    // added to DEMO_ROSTER_IDS; the prompts are kept in contextualPrompts.ts.
    references: [],
    connections: [],
  },
  {
    id: "jordan-peterson",
    name: "Jordan Peterson",
    image: "/images/why-philosophy/jordan-peterson.jpg",
    imageFocus: "54% 30%",
    videoClip: {
      label: "Nietzsche and the death of God",
      youtubeId: "q8VePUwjB9Y",
      startSeconds: 818,
      endSeconds: 931,
    },
    summary:
      "Jordan Peterson’s work asks how people can find meaning, confront suffering, and accept responsibility when traditional sources of value have become uncertain.",
    story: [
      "Jordan Peterson is a Canadian psychologist and author whose work focuses on how people can find meaning, confront suffering, and take responsibility for their lives. One of the most important philosophical influences on Peterson is the 19th-century German philosopher Friedrich Nietzsche. Peterson has described Nietzsche as a major influence on both his writing style and his approach to understanding the modern crisis of meaning.",
      "Nietzsche is most famous for his declaration that “God is dead.” By this, Nietzsche did not mean that God had literally existed and then died. Instead, he was describing the decline of Christianity and traditional religious belief in Western society. Christianity had provided people with an explanation for why human life has value, why morality matters, and why individuals should act responsibly. Nietzsche feared that people would abandon Christianity while continuing to accept the moral values that had developed from it without being able to explain why those values were true.",
      "Nietzsche believed that the loss of this religious and moral foundation could lead to nihilism, the belief that life has no objective meaning or value. This problem plays an important role in Peterson’s work, particularly his first book, Maps of Meaning. Peterson argues that modern people continue to live as though human life, morality, and individual responsibility have real significance even when they are increasingly unable to explain what that significance is based on. Peterson therefore interprets Nietzsche’s declaration of the death of God not as a celebration of humanity’s freedom from religion, but as a warning about the psychological and moral crisis that could follow.",
      "Much of Peterson’s work can be understood as an attempt to respond to this Nietzschean problem. Peterson argues that people can build meaningful lives by telling the truth, accepting responsibility, confronting suffering, and pursuing goals that are greater than their immediate comfort. Rather than viewing suffering as proof that life is meaningless, Peterson believes that voluntarily accepting responsibility can give people a reason to endure it.",
      "Nietzsche’s philosophy therefore helped define the central problem Peterson has spent much of his career addressing: how people can live meaningful and morally responsible lives when traditional sources of meaning have become increasingly uncertain. Peterson’s work demonstrates how philosophical questions about religion, morality, and meaning can directly influence modern psychology and practical advice about how people should live.",
    ],
    references: [
      {
        labels: ["Friedrich Nietzsche", "Nietzsche"],
        philosopherId: "nietzsche",
        promptId: "peterson-nietzsche-death-of-god",
      },
    ],
    connections: [
      {
        philosopherId: "nietzsche",
        philosopherName: "Friedrich Nietzsche",
        label: "The death of God and the crisis of meaning",
        description:
          "Peterson treats Nietzsche’s declaration that “God is dead” as a warning about the nihilism and moral uncertainty that may follow the decline of traditional belief.",
        promptId: "peterson-nietzsche-death-of-god",
      },
    ],
  },
];

export function getWhyPhilosophyPerson(id: string) {
  return WHY_PHILOSOPHY_PEOPLE.find((person) => person.id === id);
}
