import { useState } from "react";

export default function CitationList({ citations }) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) {
    return <p className="no-citations">No citations available.</p>;
  }

  return (
    <div className="citation-list">
      <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Hide" : "Show"} sources ({citations.length})
      </button>

      {expanded && (
        <ul>
          {citations.map((c, i) => (
            <li key={i} className="citation-item">
              <div className="citation-title">
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer">
                    {c.title || c.url}
                  </a>
                ) : (
                  <span>{c.title}</span>
                )}
                <span className={`source-tag ${c.source}`}>{c.source}</span>
              </div>
              <p className="citation-snippet">{c.snippet}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
