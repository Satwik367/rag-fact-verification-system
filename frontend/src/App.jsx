import { useState } from "react";
import ClaimInput from "./components/ClaimInput.jsx";
import VerdictCard from "./components/VerdictCard.jsx";
import AggregateScore from "./components/AggregateScore.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import { verifyClaim, verifyArticle } from "./api/verify.js";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [articleResults, setArticleResults] = useState(null);
  const [aggregateScore, setAggregateScore] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  async function handleSubmit({ text, inputType, mode }) {
    setLoading(true);
    setError(null);
    setSingleResult(null);
    setArticleResults(null);
    setAggregateScore(null);

    try {
      if (inputType === "article") {
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