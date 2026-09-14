/**
 * Source Credibility Scoring
 *
 * Assigns a 0-1 credibility score to an evidence source based on its
 * domain. This is a simple, transparent heuristic (not a claim of
 * objective truth-value) used to help the verdict-generation LLM weigh
 * conflicting evidence — e.g. prefer a .gov health agency over an
 * unrecognized blog when the two disagree.
 *
 * This is intentionally simple and explainable rather than a black-box
 * "trust score" model, in keeping with the project's explainability goal.
 */

const HIGH_CREDIBILITY_DOMAINS = [
  ".gov",
  ".edu",
  "who.int",
  "un.org",
  "nih.gov",
  "cdc.gov",
  "nasa.gov",
  "noaa.gov",
  "nature.com",
  "sciencedirect.com",
  "thelancet.com",
  "nejm.org",
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
];

const MEDIUM_CREDIBILITY_DOMAINS = [
  "nytimes.com",
  "washingtonpost.com",
  "theguardian.com",
  "npr.org",
  "wikipedia.org",
  "britannica.com",
  "nationalgeographic.com",
  "scientificamerican.com",
];

/**
 * Returns a credibility score from 0 to 1 for a given URL's domain.
 * Curated knowledge-base entries (no URL, or explicitly marked) are
 * treated as high-credibility since they were manually vetted before
 * being added to the knowledge base.
 */
export function scoreCredibility(url) {
  if (!url) return 0.75; // no URL (e.g. some curated KB entries) - assume vetted

  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return 0.4; // malformed URL - treat as unknown
  }

  if (HIGH_CREDIBILITY_DOMAINS.some((d) => hostname.endsWith(d) || hostname.includes(d))) {
    return 1.0;
  }
  if (MEDIUM_CREDIBILITY_DOMAINS.some((d) => hostname.endsWith(d) || hostname.includes(d))) {
    return 0.7;
  }
  return 0.4; // unrecognized domain - neutral-low baseline, not zero
}

/**
 * Human-readable label for a credibility score, used in the LLM prompt
 * so the model gets an explicit signal rather than a bare number.
 */
export function credibilityLabel(score) {
  if (score >= 0.9) return "High credibility (recognized authoritative source)";
  if (score >= 0.6) return "Medium credibility (established publication)";
  return "Unverified credibility (unrecognized source)";
}