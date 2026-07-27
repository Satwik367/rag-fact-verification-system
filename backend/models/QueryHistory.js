import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    snippet: String,
    source: String,
  },
  { _id: false }
);

const claimResultSchema = new mongoose.Schema(
  {
    claim: String,
    verdict: {
      type: String,
      enum: ["supported", "contradicted", "unverifiable"],
    },
    confidence: Number,
    reasoning: String,
    citations: [citationSchema],
  },
  { _id: false }
);

const queryHistorySchema = new mongoose.Schema(
  {
    inputText: { type: String, required: true },
    inputType: { type: String, enum: ["claim", "article"], default: "claim" },
    retrievalMode: {
      type: String,
      enum: ["web", "vector", "hybrid"],
      default: "hybrid",
    },
    results: [claimResultSchema],
    aggregateScore: {
      overallScore: Number,
      label: String,
      breakdown: {
        total: Number,
        supported: Number,
        contradicted: Number,
        unverifiable: Number,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("QueryHistory", queryHistorySchema);
