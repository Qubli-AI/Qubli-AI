import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  Clock,
} from "lucide-react"; // DX: Added BarChart3 for empty table, Clock for date

import StorageService from "../services/storageService.js";
import { generatePerformanceReview } from "../services/geminiService.js";

// DX: Utility function for consistent date formatting
const formatQuizDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// DX: Utility function for consistent time formatting (for 'Last Updated')
const formatUpdateTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// DX: Simple component for rendering stat cards
const StatCard = ({
  icon: Icon,
  title,
  value,
  bgColorClass,
  textColorClass,
  diffClass,
}) => (
  <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 ${bgColorClass} ${textColorClass} rounded-xl`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
        {title}
      </p>
      <p
        className={` ${
          diffClass ? "text-xl" : "text-2xl"
        } font-bold text-textMain`}
      >
        {value}
      </p>
    </div>
  </div>
);

const Overview = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [aiReview, setAiReview] = useState("");
  const [loading, setLoading] = useState(false);

  // DX: Move heavy calculations into useMemo
  const { completedQuizzes, avgScore } = useMemo(() => {
    const completed = quizzes.filter((q) => q.score !== undefined);
    const totalScore = completed.reduce((acc, q) => acc + (q.score || 0), 0);
    const average = completed.length
      ? Math.round(totalScore / completed.length)
      : 0;
    return { completedQuizzes: completed, avgScore: average };
  }, [quizzes]);

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

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // DX: Simplified review formatting logic (still manual, but separated)
  const formatReviewText = (text) => {
    if (typeof text !== "string") text = String(text || "");

    // Handling lines for basic structure (UX: Awaiting better markdown renderer integration)
    return text.split("\n").map((line, idx) => {
      // Handle **bold**
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-textMain tracking-tight">
          Performance Overview
        </h1>
        <div className="text-sm text-textMuted bg-surface px-4 py-2 rounded-full border border-border shadow-sm flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Last Updated: {formatUpdateTime()}
        </div>
      </div>

      {/* DX: Using StatCard component */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Trophy}
          title="Quizzes Completed"
          value={completedQuizzes.length}
          bgColorClass="bg-blue-600/10" // Design: Standardized color
          textColorClass="text-blue-700"
          diffClass={false}
        />
        <StatCard
          icon={Target}
          title="Avg Score"
          value={avgScore ? avgScore + "%" : "N/A"}
          bgColorClass="bg-green-600/10" // Design: Standardized color
          textColorClass="text-green-700"
          diffClass={false}
        />
        <StatCard
          icon={Calendar}
          title="Joined Since"
          value={formatQuizDate(user.limits.lastReset)}
          bgColorClass="bg-purple-600/10" // Design: Standardized color
          textColorClass="text-purple-700"
          diffClass={true}
        />
      </div>

      <div
        className="p-8 rounded-3xl border border-indigo-100 shadow-lg relative overflow-hidden group"
        style={{ background: "linear-gradient(to right, #eef2ff, #eef2ff)" }}
      >
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
              // UX: Improved skeleton loader to better mimic text structure
              <div
                className="space-y-3 max-w-2xl opacity-50 pt-2"
                aria-live="polite"
                aria-label="Loading AI review"
              >
                <div className="h-4 bg-indigo-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-indigo-200 rounded w-11/12 animate-pulse"></div>
                <div className="h-4 bg-indigo-200 rounded w-4/6 animate-pulse"></div>
              </div>
            ) : (
              <div className="prose prose-indigo text-gray-700 text-lg leading-relaxed font-medium whitespace-pre-line">
                {completedQuizzes.length > 0 ? (
                  <>{formatReviewText(aiReview)}</>
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
          <h2 className="font-bold text-lg text-textMain">
            Recent History ({completedQuizzes.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-auto min-w-[600px]">
            <thead className="bg-surfaceHighlight text-textMuted font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 pl-6 w-60">Quiz Title</th>
                <th className="p-5 text-center w-30">Date Taken</th>
                <th className="p-5 text-center w-30">Difficulty</th>
                <th className="p-5 text-center w-30">Score</th>
                <th className="p-5 text-center w-30">Marks Obtained</th>
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
                        {truncateText(q.title, 50)}
                      </td>
                      <td className="p-5 text-textMuted text-center whitespace-nowrap">
                        {formatQuizDate(q.createdAt)}
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
                          className={`font-extrabold text-base ${
                            // UX: Increased font weight for emphasis
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
                            <span className="text-textMain font-bold text-lg">
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
                    {/* UX: Added icon to empty state */}
                    <BarChart3 className="w-6 h-6 mx-auto mb-3" />
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
