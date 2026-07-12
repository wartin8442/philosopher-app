/**
 * Sanity-check hybrid retrieval scores against real queries.
 *
 * Run from the project root:  npx tsx scripts/retrieval-check.ts
 *
 * Prints every source's hybrid score for a set of probe queries — including
 * ones with no keyword overlap (the case embeddings must win) and ones that
 * should retrieve nothing. Use it to eyeball the relevance threshold.
 */
import { getPhilosopher } from "../src/lib/philosophers";
import { RETRIEVAL_MIN_SCORE, retrieveSources } from "../src/lib/retrieval";
import { warmEmbedder } from "../src/lib/embeddings";

const PROBES: { philosopherId: string; query: string; expect: string }[] = [
  {
    philosopherId: "camus",
    query: "Is life worth living?",
    expect: "absurd/suicide source, despite zero shared keywords",
  },
  {
    philosopherId: "camus",
    query: "Tell me about Sisyphus and his rock",
    expect: "Myth of Sisyphus (keyword + semantic)",
  },
  {
    philosopherId: "kierkegaard",
    query: "Why am I so anxious all the time?",
    expect: "anxiety/dread source",
  },
  {
    philosopherId: "nietzsche",
    query: "What happens after God is dead?",
    expect: "death of God source",
  },
  {
    philosopherId: "aquinas",
    query: "What's your favorite pizza topping?",
    expect: "NOTHING above threshold",
  },
];

async function main() {
  await warmEmbedder();
  for (const probe of PROBES) {
    const philosopher = getPhilosopher(probe.philosopherId)!;
    // minScore -1 / maxResults 99: dump every source with its score.
    const all = await retrieveSources(philosopher, probe.query, {
      minScore: -1,
      maxResults: 99,
    });
    console.log(`\n${philosopher.name} <- "${probe.query}"`);
    console.log(`  expecting: ${probe.expect}`);
    for (const s of all.sort((a, b) => b.score - a.score)) {
      const mark = s.score >= RETRIEVAL_MIN_SCORE ? "RETRIEVED" : "         ";
      console.log(`  ${mark} ${s.score.toFixed(3)}  ${s.label}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
