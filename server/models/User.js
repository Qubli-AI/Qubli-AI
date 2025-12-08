import mongoose from "mongoose";
import LimitsSchema from "./Limits.js";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Make optional for OAuth users
    picture: { type: String }, // Profile picture URL
    tier: {
      type: String,
      enum: ["Free", "Basic", "Pro"],
      default: "Free",
    },

    // Email verification fields
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Number, default: null },

    // OAuth connected accounts
    connectedAccounts: {
      type: Map,
      of: {
        id: String,
        email: String,
        connectedAt: Date,
      },
      default: {},
    },

    // Two-Factor Authentication
    twoFAEnabled: { type: Boolean, default: false },
    twoFAMethod: {
      type: String,
      enum: ["totp", "sms", "none"],
      default: "none",
    }, // totp or sms
    twoFASecret: { type: String, default: null }, // Encrypted secret for TOTP
    twoFAPhone: { type: String, default: null }, // Phone number for SMS
    twoFABackupCodes: [{ type: String }], // Backup codes in case of lost device

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
