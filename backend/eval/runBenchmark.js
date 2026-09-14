import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { benchmarkClaims } from "./benchmarkClaims.js";
import { retrieveEvidence } from "../services/evidenceRetrieval.js";
import { generateVerdict } from "../services/verdictGeneration.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODES = ["web", "vector", "hybrid"];
const DELAY_MS = 1500; // gentle pacing to avoid free-tier rate limits

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs the full benchmark set through one retrieval mode and returns
 * per-claim results plus aggregate accuracy.
 */
async function runMode(mode) {
  console.log(`\n=== Running benchmark: mode = "${mode}" ===`);
  const results = [];

  for (let i = 0; i < benchmarkClaims.length; i++) {
    const { claim, groundTruth } = benchmarkClaims[i];
    process.stdout.write(`  [${i + 1}/${benchmarkClaims.length}] "${claim.slice(0, 60)}..." `);

    try {
      const evidence = await retrieveEvidence(claim, mode);
      const verdict = await generateVerdict(claim, evidence);

      const correct = verdict.verdict === groundTruth;
      console.log(`${correct ? "✅" : "❌"} predicted=${verdict.verdict} (${verdict.confidence}%) expected=${groundTruth}`);

      results.push({
        claim,
        groundTruth,
        predicted: verdict.verdict,
        confidence: verdict.confidence,
        correct,
        evidenceCount: evidence.length,
      });
    } catch (err) {
      console.log(`⚠️ ERROR: ${err.message}`);
      results.push({
        claim,
        groundTruth,
        predicted: "error",
        confidence: null,
        correct: false,
        evidenceCount: 0,
        error: err.message,
      });
    }

    await sleep(DELAY_MS);
  }

  return results;
}

/**
 * Computes accuracy and a confusion breakdown for one mode's results.
 */
function summarizeAccuracy(results) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  const confusion = {};
  for (const r of results) {
    const key = `${r.groundTruth} -> ${r.predicted}`;
    confusion[key] = (confusion[key] || 0) + 1;
  }

  return { total, correct, accuracy: Math.round(accuracy * 10) / 10, confusion };
}

/**
 * Confidence calibration: buckets predictions by confidence range and
 * checks whether stated confidence actually correlates with correctness.
 * A well-calibrated system's "90% confidence" bucket should be right
 * close to 90% of the time.
 */
function summarizeCalibration(results) {
  const buckets = [
    { label: "0-20%", min: 0, max: 20, items: [] },
    { label: "21-40%", min: 21, max: 40, items: [] },
    { label: "41-60%", min: 41, max: 60, items: [] },
    { label: "61-80%", min: 61, max: 80, items: [] },
    { label: "81-100%", min: 81, max: 100, items: [] },
  ];

  for (const r of results) {
    if (r.confidence == null) continue;
    const bucket = buckets.find((b) => r.confidence >= b.min && r.confidence <= b.max);
    if (bucket) bucket.items.push(r);
  }

  return buckets
    .filter((b) => b.items.length > 0)
    .map((b) => {
      const correctCount = b.items.filter((r) => r.correct).length;
      const actualAccuracy = (correctCount / b.items.length) * 100;
      return {
        confidenceRange: b.label,
        sampleSize: b.items.length,
        actualAccuracy: Math.round(actualAccuracy * 10) / 10,
      };
    });
}

async function main() {
  const modesToRun = process.argv[2] ? [process.argv[2]] : MODES;
  const report = { generatedAt: new Date().toISOString(), modes: {} };

  for (const mode of modesToRun) {
    const results = await runMode(mode);
    const accuracySummary = summarizeAccuracy(results);
    const calibrationSummary = summarizeCalibration(results);

    report.modes[mode] = {
      accuracy: accuracySummary,
      calibration: calibrationSummary,
      rawResults: results,
    };
  }

  // Console report
  console.log("\n\n========== BENCHMARK SUMMARY ==========");
  for (const mode of modesToRun) {
    const { accuracy, calibration } = report.modes[mode];
    console.log(`\nMode: ${mode.toUpperCase()}`);
    console.log(`  Accuracy: ${accuracy.correct}/${accuracy.total} (${accuracy.accuracy}%)`);
    console.log(`  Confusion breakdown:`);
    for (const [key, count] of Object.entries(accuracy.confusion)) {
      console.log(`    ${key}: ${count}`);
    }
    console.log(`  Confidence calibration:`);
    for (const c of calibration) {
      console.log(`    Stated ${c.confidenceRange} → actual accuracy ${c.actualAccuracy}% (n=${c.sampleSize})`);
    }
  }

  // Save full report to disk for citing in resume/report
  const resultsDir = path.join(__dirname, "results");
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  const filename = `benchmark-${Date.now()}.json`;
  fs.writeFileSync(path.join(resultsDir, filename), JSON.stringify(report, null, 2));
  console.log(`\nFull report saved to backend/eval/results/${filename}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});