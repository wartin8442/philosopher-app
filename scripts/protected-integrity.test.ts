import { describe, expect, it } from "vitest";
import {
  PROTECTED_PATHS,
  compareProtected,
  hashProtectedPaths,
  loadProtectedBaseline,
  type ProtectedBaseline,
} from "./protected-integrity";

const ROOT = process.cwd();

function baseline(hashes: Record<string, string>): ProtectedBaseline {
  return { recorded_at: "2026-07-23T00:00:00.000Z", note: "fixture", hashes };
}

describe("protected-input drift detection", () => {
  it("passes when every hash matches", () => {
    const report = compareProtected(baseline({ "a.json": "AAA", "b.json": "BBB" }), {
      "a.json": "AAA",
      "b.json": "BBB",
    });
    expect(report.ok).toBe(true);
    expect(report.findings.every((finding) => finding.status === "match")).toBe(true);
  });

  it("fails and names the drifted file", () => {
    const report = compareProtected(baseline({ "a.json": "AAA" }), { "a.json": "ZZZ" });
    expect(report.ok).toBe(false);
    expect(report.findings[0]).toMatchObject({ path: "a.json", status: "changed", expected: "AAA", actual: "ZZZ" });
  });

  it("fails on a deleted protected file", () => {
    const report = compareProtected(baseline({ "a.json": "AAA" }), { "a.json": null });
    expect(report.ok).toBe(false);
    expect(report.findings[0].status).toBe("missing");
  });

  it("fails on a protected file that is no longer checked at all", () => {
    const report = compareProtected(baseline({ "a.json": "AAA", "gone.json": "GGG" }), { "a.json": "AAA" });
    expect(report.ok).toBe(false);
    expect(report.findings.find((finding) => finding.path === "gone.json")?.status).toBe("missing");
  });

  it("fails on a newly protected file with no recorded reference", () => {
    const report = compareProtected(baseline({}), { "new.json": "NNN" });
    expect(report.ok).toBe(false);
    expect(report.findings[0].status).toBe("unrecorded");
  });
});

describe("the committed baseline", () => {
  it("covers every protected path and still matches the working tree", () => {
    const report = compareProtected(loadProtectedBaseline(ROOT), hashProtectedPaths(ROOT));
    expect(report.findings.map((finding) => finding.path).sort()).toEqual([...PROTECTED_PATHS].sort());
    expect(report.ok).toBe(true);
  });

  it("still matches every immutable hash the pilot checkpoint recorded as trusted", () => {
    // Cross-check against RAG_EXPERIMENT_CHECKPOINT.md, so the automated check
    // is provably anchored to the same references the manual ceremony used.
    //
    // src/data/source-embeddings.json is deliberately absent from this list.
    // It is a *generated* artifact, not frozen history: it is rebuilt whenever
    // the corpus changes and legitimately did change on 2026-07-23 when the
    // misattribution-warning parser was added (259 -> 267 eligible units). It
    // stays in PROTECTED_PATHS so unintended drift is still caught, but
    // pinning it to a historical hash here would assert it must never be
    // regenerated, which is false.
    const immutable: Record<string, string> = {
      "data/rag/eval/questions.json":
        "5124871629C29D67DFA4DD345DE2CBD87F861D73DFF55EBE59E018C9CE00EE2E",
      "data/rag/eval/pilot-manifest.json":
        "802D0641C9D3021528044367EDEBBD65C4A67207B09C9CAAD03D204762A8C4A7",
      "data/rag/stress/dashboard.html":
        "725EF388F17A769FF4FC31BB8F3B00595C03DFD2FD3D057E40C41F611B3FC110",
      "data/rag/stress/aquinas/results.json":
        "59C0F042009AC70319E7B87C9F4D44E35FB42C2551E777E51A915976745C2470",
      "data/rag/stress/camus/results.json":
        "BC7BD73912D9EE9D74EE90D937F84F22EB686CEBA4F62647719A4EDDAA90E0E6",
      "data/rag/stress/kierkegaard/results.json":
        "D6EC995DB6D30531CBD8B5D8F0081B1C584DF644CDD81ECFF13DD9B623E3A56A",
      "data/rag/stress/nietzsche/results.json":
        "B65E825F1F0C782B8B2A8F05DF5DEF688AE9D29CFF22DADF5C7E357A694D7B58",
      "data/rag/stress/sartre/results.json":
        "CD02C0F0540041105BBFB370DB3A7655191C54F0614891BEC26BDB7F1E0B7C7D",
    };

    const recorded = loadProtectedBaseline(ROOT).hashes;
    for (const [file, hash] of Object.entries(immutable)) {
      expect(recorded[file], `${file} drifted from its trusted reference`).toBe(hash);
    }
    expect(recorded["src/data/source-embeddings.json"]).toMatch(/^[0-9A-F]{64}$/);
  });
});
