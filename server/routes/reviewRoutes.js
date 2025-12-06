import express from "express";
const router = express.Router();

import Review from "../models/Review.js";
import protect from "../middleware/auth.js";

router.post("/", protect, async (req, res) => {
  try {
    const newReview = new Review({ ...req.body, userId: req.userId });
    await newReview.save();
    res.status(201).json({ review: newReview });
  } catch (error) {
    console.error("Failed to save AI review:", error);
    res.status(500).json({ message: "Failed to save AI review." });
  }
});

router.get("/last", protect, async (req, res) => {
  try {
    const lastReview = await Review.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(1);

    res.status(200).json({ review: lastReview || null });
  } catch (error) {
    console.error("Failed to fetch last review:", error);
    res.status(500).json({ message: "Failed to fetch last review." });
  }
});

export default router;
