import express from "express";
const router = express.Router();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import { TIER_LIMITS } from "../config/constants.js";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "../helpers/emailHelper.js";
import { createSession } from "../helpers/sessionHelper.js";
import {
  exchangeCodeForToken,
  getOAuthUserInfo,
  findOrCreateOAuthUser,
} from "../helpers/oauthHelper.js";
import { generateUniqueUsername } from "../helpers/usernameHelper.js";
import { mergeDuplicateUsers } from "../helpers/mergeUsers.js";
import protect from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET;

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const defaultTier = "Free";
    const limits = TIER_LIMITS[defaultTier];

    const normalizedEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = Date.now() + 30 * 60 * 1000; // 30 minutes from now

    // Generate random unique username
    const username = await generateUniqueUsername(name);

    const user = await User.create({
      name,
      username,
      email: normalizedEmail,
      picture: null, // Explicitly null to trigger auto-generated avatar
      password: hashedPassword,
      passwordIsUserSet: true, // User set their own password during signup
      tier: defaultTier,
      limits,
      isVerified: false,
      verificationCode,
      verificationCodeExpires: codeExpires,
    });

    // Emit real-time event for new user signup (for admin dashboard)
    if (req.app.locals.io) {
      req.app.locals.io.emit("newUserSignup", {
        userId: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      });
    }

    // Send verification email in background (non-blocking)
    sendVerificationEmail(email, verificationCode).catch(() => {});

    res.status(201).json({
      message:
        "Registration successful! Please check your email for the verification code.",
      userId: user._id,
      email: user.email,
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first.",
        needsVerification: true,
        userId: user._id,
      });
    }

    // Check if user has a password to compare against
    if (!user.password) {
      return res.status(401).json({
        message:
          "This account was created with OAuth. Please sign in with Google or GitHub, or set a password in settings.",
        isOAuthAccount: true,
      });
    }

    // Compare password (works for both regular users and OAuth users with password)
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Check if user has connected OAuth accounts
      if (user.connectedAccounts) {
        const connectedObj = user.connectedAccounts.toObject
          ? user.connectedAccounts.toObject()
          : user.connectedAccounts;
        const providers = Object.keys(connectedObj)
          .filter((key) => ["google", "github"].includes(key))
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" or ");

        if (providers) {
          return res.status(401).json({
            message: `Invalid credentials. You registered with ${providers}. Please use that instead or check your password.`,
          });
        }
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create new session via helper
    const session = createSession(req, user);

    // New session created for user; session saved

    await user.save();

    // Trigger merge of duplicates (if any) in background
    mergeDuplicateUsers().catch(console.error);

    // Sign token with session id so per-session logout can be enforced
    const sessionId = session._id;
    const token = jwt.sign({ id: user._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
        connectedAccounts: user.connectedAccounts,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  })
);

// Change full name (display name) - top-level route
router.post(
  "/change-fullname",
  protect,
  asyncHandler(async (req, res) => {
    const { newFullName } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!newFullName || newFullName.trim() === "") {
      return res.status(400).json({ message: "Full name cannot be empty" });
    }

    if (newFullName.length < 6) {
      return res
        .status(400)
        .json({ message: "Full name must be at least 6 characters" });
    }

    // Prevent full name being identical to username
    if (user.username && newFullName === user.username) {
      return res
        .status(400)
        .json({ message: "Full name cannot be the same as username" });
    }

    // Check if full name already exists on another user
    const existing = await User.findOne({ name: newFullName }).lean();
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(400).json({ message: "Full name already taken" });
    }

    user.name = newFullName;
    await user.save();

    res.status(200).json({
      message: "Full name updated",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  })
);

// Update profile picture
router.post("/update-picture", protect, async (req, res) => {
  const { picture } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow clearing the picture (set to null)
    if (picture === null || picture === "") {
      user.picture = null;
      await user.save();
      return res.status(200).json({
        message: "Profile picture removed",
        user: {
          id: user._id,
          name: user.name,
          picture: null,
        },
      });
    }

    // Validate base64 image or URL
    if (typeof picture !== "string") {
      return res.status(400).json({ message: "Invalid picture format" });
    }

    // Check if it's a base64 image
    if (picture.startsWith("data:image/")) {
      // Validate size (max 2MB for base64)
      const base64Size = (picture.length * 3) / 4;
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (base64Size > maxSize) {
        return res.status(400).json({
          message: "Image too large. Maximum size is 2MB.",
        });
      }

      // Validate image type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const mimeMatch = picture.match(/data:(image\/[a-z]+);base64,/);
      if (!mimeMatch || !validTypes.includes(mimeMatch[1])) {
        return res.status(400).json({
          message: "Invalid image type. Use JPEG, PNG, GIF, or WebP.",
        });
      }
    } else if (
      picture.startsWith("http://") ||
      picture.startsWith("https://")
    ) {
      // It's a URL - just validate it's a reasonable length
      if (picture.length > 2048) {
        return res.status(400).json({ message: "URL too long" });
      }
    } else {
      return res.status(400).json({ message: "Invalid picture format" });
    }

    user.picture = picture;
    await user.save();

    res.status(200).json({
      message: "Profile picture updated",
      user: {
        id: user._id,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error updating picture" });
  }
});

// Confirm password for sensitive operations
router.post("/confirm-password", protect, async (req, res) => {
  const { password } = req.body;
  if (!password || password.trim() === "") {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await User.findById(req.userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "No password set for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json({ message: "Password confirmed" });
  } catch {
    // Server error
    return res.status(500).json({ message: "Server error" });
  }
});

// Verify email with code
router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+verificationCode +verificationCodeExpires"
    );

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

    // Create new session via helper
    const session = createSession(req, user);

    await user.save();

    const sessionId = session._id;
    const token = jwt.sign({ id: user._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Email verified successfully!",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  })
);

// Resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

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

    // Send new code in background (non-blocking)
    sendVerificationEmail(email, verificationCode).catch(() => {});

    res.status(200).json({
      message: "Verification code sent to your email",
    });
  } catch (err) {
    // Server error
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.post("/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has set a password, verify current password
    // OAuth users with unset passwords don't need verification
    if (user.passwordIsUserSet) {
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
    user.passwordIsUserSet = true; // Mark password as user-set
    await user.save();

    res.status(200).json({
      message: "Password changed successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        stats: user.stats,
        limits: user.limits,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Change username
// Check username availability (public)
router.get("/check-username", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username is required" });
    }

    // Basic validation to short-circuit invalid usernames
    if (username.length < 6 || /\s/.test(username) || /[A-Z]/.test(username)) {
      return res.status(200).json({ available: false });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(200).json({ available: false });

    return res.status(200).json({ available: true });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/change-username", protect, async (req, res) => {
  const { newUsername } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate new username
    if (!newUsername || newUsername.trim() === "") {
      return res.status(400).json({ message: "Username cannot be empty" });
    }

    if (newUsername.length < 6) {
      return res
        .status(400)
        .json({ message: "Username must be at least 6 characters" });
    }

    // Check for spaces
    if (/\s/.test(newUsername)) {
      return res
        .status(400)
        .json({ message: "Username cannot contain spaces" });
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(newUsername)) {
      return res
        .status(400)
        .json({ message: "Username cannot contain uppercase letters" });
    }

    // Check if username is the same as current
    if (newUsername === user.username) {
      return res.status(400).json({
        message: "New username must be different from current username",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Prevent username matching full name
    if (newUsername === user.name) {
      return res
        .status(400)
        .json({ message: "Username cannot be the same as full name" });
    }

    user.username = newUsername;
    await user.save();

    res.status(200).json({
      message: "Username changed successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch {
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
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Get active sessions
router.get(
  "/sessions",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId, "sessions").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user's actual sessions
    const sessions = (user.sessions || []).map((session) => ({
      _id: session._id,
      id: session._id,
      deviceName: session.deviceName || "Unknown Device",
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive,
      isCurrent: session.isCurrent || false,
    }));

    res.status(200).json({ sessions });
  })
);

// Logout from specific session
router.delete("/sessions/:sessionId/logout", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the session from user's sessions array
    const originalLength = user.sessions?.length || 0;
    if (user.sessions && Array.isArray(user.sessions)) {
      user.sessions = user.sessions.filter(
        (session) => String(session._id) !== String(sessionId)
      );
      const newLength = user.sessions.length;

      // Only save if something was actually removed
      if (originalLength !== newLength) {
        await user.save();

        const currentSessionDeleted =
          String(sessionId) === String(req.sessionId);

        res.status(200).json({
          message: "Session logout successful",
          sessionsRemaining: newLength,
          currentSessionDeleted,
        });
      } else {
        res.status(404).json({ message: "Session not found" });
      }
    } else {
      res.status(200).json({
        message: "Session logout successful",
        sessionsRemaining: 0,
      });
    }
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Logout from all devices
router.post("/logout-all", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear all sessions
    user.sessions = [];
    await user.save();

    res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch {
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
  } catch {
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

    // Find or create user (this also links OAuth accounts)
    const user = await findOrCreateOAuthUser(User, oauthUser);

    // Refresh user to get latest data
    const updatedUser = await User.findById(user._id);

    // Create new session via helper
    const session = createSession(req, updatedUser);

    await updatedUser.save();

    // Trigger merge of duplicates (if any) in background
    mergeDuplicateUsers().catch(console.error);

    // Refresh user to get latest data (in case merge happened)
    const finalUser = await User.findById(updatedUser._id);
    const useUser = finalUser || updatedUser;

    // Sign token with session id
    const sessionId = session._id;
    const token = jwt.sign({ id: useUser._id, sessionId }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "OAuth authentication successful",
      token,
      user: {
        id: useUser._id,
        email: useUser.email,
        name: useUser.name,
        picture: useUser.picture,
        tier: useUser.tier,
        stats: useUser.stats,
        limits: useUser.limits,
        connectedAccounts: useUser.connectedAccounts,
        passwordIsUserSet: useUser.passwordIsUserSet,
      },
    });
  } catch (err) {
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
      email: oauthUserData.email.toLowerCase().trim(),
      connectedAt: new Date(),
    };

    await user.save();

    res.status(200).json({
      message: `${provider} account linked successfully`,
      user: {
        id: user._id,
        email: user.email,
        connectedAccounts: user.connectedAccounts,
        passwordIsUserSet: user.passwordIsUserSet,
      },
    });
  } catch (err) {
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
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
