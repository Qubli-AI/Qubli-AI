import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: false,
    }, // Optional link to source quiz
    front: { type: String, required: true },
    back: { type: String, required: true },
    lastReviewed: { type: Number, default: Date.now },
    createdAt: { type: Number, default: Date.now },
  },
  { collection: "flashcards" }
);

const Flashcard = mongoose.model("Flashcard", FlashcardSchema);

export default Flashcard;
