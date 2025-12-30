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

const isBlocked = (url) =>
  BLOCKED_DOMAINS.some(d => url.includes(d));

const looksLikeArticle = (url) =>
  url.split("/").length > 4;

export const searchRelatedArticles = async (title) => {
  const result = await getJson({
    engine: "google",
    q: title,
    api_key: process.env.SERP_API_KEY
  });

  const organic = result.organic_results || [];

  return organic
    .map(r => r.link)
    .filter(
      link =>
        link &&
        link.startsWith("http") &&
        !isBlocked(link) &&
        looksLikeArticle(link)
    )
    .slice(0, 2);
};
