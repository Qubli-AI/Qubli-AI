import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";
import Review from "../models/Review.js";

/**
 * Merges duplicate user accounts found with the same email address.
 * Normalizes emails to lowercase before merging.
 * Transfers all data (quizzes, flashcards, reviews) to the primary account.
 */
export const mergeDuplicateUsers = async () => {
  console.log("Starting user merge process...");

  const users = await User.find({});
  const emailMap = new Map();

  // Group users by normalized email
  users.forEach((user) => {
    const email = user.email.toLowerCase().trim();
    if (!emailMap.has(email)) {
      emailMap.set(email, []);
    }
    emailMap.get(email).push(user);
  });

  let mergedCount = 0;

  for (const [email, userGroup] of emailMap.entries()) {
    if (userGroup.length > 1) {
      console.log(`Found ${userGroup.length} accounts for email: ${email}`);

      // Sort users to pick a primary one
      // Criteria: 1. Has password set, 2. Oldest created
      userGroup.sort((a, b) => {
        if (a.passwordIsUserSet && !b.passwordIsUserSet) return -1;
        if (!a.passwordIsUserSet && b.passwordIsUserSet) return 1;
        return a.createdAt - b.createdAt;
      });

      const primary = userGroup[0];
      const duplicates = userGroup.slice(1);

      console.log(`Primary account ID: ${primary._id}`);

      for (const duplicate of duplicates) {
        console.log(
          `Merging duplicate account ID: ${duplicate._id} into primary`
        );

        // Transfer Quizzes
        await Quiz.updateMany(
          { userId: duplicate._id },
          { $set: { userId: primary._id } }
        );

        // Transfer Flashcards
        await Flashcard.updateMany(
          { userId: duplicate._id },
          { $set: { userId: primary._id } }
        );

        // Transfer Reviews
        await Review.updateMany(
          { userId: duplicate._id },
          { $set: { userId: primary._id } }
        );

        // Merge connectedAccounts if primary doesn't have them
        if (duplicate.connectedAccounts) {
          const primaryAccounts = primary.connectedAccounts || new Map();
          const dupAccounts =
            duplicate.connectedAccounts instanceof Map
              ? duplicate.connectedAccounts
              : new Map(Object.entries(duplicate.connectedAccounts));

          for (const [provider, data] of dupAccounts.entries()) {
            if (!primaryAccounts.has(provider)) {
              primaryAccounts.set(provider, data);
            }
          }
          primary.connectedAccounts = primaryAccounts;
        }

        // Merge stats (simple sum for now)
        if (duplicate.stats) {
          primary.stats.quizzesTaken =
            (primary.stats.quizzesTaken || 0) +
            (duplicate.stats.quizzesTaken || 0);
          // For averageScore, we just keep the primary's or take a weighted average if we were fancy
        }

        // Merge other gamification fields
        primary.exp = (primary.exp || 0) + (duplicate.exp || 0);
        primary.totalExpEarned =
          (primary.totalExpEarned || 0) + (duplicate.totalExpEarned || 0);
        primary.quizzesCreated =
          (primary.quizzesCreated || 0) + (duplicate.quizzesCreated || 0);
        primary.flashcardsCreated =
          (primary.flashcardsCreated || 0) + (duplicate.flashcardsCreated || 0);

        // Delete the duplicate user
        await User.findByIdAndDelete(duplicate._id);
        mergedCount++;
      }

      await primary.save();
    }
  }

  console.log(
    `User merge process completed. Total duplicate accounts merged: ${mergedCount}`
  );
  return mergedCount;
};
