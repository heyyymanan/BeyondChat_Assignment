import dbConnect from "@/lib/db";
import Article from "@/models/Article";
import axios from "axios";
import { load } from "cheerio";
import { getOldestFiveArticles } from "@/lib/scrapers/beyondChatBlog";

export async function GET() {
  await dbConnect();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
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
          message: "📥 Old article scraping started"
        });

        const links = await getOldestFiveArticles();

        send({
          stage: "LINKS_FETCHED",
          message: `🔗 Found ${links.length} article links`
        });

        let inserted = 0;

        for (const link of links) {
          send({
            stage: "PROCESSING_ARTICLE",
            message: `🔍 Processing ${link}`
          });

          const exists = await Article.findOne({ sourceUrl: link });
          if (exists) {
            send({
              stage: "SKIPPED",
              type: "warn",
              message: "⏭️ Already exists, skipping"
            });
            continue;
          }

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

          if (!title || !content) {
            send({
              stage: "INVALID_CONTENT",
              type: "error",
              message: "❌ Missing title or content"
            });
            continue;
          }

          await Article.create({
            title,
            content,
            author,
            sourceUrl: link
          });

          inserted++;

          send({
            stage: "ARTICLE_SAVED",
            type: "success",
            message: "✅ Article saved to DB"
          });
        }

        send({
          stage: "COMPLETED",
          type: "success",
          message: `🎉 Scraping completed (${inserted} new articles)`
        });

        controller.close();
      } catch (err) {
        send({
          stage: "FATAL_ERROR",
          type: "error",
          message: err.message
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
