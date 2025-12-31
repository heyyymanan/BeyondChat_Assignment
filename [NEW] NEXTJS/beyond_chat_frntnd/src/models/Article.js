import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
  {
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

    sourceUrl: {
      type: String,
      required: true,
      unique: true
    },

    isUpdated: {
      type: Boolean,
      default: false
    },

    references: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.Article ||
  mongoose.model("Article", ArticleSchema);
