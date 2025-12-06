import React, { useEffect, useState } from "react";

import { Link, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  PlusCircle,
  BarChart,
  LogOut,
  Crown,
  BrainCircuit,
  Loader2,
  Zap,
} from "lucide-react";

import SubscriptionModal from "./SubscriptionModal.jsx";
import { SubscriptionTier } from "../../server/config/types.js";

// DX: Helper function for progress calculation
const getProgressWidth = (remaining, max) => {
  if (remaining === null || remaining === undefined) return "0%";
  const used = max - remaining;
  return `${Math.min(100, Math.max(0, (used / max) * 100))}%`;
};

const Layout = ({ children, user, onLogout, refreshUser }) => {
  const location = useLocation();
  const [showSubModal, setShowSubModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [quizzesLeft, setQuizzesLeft] = useState(
    user.limits.generationsRemaining
  );
  const [pdfLeft, setPdfLeft] = useState(user.limits.pdfUploadsRemaining);

  useEffect(() => {
    setQuizzesLeft(user.limits.generationsRemaining);
  }, [user.limits.generationsRemaining]);

  useEffect(() => {
    setPdfLeft(user.limits.pdfUploadsRemaining);
  }, [user.limits.pdfUploadsRemaining]);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: PlusCircle, label: "New Quiz", path: "/generate" },
    { icon: BarChart, label: "Overview", path: "/overview" },
  ];

  const handleLogoutClick = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      onLogout();
      setIsLoggingOut(false);
    }, 1000);
  };

  const userTier = user.tier;
  const userLimits = SubscriptionTier[userTier];

  const MAX_QUIZZES = userLimits.generationsRemaining;
  const MAX_PDF_UPLOADS = userLimits.pdfUploadsRemaining;

  return (
    <div className="min-h-screen bg-background text-textMain flex font-sans no-print selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-surface border-r overflow-auto border-border hidden md:flex flex-col fixed h-full z-10 shadow-sm transition-all duration-300">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight transition-opacity hover:opacity-80"
              aria-label="Go to Quizzy AI Dashboard" // A11Y improvement
            >
              <BrainCircuit className="w-7 h-7" />
              <span>Quizzy AI</span>
            </Link>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                // UX/DESIGN: Refined hover and active states (using shadow-inner for depth, shadow-sm for lift)
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-inner"
                    : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain hover:pl-5 hover:shadow-sm"
                }`}
                aria-current={isActive ? "page" : undefined} // A11Y improvement
              >
                <item.icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          {user && (
            <div className="bg-surfaceHighlight p-4 rounded-xl mb-6 border border-border/50 shadow-lg shadow-black/5">
              {" "}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 mb-1 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-textMuted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <span
                  // DESIGN: Tier badge updated to rounded-full and font-extrabold
                  className={`text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-3 shadow-sm ${
                    user.tier === "Pro"
                      ? "bg-amber-100 text-amber-700"
                      : user.tier === "Basic"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {user.tier}
                </span>
              </div>
              {/* UI/UX: Usage Limits converted to Progress Bars */}
              <div className="space-y-3 mb-1">
                {/* Quizzes Today Progress Bar */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-textMuted">
                      Quiz Generations Left
                    </span>
                    <span
                      className={`font-bold ${
                        quizzesLeft > 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {user.tier === "Pro" ? "Unlimited" : quizzesLeft}
                    </span>
                  </div>
                  {user.tier !== "Pro" && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{
                          width: getProgressWidth(quizzesLeft, MAX_QUIZZES),
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* PDF Uploads Progress Bar */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-textMuted">PDF Uploads Left</span>
                    <span className="font-bold text-textMain">
                      {user.tier === "Pro" ? "Unlimited" : pdfLeft}
                    </span>
                  </div>
                  {user.tier !== "Pro" && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{
                          width: getProgressWidth(pdfLeft, MAX_PDF_UPLOADS),
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              {user.tier !== "Pro" && (
                <button
                  onClick={() => setShowSubModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-extrabold py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] mt-5"
                >
                  <Crown className="w-[15px] h-[15px] fill-white -mt-0.5" />
                  Upgrade Plan
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            // UX/DESIGN/A11Y: Enhanced hover, focus, and disabled states
            className="flex items-center gap-3 px-4 py-2 text-textMuted hover:text-red-600 transition-colors w-full rounded-xl hover:bg-red-50 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin text-red-500" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-40 flex justify-around p-2 pb-safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              // UX: Ensured generous touch target size (min-w) and better font weight
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all flex-1 active:scale-95 min-w-[70px] ${
                isActive ? "text-primary" : "text-textMuted hover:text-textMain"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? "fill-primary/20" : "" // DESIGN: Subtle fill on active icon
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowSubModal(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-textMuted flex-1 active:scale-95 hover:text-orange-500 transition-colors min-w-[70px]"
          aria-label="Upgrade Plan"
        >
          <Crown className="w-6 h-6 mb-1 text-orange-500" />
          <span className="text-[10px] font-semibold">Upgrade</span>
        </button>
      </nav>

      {/* Main Content */}
      {/* UX/RESPONSIVENESS: Increased mobile bottom padding (pb-28) to prevent content overlap with the fixed mobile nav */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto min-h-screen bg-background pb-28 md:pb-8 transition-all">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Header */}
          {/* DESIGN: Added border and more vertical padding to the mobile header */}
          <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-background/95 backdrop-blur z-30 py-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <BrainCircuit className="w-7 h-7" />
              <span>Quizzy AI</span>
            </div>

            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="p-2 text-textMuted hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label={isLoggingOut ? "Logging out..." : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>

          {children}
        </div>
      </main>

      {/* Subscription Modal */}
      {showSubModal && (
        <SubscriptionModal
          onClose={() => setShowSubModal(false)}
          onUpgrade={refreshUser}
          currentTier={user?.tier || "Free"}
        />
      )}
    </div>
  );
};

export default Layout;
