import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function verifyClaim(text, mode = "hybrid") {
  const res = await api.post("/verify", { text, mode });
  return res.data;
}

export async function verifyArticle(text, mode = "hybrid") {
  const res = await api.post("/verify-article", { text, mode });
  return res.data;
}

/**
 * Streams a single-claim verification via Server-Sent Events. Since
 * EventSource doesn't support POST bodies, this reads the response body
 * manually as a stream and parses "event:"/"data:" blocks itself.
 *
 * callbacks: { onClaim, onEvidenceCount, onReasoningChunk, onVerdict, onError }
 */
export async function streamVerifyClaim(text, mode, callbacks = {}) {
  const response = await fetch("/api/verify-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });

  if (!response.ok || !response.body) {
    callbacks.onError?.("Failed to start the stream.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const eventMatch = rawEvent.match(/^event: (.+)$/m);
      const dataMatch = rawEvent.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const eventType = eventMatch[1];
      let data;
      try {
        data = JSON.parse(dataMatch[1]);
      } catch {
        continue;
      }

      if (eventType === "claim") callbacks.onClaim?.(data.claim);
      else if (eventType === "evidence_count") callbacks.onEvidenceCount?.(data.count);
      else if (eventType === "reasoning_chunk") callbacks.onReasoningChunk?.(data.text);
      else if (eventType === "verdict") callbacks.onVerdict?.(data);
      else if (eventType === "error") callbacks.onError?.(data.error);
    }
  }
}

export async function getHistory() {
  const res = await api.get("/history");
  return res.data;
}