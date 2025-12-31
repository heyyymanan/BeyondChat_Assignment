import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    content: {
      type: String, // HTML content
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

export default mongoose.model("Article", articleSchema);
