export default function AggregateScore({ score }) {
  if (!score) return null;

  const { overallScore, label, breakdown } = score;

  return (
    <div className="aggregate-score">
      <h3>Overall Article Credibility</h3>
      {overallScore === null ? (
        <p>{label}</p>
      ) : (
        <>
          <div className="score-circle">{overallScore}</div>
          <p className="score-label">{label}</p>
        </>
      )}
      <div className="breakdown">
        <span>Total claims: {breakdown.total}</span>
        <span>Supported: {breakdown.supported}</span>
        <span>Contradicted: {breakdown.contradicted}</span>
        <span>Unverifiable: {breakdown.unverifiable}</span>
      </div>
    </div>
  );
}
