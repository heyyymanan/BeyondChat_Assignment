import dbConnect from "@/lib/db";
import UpdatedArticle from "@/models/UpdatedArticle";

export async function GET(req, { params }) {
  await dbConnect();

  const article = await UpdatedArticle.findById(params.id)
    .populate("originalArticleId");

  if (!article) {
    return Response.json(
      { message: "Updated article not found" },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    data: article
  });
}


export async function DELETE(req, context) {
  await dbConnect();

  // ✅ UNWRAP params
  const { id } = await context.params;

  if (!id) {
    return Response.json(
      { success: false, message: "Missing article id" },
      { status: 400 }
    );
  }

  try {
    const deleted = await UpdatedArticle.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json(
        { success: false, message: "Updated article not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Updated article deleted"
    });

  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
