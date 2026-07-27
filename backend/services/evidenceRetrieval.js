import { retrieveWebEvidence } from "./webSearchRetrieval.js";
import { retrieveVectorEvidence } from "./vectorStore.js";

/**
 * Stage 2 orchestrator: decides which evidence sources to query
 * and merges/dedupes the results into a single evidence list that
 * gets passed to the verdict generator.
 *
 * mode: "web" | "vector" | "hybrid"
 *  - web:    Phase 1 behavior, live search only
 *  - vector: Phase 2 behavior, curated KB only
 *  - hybrid: Phase 2 behavior, both sources merged (default/best)
 */
export async function retrieveEvidence(claim, mode = "hybrid") {
  let evidence = [];

  if (mode === "web") {
    evidence = await retrieveWebEvidence(claim);
  } else if (mode === "vector") {
    evidence = await retrieveVectorEvidence(claim);
  } else {
    // hybrid: run both concurrently, fall back gracefully if one fails
    const [webResult, vectorResult] = await Promise.allSettled([
      retrieveWebEvidence(claim),
      retrieveVectorEvidence(claim),
    ]);

    if (webResult.status === "fulfilled") evidence.push(...webResult.value);
    else console.warn("Web retrieval failed:", webResult.reason?.message);

    if (vectorResult.status === "fulfilled") evidence.push(...vectorResult.value);
    else console.warn("Vector retrieval failed:", vectorResult.reason?.message);
  }

  // Cap total evidence passed to the LLM to keep prompts focused
  return evidence.slice(0, 8);
}
