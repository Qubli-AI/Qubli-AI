import mongoose from "mongoose";
import LimitsSchema from "./Limits.js";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Store hashed password
    tier: { type: String, enum: ["Free", "Basic", "Premium"], default: "Free" },

    // Embed the Limits Schema
    limits: { type: LimitsSchema, required: true, default: {} },

    stats: {
      quizzesTaken: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      streakDays: { type: Number, default: 0 },
      lastActive: { type: Number, default: Date.now },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
