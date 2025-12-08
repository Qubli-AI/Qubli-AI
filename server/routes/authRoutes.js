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
import {
  exchangeCodeForToken,
  getOAuthUserInfo,
  findOrCreateOAuthUser,
} from "../helpers/oauthHelper.js";
import protect from "../middleware/auth.js";

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

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first.",
        needsVerification: true,
        userId: user._id,
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          "This account was created with OAuth. Please sign in with Google or GitHub.",
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

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
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

// Change password
router.post("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has a password, verify current password
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter and one digit",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete account
router.delete("/delete-account", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user
    await User.findByIdAndDelete(req.userId);

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get active sessions (mock - in production, you'd track actual sessions)
router.get("/sessions", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mock sessions data - in production, store actual session info in DB
    const sessions = [
      {
        id: "session_1",
        deviceName: "Current Device",
        browser: "Chrome",
        lastActive: new Date(),
      },
    ];

    res.status(200).json({ sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout from specific session
router.delete("/sessions/:sessionId/logout", protect, async (req, res) => {
  try {
    // In production, remove the session from the database
    // For now, just return success

    res.status(200).json({
      message: "Session logout successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Setup 2FA
router.post("/2fa/setup", protect, async (req, res) => {
  const { method } = req.body; // 'totp' or 'sms'

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["totp", "sms"].includes(method)) {
      return res.status(400).json({ message: "Invalid 2FA method" });
    }

    // Mock 2FA setup - in production, generate TOTP secret or send SMS verification
    const setupData = {
      method,
      status: "pending",
      message: `2FA setup via ${method.toUpperCase()} initiated. Follow the instructions to complete setup.`,
    };

    res.status(200).json(setupData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// OAuth callback handler
router.post("/oauth/callback", async (req, res) => {
  const { provider, code, redirectUri } = req.body;

  try {
    // Validate provider
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ message: "Invalid OAuth provider" });
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(provider, code, redirectUri);

    const oauthUser = await getOAuthUserInfo(provider, accessToken);

    // Find or create user
    const user = await findOrCreateOAuthUser(User, oauthUser);

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "OAuth authentication successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
        connectedAccounts: user.connectedAccounts,
        password: user.password,
      },
    });
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.status(500).json({
      message: "OAuth authentication failed",
      error: err.message,
    });
  }
});

// Link OAuth account to existing user
router.post("/oauth/link", protect, async (req, res) => {
  const { provider, code, redirectUri } = req.body;

  try {
    if (!["google", "github"].includes(provider)) {
      return res.status(400).json({ message: "Invalid OAuth provider" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(provider, code, redirectUri);

    // Get user info from OAuth provider
    const oauthUserData = await getOAuthUserInfo(provider, accessToken);

    // Link OAuth account
    if (!user.connectedAccounts) {
      user.connectedAccounts = {};
    }

    user.connectedAccounts[provider] = {
      id: oauthUserData.providerId,
      email: oauthUserData.email,
      connectedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
      message: `${provider} account linked successfully`,
      user: {
        id: user._id,
        email: user.email,
        connectedAccounts: user.connectedAccounts,
      },
    });
  } catch (err) {
    console.error("OAuth link error:", err);
    res
      .status(500)
      .json({ message: "Failed to link OAuth account", error: err.message });
  }
});

// Disconnect OAuth account
router.delete("/oauth/disconnect/:provider", protect, async (req, res) => {
  const { provider } = req.params;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.connectedAccounts && user.connectedAccounts[provider]) {
      delete user.connectedAccounts[provider];
      await user.save();

      res.status(200).json({
        message: `${provider} account disconnected successfully`,
      });
    } else {
      res.status(404).json({ message: "OAuth account not connected" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
