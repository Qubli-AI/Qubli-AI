import { request } from "./api.js";
import StorageService from "./storageService.js";

/**
 * Generates a quiz by calling the secure backend endpoint.
 * The user's tier and authentication are handled automatically by the backend
 * using the JWT token passed by the 'request' helper.
 * * @param {string} topic
 * @param {string} difficulty
 * @param {number} questionCount
 * @param {string[]} types
 * @param {number} totalMarks
 * @param {string} [examStyleId="standard"]
 * @param {object} [fileData]
 * @returns {Promise<Quiz>} The generated Quiz object.
 */
export const generateQuiz = async (
  topic,
  difficulty,
  questionCount,
  types,
  totalMarks,
  examStyleId = "standard",
  fileData
) => {
  const payload = {
    topic,
    difficulty,
    questionCount,
    types,
    totalMarks,
    examStyleId,
    fileData,
  };

  // ✅ Call the secure server endpoint
  return request("/api/ai/generate", "POST", payload);
};

/**
 * Generates a performance review by calling the secure backend endpoint.
 * * @param {object} user - The client-side UserProfile (needed to pass user.name/tier to server).
 * @param {object[]} quizzes - Array of completed quiz data.
 * @returns {Promise<string>} The AI-generated review text.
 */
export const generatePerformanceReview = async (user, quizzes) => {
  const payload = {
    user: {
      name: user.name,
      tier: user.tier,
    },
    quizzes,
  };

  // Call the secure server endpoint
  return request("/api/ai/review", "POST", payload);
};

/**
 * Executes the full cycle: generates a new AI review and saves it to the DB.
 * This function is designed to be called when a quiz is COMPLETED.
 * @param {object} user - The current user object.
 * @param {object[]} updatedQuizzes - The full list of quizzes including the new one.
 * @returns {Promise<string>} The newly generated review text.
 */
export const generateAndSaveReview = async (user, updatedQuizzes) => {
  const result = await generatePerformanceReview(user, updatedQuizzes);
  const reviewText = result.review;

  if (!reviewText) {
    throw new Error("AI review generation returned empty text.");
  }

  await StorageService.saveReview(reviewText);

  return reviewText;
};
