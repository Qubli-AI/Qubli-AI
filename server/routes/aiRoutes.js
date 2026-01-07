import express from "express";
import {
  generateQuizEndpoint,
  generateReviewEndpoint,
  chatWithAIEndpoint,
} from "../controllers/aiController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// The user must be authenticated before accessing this route
router.route("/generate").post(protect, generateQuizEndpoint);
router.route("/review").post(protect, generateReviewEndpoint);
router.route("/chat").post(protect, chatWithAIEndpoint);

export default router;
