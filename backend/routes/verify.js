import express from "express";
import { extractClaims } from "../services/claimExtraction.js";
import { retrieveEvidence } from "../services/evidenceRetrieval.js";
import { generateVerdict, streamVerdictReasoning } from "../services/verdictGeneration.js";
import { computeAggregateScore } from "../services/aggregateScore.js";
import { addDocument } from "../services/vectorStore.js";
import { isUrl, extractContentFromUrl } from "../services/contentExtraction.js";
import QueryHistory from "../models/QueryHistory.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * If the user's input looks like a URL (a news article, blog post, or PDF
 * link), fetch it and extract its readable text content server-side.
 * Otherwise, the input is used as-is (a claim or pasted article text).
 * Returns { resolvedText, sourceUrl } - sourceUrl is null for plain text input.
 */
async function resolveInput(rawText) {
  const trimmed = rawText.trim();
  if (!isUrl(trimmed)) {
    return { resolvedText: trimmed, sourceUrl: null };
  }

  const extracted = await extractContentFromUrl(trimmed);
  if (!extracted || extracted.length < 50) {
    throw new Error("Could not extract meaningful content from the provided URL.");
  }
  return { resolvedText: extracted, sourceUrl: trimmed };
}

/**
 * POST /api/verify
 * Body: { text: string, mode?: "web" | "vector" | "hybrid" }
 *
 * Phase 1/2 endpoint: verifies a single claim (or the first claim
 * extracted from the input text).
 */
router.post("/verify", async (req, res) => {
  try {
    const { text, mode = "hybrid" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    let resolvedText, sourceUrl;
    try {
      ({ resolvedText, sourceUrl } = await resolveInput(text));
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }

    const claims = await extractClaims(resolvedText);
    if (claims.length === 0) {
      return res.status(422).json({
        error: "No verifiable factual claim could be extracted from the input.",
      });
    }

    const primaryClaim = claims[0].claim;
    const evidence = await retrieveEvidence(primaryClaim, mode);
    const verdictResult = await generateVerdict(primaryClaim, evidence);

    const historyDoc = await QueryHistory.create({
      inputText: text, // store what the user actually entered (URL or claim)
      inputType: "claim",
      retrievalMode: mode,
      results: [verdictResult],
    });

    res.json({ id: historyDoc._id, sourceUrl, ...verdictResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed", details: err.message });
  }
});

/**
 * POST /api/verify-article
 * Body: { text: string, mode?: "web" | "vector" | "hybrid" }
 *
 * Phase 3 endpoint: breaks a full article into multiple claims,
 * verifies each independently, and returns an aggregate credibility score.
 */
router.post("/verify-article", async (req, res) => {
  try {
    const { text, mode = "hybrid" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    let resolvedText, sourceUrl;
    try {
      ({ resolvedText, sourceUrl } = await resolveInput(text));
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }

    const claims = await extractClaims(resolvedText);
    if (claims.length === 0) {
      return res.status(422).json({
        error: "No verifiable factual claims could be extracted from the input.",
      });
    }

    // Process claims sequentially to keep API rate usage predictable.
    // (Could be parallelized with Promise.all if your API quota allows.)
    const results = [];
    for (const c of claims) {
      const evidence = await retrieveEvidence(c.claim, mode);
      const verdict = await generateVerdict(c.claim, evidence);
      results.push(verdict);
    }

    const aggregateScore = computeAggregateScore(results);

    const historyDoc = await QueryHistory.create({
      inputText: text, // store what the user actually entered (URL or article text)
      inputType: "article",
      retrievalMode: mode,
      results,
      aggregateScore,
    });

    res.json({ id: historyDoc._id, sourceUrl, claims: results, aggregateScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Article verification failed", details: err.message });
  }
});

/**
 * POST /api/verify-stream
 * Body: { text: string, mode?: "web" | "vector" | "hybrid" }
 *
 * Server-Sent Events endpoint: streams the model's reasoning as it's
 * generated, then emits the final structured verdict once ready. Scoped
 * to single-claim verification for simplicity.
 *
 * Emitted events: "claim", "evidence_count", "reasoning_chunk", "verdict", "error"
 */
router.post("/verify-stream", async (req, res) => {
  const { text, mode = "hybrid" } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!text || !text.trim()) {
      send("error", { error: "text is required" });
      return res.end();
    }

    let resolvedText;
    try {
      ({ resolvedText } = await resolveInput(text));
    } catch (err) {
      send("error", { error: err.message });
      return res.end();
    }

    const claims = await extractClaims(resolvedText);
    if (claims.length === 0) {
      send("error", { error: "No verifiable factual claim could be extracted from the input." });
      return res.end();
    }

    const claim = claims[0].claim;
    send("claim", { claim });

    const evidence = await retrieveEvidence(claim, mode);
    send("evidence_count", { count: evidence.length });

    await streamVerdictReasoning(claim, evidence, (chunk) => {
      send("reasoning_chunk", { text: chunk });
    });

    // Final structured verdict comes from the same deterministic path used
    // by the non-streaming endpoint, so accuracy is unaffected by streaming.
    const verdictResult = await generateVerdict(claim, evidence);

    await QueryHistory.create({
      inputText: text,
      inputType: "claim",
      retrievalMode: mode,
      results: [verdictResult],
    });

    send("verdict", verdictResult);
    res.end();
  } catch (err) {
    console.error(err);
    send("error", { error: err.message });
    res.end();
  }
});

/**
 * GET /api/history
 * Returns recent verification queries (for a simple history view).
 */
router.get("/history", async (req, res) => {
  try {
    const items = await QueryHistory.find().sort({ createdAt: -1 }).limit(20);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch history" });
  }
});

/**
 * POST /api/kb/add
 * Body: { id?: string, text: string, title?: string, url?: string }
 *
 * Phase 2 helper: add a curated document chunk into the vector KB.
 * Use this (or the seed script) to populate domain knowledge (health, science, etc).
 */
router.post("/kb/add", async (req, res) => {
  try {
    const { text, title, url } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    const id = req.body.id || uuidv4();
    await addDocument({ id, text, metadata: { title, url } });
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add document", details: err.message });
  }
});

export default router;