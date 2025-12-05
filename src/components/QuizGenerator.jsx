import React, { useState, useEffect } from "react";

import {
  Type,
  Upload,
  FileText,
  GraduationCap,
  Lock,
  Check,
  Layers,
  AlertCircle,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { generateQuiz } from "../services/geminiService.js";
import StorageService from "../services/storageService.js";
import { TIER_LIMITS, EXAM_STYLES } from "../../server/config/constants.js";
import SubscriptionModal from "./SubscriptionModal.jsx";

import {
  SubscriptionTier,
  Difficulty,
  QuestionType,
} from "../../server/config/types.js";

const QuizGenerator = ({ user, onGenerateSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mode, setMode] = useState("text");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [totalMarks, setTotalMarks] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState(["MCQ"]);
  const [examStyleId, setExamStyleId] = useState("standard");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [generateFlashcards, setGenerateFlashcards] = useState(false);

  const userMaxQuestions = TIER_LIMITS[user.tier].maxQuestions;
  const userMaxMarks = TIER_LIMITS[user.tier].maxMarks;

  useEffect(() => {
    setGenerateFlashcards(user.tier !== "Free");
  }, [user.tier]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) =>
      setFile({
        name: selectedFile.name,
        data: ev.target.result.split(",")[1],
        mime: selectedFile.type,
      });
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(selectedFile);
  };

  const toggleType = (type) => {
    if (selectedTypes.includes(type)) {
      // Prevent removing the last selected item
      if (selectedTypes.length === 1) return;

      // Remove normally
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      // Add the type
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleExamStyleSelect = (styleId, requiredTier) => {
    if (
      (requiredTier === "Basic" && user.tier === "Free") ||
      (requiredTier === "Pro" && user.tier !== "Pro")
    ) {
      setShowUpgradeModal(true);
      return;
    }
    setExamStyleId(styleId);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");

    if (questionCount > userMaxQuestions)
      return setError(`Max ${userMaxQuestions} questions allowed.`);

    if (totalMarks > userMaxMarks)
      return setError(`Max ${userMaxMarks} marks allowed.`);

    if (user.limits.generationsRemaining <= 0)
      return setError("Daily quiz limit reached.");
    if (generateFlashcards && user.limits.flashcardGenerationsRemaining <= 0)
      return setError("Daily flashcard limit reached.");
    if (
      mode === "pdf" &&
      user.tier !== "Pro" &&
      user.limits.pdfUploadsRemaining <= 0
    )
      return setError("Daily PDF upload limit reached.");
    if (selectedTypes.length === 0)
      return setError("Select at least one question type.");
    if (mode === "pdf" && !file) return setError("Upload a PDF file.");
    if (mode === "text" && !topic.trim()) return setError("Enter a topic.");

    setLoading(true);
    try {
      const fileData =
        mode === "pdf" && file
          ? { mimeType: file.mime, data: file.data }
          : undefined;
      const promptTopic =
        mode === "pdf" ? "the attached document content" : topic;
      const quiz = await generateQuiz(
        promptTopic,
        difficulty,
        questionCount,
        selectedTypes,
        totalMarks,
        examStyleId,
        fileData
      );
      quiz.userId = user.id;
      quiz.isFlashcardSet = generateFlashcards;

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:" + import.meta.env.VITE_SERVER_PORT + "/api/quizzes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...quiz,
            isFlashcardSet: generateFlashcards,
          }),
        }
      );
      const savedQuiz = await response.json();

      if (generateFlashcards) {
        const cards = quiz.questions.map((q) => ({
          id: `fc_${q._id}`,
          userId: user.id,
          quizId: savedQuiz._id,
          front: q.text,
          back: `${q.correctAnswer}\n\n${q.explanation}`,
          nextReview: Date.now(),
          interval: 0,
          repetition: 0,
          easeFactor: 2.5,
        }));
        StorageService.saveFlashcards(cards);
      }

      StorageService.decrementGeneration();
      if (generateFlashcards) StorageService.decrementFlashcardGeneration();
      if (mode === "pdf") StorageService.decrementPdfUpload();
      onGenerateSuccess();
      navigate(`/quiz/${savedQuiz._id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionCountChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > userMaxQuestions) val = userMaxQuestions;
    setQuestionCount(val);
  };

  const handleTotalMarksChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > userMaxMarks) val = userMaxMarks;
    setTotalMarks(val);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-textMain">Create New Quiz</h1>
        <div className="text-sm text-textMuted bg-surfaceHighlight px-3 py-1 rounded-full">
          {user.limits.generationsRemaining} generations left today
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-xl">
        {/* Mode Toggles */}
        <div className="flex p-1 bg-surfaceHighlight rounded-xl mb-8 w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === "text"
                ? "bg-white text-primary shadow-sm"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Type className="w-4 h-4" /> Manual Topic
          </button>
          <button
            type="button"
            onClick={() => setMode("pdf")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === "pdf"
                ? "bg-white text-primary shadow-sm"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-8">
          {/* Section 1: Content Source */}
          <div className="space-y-4">
            {mode === "text" ? (
              <div>
                <label className="block text-sm font-bold text-textMain mb-2">
                  Quiz Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quantum Physics, French Revolution, Organic Chemistry"
                  className="w-full p-4 bg-surfaceHighlight border border-border rounded-xl text-textMain focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-textMain mb-2">
                  Upload Study Material (PDF)
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-surfaceHighlight transition-colors relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-primary">
                      <FileText className="w-10 h-10 mb-2" />
                      <span className="font-bold">{file.name}</span>
                      <span className="text-xs text-textMuted mt-1">
                        Click to replace
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-textMuted">
                      <Upload className="w-10 h-10 mb-2" />
                      <span className="font-medium">
                        Drag & drop or click to upload
                      </span>
                      <span className="text-xs mt-1">PDF up to 10MB</span>
                    </div>
                  )}
                </div>
                {user.tier === SubscriptionTier.Free && (
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Free plan: {user.limits.pdfUploadsRemaining} PDF uploads
                    left today.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* Section 2: Exam Style Selector */}
          <div>
            <label className="block text-sm font-bold text-textMain mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Exam Board /
              Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXAM_STYLES.map((style) => {
                const isLocked =
                  (style.tier === SubscriptionTier.Basic &&
                    user.tier === SubscriptionTier.Free) ||
                  (style.tier === SubscriptionTier.Pro &&
                    user.tier !== SubscriptionTier.Pro);

                return (
                  <div
                    key={style.id}
                    onClick={() => handleExamStyleSelect(style.id, style.tier)}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between h-full ${
                      examStyleId === style.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white hover:border-primary/30"
                    } ${isLocked ? "opacity-70 bg-gray-50" : ""}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`font-bold text-sm ${
                            examStyleId === style.id
                              ? "text-primary"
                              : "text-textMain"
                          }`}
                        >
                          {style.label}
                        </h4>
                        {isLocked && (
                          <Lock className="w-4 h-4 text-textMuted" />
                        )}
                        {!isLocked && examStyleId === style.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">
                        {style.description}
                      </p>
                    </div>

                    {isLocked && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-50 px-2 py-1 rounded w-fit">
                        {style.tier} Plan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* Section 3: Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Difficulty
              </label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-3 bg-surfaceHighlight border border-border rounded-xl text-textMain outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  {Object.values(Difficulty).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Number of Questions{" "}
                <span className="text-xs font-normal text-textMuted">
                  (Max: {userMaxQuestions})
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={userMaxQuestions}
                  value={questionCount}
                  onChange={handleQuestionCountChange}
                  className="w-full p-3 bg-surfaceHighlight border border-border rounded-xl text-textMain outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Total Marks{" "}
                <span className="text-xs font-normal text-textMuted">
                  (Max: {userMaxMarks})
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={userMaxMarks}
                  value={totalMarks}
                  onChange={handleTotalMarksChange}
                  className="w-full p-3 bg-surfaceHighlight border border-border rounded-xl text-textMain outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">
                Question Types
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(QuestionType).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      selectedTypes.includes(type)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white border-border text-textMuted hover:border-primary/50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flashcard Toggle */}
          <div className="p-4 bg-surfaceHighlight rounded-xl flex items-center justify-between border border-border">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  generateFlashcards
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-1">
                  <h4 className="font-bold text-sm text-textMain">
                    Generate Flashcards
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      user.limits.flashcardGenerationsRemaining > 0
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}
                  >
                    {user.limits.flashcardGenerationsRemaining} left
                  </span>
                </div>
                <p className="text-xs text-textMuted">
                  Create a study set automatically
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGenerateFlashcards(!generateFlashcards)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                generateFlashcards ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  generateFlashcards ? "translate-x-3" : "translate-x-0"
                }`}
              ></span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || selectedTypes.length === 0}
            className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Generate Quiz
              </>
            )}
          </button>
        </form>
      </div>

      {showUpgradeModal && (
        <SubscriptionModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            onGenerateSuccess();
          }}
          currentTier={user.tier}
        />
      )}
    </div>
  );
};

export default QuizGenerator;
