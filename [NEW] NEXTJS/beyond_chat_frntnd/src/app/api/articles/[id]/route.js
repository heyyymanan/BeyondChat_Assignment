import dbConnect from "@/lib/db";
import Article from "@/models/Article";

export async function GET(req, { params }) {
  await dbConnect();

  try {
    const article = await Article.findById(params.id);

    if (!article) {
      return Response.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: article
    });
  } catch (err) {
    return Response.json(
      { message: err.message },
      { status: 400 }
    );
  }
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
    const deleted = await Article.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json(
        { success: false, message: "Orignal article not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Orignal article deleted"
    });

  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}