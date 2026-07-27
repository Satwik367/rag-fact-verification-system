import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const EMBED_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Helper: ask Gemini for strict JSON output.
 * We instruct the model heavily + strip markdown fences defensively,
 * since models sometimes wrap JSON in ```json blocks anyway.
 */
export async function generateJSON(prompt) {
  const response = await callGeminiWithRetry(prompt);

  const raw = response.text;
  const cleaned = raw.replace(/```json|```/g, "").trim();

  // First, try parsing as-is.
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: extract just the first balanced {...} object, in case the
    // model appended stray characters (e.g. an extra closing brace) after it.
    const extracted = extractFirstJsonObject(cleaned);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch (err2) {
        console.error("Failed to parse extracted JSON:", extracted);
        throw new Error("LLM did not return valid JSON");
      }
    }
    console.error("Failed to parse Gemini JSON output:", cleaned);
    throw new Error("LLM did not return valid JSON");
  }
}

/**
 * Calls Gemini with automatic retry on transient errors (503 overloaded,
 * 429 rate limited). Free-tier Gemini keys hit these fairly often under
 * load, and they usually clear up within a few seconds.
 */
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
    } catch (err) {
      lastErr = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        /UNAVAILABLE|RESOURCE_EXHAUSTED/.test(err?.message || "");

      if (!isTransient || attempt === maxRetries) throw err;

      const waitMs = 1500 * Math.pow(2, attempt); // 1.5s, 3s, 6s
      console.warn(
        `Gemini transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${waitMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastErr;
}

/**
 * Scans a string for the first balanced { ... } block by tracking brace
 * depth (respecting strings so braces inside quoted text don't confuse it).
 * Returns the substring of just that object, or null if none found.
 */
function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\") {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Get an embedding vector for a piece of text (used for ChromaDB in Phase 2).
 */
export async function embedText(text) {
  const response = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: text,
  });
  return response.embeddings[0].values;
}