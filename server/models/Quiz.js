import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "MCQ",
      "Multiple Choice",
      "TrueFalse",
      "True/False",
      "ShortAnswer",
      "Short Answer",
      "FillInTheBlank",
      "Fill in the Blank",
      "Multiple Select",
      "Essay",
      "Long Answer",
    ],
    required: true,
  },
  options: [String],
  correctAnswer: { type: mongoose.Schema.Types.Mixed }, // String or Array (for MSQ)
  explanation: String,
  marks: { type: Number, default: 1 },
  // For user responses/grading
  userAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
});

const QuizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Exam Style"],
      default: "Medium",
    },

    // Strict subdocument array
    questions: [QuestionSchema],

    totalMarks: Number,
    examStyle: String,
    score: Number,
    timeSpentMinutes: { type: Number, default: 0 }, // Track time spent on quiz
    isActive: { type: Boolean, default: true, index: true }, // Index for filtering active quizzes
    isFlashcardSet: { type: Boolean, default: false }, // Track if flashcards are created for this quiz
    behavioralData: { type: mongoose.Schema.Types.Mixed, default: {} }, // Detailed question-level tracking
    createdAt: { type: Number, default: Date.now, index: true }, // Index for sorting by date
  },
  { collection: "quizzes" }
); // Explicit collection name

const Quiz = mongoose.model("Quiz", QuizSchema);

export default Quiz;
