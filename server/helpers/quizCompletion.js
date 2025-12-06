import { generateAndSaveReview } from "../../src/services/geminiService.js";
import StorageService from "../../src/services/storageService.js";

const handleQuizCompletion = async (completedQuiz, user, navigate) => {
  if (!user || !navigate) {
    console.error("Missing user or navigation function.");
  }

  try {
    await StorageService.saveQuiz(completedQuiz);

    const updatedQuizzes = await StorageService.getQuizzes(user.id);

    await generateAndSaveReview(user, updatedQuizzes);

    navigate("/overview");
  } catch (error) {
    console.error("Quiz completion or review generation failed:", error);
    navigate("/overview?error=review_fail");
  }
};

export default handleQuizCompletion;
