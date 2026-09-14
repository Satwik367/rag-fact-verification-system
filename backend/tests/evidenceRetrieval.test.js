import { describe, it, expect } from "vitest";
import { combinedRank } from "../services/evidenceRetrieval.js";

describe("combinedRank", () => {
  it("ranks highly relevant + highly credible evidence highest", () => {
    const item = { score: 0.9, credibility: 1.0 };
    expect(combinedRank(item)).toBeCloseTo(0.9 * 0.6 + 1.0 * 0.4, 5);
  });

  it("does not let high credibility alone outrank strong relevance", () => {
    // This is the exact bug we found via the benchmark: a highly "trusted"
    // but topically irrelevant curated-KB entry should NOT outrank a
    // genuinely relevant web result just because of credibility.
    const irrelevantButTrusted = { score: 0.1, credibility: 1.0 };
    const relevantButUnverified = { score: 0.9, credibility: 0.4 };

    expect(combinedRank(relevantButUnverified)).toBeGreaterThan(
      combinedRank(irrelevantButTrusted)
    );
  });

  it("falls back to neutral defaults when score/credibility are missing", () => {
    const item = {};
    const rank = combinedRank(item);
    expect(rank).toBeCloseTo(0.6 * 0.6 + 0.4 * 0.4, 5);
  });
});