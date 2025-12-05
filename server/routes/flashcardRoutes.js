import express from "express";
const router = express.Router();

import Flashcard from "../models/Flashcard.js";
import protect from "../middleware/auth.js";

router.get("/", protect, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(flashcards);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flashcards." });
  }
});

router.post("/bulk", protect, async (req, res) => {
  try {
    const cardsWithUser = req.body.map((card) => ({
      ...card,
      userId: req.userId,
      createdAt: Date.now(),
    }));
    const newCards = await Flashcard.insertMany(cardsWithUser);
    res.status(201).json(newCards);
  } catch (error) {
    console.error("Bulk insert error:", error);
    res.status(400).json({ message: "Error saving flashcards." });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const card = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!card)
      return res
        .status(404)
        .json({ message: "Flashcard not found or unauthorized." });
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: "Error updating flashcard." });
  }
});

export default router;
