import { generateJSON } from "../config/geminiClient.js";

/**
 * Stage 3: Verdict Generation
 * Compares the claim against the retrieved evidence snippets and
 * produces a structured, explainable verdict.
 */
export async function generateVerdict(claim, evidence) {
  if (!evidence.length) {
    return {
      claim,
      verdict: "unverifiable",
      confidence: 0,
      reasoning: "No relevant evidence could be retrieved for this claim.",
      citations: [],
    };
  }

  const evidenceBlock = evidence
    .map(
      (e, i) =>
        `[${i}] Source: ${e.title}\nURL: ${e.url || "N/A"}\nSnippet: ${e.snippet}`
    )
    .join("\n\n");

  const prompt = `
You are a rigorous, neutral fact-checking analyst. You will be given a CLAIM
and a numbered list of EVIDENCE snippets retrieved from real sources.

Your job:
1. Decide whether the evidence SUPPORTS, CONTRADICTS, or is INSUFFICIENT to
   verify the claim (use exactly one of: "supported", "contradicted", "unverifiable").
2. Give a confidence score from 0 to 100 reflecting how strongly the evidence
   backs your verdict.
3. Write a short (2-4 sentence) neutral reasoning explaining your verdict,
   referencing evidence by its index number, e.g. "[0]".
4. List which evidence indices you actually relied on as citations.

Do not use outside knowledge beyond what's in the evidence. If evidence is
mixed or thin, prefer "unverifiable" over guessing.

Return STRICT JSON only, in this exact shape:
{
  "verdict": "supported" | "contradicted" | "unverifiable",
  "confidence": 0-100,
  "reasoning": "...",
  "citedIndices": [0, 2]
}

CLAIM:
"${claim}"

EVIDENCE:
${evidenceBlock}
`;

  const result = await generateJSON(prompt);

  const citedIndices = Array.isArray(result.citedIndices)
    ? result.citedIndices
    : [];

  const citations = citedIndices
    .filter((i) => evidence[i])
    .map((i) => ({
      title: evidence[i].title,
      url: evidence[i].url,
      snippet: evidence[i].snippet,
      source: evidence[i].source,
    }));

  return {
    claim,
    verdict: result.verdict || "unverifiable",
    confidence: typeof result.confidence === "number" ? result.confidence : 0,
    reasoning: result.reasoning || "",
    citations,
  };
}
