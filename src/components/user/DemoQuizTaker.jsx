import { useState, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, BookOpen, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const DemoQuizTaker = ({ quiz, onReset }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const { width, height } = useWindowSize();

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleOptionSelect = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsAnswered(true);

    if (selectedOption === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const calculatePercentage = () => {
    return Math.round((score / quiz.questions.length) * 100);
  };

  if (showResults) {
    return (
      <div className="max-w-xl mx-auto text-center animate-fade-in-up">
        {calculatePercentage() >= 70 && (
          <Confetti width={width} height={height} recycle={false} />
        )}
        <div className="bg-surface rounded-2xl p-8 border border-border shadow-lg-custom">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-textMain mb-2">
            Demo Complete!
          </h2>
          <p className="text-textMuted mb-6">
            You scored {score} out of {quiz.questions.length} (
            {calculatePercentage()}%)
          </p>

          <div className="bg-surfaceHighlight rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-lg text-textMain mb-2">
              Want more features?
            </h3>
            <ul className="space-y-3 text-sm text-textMuted">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Unlimited AI Quizzes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Save your progress & earn achievements</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Upload PDFs & YouTube videos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Detailed AI Analytics</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/signup"
              className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Sign Up for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={onReset}
              className="w-full py-3 bg-surfaceHighlight text-textMain font-semibold rounded-xl hover:bg-border transition-colors"
            >
              Try Another Topic (If Limit Allows)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain">{quiz.title}</h2>
          <p className="text-sm text-textMuted">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded bg-opacity-50 dark:bg-blue-900/30 dark:text-blue-400">
          Demo Mode
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm-custom">
        {/* Progress Bar */}
        <div className="h-1.5 bg-surfaceHighlight w-full">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
            }}
          />
        </div>

        <div className="p-6 md:p-8">
          <h3 className="text-lg font-medium text-textMain mb-6 leading-relaxed">
            {currentQuestion.text}
          </h3>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {currentQuestion.options.map((option, idx) => {
                let stateClass =
                  "border-border hover:border-primary/50 hover:bg-surfaceHighlight";

                if (isAnswered) {
                  if (option === currentQuestion.correctAnswer) {
                    stateClass =
                      "border-green-500 bg-green-50 dark:bg-green-900/20";
                  } else if (option === selectedOption) {
                    stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                  } else {
                    stateClass = "border-border opacity-50";
                  }
                } else if (selectedOption === option) {
                  stateClass =
                    "border-primary bg-primary/5 ring-1 ring-primary";
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${stateClass}`}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-textMain">{option}</div>
                      {isAnswered &&
                        option === currentQuestion.correctAnswer && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      {isAnswered &&
                        option === selectedOption &&
                        option !== currentQuestion.correctAnswer && (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-surfaceHighlight rounded-xl border border-border"
            >
              <h4 className="font-bold text-textMain mb-1">Explanation:</h4>
              <p className="text-textMuted text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}

          <div className="mt-8 flex justify-end">
            {!isAnswered ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedOption}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                  selectedOption
                    ? "bg-primary text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
                    : "bg-surfaceHighlight text-textMuted cursor-not-allowed"
                }`}
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                {currentQuestionIndex < quiz.questions.length - 1
                  ? "Next Question"
                  : "View Results"}{" "}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoQuizTaker;
