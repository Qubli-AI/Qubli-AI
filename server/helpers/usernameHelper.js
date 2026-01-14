import User from "../models/User.js";

/**
 * Generate a unique random username based on full name
 * @param {string} fullName - The user's full name
 * @returns {Promise<string>} - A unique username
 */
export const generateUniqueUsername = async (fullName) => {
  // 1. Normalize name: lowercase, remove non-alphanumeric
  let baseName = fullName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 2. Ensure base availability
  // If name is too short or empty (e.g. just unicode chars removed), use "user"
  if (baseName.length < 3) {
    baseName = "user" + baseName;
  }

  // Cap base length to prevent overly long usernames (leave room for suffix)
  if (baseName.length > 20) {
    baseName = baseName.substring(0, 20);
  }

  let username;
  let isUnique = false;

  // 3. Loop until unique
  while (!isUnique) {
    // Generate 4-digit random suffix
    const suffix = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
    username = `${baseName}${suffix}`;

    // Ensure strict regex compliance (min 6 chars, no spaces/uppercase - already handled by cleaning)
    if (username.length < 6) {
      // Pad with more random numbers if too short
      username = `${baseName}${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Check availability
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return username;
};
