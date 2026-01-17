import express from "express";
import {
  generateQuizEndpoint,
  generateReviewEndpoint,
  chatWithAIEndpoint,
  gradeAnswerEndpoint,
  generateDemoEndpoint,
} from "../controllers/aiController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// The user must be authenticated before accessing this route
router.route("/generate").post(protect, generateQuizEndpoint);
router.route("/review").post(protect, generateReviewEndpoint);
router.route("/chat").post(protect, chatWithAIEndpoint);
router.route("/grade").post(protect, gradeAnswerEndpoint);
router.route("/demo").post(generateDemoEndpoint);

export default router;
