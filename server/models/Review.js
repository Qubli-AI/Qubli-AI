import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Number,
      default: Date.now,
    },
  },
  {
    collection: "reviews",
  }
);

const Review = mongoose.model("Review", ReviewSchema);

export default Review;
