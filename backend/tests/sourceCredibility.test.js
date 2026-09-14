import { describe, it, expect } from "vitest";
import { scoreCredibility, credibilityLabel } from "../services/sourceCredibility.js";

describe("scoreCredibility", () => {
  it("scores .gov domains as high credibility", () => {
    expect(scoreCredibility("https://www.cdc.gov/some-page")).toBe(1.0);
  });

  it("scores .edu domains as high credibility", () => {
    expect(scoreCredibility("https://www.harvard.edu/research")).toBe(1.0);
  });

  it("scores known authoritative orgs (e.g. who.int) as high credibility", () => {
    expect(scoreCredibility("https://www.who.int/news/item")).toBe(1.0);
  });

  it("scores established publications as medium credibility", () => {
    expect(scoreCredibility("https://www.nytimes.com/2024/article")).toBe(0.7);
  });

  it("scores unrecognized domains as low-but-nonzero credibility", () => {
    expect(scoreCredibility("https://some-random-blog.example.com/post")).toBe(0.4);
  });

  it("treats a missing URL as a vetted curated-KB entry (high-ish default)", () => {
    expect(scoreCredibility(null)).toBe(0.75);
    expect(scoreCredibility(undefined)).toBe(0.75);
  });

  it("handles malformed URLs without throwing", () => {
    expect(() => scoreCredibility("not-a-url")).not.toThrow();
    expect(scoreCredibility("not-a-url")).toBe(0.4);
  });
});

describe("credibilityLabel", () => {
  it("labels high scores correctly", () => {
    expect(credibilityLabel(1.0)).toMatch(/High credibility/);
    expect(credibilityLabel(0.9)).toMatch(/High credibility/);
  });

  it("labels medium scores correctly", () => {
    expect(credibilityLabel(0.7)).toMatch(/Medium credibility/);
    expect(credibilityLabel(0.6)).toMatch(/Medium credibility/);
  });

  it("labels low scores correctly", () => {
    expect(credibilityLabel(0.4)).toMatch(/Unverified credibility/);
    expect(credibilityLabel(0)).toMatch(/Unverified credibility/);
  });
});