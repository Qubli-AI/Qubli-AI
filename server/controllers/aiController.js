import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import {
  generateQuizHelper,
  generatePerformanceReviewHelper,
  chatWithAIHelper,
  gradeAnswerHelper,
} from "../helpers/aiHelper.js";

export const generateQuizEndpoint = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.limits.generationsRemaining <= 0 && user.role !== "admin") {
      return res.status(403).json({
        message: "Monthly generation limit reached. Please upgrade your tier.",
      });
    }

    // Function to send progress updates
    const sendProgress = (stage, percentage, questionsGenerated = null) => {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: "progress",
            stage,
            percentage,
            questionsGenerated,
          })}\n\n`,
        );
      } catch (err) {
        console.error("Error writing progress:", err);
      }
    };

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const quizData = await generateQuizHelper(req.body, user, sendProgress);

    // Send final result
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        data: quizData,
      })}\n\n`,
    );

    // Only decrement limits for non-admin users
    if (user.role !== "admin") {
      user.limits.generationsRemaining -= 1;
    }
    await user.save();

    res.end();
  } catch (error) {
    console.error("Quiz generation error:", error);
    try {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: error.message || "Internal server error",
        })}\n\n`,
      );
    } catch (err) {
      console.error("Error writing error response:", err);
    }
    res.end();
  }
};

export const generateReviewEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { quizzes } = req.body;

  const reviewText = await generatePerformanceReviewHelper(user, quizzes);

  res.status(200).json({ review: reviewText });
});

export const chatWithAIEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { messages, context } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required." });
  }

  const reply = await chatWithAIHelper(user, messages, context);
  res.status(200).json({ reply });
});

export const generateDemoEndpoint = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Hardcoded "Demo User" - effectively free tier
    const demoUser = {
      _id: "demo",
      name: "Demo User",
      role: "user",
      tier: "Free",
      limits: { generationsRemaining: 1 }, // Virtual limit
    };

    // Hardcoded strict limits for demo
    const demoPayload = {
      topic,
      difficulty: "Easy",
      questionCount: 5,
      types: ["MCQ"],
      totalMarks: 5,
      examStyleId: "standard",
    };

    // Function to send progress updates (optional for demo, but good UX)
    const sendProgress = (stage, percentage, questionsGenerated = null) => {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: "progress",
            stage,
            percentage,
            questionsGenerated,
          })}\n\n`,
        );
      } catch (err) {
        console.error("Error writing progress:", err);
      }
    };

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const quizData = await generateQuizHelper(
      demoPayload,
      demoUser,
      sendProgress,
    );

    // Send final result
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        data: quizData,
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    console.error("Demo generation error:", error);
    try {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: error.message || "Internal server error",
        })}\n\n`,
      );
    } catch (err) {
      console.error("Error writing error response:", err);
    }
    res.end();
  }
};

export const gradeAnswerEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { question, userAnswer, topic } = req.body;

  if (!question || !question.text) {
    return res.status(400).json({ message: "Question object is required." });
  }

  const result = await gradeAnswerHelper(user, question, userAnswer, topic);
  res.status(200).json(result);
});
