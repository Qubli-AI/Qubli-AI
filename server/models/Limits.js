import mongoose from "mongoose";

const LimitsSchema = new mongoose.Schema(
  {
    generationsRemaining: { type: Number, default: 7 },
    flashcardGenerationsRemaining: {
      type: Number,
      default: 3,
    },
    pdfUploadsRemaining: { type: Number, default: 3 },
    pdfExportsRemaining: { type: Number, default: 3 },
    lastReset: { type: Number, default: Date.now },
    maxQuestions: { type: Number, default: 5 },
    maxMarks: { type: Number, default: 25 },
  },
  { _id: false }
);

export default LimitsSchema;
