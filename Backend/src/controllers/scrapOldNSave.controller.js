import axios from "axios";
import { load } from "cheerio";
import Article from "../models/Article.model.js";
import { getOldestFiveArticles } from "../scrapper/beyondChatBlog.js";


// Scrapes the oldest 5 BeyondChats articles
// and stores them in the database.

export const fetchNSaveOld = async (req, res) => {
  try {
    const links = await getOldestFiveArticles();
    const inserted = [];

    for (const link of links) {
      // skip if already saved
      const exists = await Article.findOne({ sourceUrl: link });
      if (exists) continue;

      const page = await axios.get(link);
      const $ = load(page.data);

      const contentBlock = $('[data-id="b2a436b"]');
      contentBlock.find("script, style, iframe").remove();

      const content = contentBlock.html();
      const title = $("h1").first().text().trim();

      const author = $("span.elementor-post-info__item--type-author")
        .first()
        .text()
        .trim();

      if (!title || !content) continue;

      const article = await Article.create({
        title,
        content,
        author,
        sourceUrl: link
      });

      inserted.push(article);
    }

    res.status(201).json({
      success: true,
      count: inserted.length,
      data: inserted
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
