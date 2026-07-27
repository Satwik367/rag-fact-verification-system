import { generateJSON } from "../config/geminiClient.js";

/**
 * Stage 1: Claim Extraction
 * Takes raw user input (a claim or full article) and extracts
 * one or more discrete, independently-checkable factual claims.
 *
 * Phase 1/2: we still extract into an array, but the pipeline
 * only fact-checks the first claim by default.
 * Phase 3: the /verify-article route uses ALL extracted claims.
 */
export async function extractClaims(inputText) {
  const prompt = `
You are a claim-extraction engine for a fact-checking system.

Given the text below, extract every distinct, independently verifiable
factual claim. Ignore opinions, questions, and rhetorical statements.
Rewrite each claim as a short, self-contained, unambiguous sentence
(resolve pronouns, add missing context/date if it is in the source text).

Return STRICT JSON only, in this exact shape:
{
  "claims": [
    { "id": 1, "claim": "..." },
    { "id": 2, "claim": "..." }
  ]
}

If the text contains no checkable factual claim, return:
{ "claims": [] }

TEXT:
"""
${inputText}
"""
`;

  const data = await generateJSON(prompt);
  if (!data.claims || !Array.isArray(data.claims)) {
    return [];
  }
  return data.claims;
}
