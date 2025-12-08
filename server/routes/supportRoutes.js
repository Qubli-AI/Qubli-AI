import express from "express";
const router = express.Router();

import User from "../models/User.js";
import protect from "../middleware/auth.js";

// Submit feedback
router.post("/feedback", protect, async (req, res) => {
  const { feedback } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ message: "Feedback cannot be empty" });
    }

    // In production, save to database or email service
    // For now, just log it
    console.log(`Feedback from ${user.email}: ${feedback}`);

    res.status(200).json({
      message: "Feedback submitted successfully. Thank you!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
