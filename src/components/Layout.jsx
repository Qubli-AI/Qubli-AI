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
} from "lucide-react";

import SubscriptionModal from "./SubscriptionModal.jsx";

const Layout = ({ children, user, onLogout, refreshUser }) => {
  const location = useLocation();
  const [showSubModal, setShowSubModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-textMain flex font-sans no-print selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-surface border-r overflow-auto border-border hidden md:flex flex-col fixed h-full z-10 shadow-sm transition-all duration-300">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight"
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-textMuted hover:bg-surfaceHighlight hover:text-textMain hover:pl-5"
                }`}
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
            <div className="bg-surfaceHighlight p-4 rounded-xl mb-6 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 mb-1 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
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
                  className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ml-1 ${
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

              <div className="space-y-2 mb-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-textMuted">Quizzes Today</span>
                  <span
                    className={`font-bold ${
                      user.limits.generationsRemaining > 0
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {user.limits.generationsRemaining}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-textMuted">PDF Uploads</span>
                  <span className="font-bold text-textMain">
                    {user.limits.pdfUploadsRemaining}
                  </span>
                </div>
              </div>

              {user.tier !== "Pro" && (
                <button
                  onClick={() => setShowSubModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary to-secondary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-all hover:shadow-md shadow-primary/20 mt-4"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade Plan
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-4 py-2 text-textMuted hover:text-red-500 transition-colors w-full rounded-lg hover:bg-red-50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-40 flex justify-around p-2 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all flex-1 active:scale-95 ${
                isActive ? "text-primary" : "text-textMuted hover:text-textMain"
              }`}
            >
              <item.icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? "fill-current opacity-20" : ""
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowSubModal(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-textMuted flex-1 active:scale-95 hover:text-orange-500 transition-colors"
        >
          <Crown className="w-6 h-6 mb-1 text-orange-500" />
          <span className="text-[10px] font-medium">Upgrade</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto min-h-screen bg-background pb-28 md:pb-8 transition-all">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-background/95 backdrop-blur z-30 py-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <BrainCircuit className="w-7 h-7" />
              <span>Quizzy AI</span>
            </div>

            <button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="p-2 text-textMuted hover:text-red-500 transition-colors disabled:opacity-50"
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
