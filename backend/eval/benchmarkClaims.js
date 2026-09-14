/**
 * Benchmark Claim Set
 *
 * A small, hand-curated set of claims with known ground-truth verdicts,
 * used by runBenchmark.js to measure the system's actual verdict accuracy
 * across retrieval modes (web / vector / hybrid), instead of relying on
 * spot-checking individual examples.
 *
 * groundTruth uses the same 3-way verdict scheme the system outputs:
 * "supported" | "contradicted" | "unverifiable"
 *
 * Keep these claims objectively checkable — avoid claims that are
 * genuinely ambiguous or opinion-based, since the benchmark is only as
 * good as the correctness of its own labels.
 */
export const benchmarkClaims = [
  // --- Should be SUPPORTED ---
  { claim: "Mount Everest is the highest mountain above sea level.", groundTruth: "supported" },
  { claim: "The adult human body has 206 bones.", groundTruth: "supported" },
  { claim: "Water boils at 100 degrees Celsius at sea level.", groundTruth: "supported" },
  { claim: "The Great Wall of China was built over many centuries by multiple dynasties.", groundTruth: "supported" },
  { claim: "Vaccines prevent millions of deaths every year according to the WHO.", groundTruth: "supported" },
  { claim: "The Earth orbits the Sun once approximately every 365 days.", groundTruth: "supported" },
  { claim: "Photosynthesis converts light energy into chemical energy in plants.", groundTruth: "supported" },
  { claim: "The Great Barrier Reef is located off the coast of Australia.", groundTruth: "supported" },

  // --- Should be CONTRADICTED (well-known myths / false claims) ---
  { claim: "The Great Wall of China is visible from space with the naked eye.", groundTruth: "contradicted" },
  { claim: "Humans only use 10 percent of their brains.", groundTruth: "contradicted" },
  { claim: "Goldfish have a memory span of only a few seconds.", groundTruth: "contradicted" },
  { claim: "Lightning never strikes the same place twice.", groundTruth: "contradicted" },
  { claim: "Napoleon Bonaparte was unusually short compared to men of his era.", groundTruth: "contradicted" },
  { claim: "Cracking your knuckles causes arthritis.", groundTruth: "contradicted" },
  { claim: "The Great Depression was caused primarily by the invention of the automobile.", groundTruth: "contradicted" },

  // --- Should be UNVERIFIABLE (ambiguous, underspecified, or highly contested) ---
  { claim: "This is the best programming language ever created.", groundTruth: "unverifiable" },
  { claim: "Aliens have visited Earth in the past century.", groundTruth: "unverifiable" },
  { claim: "The stock market will crash next year.", groundTruth: "unverifiable" },
  { claim: "Mount Everest is the tallest mountain on Earth.", groundTruth: "unverifiable" }, // ambiguous: tallest vs highest
  { claim: "Coffee is better than tea.", groundTruth: "unverifiable" },
];