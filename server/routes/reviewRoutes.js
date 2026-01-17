import express from "express";
import asyncHandler from "express-async-handler";
const router = express.Router();

import Review from "../models/Review.js";
import protect from "../middleware/auth.js";

router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const newReview = new Review({ ...req.body, userId: req.userId });
    await newReview.save();
    res.status(201).json({ review: newReview });
  })
);

router.get(
  "/last",
  protect,
  asyncHandler(async (req, res) => {
    const lastReview = await Review.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean(); // Use lean() for better performance when not modifying docs

    res.status(200).json({ review: lastReview || null });
  })
);

export default router;
