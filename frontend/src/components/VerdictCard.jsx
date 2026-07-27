import CitationList from "./CitationList.jsx";

const VERDICT_STYLES = {
  supported: { label: "✅ Supported", className: "verdict-supported" },
  contradicted: { label: "❌ Contradicted", className: "verdict-contradicted" },
  unverifiable: { label: "❔ Unverifiable", className: "verdict-unverifiable" },
};

export default function VerdictCard({ result }) {
  const style = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.unverifiable;

  return (
    <div className={`verdict-card ${style.className}`}>
      <p className="claim-text">"{result.claim}"</p>

      <div className="verdict-row">
        <span className="verdict-badge">{style.label}</span>
        <span className="confidence">Confidence: {result.confidence}%</span>
      </div>

      <p className="reasoning">{result.reasoning}</p>

      <CitationList citations={result.citations} />
    </div>
  );
}
