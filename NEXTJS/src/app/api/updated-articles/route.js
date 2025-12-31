import dbConnect from "@/lib/db";
import UpdatedArticle from "@/models/UpdatedArticle";

export async function GET() {
  await dbConnect();

  const articles = await UpdatedArticle.find()
    .sort({ createdAt: -1 })
    .populate("originalArticleId");

  return Response.json({
    success: true,
    data: articles
  });
}
