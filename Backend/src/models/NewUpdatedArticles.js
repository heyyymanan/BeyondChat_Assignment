import mongoose from "mongoose";

const updatedArticleSchema = new mongoose.Schema(
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

export default mongoose.model(
  "UpdatedArticle",
  updatedArticleSchema
);
