import { ChromaClient } from "chromadb";
import { embedText } from "../config/geminiClient.js";

let client;
let collectionCache;

function getClient() {
  if (!client) {
    client = new ChromaClient({ path: process.env.CHROMA_URL });
  }
  return client;
}

/**
 * Get (or create) the curated evidence collection.
 * We manage embeddings ourselves via Gemini, so we pass
 * embeddingFunction: null semantics by always supplying vectors manually.
 */
async function getCollection() {
  if (collectionCache) return collectionCache;
  const chroma = getClient();
  collectionCache = await chroma.getOrCreateCollection({
    name: process.env.CHROMA_COLLECTION || "curated_evidence",
  });
  return collectionCache;
}

/**
 * Add a curated document (e.g. a vetted health/science fact-sheet chunk)
 * to the vector knowledge base.
 */
export async function addDocument({ id, text, metadata = {} }) {
  const collection = await getCollection();
  const embedding = await embedText(text);
  await collection.add({
    ids: [id],
    embeddings: [embedding],
    documents: [text],
    metadatas: [metadata],
  });
}

/**
 * Stage 2b: Evidence Retrieval — curated vector KB (Phase 2)
 * Semantic similarity search over the curated domain knowledge base.
 */
export async function retrieveVectorEvidence(claim, topK = 5) {
  const collection = await getCollection();
  const queryEmbedding = await embedText(claim);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const docs = results.documents?.[0] || [];
  const metas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  return docs.map((doc, i) => ({
    source: "vector_kb",
    title: metas[i]?.title || "Curated knowledge base entry",
    url: metas[i]?.url || null,
    snippet: doc.slice(0, 1200),
    score: distances[i] != null ? 1 - distances[i] : null, // convert distance -> similarity-ish
  }));
}
