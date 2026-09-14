import { useState } from "react";
import ClaimInput from "./components/ClaimInput.jsx";
import VerdictCard from "./components/VerdictCard.jsx";
import AggregateScore from "./components/AggregateScore.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import StreamingVerdict from "./components/StreamingVerdict.jsx";
import { verifyClaim, verifyArticle, streamVerifyClaim } from "./api/verify.js";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [articleResults, setArticleResults] = useState(null);
  const [aggregateScore, setAggregateScore] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Streaming-mode state
  const [streamClaim, setStreamClaim] = useState(null);
  const [streamEvidenceCount, setStreamEvidenceCount] = useState(null);
  const [streamReasoning, setStreamReasoning] = useState("");
  const [streamIsStreaming, setStreamIsStreaming] = useState(false);
  const [streamFinalVerdict, setStreamFinalVerdict] = useState(null);

  function resetAllResults() {
    setSingleResult(null);
    setArticleResults(null);
    setAggregateScore(null);
    setStreamClaim(null);
    setStreamEvidenceCount(null);
    setStreamReasoning("");
    setStreamIsStreaming(false);
    setStreamFinalVerdict(null);
  }

  async function handleSubmit({ text, inputType, mode, streamMode }) {
    setLoading(true);
    setError(null);
    resetAllResults();

    try {
      if (streamMode && inputType === "claim") {
        setStreamIsStreaming(true);
        await streamVerifyClaim(text, mode, {
          onClaim: (claim) => setStreamClaim(claim),
          onEvidenceCount: (count) => setStreamEvidenceCount(count),
          onReasoningChunk: (chunk) => setStreamReasoning((prev) => prev + chunk),
          onVerdict: (verdict) => {
            setStreamFinalVerdict(verdict);
            setStreamIsStreaming(false);
          },
          onError: (message) => {
            setError(message);
            setStreamIsStreaming(false);
          },
        });
      } else if (inputType === "article") {
        const data = await verifyArticle(text, mode);
        setArticleResults(data.claims);
        setAggregateScore(data.aggregateScore);
      } else {
        const data = await verifyClaim(text, mode);
        setSingleResult(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showStreamingCard = streamClaim || streamReasoning || streamFinalVerdict;

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <div>
            <h1>🔍 RAG Fact Verification System</h1>
            <p className="subtitle">
              Evidence-backed, explainable claim verification — not a black-box classifier.
            </p>
          </div>
          <button className="history-toggle-btn" onClick={() => setShowHistory(true)}>
            📜 History
          </button>
        </div>
      </header>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

      <ClaimInput onSubmit={handleSubmit} loading={loading} />

      {error && <div className="error-banner">{error}</div>}

      {singleResult && <VerdictCard result={singleResult} />}

      {showStreamingCard && (
        <StreamingVerdict
          claim={streamClaim}
          evidenceCount={streamEvidenceCount}
          reasoningText={streamReasoning}
          isStreaming={streamIsStreaming}
          finalVerdict={streamFinalVerdict}
        />
      )}

      {articleResults && (
        <div className="article-results">
          <AggregateScore score={aggregateScore} />
          {articleResults.map((r, i) => (
            <VerdictCard key={i} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}