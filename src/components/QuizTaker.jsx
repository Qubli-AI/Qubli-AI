import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import AssignmentIcon from "@mui/icons-material/Assignment";

import {
  Check,
  ArrowRight,
  ArrowLeft,
  Printer,
  Layers,
  Clock,
  HelpCircle,
  BarChart2,
  Play,
  ChevronRight,
  BookOpen,
  ChevronLeft,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import StorageService from "../services/storageService.js";
import { QuestionType } from "../../server/config/types.js";
import PrintView from "./PrintView.jsx";

const parseBoldText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};

const TrueFalseOptions = ["True", "False"];

const QuizIntroView = ({ quiz, startQuiz }) => (
  <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl text-center">
    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary dark:text-blue-400">
      <Layers className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-bold text-textMain mb-2">Ready to start?</h2>
    <p className="text-textMuted mb-8 max-w-md mx-auto">
      This quiz contains <strong>{quiz.questions.length}</strong> questions
      covering <strong>{truncateText(quiz.topic, 20)}</strong>. There is no time
      limit, but try to answer as accurately as possible.
    </p>

    <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <HelpCircle className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
        <div className="font-bold text-textMain">{quiz.questions.length}</div>
        <div className="text-xs text-textMuted">Questions</div>
      </div>
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <BarChart2 className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
        <div className="font-bold text-textMain">{quiz.totalMarks || "-"}</div>
        <div className="text-xs text-textMuted">Marks</div>
      </div>
      <div className="p-4 bg-surfaceHighlight rounded-xl">
        <Clock className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
        <div className="font-bold text-textMain">
          ~{Math.ceil(quiz.questions.length * 0.5)}m
        </div>
        <div className="text-xs text-textMuted">Est. Time</div>
      </div>
    </div>

    <div className="flex flex-col md:flex-row gap-4 justify-center">
      <button
        onClick={startQuiz}
        className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 point"
      >
        <Play className="w-5 h-5 fill-current" /> Start Quiz
      </button>
    </div>
  </div>
);

const QuizResultsView = ({
  quiz,
  quizFlashcards,
  navigate,
  manualCreateFlashcards,
  setActiveTab,
  isCreatingFlashcards,
}) => (
  <div className="space-y-6">
    {/* Summary Card */}
    <div className="bg-surface p-6 md:p-8 rounded-2xl border border-border shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="text-center md:text-left">
        <h2 className="text-xl font-bold text-textMain mb-1">
          Quiz Completed!
        </h2>
        <p className="text-textMuted">Here is how you performed.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
        <div className="text-center md:text-right">
          <div className="text-4xl font-bold text-primary dark:text-blue-400">
            {quiz.score}%
          </div>
          <p className="text-xs text-textMuted uppercase tracking-wide font-semibold">
            Final Score
          </p>
        </div>
        <div className="hidden sm:block h-12 w-px bg-border"></div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {quizFlashcards?.length === 0 || !quiz?.isFlashcardSet ? (
            <button
              onClick={manualCreateFlashcards}
              disabled={isCreatingFlashcards}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/80 dark:text-indigo-300 dark:hover:bg-indigo-900 flex items-center justify-center gap-2 text-sm font-semibold transition-colors border border-indigo-100 dark:border-indigo-700 point disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingFlashcards ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Flashcards</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" /> Create Flashcards
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("flashcards")}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-900 transition-colors point"
            >
              <BookOpen className="w-4 h-4" /> Study Flashcards
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Review Questions List */}
    <div className="space-y-6">
      {quiz.questions.map((q, idx) => (
        <div
          key={q.id}
          className={`p-6 rounded-xl border transition-all shadow-xl ${
            q.isCorrect
              ? "bg-green-100/70 border-green-300 hover:bg-green-100 dark:bg-green-900/70 dark:border-green-700 dark:hover:bg-green-900/80  "
              : "bg-red-100/70 border-red-300 hover:bg-red-100 dark:bg-red-900/70 dark:border-red-700 dark:hover:bg-red-900/80"
          }`}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3">
              <span
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  q.isCorrect
                    ? "bg-green-300 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-300 text-red-800 dark:bg-red-900 dark:text-red-300"
                }
`}
              >
                {idx + 1}
              </span>
              <h3 className="font-medium text-textMain pt-0.75">{q.text}</h3>
            </div>
            {q.marks && (
              <span
                className={`text-sm font-semibold bg-white/50 dark:bg-surfaceHighlight mt-0.75 px-2 py-1 rounded border border-black/5 ${
                  q.marks === 1 ? "min-w-18" : "min-w-20"
                } text-center`}
              >
                {q.marks} {q.marks === 1 ? "mark" : "marks"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-sm ml-0 md:ml-11">
            <div className="p-3 rounded-lg border border-border/50 bg-white dark:bg-surfaceHighlight">
              <span className="block text-xs text-textMuted mb-1 uppercase tracking-wide">
                Your Answer
              </span>
              <div
                className={
                  q.isCorrect
                    ? "text-green-700 font-medium dark:text-green-400"
                    : "text-red-700 font-medium dark:text-red-400"
                }
              >
                {q.userAnswer || "(No answer)"}
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-border/50 dark:bg-surfaceHighlight">
              <span className="block text-xs text-textMuted mb-1 uppercase tracking-wide">
                Correct Answer
              </span>
              <div className="text-green-700 dark:text-green-400 font-medium">
                {q.correctAnswer}
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-black/10 dark:border-white/20 text-sm text-textMuted ml-0 md:ml-11">
            <span className="font-semibold text-textMain">Explanation:</span>{" "}
            {q.explanation}
          </div>
        </div>
      ))}
    </div>

    <button
      onClick={() => navigate("/dashboard")}
      className="w-full py-4 bg-surface hover:bg-surfaceHighlight text-textMain rounded-xl font-bold transition-colors border border-border shadow-sm point"
    >
      Back to Dashboard
    </button>
  </div>
);

const StudyFlashcards = ({
  quizFlashcards,
  quiz,
  manualCreateFlashcards,
  isCreatingFlashcards,
  flashcardsResetKey,
}) => {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Clamp index when flashcards change (avoid out-of-range)
  useEffect(() => {
    if (!quizFlashcards || quizFlashcards.length === 0) {
      setCardIndex(0);
      setFlipped(false);
      return;
    }
    setCardIndex((idx) => Math.min(idx, quizFlashcards.length - 1));
  }, [quizFlashcards?.length]);

  // When a reset key changes (new flashcards created), force index back to 0 and show a tiny placeholder to avoid flashing a stale card
  useEffect(() => {
    if (flashcardsResetKey == null) return;
    if (!quizFlashcards || quizFlashcards.length === 0) return;

    setIsResetting(true);
    setCardIndex(0);
    setFlipped(false);

    const raf = requestAnimationFrame(() => setIsResetting(false));
    return () => cancelAnimationFrame(raf);
  }, [flashcardsResetKey, quizFlashcards?.length]);

  // Keyboard navigation: left/right/space. Ignore when typing in inputs.
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
      if (isEditable || !quizFlashcards?.length) return;

      if (e.code === "ArrowRight" || e.key === "ArrowRight") {
        e.preventDefault();
        setCardIndex((prev) => (prev + 1) % quizFlashcards.length);
      } else if (e.code === "ArrowLeft" || e.key === "ArrowLeft") {
        e.preventDefault();
        setCardIndex(
          (prev) => (prev - 1 + quizFlashcards.length) % quizFlashcards.length
        );
      } else if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizFlashcards?.length]);

  // Reset flip on card change
  useEffect(() => {
    setFlipped(false);
  }, [cardIndex]);

  if (isResetting) {
    return (
      <div className="text-center py-12 bg-surface rounded-2xl border border-border">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
        <div className="text-textMuted">Preparing flashcards...</div>
      </div>
    );
  }

  if (quizFlashcards?.length === 0 || !quiz?.isFlashcardSet) {
    return (
      <div className="text-center py-12 bg-surface rounded-2xl border border-border">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-textMain mb-2">
          No Flashcards Created
        </h3>
        <p className="text-textMuted mb-6">
          Flashcards were not generated for this quiz.
        </p>
        <button
          onClick={manualCreateFlashcards}
          disabled={isCreatingFlashcards}
          className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm point disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {isCreatingFlashcards ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Flashcards</span>
            </>
          ) : (
            "Generate Flashcards Now"
          )}
        </button>
      </div>
    );
  }

  const card = quizFlashcards[cardIndex];

  const nextCard = () => {
    if (!quizFlashcards?.length) return;
    setCardIndex((prev) => (prev + 1) % quizFlashcards.length);
  };

  const prevCard = () => {
    if (!quizFlashcards?.length) return;
    setCardIndex(
      (prev) => (prev - 1 + quizFlashcards.length) % quizFlashcards.length
    );
  };

  return (
    <div className="max-w-2xl mx-auto h-[65vh] flex flex-col">
      <div className="flex justify-between items-center mb-4 text-textMuted text-sm">
        <span>
          Card <strong>{cardIndex + 1}</strong> of{" "}
          <strong>{quizFlashcards.length}</strong>
        </span>
        <span className="text-textMuted">Tap card to flip</span>
      </div>

      <div className="flex-1 relative mb-8" style={{ perspective: "1000px" }}>
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-full h-full relative cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            transformOrigin: "center",
            willChange: "transform",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 350ms cubic-bezier(0.645, 0.045, 0.355, 1)",
            minHeight: "300px",
          }}
        >
          {/* Front - Question */}
          <div
            className="absolute inset-0 bg-surface border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-primary dark:text-blue-400 tracking-widest uppercase">
              Question
            </span>
            <div className="text-xl font-medium text-textMain overflow-y-auto max-h-full custom-scrollbar">
              {parseBoldText(card.front)}
            </div>
          </div>

          {/* Back - Answer */}
          <div
            className="absolute inset-0 bg-surface border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(0)",
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-secondary dark:text-indigo-300 tracking-widest uppercase">
              Answer
            </span>
            <div className="text-lg text-textMain overflow-y-auto max-h-full whitespace-pre-wrap custom-scrollbar">
              {parseBoldText(card.back)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          onClick={prevCard}
          className="flex-1 py-3 rounded-xl bg-surfaceHighlight hover:bg-surface border border-transparent hover:border-border transition-all font-medium text-textMain flex items-center justify-center gap-2 point"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={nextCard}
          className="flex-1 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2 point"
        >
          Next Card <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

const QuizTaker = ({ user, onComplete, onLimitUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [status, setStatus] = useState("loading");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("exam");
  const [quizFlashcards, setQuizFlashcards] = useState([]);
  const [isCreatingFlashcards, setIsCreatingFlashcards] = useState(false);
  // Increment this key to force remounting the StudyFlashcards component when new cards are created
  const [flashcardsResetKey, setFlashcardsResetKey] = useState(0);

  const isLast = quiz && currentIdx === quiz.questions.length - 1;

  useEffect(() => {
    if (!user) return;

    // If navigate state contains the saved quiz (from generator), use it directly
    if (
      location?.state?.quiz &&
      String(location.state.quiz._id || location.state.quiz.id) === String(id)
    ) {
      const q = location.state.quiz;
      (async () => {
        try {
          const allCards = (await StorageService.getFlashcards(user._id)) || [];
          const qId = q._id || q.id;
          const relevantCards = allCards.filter(
            (c) =>
              String(c.quizId) === String(qId) ||
              String(c.quizId) === String(q._id) ||
              String(c.quizId) === String(q.id)
          );
          const isFlashcardSet = relevantCards.length > 0;
          const updatedQuiz = { ...q, isFlashcardSet };

          setQuiz(updatedQuiz);
          setQuizFlashcards(relevantCards);
          setCurrentIdx(0);

          if (q.score !== undefined) {
            setStatus("completed");
            const prevAnswers = {};
            q.questions.forEach((ques) => {
              const qid = ques.id || ques._id;
              prevAnswers[qid] = ques.userAnswer || "";
            });
            setAnswers(prevAnswers);
          } else {
            // Always show the intro page; the user must click Start Quiz
            setStatus("intro");
          }
          setIsFetching(false);
        } catch (err) {
          // Hydration from nav state failed - fallback to fetch flow
        }
      })();
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let isMounted = true;
    let timeoutId = null;

    async function fetchQuiz() {
      try {
        const response = await StorageService.getQuizzes(user._id);

        // Handle both paginated and non-paginated responses
        const quizzes = response?.quizzes || response || [];

        // Use fallback pattern for quiz ID matching with string comparison
        const q = quizzes.find(
          (qq) => String(qq._id) === String(id) || String(qq.id) === String(id)
        );

        if (!q) {
          // If quiz not found and we haven't retried yet, retry after a short delay
          if (retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(fetchQuiz, 500);
            return;
          }
          if (isMounted) navigate("/dashboard");
          return;
        }

        // Fetch flashcards for this quiz
        const allCards = (await StorageService.getFlashcards(user._id)) || [];
        const qId = q._id || q.id;

        // Match flashcards using fallback pattern
        const relevantCards = allCards.filter(
          (c) =>
            String(c.quizId) === String(qId) ||
            String(c.quizId) === String(q._id) ||
            String(c.quizId) === String(q.id)
        );

        const isFlashcardSet = relevantCards.length > 0;
        const updatedQuiz = { ...q, isFlashcardSet };

        if (isMounted) {
          setQuiz(updatedQuiz);
          setQuizFlashcards(relevantCards);

          if (q.score !== undefined) {
            setStatus("completed");
            const prevAnswers = {};
            q.questions.forEach((ques) => {
              const qid = ques.id || ques._id;
              prevAnswers[qid] = ques.userAnswer || "";
            });
            setAnswers(prevAnswers);
          } else {
            setStatus("intro");
          }
          setIsFetching(false);
        }
      } catch (err) {
        // Failed to fetch quiz - navigate back to dashboard
        if (isMounted) {
          setIsFetching(false);
          navigate("/dashboard");
        }
      }
    }

    fetchQuiz();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, navigate, user, location?.state?.quiz]);

  if (isFetching || !quiz) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress sx={{ color: "#2563eb" }} />
      </div>
    );
  }

  const startQuiz = () => setStatus("active");

  const handleAnswer = (val) => {
    if (status === "completed" || !quiz) return;
    const qid = quiz.questions[currentIdx].id || quiz.questions[currentIdx]._id;
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  const calculateScore = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return 0;
    let correct = 0;
    quiz.questions.forEach((q) => {
      const qid = q.id || q._id;
      const userAns = answers[qid]?.toLowerCase().trim() || "";
      const correctAns = q.correctAnswer?.toLowerCase().trim() || "";
      if (userAns === correctAns) correct++;
      else if (q.type === "MCQ" && answers[qid] === q.correctAnswer) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting) return;
    const currentQId =
      quiz.questions[currentIdx].id || quiz.questions[currentIdx]._id;
    if (!answers[currentQId] || answers[currentQId].trim() === "") return;

    setIsSubmitting(true);
    try {
      const score = calculateScore();
      const updatedQuiz = {
        ...quiz,
        score,
        completedAt: Date.now(),
        isFlashcardSet: quiz.isFlashcardSet || false,
      };

      updatedQuiz.questions = updatedQuiz.questions.map((q) => {
        const qid = q.id || q._id; // Use consistent ID
        return {
          ...q,
          userAnswer: answers[qid] || "",
          isCorrect:
            answers[qid]?.toLowerCase().trim() ===
            q.correctAnswer?.toLowerCase().trim(),
        };
      });

      // Save and use server response if available
      const saved = await StorageService.saveQuiz(updatedQuiz);
      const finalQuiz =
        saved && (saved._id || saved.id)
          ? { ...updatedQuiz, ...saved }
          : updatedQuiz;
      // Replace the current history state so hydration uses the saved quiz and we avoid refetch races
      navigate(`/quiz/${id}`, { replace: true, state: { quiz: finalQuiz } });
      setQuiz(finalQuiz);
      setCurrentIdx(0);
      setStatus("completed");
      if (onComplete) onComplete();
    } catch (err) {
      // Failed to submit quiz - notify user
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    const currentQId =
      quiz.questions[currentIdx].id || quiz.questions[currentIdx]._id;
    if (!answers[currentQId] || answers[currentQId].trim() === "") return;
    setCurrentIdx((prev) => Math.min(quiz.questions.length - 1, prev + 1));
  };

  const handlePrint = () => {
    if (user.tier !== "Pro" && (user.limits?.pdfExportsRemaining ?? 0) <= 0) {
      alert(
        "You have reached your daily PDF export limit. Upgrade to Pro for more exports."
      );
      return;
    }

    if (user.tier !== "Pro") {
      const success = StorageService.decrementPdfExport();
      if (!success) return;
      onLimitUpdate();
    }

    setTimeout(() => window.print(), 100);
  };

  const manualCreateFlashcards = async () => {
    if (!quiz || !user) return;
    if (quiz.isFlashcardSet) {
      toast.info("Flashcards already created for this quiz.");
      return;
    }

    // Check quota for non-Pro users
    if (
      user.tier !== "Pro" &&
      (user.limits?.flashcardGenerationsRemaining ?? 0) <= 0
    ) {
      toast.error("You have reached your daily flashcard generation limit.");
      return;
    }

    setIsCreatingFlashcards(true);
    try {
      const quizIdKey = quiz._id;
      const cards = quiz.questions.map((q) => {
        const qid = q.id || q._id;
        return {
          id: `fc_${qid}`,
          userId: user._id,
          quizId: quizIdKey,
          front: q.text,
          back: `${q.correctAnswer}\n\n${
            q.explanation || "No explanation provided."
          }`,
          nextReview: Date.now(),
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
        };
      });

      await StorageService.saveFlashcards(cards);

      const updatedQuiz = { ...quiz, isFlashcardSet: true };
      const saved = await StorageService.saveQuiz(updatedQuiz);
      const finalQuiz =
        saved && (saved._id || saved.id)
          ? { ...updatedQuiz, ...saved }
          : updatedQuiz;

      // Decrement user's flashcard generation quota
      const success = await StorageService.decrementFlashcardGeneration();
      if (!success) {
        toast.error(
          "Failed to decrement flashcard quota. Please try again later."
        );
      }

      setQuiz(finalQuiz);
      setQuizFlashcards(cards);
      // Force StudyFlashcards to remount so it starts on the first card (avoids showing stale index)
      setFlashcardsResetKey((k) => k + 1);
      setActiveTab("flashcards");

      // Let parent know limits changed so UI updates
      if (onLimitUpdate) onLimitUpdate();
    } catch (err) {
      // Failed to create flashcards; inform user
      toast.error("Failed to create flashcards. Please try again.");
    } finally {
      setIsCreatingFlashcards(false);
    }
  };

  const currentQ = quiz.questions[currentIdx];
  const currentQId = currentQ?.id || currentQ?._id;
  const hasAnsweredCurrent =
    !!answers[currentQId] && answers[currentQId]?.trim() !== ""; // Added optional chaining

  const fullTitle = quiz.title;

  return (
    <>
      <PrintView quiz={quiz} />
      <div className="max-w-2xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
        {/* Common Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-textMuted hover:text-textMain flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surfaceHighlight point"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1
                className="text-2xl font-bold text-textMain truncate"
                title={fullTitle}
              >
                {fullTitle}
              </h1>
            </div>
            <div className="flex gap-2 mt-1 ml-10 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  quiz.difficulty === "Easy"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : quiz.difficulty === "Medium"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }
`}
              >
                {quiz.difficulty}
              </span>
              <span className="text-xs text-textMuted py-0.5 uppercase tracking-wider truncate max-w-37.5 border border-border px-2 rounded">
                {quiz.examStyle || "Standard"}
              </span>
              {quiz.totalMarks && (
                <span className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded font-bold">
                  Max Marks: {quiz.totalMarks}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handlePrint}
            disabled={
              status !== "completed" ||
              (user.tier !== "Pro" &&
                (user.limits?.pdfExportsRemaining ?? 0) <= 0)
            }
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors font-bold shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-[10px] point"
            title={
              status !== "completed"
                ? "Finish quiz to export"
                : `Export PDF (${user.limits?.pdfExportsRemaining} left)`
            }
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export Quiz</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        {/* --- TABS --- */}
        <div className="flex bg-surfaceHighlight p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab("exam")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 point ${
              activeTab === "exam"
                ? "bg-surface text-primary dark:text-blue-400 shadow-sm"
                : "text-textMuted hover:text-textMain/85"
            }`}
          >
            <AssignmentIcon sx={{ width: 20, height: 20 }} /> Quiz Mode
          </button>
          <button
            onClick={() => status === "completed" && setActiveTab("flashcards")}
            disabled={status !== "completed"}
            title={
              status !== "completed"
                ? "Complete the quiz to unlock flashcards"
                : ""
            }
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              status === "completed" ? "point" : "cursor-not-allowed"
            } ${
              activeTab === "flashcards"
                ? "bg-surface text-primary dark:text-blue-400 shadow-sm"
                : status !== "completed"
                ? "text-gray-500 dark:text-gray-400"
                : "text-textMuted hover:text-textMain/85"
            }`}
          >
            <Layers className="w-4 h-4" /> Flashcards
            {status !== "completed" && <Lock className="w-3 h-3" />}
          </button>
        </div>

        {/* --- CONTENT BASED ON TAB --- */}
        {activeTab === "flashcards" ? (
          <StudyFlashcards
            key={flashcardsResetKey}
            flashcardsResetKey={flashcardsResetKey}
            quizFlashcards={quizFlashcards}
            quiz={quiz}
            manualCreateFlashcards={manualCreateFlashcards}
            isCreatingFlashcards={isCreatingFlashcards}
          />
        ) : (
          <>
            {/* --- INTRO VIEW --- */}
            {status === "intro" && (
              <QuizIntroView quiz={quiz} startQuiz={startQuiz} />
            )}

            {/* --- RESULTS VIEW --- */}
            {status === "completed" && (
              <QuizResultsView
                quiz={quiz}
                quizFlashcards={quizFlashcards}
                navigate={navigate}
                manualCreateFlashcards={manualCreateFlashcards}
                setActiveTab={setActiveTab}
                isCreatingFlashcards={isCreatingFlashcards}
              />
            )}

            {/* --- QUIZ ACTIVE VIEW --- */}
            {status === "active" && (
              <div className="bg-surface p-6 md:p-10 rounded-2xl border border-border shadow-xl">
                {/* Progress Bar */}
                <div className="w-full bg-surfaceHighlight h-2 rounded-full mb-8">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentIdx + 1) / quiz.questions.length) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className="min-h-75 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-primary dark:text-blue-400 tracking-wide uppercase px-2 py-1 bg-primary/5 dark:bg-primary/10 rounded">
                      {currentQ.type}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-textMuted block">
                        Question {currentIdx + 1} of {quiz.questions.length}
                      </span>
                      {currentQ.marks && (
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                          {currentQ.marks} Marks
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl md:text-2xl font-medium text-textMain mb-8 leading-relaxed">
                    {currentQ.text}
                  </h2>

                  <div className="flex-1 space-y-3">
                    {currentQ.type === QuestionType.MCQ ||
                    currentQ.type === QuestionType.TrueFalse ? (
                      <div className="grid grid-cols-1 gap-3">
                        {(currentQ.type === QuestionType.TrueFalse
                          ? TrueFalseOptions
                          : currentQ.options
                        )?.map((opt, i) => (
                          <button
                            key={opt}
                            onClick={() => handleAnswer(opt)}
                            className={`p-4 text-left rounded-xl border transition-all cursor-pointer ${
                              answers[currentQId] === opt
                                ? "bg-primary/10 border-primary dark:border-blue-400 text-primary dark:text-blue-400 shadow-sm ring-1 ring-primary dark:ring-blue-400 font-semibold"
                                : "bg-surface border-border text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                            }`}
                          >
                            <span className="inline-block w-6 font-mono text-gray-400  dark:text-gray-300 mr-2 font-bold">
                              {currentQ.type === QuestionType.MCQ ||
                              currentQ.type === QuestionType.TrueFalse
                                ? String.fromCharCode(65 + i) + "."
                                : ""}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={answers[currentQId] || ""}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full min-h-37.5 p-4 bg-surfaceHighlight border border-border rounded-xl text-textMain resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() =>
                      setCurrentIdx((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentIdx === 0}
                    className="px-6 py-2 text-textMuted hover:text-textMain disabled:opacity-30 disabled:hover:text-textMuted point"
                  >
                    Previous
                  </button>

                  {isLast ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!hasAnsweredCurrent || isSubmitting}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          Submit Quiz <Check className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!hasAnsweredCurrent}
                      className="px-8 py-3 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                    >
                      Next Question <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default QuizTaker;
