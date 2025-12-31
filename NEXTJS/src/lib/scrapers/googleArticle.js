import axios from "axios";
import { load } from "cheerio";

export async function scrapeFullPageHtml(url) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BeyondChatBot/1.0; +https://example.com)"
    }
  });

  const $ = load(res.data);

  // remove heavy junk
  $(
    "script, style, iframe, nav, footer, aside, noscript"
  ).remove();

  $("[class*='ad'], [id*='ad']").remove();
  $("[class*='comment']").remove();

  const bodyHtml = $("body").html();

  // safety trim (tokens)
  return bodyHtml ? bodyHtml.slice(0, 15000) : "";
}
