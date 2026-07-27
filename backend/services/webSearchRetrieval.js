import axios from "axios";

/**
 * Stage 2a: Evidence Retrieval — live web search (Phase 1)
 * Uses Tavily's search API to fetch real-world evidence snippets
 * relevant to a claim. Returns a normalized array of evidence objects.
 */
export async function retrieveWebEvidence(claim, maxResults = 5) {
  const response = await axios.post("https://api.tavily.com/search", {
    api_key: process.env.TAVILY_API_KEY,
    query: claim,
    search_depth: "advanced",
    include_answer: false,
    max_results: maxResults,
  });

  const results = response.data?.results || [];

  return results.map((r) => ({
    source: "web",
    title: r.title,
    url: r.url,
    snippet: r.content?.slice(0, 1200) || "",
    score: r.score ?? null,
  }));
}
