import express from "express";
const router = express.Router();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { TIER_LIMITS } from "../config/constants.js";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "../helpers/emailHelper.js";

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const defaultTier = "Free";
  const limits = TIER_LIMITS[defaultTier];

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      tier: defaultTier,
      limits,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: codeExpires,
    });

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message:
        "Registration successful! Please check your email for the verification code.",
      userId: user._id,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first.",
        needsVerification: true,
        userId: user._id,
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Verify email with code
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if code is expired
    if (Date.now() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: "Verification code expired. Please register again.",
        codeExpired: true,
      });
    }

    // Check if code is correct
    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const codeExpires = Date.now() + 30 * 60 * 1000;

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = codeExpires;
    await user.save();

    // Send new code
    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      message: "Verification code sent to your email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
