/**
 * Phase 3: Multi-claim aggregate credibility scoring.
 * Given an array of per-claim verdicts, compute an overall
 * article-level credibility score (0-100).
 *
 * Weighting logic (simple, explainable, tunable):
 *  - supported claim contributes its confidence (positive)
 *  - contradicted claim contributes its confidence (negative)
 *  - unverifiable claims are excluded from the score but tracked separately
 */
export function computeAggregateScore(verdicts) {
  const scored = verdicts.filter((v) => v.verdict !== "unverifiable");

  if (scored.length === 0) {
    return {
      overallScore: null,
      label: "Insufficient evidence to score this article",
      breakdown: summarize(verdicts),
    };
  }

  const total = scored.reduce((sum, v) => {
    const sign = v.verdict === "supported" ? 1 : -1;
    return sum + sign * v.confidence;
  }, 0);

  // Normalize to 0-100 scale (start from neutral midpoint 50)
  const maxPossible = scored.length * 100;
  const normalized = 50 + (total / maxPossible) * 50;
  const overallScore = Math.round(Math.max(0, Math.min(100, normalized)));

  let label = "Mixed credibility";
  if (overallScore >= 75) label = "Largely credible";
  else if (overallScore <= 30) label = "Largely not credible";

  return {
    overallScore,
    label,
    breakdown: summarize(verdicts),
  };
}

function summarize(verdicts) {
  return {
    total: verdicts.length,
    supported: verdicts.filter((v) => v.verdict === "supported").length,
    contradicted: verdicts.filter((v) => v.verdict === "contradicted").length,
    unverifiable: verdicts.filter((v) => v.verdict === "unverifiable").length,
  };
}
