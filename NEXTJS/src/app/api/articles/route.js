import dbConnect from "@/lib/db";
import Article from "@/models/Article";
import UpdatedArticle from "@/models/UpdatedArticle";

export async function GET() {
  await dbConnect();

  try {
    const articles = await Article.find().sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: articles
    });
  } catch (err) {
    return Response.json(
      { message: err.message },
      { status: 500 }
    );
  }
}
