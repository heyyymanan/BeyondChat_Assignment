import mongoose from "mongoose";

const UpdatedArticleSchema = new mongoose.Schema(
  {
    originalArticleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String,
      required: true
    },

    author: {
      type: String,
      trim: true
    },

    references: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.UpdatedArticle ||
  mongoose.model("UpdatedArticle", UpdatedArticleSchema);
