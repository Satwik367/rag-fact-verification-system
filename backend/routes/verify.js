import express from "express";
import { extractClaims } from "../services/claimExtraction.js";
import { retrieveEvidence } from "../services/evidenceRetrieval.js";
import { generateVerdict } from "../services/verdictGeneration.js";
import { computeAggregateScore } from "../services/aggregateScore.js";
import { addDocument } from "../services/vectorStore.js";
import QueryHistory from "../models/QueryHistory.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

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

    const claims = await extractClaims(text);
    if (claims.length === 0) {
      return res.status(422).json({
        error: "No verifiable factual claim could be extracted from the input.",
      });
    }

    const primaryClaim = claims[0].claim;
    const evidence = await retrieveEvidence(primaryClaim, mode);
    const verdictResult = await generateVerdict(primaryClaim, evidence);

    const historyDoc = await QueryHistory.create({
      inputText: text,
      inputType: "claim",
      retrievalMode: mode,
      results: [verdictResult],
    });

    res.json({ id: historyDoc._id, ...verdictResult });
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

    const claims = await extractClaims(text);
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
      inputText: text,
      inputType: "article",
      retrievalMode: mode,
      results,
      aggregateScore,
    });

    res.json({ id: historyDoc._id, claims: results, aggregateScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Article verification failed", details: err.message });
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
