import axios from "axios";
import { load } from "cheerio";

/**
 * Returns the last page number of BeyondChats blogs
 */
async function getBlogLastPage() {
  const res = await axios.get("https://beyondchats.com/blogs/", {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BeyondChatBot/1.0)"
    }
  });

  const $ = load(res.data);
  const pageElements = $(".page-numbers");

  const pageNumbers = [];

  pageElements.each((_, el) => {
    const num = Number($(el).text().trim());
    if (!isNaN(num)) pageNumbers.push(num);
  });

  return Math.max(...pageNumbers);
}

/**
 * Returns all article links from a given page
 */
async function getArticleLinksFromPage(page) {
  const res = await axios.get(
    `https://beyondchats.com/blogs/page/${page}`,
    {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BeyondChatBot/1.0)"
      }
    }
  );

  const $ = load(res.data);
  const articleLinks = [];

  $(".entry-title a").each((_, el) => {
    const href = $(el).attr("href");
    if (href) articleLinks.push(href);
  });

  return articleLinks;
}

/**
 * Returns oldest 5 article links from BeyondChats
 */
export async function getOldestFiveArticles() {
  const lastPage = await getBlogLastPage();
  const lastPageLinks = await getArticleLinksFromPage(lastPage);

  const oldest = [];

  if (lastPageLinks.length >= 5) {
    return lastPageLinks.slice(-5);
  }

  oldest.push(...lastPageLinks);

  const prevPageLinks = await getArticleLinksFromPage(lastPage - 1);
  oldest.push(
    ...prevPageLinks.slice(-(5 - oldest.length))
  );

  return oldest;
}
