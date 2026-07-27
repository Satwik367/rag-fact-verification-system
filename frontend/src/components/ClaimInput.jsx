import { useState } from "react";

export default function ClaimInput({ onSubmit, loading }) {
  const [text, setText] = useState("");
  const [inputType, setInputType] = useState("claim"); // "claim" | "article"
  const [mode, setMode] = useState("hybrid"); // "web" | "vector" | "hybrid"

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({ text, inputType, mode });
  }

  return (
    <form className="claim-input" onSubmit={handleSubmit}>
      <textarea
        placeholder="Paste a claim, or a full article to break down into multiple claims..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
      />

      <div className="controls-row">
        <div className="toggle-group">
          <label>Input type:</label>
          <select value={inputType} onChange={(e) => setInputType(e.target.value)}>
            <option value="claim">Single claim</option>
            <option value="article">Full article (multi-claim)</option>
          </select>
        </div>

        <div className="toggle-group">
          <label>Evidence source:</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="hybrid">Hybrid (web + curated KB)</option>
            <option value="web">Live web search only</option>
            <option value="vector">Curated knowledge base only</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </form>
  );
}
