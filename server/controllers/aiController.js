import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import {
  generateQuizHelper,
  generatePerformanceReviewHelper,
} from "../helpers/aiHelper.js";

export const generateQuizEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  if (user.limits.generationsRemaining <= 0) {
    return res.status(403).json({
      message: "Daily generation limit reached. Please upgrade your tier.",
    });
  }

  const quizData = await generateQuizHelper(req.body, user);

  user.limits.generationsRemaining -= 1;
  await user.save();

  res.status(200).json(quizData);
});

export const generateReviewEndpoint = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  const { quizzes } = req.body;

  const reviewText = await generatePerformanceReviewHelper(user, quizzes);

  res.status(200).json({ review: reviewText });
});
