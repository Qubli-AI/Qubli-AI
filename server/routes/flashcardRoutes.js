import express from "express";
import asyncHandler from "express-async-handler";
const router = express.Router();

import Flashcard from "../models/Flashcard.js";
import protect from "../middleware/auth.js";

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    // Add pagination support to prevent loading too many flashcards at once
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 30);
    const skip = (page - 1) * limit;

    const flashcards = await Flashcard.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance when not modifying docs

    const total = await Flashcard.countDocuments({ userId: req.userId });

    res.status(200).json({
      flashcards,
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
  "/bulk",
  protect,
  asyncHandler(async (req, res) => {
    const cardsWithUser = req.body.map((card) => ({
      ...card,
      userId: req.userId,
      createdAt: Date.now(),
    }));
    const newCards = await Flashcard.insertMany(cardsWithUser);
    res.status(201).json(newCards);
  })
);

router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
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
  })
);

export default router;
