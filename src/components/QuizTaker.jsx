import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

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
} from "lucide-react";

import StorageService from "../services/storageService.js";
import { QuestionType } from "../../server/config/types.js";
import PrintView from "./PrintView.jsx";

const QuizTaker = ({ user, onComplete, onLimitUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'intro' | 'active' | 'completed'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFetching, setIsFetching] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState("exam"); // 'exam' | 'flashcards'
  const [quizFlashcards, setQuizFlashcards] = useState([]);

  useEffect(() => {
    if (!user) return; // wait until user is loaded

    async function fetchQuiz() {
      try {
        const quizzes = (await StorageService.getQuizzes(user.id)) || [];
        const q = quizzes.find((q) => q._id === id);

        if (!q) {
          console.warn("Quiz not found:", id);
          navigate("/");
          return;
        }

        setQuiz(q);

        const allCards = (await StorageService.getFlashcards(user.id)) || [];
        const relevantCards = allCards.filter((c) => c.quizId === q.id);
        setQuizFlashcards(relevantCards);

        if (status === "loading") {
          if (q.score !== undefined) {
            setStatus("completed");
            const prevAnswers = {};
            q.questions.forEach((ques) => {
              prevAnswers[ques.id] = ques.userAnswer || "";
            });
            setAnswers(prevAnswers);
          } else {
            setStatus("intro");
          }
        }
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        navigate("/");
      } finally {
        setIsFetching(false);
      }
    }

    fetchQuiz();
  }, [id, navigate, user, status]);

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress sx={{ color: "#2563eb" }} />
      </div>
    );
  }

  const startQuiz = () => setStatus("active");

  const handleAnswer = (val) => {
    if (status === "completed" || !quiz) return;
    setAnswers((prev) => ({ ...prev, [quiz.questions[currentIdx].id]: val }));
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q) => {
      const userAns = answers[q.id]?.toLowerCase().trim();
      const correctAns = q.correctAnswer.toLowerCase().trim();
      if (userAns === correctAns) correct++;
      else if (q.type === "MCQ" && answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const handleSubmit = () => {
    if (!quiz) return;
    const currentQId = quiz.questions[currentIdx].id;
    if (!answers[currentQId] || answers[currentQId].trim() === "") return;

    const score = calculateScore();
    const updatedQuiz = {
      ...quiz,
      score,
      completedAt: Date.now(),
      isFlashcardSet: quiz.isFlashcardSet || false,
    };

    updatedQuiz.questions = updatedQuiz.questions.map((q) => ({
      ...q,
      userAnswer: answers[q.id] || "",
      isCorrect:
        answers[q.id]?.toLowerCase().trim() ===
        q.correctAnswer.toLowerCase().trim(),
    }));

    StorageService.saveQuiz(updatedQuiz);
    setQuiz(updatedQuiz);
    setStatus("completed");
    onComplete();
  };

  const handleNext = () => {
    if (!quiz) return;
    const currentQId = quiz.questions[currentIdx].id;
    if (!answers[currentQId] || answers[currentQId].trim() === "") return;
    setCurrentIdx((prev) => Math.min(quiz.questions.length - 1, prev + 1));
  };

  const handlePrint = () => {
    if (user.limits.pdfExportsRemaining <= 0) {
      alert(
        "You have reached your daily PDF export limit. Upgrade your plan for more exports."
      );
      return;
    }
    const success = StorageService.decrementPdfExport();
    if (success) {
      onLimitUpdate();
      setTimeout(() => window.print(), 100);
    }
  };

  const manualCreateFlashcards = () => {
    if (!quiz) return;
    const cards = quiz.questions.map((q) => ({
      id: `fc_${q.id}`,
      userId: user.id,
      quizId: quiz.id,
      front: q.text,
      back: `${q.correctAnswer}\n\n${q.explanation}`,
      nextReview: Date.now(),
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
    }));
    StorageService.saveFlashcards(cards);
    const updatedQuiz = { ...quiz, isFlashcardSet: true };
    setQuiz(updatedQuiz);
    StorageService.saveQuiz(updatedQuiz);
    setQuizFlashcards(cards);
    setActiveTab("flashcards");
  };

  const parseBoldText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const currentQ = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const hasAnsweredCurrent =
    !!answers[currentQ.id] && answers[currentQ.id].trim() !== "";

  const displayTitle =
    quiz.title.length > 40 ? quiz.title.substring(0, 40) + "..." : quiz.title;

  const StudyFlashcards = () => {
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    if (quizFlashcards.length === 0) {
      return (
        <div className="text-center py-12 bg-surface rounded-2xl border border-border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Generate Flashcards Now
          </button>
        </div>
      );
    }

    const card = quizFlashcards[cardIndex];

    const nextCard = () => {
      setFlipped(false);
      setCardIndex((prev) => (prev + 1) % quizFlashcards.length);
    };

    const prevCard = () => {
      setFlipped(false);
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
          <span>Tap card to flip</span>
        </div>
        <div className="flex-1 perspective-1000 relative mb-8">
          <div
            onClick={() => setFlipped(!flipped)}
            className={`w-full h-full relative cursor-pointer transition-transform duration-500 transform-style-3d ${
              flipped ? "rotate-y-180" : ""
            }`}
          >
            <div className="absolute inset-0 backface-hidden bg-white border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center">
              <span className="absolute top-4 left-4 text-xs font-bold text-primary tracking-widest uppercase">
                Question
              </span>
              <div className="text-xl font-medium text-textMain overflow-y-auto max-h-full custom-scrollbar">
                {parseBoldText(card.front)}
              </div>
            </div>
            <div className="absolute inset-0 backface-hidden bg-white border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center rotate-y-180">
              <span className="absolute top-4 left-4 text-xs font-bold text-secondary tracking-widest uppercase">
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
            className="flex-1 py-3 rounded-xl bg-surfaceHighlight hover:bg-white border border-transparent hover:border-border transition-all font-medium text-textMain flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={nextCard}
            className="flex-1 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all font-bold flex items-center justify-center gap-2"
          >
            Next Card <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <PrintView quiz={quiz} />
      <div className="max-w-3xl mx-auto no-print animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
        {/* Common Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate("/")}
                className="text-textMuted hover:text-textMain"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1
                className="text-2xl font-bold text-textMain truncate"
                title={quiz.title}
              >
                {displayTitle}
              </h1>
            </div>
            <div className="flex gap-2 mt-1 ml-6 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  quiz.difficulty === "Easy"
                    ? "bg-green-100 text-green-700"
                    : quiz.difficulty === "Medium"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {quiz.difficulty}
              </span>
              <span className="text-xs text-textMuted py-0.5 uppercase tracking-wider truncate max-w-[150px] border border-border px-2 rounded">
                {quiz.examStyle || "Standard"}
              </span>
              {quiz.totalMarks && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                  Max Marks: {quiz.totalMarks}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handlePrint}
            disabled={
              status !== "completed" || user.limits.pdfExportsRemaining <= 0
            }
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-bold shadow-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-[10px]"
            title={
              status !== "completed"
                ? "Finish quiz to export"
                : `Export PDF (${user.limits.pdfExportsRemaining} left)`
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
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "exam"
                ? "bg-white text-primary shadow-sm"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            Exam Mode
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
              activeTab === "flashcards"
                ? "bg-white text-primary shadow-sm"
                : status !== "completed"
                ? "text-gray-400 cursor-not-allowed opacity-60"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Layers className="w-4 h-4" /> Flashcards
            {status !== "completed" && <Lock className="w-3 h-3" />}
          </button>
        </div>

        {/* --- CONTENT BASED ON TAB --- */}
        {activeTab === "flashcards" ? (
          <StudyFlashcards />
        ) : (
          <>
            {/* --- INTRO VIEW --- */}
            {status === "intro" && (
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-xl text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                  <Layers className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-textMain mb-2">
                  Ready to start?
                </h2>
                <p className="text-textMuted mb-8 max-w-md mx-auto">
                  This quiz contains <strong>{quiz.questions.length}</strong>{" "}
                  questions covering <strong>{quiz.topic}</strong>. There is no
                  time limit, but try to answer as accurately as possible.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
                  <div className="p-4 bg-surfaceHighlight rounded-xl">
                    <HelpCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-bold text-textMain">
                      {quiz.questions.length}
                    </div>
                    <div className="text-xs text-textMuted">Questions</div>
                  </div>
                  <div className="p-4 bg-surfaceHighlight rounded-xl">
                    <BarChart2 className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-bold text-textMain">
                      {quiz.totalMarks || "-"}
                    </div>
                    <div className="text-xs text-textMuted">Marks</div>
                  </div>
                  <div className="p-4 bg-surfaceHighlight rounded-xl">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-bold text-textMain">
                      ~{Math.ceil(quiz.questions.length * 0.5)}m
                    </div>
                    <div className="text-xs text-textMuted">Est. Time</div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button
                    onClick={startQuiz}
                    className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" /> Start Quiz
                  </button>
                </div>
              </div>
            )}

            {/* --- RESULTS VIEW --- */}
            {status === "completed" && (
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
                      <div className="text-4xl font-bold text-primary">
                        {quiz.score}%
                      </div>
                      <p className="text-xs text-textMuted uppercase tracking-wide font-semibold">
                        Final Score
                      </p>
                    </div>
                    <div className="hidden sm:block h-12 w-px bg-border"></div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {quizFlashcards.length === 0 && !quiz.isFlashcardSet ? (
                        <button
                          onClick={manualCreateFlashcards}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 text-sm font-semibold transition-colors border border-indigo-100"
                        >
                          <Layers className="w-4 h-4" /> Create Flashcards
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab("flashcards")}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm font-bold shadow-md shadow-indigo-200 transition-colors"
                        >
                          <BookOpen className="w-4 h-4" /> Study Flashcards
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Questions List */}
                <div className="space-y-4">
                  {quiz.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`p-6 rounded-xl border transition-all ${
                        q.isCorrect
                          ? "bg-green-50/50 border-green-200 hover:bg-green-50"
                          : "bg-red-50/50 border-red-200 hover:bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex gap-3">
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              q.isCorrect
                                ? "bg-green-200 text-green-700"
                                : "bg-red-200 text-red-700"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h3 className="font-medium text-textMain pt-[3px]">
                            {q.text}
                          </h3>
                        </div>
                        {q.marks && (
                          <span className="text-xs font-semibold bg-white/50 mt-[3px] px-2 py-1 rounded border border-black/5 min-w-[65px]">
                            {q.marks} {q.marks === 1 ? "marks" : "marks"}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ml-0 md:ml-11">
                        <div className="p-3 bg-white/60 rounded-lg border border-border/50">
                          <span className="block text-xs text-textMuted mb-1 uppercase tracking-wide">
                            Your Answer
                          </span>
                          <div
                            className={
                              q.isCorrect
                                ? "text-green-700 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {q.userAnswer || "(No answer)"}
                          </div>
                        </div>
                        <div className="p-3 bg-white/60 rounded-lg border border-border/50">
                          <span className="block text-xs text-textMuted mb-1 uppercase tracking-wide">
                            Correct Answer
                          </span>
                          <div className="text-green-700 font-medium">
                            {q.correctAnswer}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-black/5 text-sm text-textMuted ml-0 md:ml-11">
                        <span className="font-semibold text-textMain">
                          Explanation:
                        </span>{" "}
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate("/")}
                  className="w-full py-4 bg-white hover:bg-surfaceHighlight text-textMain rounded-xl font-bold transition-colors border border-border shadow-sm"
                >
                  Back to Dashboard
                </button>
              </div>
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

                <div className="min-h-[300px] flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-primary tracking-wide uppercase px-2 py-1 bg-primary/5 rounded">
                      {currentQ.type}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-textMuted block">
                        Question {currentIdx + 1} of {quiz.questions.length}
                      </span>
                      {currentQ.marks && (
                        <span className="text-xs font-semibold text-gray-500">
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
                        {currentQ.type === QuestionType.TrueFalse
                          ? ["True", "False"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                className={`p-4 text-left rounded-xl border transition-all ${
                                  answers[currentQ.id] === opt
                                    ? "bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary"
                                    : "bg-white border-border text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                                }`}
                              >
                                {opt}
                              </button>
                            ))
                          : currentQ.options?.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className={`p-4 text-left rounded-xl border transition-all ${
                                  answers[currentQ.id] === opt
                                    ? "bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary"
                                    : "bg-white border-border text-textMuted hover:bg-surfaceHighlight hover:text-textMain"
                                }`}
                              >
                                <span className="inline-block w-6 font-mono text-gray-400 mr-2">
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                {opt}
                              </button>
                            ))}
                      </div>
                    ) : (
                      <textarea
                        value={answers[currentQ.id] || ""}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full h-32 p-4 bg-surfaceHighlight border border-border rounded-xl text-textMain resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
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
                    className="px-6 py-2 text-textMuted hover:text-textMain disabled:opacity-30 disabled:hover:text-textMuted"
                  >
                    Previous
                  </button>

                  {isLast ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!hasAnsweredCurrent}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      Submit Quiz <Check className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!hasAnsweredCurrent}
                      className="px-8 py-3 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
