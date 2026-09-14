import CitationList from "./CitationList.jsx";

const VERDICT_STYLES = {
  supported: { label: "✅ Supported", className: "verdict-supported" },
  contradicted: { label: "❌ Contradicted", className: "verdict-contradicted" },
  unverifiable: { label: "❔ Unverifiable", className: "verdict-unverifiable" },
};

/**
 * Shows a claim being verified in real time: the extracted claim, how
 * much evidence was found, the model's reasoning streaming in live, and
 * finally the structured verdict once it's ready.
 */
export default function StreamingVerdict({ claim, evidenceCount, reasoningText, isStreaming, finalVerdict }) {
  const style = finalVerdict
    ? VERDICT_STYLES[finalVerdict.verdict] || VERDICT_STYLES.unverifiable
    : null;

  return (
    <div className={`verdict-card streaming-card ${style ? style.className : ""}`}>
      {claim && <p className="claim-text">"{claim}"</p>}

      {evidenceCount != null && (
        <p className="evidence-count-note">Found {evidenceCount} pieces of evidence.</p>
      )}

      {!finalVerdict && (
        <div className="streaming-reasoning">
          <p className="streaming-label">
            {isStreaming ? "Analyzing evidence..." : "Finalizing verdict..."}
          </p>
          <p className="reasoning streaming-text">
            {reasoningText}
            {isStreaming && <span className="cursor-blink">▌</span>}
          </p>
        </div>
      )}

      {finalVerdict && (
        <>
          <div className="verdict-row">
            <span className="verdict-badge">{style.label}</span>
            <span className="confidence">Confidence: {finalVerdict.confidence}%</span>
          </div>
          <p className="reasoning">{finalVerdict.reasoning}</p>
          <CitationList citations={finalVerdict.citations} />
        </>
      )}
    </div>
  );
}