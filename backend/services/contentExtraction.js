import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const URL_REGEX = /^https?:\/\/\S+$/i;
const MAX_CHARS = 6000; // keep extracted content within a reasonable prompt size

/**
 * Returns true if the given input string looks like a bare URL rather
 * than a claim/article the user typed directly.
 */
export function isUrl(text) {
  return URL_REGEX.test(text.trim());
}

/**
 * Fetches a URL and extracts its readable text content, handling both
 * regular web pages (HTML) and PDF documents transparently based on the
 * response's content-type.
 */
export async function extractContentFromUrl(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000,
    maxContentLength: 20 * 1024 * 1024, // 20MB safety cap
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FactCheckRAGBot/1.0)",
    },
  });

  const contentType = (response.headers["content-type"] || "").toLowerCase();
  const looksLikePdf = contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf");

  let text;
  if (looksLikePdf) {
    text = await extractPdfText(Buffer.from(response.data));
  } else {
    text = extractHtmlText(response.data.toString("utf-8"));
  }

  return cleanAndTruncate(text);
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

function extractHtmlText(html) {
  const $ = cheerio.load(html);
  // Strip elements that are never part of the actual article content
  $("script, style, nav, footer, header, aside, noscript, iframe").remove();

  // Prefer <article> content if the page provides one (common on news
  // sites), otherwise fall back to the full page body.
  const articleText = $("article").text();
  return articleText.trim().length > 200 ? articleText : $("body").text();
}

function cleanAndTruncate(text) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > MAX_CHARS ? collapsed.slice(0, MAX_CHARS) : collapsed;
}