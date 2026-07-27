import { useEffect, useState } from "react";
import { getHistory } from "../api/verify.js";

const VERDICT_ICON = {
  supported: "✅",
  contradicted: "❌",
  unverifiable: "❔",
};

export default function HistoryPanel({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHistory()
      .then(setItems)
      .catch(() => setError("Could not load history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>Past Verifications</h2>
        <button className="close-btn" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-banner">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="no-history">No past queries yet. Verify a claim to see it here.</p>
      )}

      <ul className="history-list">
        {items.map((item) => (
          <li key={item._id} className="history-item">
            <div className="history-item-header">
              <span className="history-input-type">
                {item.inputType === "article" ? "📰 Article" : "💬 Claim"}
              </span>
              <span className="history-date">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="history-input-text">
              {item.inputText.length > 160
                ? item.inputText.slice(0, 160) + "..."
                : item.inputText}
            </p>

            <div className="history-verdicts">
              {item.results?.map((r, i) => (
                <span key={i} className={`history-verdict-tag ${r.verdict}`}>
                  {VERDICT_ICON[r.verdict] || "❔"} {r.verdict}
                </span>
              ))}
            </div>

            {item.aggregateScore?.overallScore != null && (
              <p className="history-score">
                Overall score: <strong>{item.aggregateScore.overallScore}</strong> (
                {item.aggregateScore.label})
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}