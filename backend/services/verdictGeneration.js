import { generateJSON, streamGenerateText } from "../config/geminiClient.js";
import { credibilityLabel } from "./sourceCredibility.js";

/**
 * Builds the shared evidence block text used by both the streaming
 * reasoning prompt and the final structured verdict prompt, so the two
 * calls are evaluating the exact same evidence presentation.
 */
function buildEvidenceBlock(evidence) {
  return evidence
    .map(
      (e, i) =>
        `[${i}] Source: ${e.title}\nURL: ${e.url || "N/A"}\nCredibility: ${credibilityLabel(
          e.credibility ?? 0.4
        )}\nSnippet: ${e.snippet}`
    )
    .join("\n\n");
}

/**
 * Streams a free-text reasoning analysis for a claim against its evidence,
 * invoking onChunk as text arrives. This is a separate, lighter-weight call
 * used purely for live UX (watching the model "think" in real time) - the
 * authoritative structured verdict still comes from generateVerdict below,
 * so accuracy/behavior there is unaffected by streaming mode.
 */
export async function streamVerdictReasoning(claim, evidence, onChunk) {
  if (!evidence.length) {
    const message = "No relevant evidence could be retrieved for this claim.";
    onChunk(message);
    return message;
  }

  const evidenceBlock = buildEvidenceBlock(evidence);

  const prompt = `
You are a rigorous, neutral fact-checking analyst. Think through whether the
EVIDENCE below supports, contradicts, or is insufficient to verify the CLAIM.

Write your reasoning as flowing prose (3-5 sentences), referencing evidence
by index number, e.g. "[0]". Weigh higher-credibility sources more heavily
when evidence conflicts. Do NOT include a final JSON verdict or a summary
label - just the reasoning itself, as if thinking out loud.

CLAIM:
"${claim}"

EVIDENCE:
${evidenceBlock}
`;

  return await streamGenerateText(prompt, onChunk);
}

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

  const evidenceBlock = buildEvidenceBlock(evidence);

  const prompt = `
You are a rigorous, neutral fact-checking analyst. You will be given a CLAIM
and a numbered list of EVIDENCE snippets retrieved from real sources. Each
piece of evidence includes a credibility label reflecting the general
reliability of its source domain.

Your job:
1. Decide whether the evidence SUPPORTS, CONTRADICTS, or is INSUFFICIENT to
   verify the claim (use exactly one of: "supported", "contradicted", "unverifiable").
2. Give a confidence score from 0 to 100 reflecting how strongly the evidence
   backs your verdict.
3. Write a short (2-4 sentence) neutral reasoning explaining your verdict,
   referencing evidence by its index number, e.g. "[0]".
4. List which evidence indices you actually relied on as citations.

When evidence conflicts, give more weight to higher-credibility sources, but
still consider the substance of lower-credibility evidence rather than
dismissing it outright. Do not use outside knowledge beyond what's in the
evidence. If evidence is mixed or thin, prefer "unverifiable" over guessing.

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
      credibility: evidence[i].credibility ?? null,
    }));

  return {
    claim,
    verdict: result.verdict || "unverifiable",
    confidence: typeof result.confidence === "number" ? result.confidence : 0,
    reasoning: result.reasoning || "",
    citations,
  };
}