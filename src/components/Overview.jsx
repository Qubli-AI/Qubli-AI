import React, { useEffect, useState } from "react";
import { Sparkles, Trophy, Target, Calendar } from "lucide-react";

import StorageService from "../services/storageService.js";
import { generatePerformanceReview } from "../services/geminiService.js";

const Overview = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [aiReview, setAiReview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadQuizzes() {
      const userQuizzes = await StorageService.getQuizzes(user.id);
      setQuizzes(userQuizzes);

      if (userQuizzes.length > 0) {
        fetchAiReview(userQuizzes);
      }
    }

    loadQuizzes();
  }, [user.id]);

  const fetchAiReview = async (quizData) => {
    if (!quizData || quizData.length === 0) return;
    setLoading(true);
    try {
      const result = await generatePerformanceReview(user, quizData);
      setAiReview(result.review);
    } catch (e) {
      console.error(e);
      setAiReview("Could not generate review at this time.");
    } finally {
      setLoading(false);
    }
  };

  const formatReviewText = (text) => {
    if (typeof text !== "string") text = String(text || "");

    // Split into lines for bullets / newlines
    return text.split("\n").map((line, idx) => {
      // Handle **bold** inside the line
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="mb-2">
          {parts.map((part, i) =>
            (part.startsWith("**") || part.startsWith("*")) &&
            (part.endsWith("**") || part.endsWith("*")) ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  };

  const completedQuizzes = quizzes.filter((q) => q.score !== undefined);
  const totalScore = completedQuizzes.reduce(
    (acc, q) => acc + (q.score || 0),
    0
  );
  const avgScore = completedQuizzes.length
    ? Math.round(totalScore / completedQuizzes.length)
    : 0;

  const formattedDate = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-textMain tracking-tight">
          Performance Overview
        </h1>
        <div className="text-sm text-textMuted bg-surface px-4 py-2 rounded-full border border-border shadow-sm">
          Last Updated: {formattedDate}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
              Quizzes Completed
            </p>
            <p className="text-2xl font-bold text-textMain">
              {completedQuizzes.length}
            </p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
              Avg Score
            </p>
            <p className="text-2xl font-bold text-textMain">
              {avgScore ? avgScore + "%" : "N/A"}
            </p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
              Active Since
            </p>
            <p className="text-xl font-bold text-textMain">
              {new Date(user.limits.lastReset).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-lg relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 shrink-0">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-textMain mb-3 flex items-center gap-2">
              AI Performance Coach
              {loading && (
                <span className="text-xs font-normal text-indigo-600 animate-pulse">
                  Analyzing...
                </span>
              )}
            </h2>
            {loading ? (
              <div className="space-y-3 max-w-2xl opacity-50">
                <div className="h-4 bg-indigo-200 rounded w-full"></div>
                <div className="h-4 bg-indigo-200 rounded w-5/6"></div>
              </div>
            ) : (
              <div className="prose prose-indigo text-gray-700 text-lg leading-relaxed font-medium whitespace-pre-line">
                {completedQuizzes.length > 0 ? (
                  <p>{formatReviewText(aiReview)}</p>
                ) : (
                  <p>
                    Complete at least one quiz to unlock your personalized AI
                    assessment!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-lg text-textMain">Recent History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceHighlight text-textMuted font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 pl-6">Quiz Title</th>
                <th className="p-5">Date Taken</th>
                <th className="p-5 text-center">Difficulty</th>
                <th className="p-5 text-center">Score</th>
                <th className="p-5 text-center">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completedQuizzes
                .slice()
                .reverse()
                .map((q) => {
                  const obtainedMarks =
                    q.score !== undefined && q.totalMarks
                      ? Math.round((q.score / 100) * q.totalMarks)
                      : null;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50 transition-colors group cursor-default"
                    >
                      <td className="p-5 pl-6 font-semibold text-textMain group-hover:text-primary transition-colors">
                        {q.title}
                      </td>
                      <td className="p-5 text-textMuted">
                        <span className="hidden min-[1092px]:inline opacity-0">
                          -
                        </span>
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                            q.difficulty === "Easy"
                              ? "bg-green-100 text-green-700"
                              : q.difficulty === "Medium"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              q.difficulty === "Easy"
                                ? "bg-green-500"
                                : q.difficulty === "Medium"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                          ></span>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span
                          className={`font-bold ${
                            (q.score || 0) >= 80
                              ? "text-green-600"
                              : (q.score || 0) >= 50
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {q.score}%
                        </span>
                      </td>
                      <td className="p-5 font-medium">
                        {obtainedMarks !== null ? (
                          <div className="flex items-baseline gap-1 justify-center">
                            <span className="text-textMain font-bold text-base">
                              {obtainedMarks}
                            </span>
                            <span className="text-textMuted text-xs">
                              / {q.totalMarks}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              {completedQuizzes.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-textMuted">
                    No history available yet. Start a quiz to see your progress!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
