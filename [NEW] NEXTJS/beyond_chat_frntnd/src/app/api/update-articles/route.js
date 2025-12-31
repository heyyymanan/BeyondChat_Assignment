import dbConnect from "@/lib/db";
import Article from "@/models/Article";
import UpdatedArticle from "@/models/UpdatedArticle";
import { searchRelatedArticles } from "@/lib/scrapers/googleSearch";
import { scrapeFullPageHtml } from "@/lib/scrapers/googleArticle";
import { rewriteWithLLM } from "@/lib/rewriteWithLLM";

export async function GET() {
  await dbConnect();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {

      // ✅ STANDARDIZED SSE EMITTER
      const send = ({ stage, type = "info", message, ...rest }) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              timestamp: new Date().toISOString(),
              stage,
              type,
              message,
              ...rest
            })}\n\n`
          )
        );
      };

      try {
        send({
          stage: "STARTED",
          message: "🚀 AI update process started"
        });

        const articles = await Article.find()
          .sort({ createdAt: 1 })
          .limit(5);

        send({
          stage: "ARTICLES_FETCHED",
          message: `📚 Fetched ${articles.length} articles`,
          count: articles.length
        });

        for (const article of articles) {
          send({
            stage: "PROCESSING_ARTICLE",
            message: `🔍 Processing article: ${article.title}`,
            articleId: article._id
          });

          const exists = await UpdatedArticle.findOne({
            originalArticleId: article._id
          });

          if (exists) {
            send({
              stage: "SKIPPED_ALREADY_UPDATED",
              type: "warn",
              message: "⏭️ Already updated, skipping",
              articleId: article._id
            });
            continue;
          }

          send({
            stage: "SEARCHING_REFERENCES",
            message: "🌐 Searching reference articles"
          });

          const links = await searchRelatedArticles(article.title);

          if (!links.length) {
            send({
              stage: "ERROR",
              type: "error",
              message: "❌ No reference links found",
              articleId: article._id
            });
            continue;
          }

          send({
            stage: "SCRAPING_REFERENCES",
            message: `⬇️ Scraping ${links.length} reference pages`,
            count: links.length
          });

          const referenceHtmls = [];

          for (const link of links) {
            try {
              const html = await scrapeFullPageHtml(link);
              if (html) {
                referenceHtmls.push(html);
              } else {
                send({
                  stage: "EMPTY_HTML",
                  type: "warn",
                  message: `⚠️ Empty HTML from ${link}`
                });
              }
            } catch {
              send({
                stage: "SCRAPE_FAILED",
                type: "error",
                message: `❌ Failed to scrape ${link}`
              });
            }
          }

          if (!referenceHtmls.length) {
            send({
              stage: "ERROR",
              type: "error",
              message: "❌ No usable reference HTMLs",
              articleId: article._id
            });
            continue;
          }

          send({
            stage: "REWRITING_WITH_LLM",
            type: "ai",
            message: "🧠 Rewriting article using Gemini"
          });

          const rewrittenHtml = await rewriteWithLLM(
            article.content,
            referenceHtmls
          );

          if (!rewrittenHtml) {
            send({
              stage: "ERROR",
              type: "error",
              message: "❌ LLM returned empty response",
              articleId: article._id
            });
            continue;
          }

          await UpdatedArticle.create({
            originalArticleId: article._id,
            title: article.title,
            content: rewrittenHtml,
            author: article.author,
            references: links
          });

          send({
            stage: "ARTICLE_UPDATED",
            type: "success",
            message: "✅ Article updated successfully",
            articleId: article._id
          });
        }

        send({
          stage: "COMPLETED",
          type: "success",
          message: "🎉 AI update process completed"
        });

        controller.close();

      } catch (err) {
        send({
          stage: "FATAL_ERROR",
          type: "error",
          message: `🔥 Fatal error: ${err.message}`
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
