/**
 * Checks if a new day has started since the last activity and resets daily limits.
 * @param {object} user - The Mongoose User document.
 * @param {object} TIER_LIMITS - The constant object defining tier limits.
 * @returns {Promise<object>} The updated User document.
 */

const checkDailyReset = async (user, TIER_LIMITS) => {
  const now = Date.now();
  const lastReset = new Date(user.limits.lastReset);
  const currentDate = new Date(now);
  const limits = TIER_LIMITS[user.tier];

  // If new day (check year/month/day), reset all
  if (lastReset.toDateString() !== currentDate.toDateString()) {
    user.limits.generationsRemaining = limits.dailyGenerations;
    user.limits.flashcardGenerationsRemaining =
      limits.dailyFlashcardGenerations;
    user.limits.pdfUploadsRemaining = limits.dailyPdfUploads;
    user.limits.pdfExportsRemaining = limits.dailyPdfExports;

    // Max limits should not change daily, but are set here for safety
    user.limits.maxQuestions = limits.maxQuestions;
    user.limits.maxMarks = limits.maxMarks;

    user.limits.lastReset = now; // Update the reset timestamp

    await user.save(); // Persist changes to the database
  }
  return user;
};

export default checkDailyReset;
