import { getJson } from "serpapi";

const BLOCKED_DOMAINS = [
  "amazon.",
  "flipkart.",
  "youtube.",
  "facebook.",
  "instagram.",
  "twitter.",
  "linkedin.",
  "reddit.",
  "quora.",
  "pinterest.",
  "beyondchats.com"
];

function isBlocked(url) {
  return BLOCKED_DOMAINS.some(domain => url.includes(domain));
}

function looksLikeArticle(url) {
  return url.split("/").length > 4;
}

export async function searchRelatedArticles(title) {
  if (!process.env.SERP_API_KEY) {
    throw new Error("SERP_API_KEY is not defined");
  }

  const result = await getJson({
    engine: "google",
    q: title,
    api_key: process.env.SERP_API_KEY
  });

  const organic = result?.organic_results || [];

  return organic
    .map(r => r.link)
    .filter(
      link =>
        typeof link === "string" &&
        link.startsWith("http") &&
        !isBlocked(link) &&
        looksLikeArticle(link)
    )
    .slice(0, 2);
}
