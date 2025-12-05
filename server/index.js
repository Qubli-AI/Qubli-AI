// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// 1. Packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// 2. Models
import User from "./models/User.js";

// 3. Middleware & Helpers
import checkDailyReset from "./middleware/limitReset.js";
import protect from "./middleware/auth.js";

// 4. Constants
import { TIER_LIMITS } from "./config/constants.js";

// 5. App setup
const app = express();
const PORT = process.env.VITE_SERVER_PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// 6. Routes
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";

if (isProduction) {
  console.log = () => {};
}

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose
      .connect(MONGODB_URI)
      .then(() => console.log("MongoDB Atlas Connected successfully! 🚀"))
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
      });

    // Get current user
    app.get("/api/users/me", protect, async (req, res) => {
      try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found." });

        const updatedUser = await checkDailyReset(user, TIER_LIMITS);
        res.status(200).json({ user: updatedUser });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error, Try Again!" });
      }
    });

    // Decrement Limits
    app.post("/api/limits/decrement/:type", protect, async (req, res) => {
      const { type } = req.params;
      let limitField;
      let success = false;
      let message = "Unknown limit type.";

      switch (type) {
        case "quiz":
          limitField = "limits.generationsRemaining";
          break;
        case "flashcard":
          limitField = "limits.flashcardGenerationsRemaining";
          break;
        case "pdfupload":
          limitField = "limits.pdfUploadsRemaining";
          break;
        case "pdfexport":
          limitField = "limits.pdfExportsRemaining";
          break;
        default:
          return res.status(400).json({ success: false, message });
      }

      try {
        const user = await User.findById(req.userId);
        if (!user)
          return res
            .status(404)
            .json({ success: false, message: "User not found." });

        const remaining = user.get(limitField);
        if (typeof remaining === "string" || remaining > 0) {
          if (typeof remaining === "number")
            user.set(limitField, remaining - 1);
          await user.save();
          success = true;
          message = "Limit successfully decremented.";
        } else {
          message = "Daily limit reached for this feature.";
        }

        res
          .status(200)
          .json({ success, message, remaining: user.get(limitField) });
      } catch (error) {
        console.error("Decrement limit error:", error);
        res.status(500).json({
          success: false,
          message: "Server error during limit decrement.",
        });
      }
    });

    // Upgrade Subscription
    app.post("/api/subscription/upgrade", protect, async (req, res) => {
      const { tier } = req.body;
      const newLimits = TIER_LIMITS[tier];

      if (!newLimits || tier === "free")
        return res.status(400).json({ message: "Invalid subscription tier." });

      try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.tier = tier;
        user.limits.generationsRemaining = newLimits.dailyGenerations;
        user.limits.flashcardGenerationsRemaining =
          newLimits.dailyFlashcardGenerations;
        user.limits.pdfUploadsRemaining = newLimits.dailyPdfUploads;
        user.limits.pdfExportsRemaining = newLimits.dailyPdfExports;
        user.limits.maxQuestions = newLimits.maxQuestions;
        user.limits.maxMarks = newLimits.maxMarks;
        user.limits.lastReset = Date.now();

        await user.save();

        res.status(200).json({
          message: `Successfully upgraded to ${tier} tier.`,
          user: { ...user.toObject(), password: undefined },
        });
      } catch (error) {
        console.error("Upgrade error:", error);
        res.status(500).json({ message: "Server error during upgrade." });
      }
    });

    app.use("/api/ai", aiRoutes);
    app.use("/api/quizzes", quizRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/flashcards", flashcardRoutes);

    // Start server
    app.listen(PORT, () =>
      console.log(
        `Server running in development mode on http://localhost:${PORT}`
      )
    );
  } catch (err) {
    console.error("❌ Server Not Started", err);
    process.exit(1);
  }
}

startServer();
