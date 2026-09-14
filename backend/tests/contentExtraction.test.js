import { describe, it, expect } from "vitest";
import { isUrl } from "../services/contentExtraction.js";

describe("isUrl", () => {
  it("recognizes http and https URLs", () => {
    expect(isUrl("https://example.com/article")).toBe(true);
    expect(isUrl("http://example.com")).toBe(true);
  });

  it("recognizes URLs with surrounding whitespace", () => {
    expect(isUrl("  https://example.com/article  ")).toBe(true);
  });

  it("does not treat plain claims as URLs", () => {
    expect(isUrl("The Eiffel Tower was completed in 1889.")).toBe(false);
  });

  it("does not treat a claim that merely mentions a URL as a URL", () => {
    expect(isUrl("According to https://example.com, the sky is blue.")).toBe(false);
  });

  it("does not treat a bare domain without a scheme as a URL", () => {
    expect(isUrl("example.com/article")).toBe(false);
  });
});