import axios from "axios";
import { load } from "cheerio";

export const scrapeFullPageHtml = async (url) => {
  const res = await axios.get(url);
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
};
