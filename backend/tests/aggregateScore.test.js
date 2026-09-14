import { describe, it, expect } from "vitest";
import { computeAggregateScore } from "../services/aggregateScore.js";

describe("computeAggregateScore", () => {
  it("returns null score when all claims are unverifiable", () => {
    const verdicts = [
      { verdict: "unverifiable", confidence: 0 },
      { verdict: "unverifiable", confidence: 50 },
    ];
    const result = computeAggregateScore(verdicts);
    expect(result.overallScore).toBeNull();
    expect(result.breakdown.total).toBe(2);
    expect(result.breakdown.unverifiable).toBe(2);
  });

  it("scores all-supported claims above the neutral midpoint", () => {
    const verdicts = [
      { verdict: "supported", confidence: 100 },
      { verdict: "supported", confidence: 100 },
    ];
    const result = computeAggregateScore(verdicts);
    expect(result.overallScore).toBe(100);
    expect(result.label).toBe("Largely credible");
  });

  it("scores all-contradicted claims below the neutral midpoint", () => {
    const verdicts = [
      { verdict: "contradicted", confidence: 100 },
      { verdict: "contradicted", confidence: 100 },
    ];
    const result = computeAggregateScore(verdicts);
    expect(result.overallScore).toBe(0);
    expect(result.label).toBe("Largely not credible");
  });

  it("lands near the midpoint for an even mix of supported/contradicted", () => {
    const verdicts = [
      { verdict: "supported", confidence: 100 },
      { verdict: "contradicted", confidence: 100 },
    ];
    const result = computeAggregateScore(verdicts);
    expect(result.overallScore).toBe(50);
    expect(result.label).toBe("Mixed credibility");
  });

  it("excludes unverifiable claims from the score but still counts them in breakdown", () => {
    const verdicts = [
      { verdict: "supported", confidence: 100 },
      { verdict: "unverifiable", confidence: 0 },
    ];
    const result = computeAggregateScore(verdicts);
    expect(result.overallScore).toBe(100); // scored on the 1 supported claim only
    expect(result.breakdown.total).toBe(2);
    expect(result.breakdown.supported).toBe(1);
    expect(result.breakdown.unverifiable).toBe(1);
  });

  it("clamps the score within 0-100 bounds", () => {
    const verdicts = [{ verdict: "supported", confidence: 100 }];
    const result = computeAggregateScore(verdicts);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});