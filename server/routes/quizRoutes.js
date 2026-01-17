import express from "express";
import asyncHandler from "express-async-handler";
const router = express.Router();

import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";

import protect from "../middleware/auth.js";

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    // Add pagination support to prevent loading too many quizzes at once
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const quizzes = await Quiz.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance when not modifying docs

    const total = await Quiz.countDocuments({ userId: req.userId });

    res.status(200).json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const newQuiz = new Quiz({ ...req.body, userId: req.userId });
    await newQuiz.save();

    // Convert to plain object to ensure _id is properly serialized
    const savedQuizData = newQuiz.toObject();

    res.status(201).json(savedQuizData);
  })
);

router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!quiz)
      return res
        .status(404)
        .json({ message: "Quiz not found or unauthorized." });

    res.status(200).json(quiz);
  })
);

router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const result = await Quiz.deleteOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (result.deletedCount === 0)
      return res
        .status(404)
        .json({ message: "Quiz not found or unauthorized." });

    await Flashcard.deleteMany({
      quizId: req.params.id,
      userId: req.userId,
    });

    res.status(200).json({ message: "Quiz deleted successfully." });
  })
);

export default router;
