import Article from "../models/Article.model.js";
import UpdatedArticle from "../models/NewUpdatedArticles.js";
import { searchRelatedArticles } from "../scrapper/googleSearch.js";
import { scrapeFullPageHtml } from "../scrapper/googleArticle.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const rewriteWithLLM = async (originalHtml, referenceHtmls) => {
  const safeOriginal = originalHtml.slice(0, 12000);
  const safeRefs = referenceHtmls
    .map(h => h.slice(0, 12000))
    .join("\n\n");

  const prompt = `You are given raw HTML from multiple web pages.

TASK:
- Identify and extract the main article content.
- Ignore navigation, ads, sidebars, footers, and unrelated sections.
- Rewrite the article in clean, readable HTML.
- Use ONLY these tags: h2, h3, p, ul, ol, li.
- Do NOT include styles, scripts, branding, headers, or footers.
- Output ONLY valid HTML. No explanations.

ORIGINAL ARTICLE HTML:
${safeOriginal}

REFERENCE ARTICLE HTML:
${safeRefs}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text?.trim() || "";
};

export const updateOldestArticlesFromGoogle = async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ createdAt: 1 })
      .limit(5);

    if (!articles.length) {
      return res.status(400).json({ message: "No articles found" });
    }

    const updatedArticles = [];

    for (const article of articles) {
      const exists = await UpdatedArticle.findOne({
        originalArticleId: article._id
      });
      if (exists) continue;

      const links = await searchRelatedArticles(article.title);
      if (!links.length) continue;

      const referenceHtmls = [];
      for (const link of links) {
        const html = await scrapeFullPageHtml(link);
        if (html) referenceHtmls.push(html);
      }

      if (!referenceHtmls.length) continue;

      const rewrittenHtml = await rewriteWithLLM(
        article.content,
        referenceHtmls
      );

      if (!rewrittenHtml) continue;

      const updated = await UpdatedArticle.create({
        originalArticleId: article._id,
        title: article.title,
        content: rewrittenHtml,
        author: article.author,
        references: links
      });

      updatedArticles.push(updated);
    }

    res.json({
      success: true,
      count: updatedArticles.length,
      data: updatedArticles
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUpdatedArticles = async (req, res) => {
  try {
    const articles = await UpdatedArticle.find()
      .sort({ createdAt: -1 })
      .populate("originalArticleId");

    res.json({
      success: true,
      data: articles
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUpdatedArticleById = async (req, res) => {
  try {
    const article = await UpdatedArticle.findById(req.params.id)
      .populate("originalArticleId");

    if (!article) {
      return res.status(404).json({ message: "Updated article not found" });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteUpdatedArticle = async (req, res) => {
  try {
    await UpdatedArticle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Updated article deleted"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
