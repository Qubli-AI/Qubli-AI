import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import {
  Trophy,
  Target,
  Trash2,
  Zap,
  AlertTriangle,
  Search,
  Filter,
  BookOpen,
} from "lucide-react";

import StorageService from "../services/storageService.js";
import { Difficulty } from "../../server/config/types.js";

const Dashboard = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [stats, setStats] = useState({
    avgEasy: 0,
    avgMedium: 0,
    avgHard: 0,
    weakestTopic: "N/A",
    weakestType: "N/A",
  });

  useEffect(() => {
    if (user) {
      refreshQuizzes();
    }
  }, [user]);

  const refreshQuizzes = async () => {
    if (!user) return;
    try {
      const userQuizzes = await StorageService.getQuizzes(user._id); // <- await here
      setQuizzes(userQuizzes);
      calculateAdvancedStats(userQuizzes);
    } catch (err) {
      console.error("Failed to refresh quizzes:", err);
    }
  };

  const calculateAdvancedStats = (data) => {
    const completed = data.filter((q) => q.score !== undefined);
    if (completed.length === 0) return;

    const diffStats = {
      [Difficulty.Easy]: { total: 0, sum: 0 },
      [Difficulty.Medium]: { total: 0, sum: 0 },
      [Difficulty.Hard]: { total: 0, sum: 0 },
    };

    // Type Stats (removed explicit Record type)
    const typeStats = {};

    // Topic Stats (removed explicit Record type)
    const topicStats = {};

    completed.forEach((q) => {
      diffStats[q.difficulty].total++;
      diffStats[q.difficulty].sum += q.score || 0;

      const topic = q.topic.toLowerCase();
      if (!topicStats[topic]) topicStats[topic] = { total: 0, sum: 0 };
      topicStats[topic].total++;
      topicStats[topic].sum += q.score || 0;

      q.questions.forEach((ques) => {
        if (!typeStats[ques.type])
          typeStats[ques.type] = { total: 0, correct: 0 };
        typeStats[ques.type].total++;
        if (ques.isCorrect) typeStats[ques.type].correct++;
      });
    });

    // Weakest Topic
    let minTopicScore = 101;
    let weakTopic = "N/A";
    Object.entries(topicStats).forEach(([t, s]) => {
      const avg = s.sum / s.total;
      if (avg < minTopicScore) {
        minTopicScore = avg;
        weakTopic = t;
      }
    });

    // Weakest Type
    let minTypeScore = 1.1; // Percent
    let weakType = "N/A";
    Object.entries(typeStats).forEach(([t, s]) => {
      const avg = s.correct / s.total;
      if (avg < minTypeScore) {
        minTypeScore = avg;
        weakType = t;
      }
    });

    setStats({
      avgEasy: diffStats[Difficulty.Easy].total
        ? Math.round(
            diffStats[Difficulty.Easy].sum / diffStats[Difficulty.Easy].total
          )
        : 0,
      avgMedium: diffStats[Difficulty.Medium].total
        ? Math.round(
            diffStats[Difficulty.Medium].sum /
              diffStats[Difficulty.Medium].total
          )
        : 0,
      avgHard: diffStats[Difficulty.Hard].total
        ? Math.round(
            diffStats[Difficulty.Hard].sum / diffStats[Difficulty.Hard].total
          )
        : 0,
      weakestTopic: weakTopic.charAt(0).toUpperCase() + weakTopic.slice(1),
      weakestType: weakType,
    });
  };

  // Removed type annotations for event (e) and id
  const handleDelete = (e, id) => {
    // 1. Prevent bubbling immediately
    e.preventDefault();
    e.stopPropagation();

    // 2. Confirm
    if (
      !window.confirm(
        "Are you sure you want to delete this quiz? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      // 3. Perform delete in storage
      StorageService.deleteQuiz(id);

      // 4. Force a refresh from storage to ensure UI is in sync
      refreshQuizzes();
    } catch (error) {
      console.error("Delete failed", error);

      window.alert("Failed to delete quiz.");
    }
  };

  const difficultyData = [
    { name: "Easy", score: stats.avgEasy, fill: "#10b981" },
    { name: "Medium", score: stats.avgMedium, fill: "#f59e0b" },
    { name: "Hard", score: stats.avgHard, fill: "#ef4444" },
  ];

  const typeChartData = (() => {
    const typeMap = {};
    quizzes
      .filter((q) => q.score !== undefined)
      .forEach((q) => {
        q.questions.forEach((ques) => {
          if (!typeMap[ques.type])
            typeMap[ques.type] = { total: 0, correct: 0 };
          typeMap[ques.type].total++;
          if (ques.isCorrect) typeMap[ques.type].correct++;
        });
      });
    return Object.keys(typeMap).map((key) => ({
      subject: key,
      A: Math.round((typeMap[key].correct / typeMap[key].total) * 100),
      fullMark: 100,
    }));
  })();

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff =
      filterDifficulty === "All" || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  const totalAvgScore =
    quizzes.filter((q) => q.score !== undefined).length > 0
      ? Math.round(
          quizzes.reduce((acc, q) => acc + (q.score || 0), 0) /
            quizzes.filter((q) => q.score !== undefined).length
        )
      : 0;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textMain tracking-tight">
            Dashboard
          </h1>
          <p className="text-textMuted mt-1">
            Overview of your learning progress.
          </p>
        </div>
        <div className="text-left md:text-right flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-textMuted">Current Plan</div>
            <div
              className={`text-lg font-bold ${
                user.tier === "Pro" ? "text-indigo-600" : "text-textMain"
              }`}
            >
              {user.tier} Plan
            </div>
          </div>
        </div>
      </header>

      {/* KPI Stats Grid - Fixed Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
                Completed
              </p>
              <h3 className="text-2xl font-bold text-textMain">
                {quizzes.filter((q) => q.score !== undefined).length}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl text-green-600 shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
                Avg Score
              </p>
              <h3 className="text-2xl font-bold text-textMain">
                {quizzes.filter((q) => q.score !== undefined).length > 0
                  ? totalAvgScore + "%"
                  : "N/A"}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
                Weak Point
              </p>
              <h3
                className="text-lg font-bold text-textMain truncate"
                title={stats.weakestTopic}
              >
                {stats.weakestTopic}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-textMuted font-bold uppercase tracking-wider truncate">
                Flashcards Left
              </p>
              <h3 className="text-2xl font-bold text-textMain">
                {user.limits.flashcardGenerationsRemaining}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm h-[350px]">
          <h2 className="text-lg font-bold text-textMain mb-6">
            Performance by Difficulty
          </h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={difficultyData}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    color: "#0f172a",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Question Type Radar */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm h-[350px]">
          <h2 className="text-lg font-bold text-textMain mb-2">
            Weak Areas by Question Type
          </h2>
          {typeChartData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={typeChartData}
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="#4f46e5"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      color: "#0f172a",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-textMuted">
              Not enough data yet.
            </div>
          )}
        </div>
      </div>

      {/* All Quizzes Section */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-textMain">All Quizzes</h2>
            <p className="text-xs text-textMuted mt-1">
              Total: {quizzes.length} | Avg Score: {totalAvgScore}%
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-surfaceHighlight border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm bg-surfaceHighlight border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-all"
              >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <Filter className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-textMuted py-10">
              {quizzes.length === 0 ? (
                <>
                  No quizzes yet.{" "}
                  <Link to="/generate" className="text-primary hover:underline">
                    Create one!
                  </Link>
                </>
              ) : (
                <>No quizzes found matching your filters.</>
              )}
            </div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group relative bg-surfaceHighlight rounded-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-primary/20 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Delete Button - Using z-50 to ensure it sits above the link and other elements */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, quiz._id)}
                  className="absolute top-3 right-3 z-50 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  title="Delete Quiz"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>

                <Link
                  to={`/quiz/${quiz._id}`}
                  className="block p-5 h-full z-10"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        quiz.difficulty === "Easy"
                          ? "bg-green-100 text-green-600"
                          : quiz.difficulty === "Medium"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-textMain truncate mb-1 pr-8 text-lg"
                    title={quiz.title}
                  >
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-textMuted mb-4 flex items-center gap-2">
                    <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-xs font-medium">
                      {quiz.questions.length} Qs
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                    {quiz.isFlashcardSet && (
                      <BookOpen className="w-3 h-3 text-indigo-500 ml-auto" />
                    )}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                    <span className="text-xs text-textMuted font-medium">
                      {quiz.score !== undefined ? "Score" : "Incomplete"}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        quiz.score >= 80
                          ? "text-green-600"
                          : quiz.score >= 50
                          ? "text-orange-600"
                          : quiz.score < 49 && "text-red-600"
                      }`}
                    >
                      {quiz.score !== undefined ? `${quiz.score}%` : "-"}
                    </span>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
