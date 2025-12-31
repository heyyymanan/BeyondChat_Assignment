import Article from "../models/Article.model.js";
import UpdatedArticle from "../models/NewUpdatedArticles.js";
import { searchRelatedArticles } from "../scrapper/googleSearch.js";
import { scrapeFullPageHtml } from "../scrapper/googleArticle.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// const rewriteWithLLM = async (originalHtml, referenceHtmls) => {
//   const Original = originalHtml.slice(0, 12000);
//   const Refs = referenceHtmls
//     .map(h => h.slice(0, 12000))
//     .join("\n\n");

//   const prompt = `You are given raw HTML from multiple web pages.
//                   TASK:
//                   1 Identify and extract the main article content.,
//                   2 Ignore navigation, ads, sidebars, footers, and unrelated sections.,
//                   3 Rewrite the original article and make its formatting, content similar(with updated seo ranking keywords or new info accquired from the refrence articles) to the two new articles ,
//                   4 Use ONLY these tags: h2, h3, p, ul, ol, li. ,
//                   5 Do NOT include styles, scripts, branding, headers, or footers.,
//                   6 Output updated,rewritten & ONLY valid HTML. No explanations.,

//                   ORIGINAL ARTICLE HTML:
//                   ${Original}

//                   REFERENCE ARTICLE HTML:
//                   ${Refs}
//                   `;

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: prompt
//   });

//   return response.text?.trim() || "";
// };

// export const updateOldestArticlesFromGoogle = async (req, res) => {
//   try {
//     const articles = await Article.find()
//       .sort({ createdAt: 1 })
//       .limit(5);

//     if (!articles.length) {
//       return res.status(400).json({ message: "No articles found" });
//     }

//     const updatedArticles = [];

//     for (const article of articles) {
//       const exists = await UpdatedArticle.findOne({
//         originalArticleId: article._id
//       });
//       if (exists) continue;

//       const links = await searchRelatedArticles(article.title);
//       if (!links.length) continue;

//       const referenceHtmls = [];
//       for (const link of links) {
//         const html = await scrapeFullPageHtml(link);
//         if (html) referenceHtmls.push(html);
//       }

//       if (!referenceHtmls.length) continue;

//       const rewrittenHtml = await rewriteWithLLM(
//         article.content,
//         referenceHtmls
//       );

//       if (!rewrittenHtml) continue;

//       const updated = await UpdatedArticle.create({
//         originalArticleId: article._id,
//         title: article.title,
//         content: rewrittenHtml,
//         author: article.author,
//         references: links
//       });

//       updatedArticles.push(updated);
//     }

//     res.json({
//       success: true,
//       count: updatedArticles.length,
//       data: updatedArticles
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };



const rewriteWithLLM = async (originalHtml, referenceHtmls) => {
  console.log("🧠 rewriteWithLLM: started");

  try {
    const Original = originalHtml.slice(0, 12000);
    const Refs = referenceHtmls
      .map((h, i) => {
        console.log(`📄 Reference HTML [${i}] length:`, h.length);
        return h.slice(0, 12000);
      })
      .join("\n\n");

    console.log("✂️ Original HTML length after slice:", Original.length);

    const prompt = `
You are given raw HTML from multiple web pages.

TASK:
1 Identify and extract the main article content.
2 Ignore navigation, ads, sidebars, footers, and unrelated sections.
3 Rewrite the original article and make its formatting & content similar (with updated SEO keywords or new info acquired from reference articles).
4 Use ONLY these tags: h2, h3, p, ul, ol, li.
5 Do NOT include styles, scripts, branding, headers, or footers.
6 Output ONLY valid rewritten HTML. No explanations.

ORIGINAL ARTICLE HTML:
${Original}

REFERENCE ARTICLE HTML:
${Refs}
`;

    console.log("📤 Sending prompt to LLM");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const output = response.text?.trim() || "";

    console.log(
      output
        ? "✅ LLM rewrite successful, length:"
        : "❌ LLM returned empty response",
      output.length
    );

    return output;

  } catch (err) {
    console.error("🔥 rewriteWithLLM failed:", err.message);
    return "";
  }
};



export const updateOldestArticlesFromGoogle = async (req, res) => {
  console.log("🚀 updateOldestArticlesFromGoogle: started");

  try {
    const articles = await Article.find()
      .sort({ createdAt: 1 })
      .limit(5);

    console.log("📚 Articles fetched:", articles.length);

    if (!articles.length) {
      console.warn("⚠️ No articles found in DB");
      return res.status(400).json({ message: "No articles found" });
    }

    const updatedArticles = [];

    for (const article of articles) {
      console.log("\n🔍 Processing article:", article._id, "-", article.title);

      const exists = await UpdatedArticle.findOne({
        originalArticleId: article._id
      });

      if (exists) {
        console.log("⏭️ Already updated, skipping");
        continue;
      }

      console.log("🌐 Searching reference articles from Google");
      const links = await searchRelatedArticles(article.title);

      console.log("🔗 Reference links found:", links.length);

      if (!links.length) {
        console.warn("⚠️ No reference links found, skipping");
        continue;
      }

      const referenceHtmls = [];

      for (const link of links) {
        console.log("⬇️ Scraping:", link);
        try {
          const html = await scrapeFullPageHtml(link);
          if (html) {
            console.log("✅ Scraped HTML length:", html.length);
            referenceHtmls.push(html);
          } else {
            console.warn("⚠️ Empty HTML from:", link);
          }
        } catch (err) {
          console.error("❌ Scrape failed:", link, err.message);
        }
      }

      if (!referenceHtmls.length) {
        console.warn("⚠️ No usable reference HTMLs, skipping");
        continue;
      }

      console.log("✍️ Rewriting article with LLM");
      const rewrittenHtml = await rewriteWithLLM(
        article.content,
        referenceHtmls
      );

      if (!rewrittenHtml) {
        console.warn("⚠️ Rewritten HTML empty, skipping");
        continue;
      }

      const updated = await UpdatedArticle.create({
        originalArticleId: article._id,
        title: article.title,
        content: rewrittenHtml,
        author: article.author,
        references: links
      });

      console.log("💾 Updated article saved:", updated._id);
      updatedArticles.push(updated);
    }

    console.log("🎉 Update process completed. Total updated:", updatedArticles.length);

    res.json({
      success: true,
      count: updatedArticles.length,
      data: updatedArticles
    });

  } catch (err) {
    console.error("🔥 Controller crashed:", err);
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
