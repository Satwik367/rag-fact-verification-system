import { describe, it, expect } from "vitest";
import { extractFirstJsonObject } from "../config/geminiClient.js";

describe("extractFirstJsonObject", () => {
  it("extracts a clean, already-valid JSON object unchanged", () => {
    const input = `{"verdict": "supported", "confidence": 95}`;
    expect(JSON.parse(extractFirstJsonObject(input))).toEqual({
      verdict: "supported",
      confidence: 95,
    });
  });

  it("extracts the object even when a stray trailing brace is appended", () => {
    // This is the exact malformed shape Gemini produced during real
    // Phase 3 testing that originally broke JSON.parse.
    const input = `{
      "verdict": "contradicted",
      "confidence": 100,
      "reasoning": "some reasoning here"
    }
    }`;
    const extracted = extractFirstJsonObject(input);
    expect(() => JSON.parse(extracted)).not.toThrow();
    expect(JSON.parse(extracted).verdict).toBe("contradicted");
  });

  it("correctly handles braces that appear inside string values", () => {
    const input = `{"reasoning": "the set {1, 2, 3} was mentioned", "verdict": "supported"}`;
    const extracted = extractFirstJsonObject(input);
    expect(JSON.parse(extracted).reasoning).toBe("the set {1, 2, 3} was mentioned");
  });

  it("handles escaped quotes inside strings without miscounting braces", () => {
    const input = `{"reasoning": "he said \\"hello {world}\\"", "verdict": "supported"}`;
    const extracted = extractFirstJsonObject(input);
    expect(() => JSON.parse(extracted)).not.toThrow();
  });

  it("returns null when there is no JSON object at all", () => {
    expect(extractFirstJsonObject("no braces here")).toBeNull();
  });

  it("extracts only the first object when multiple appear", () => {
    const input = `{"a": 1} {"b": 2}`;
    const extracted = extractFirstJsonObject(input);
    expect(JSON.parse(extracted)).toEqual({ a: 1 });
  });
});