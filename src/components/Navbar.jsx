import React from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 font-bold text-xl text-primary dark:text-blue-400 hover:opacity-80 transition-opacity point"
        >
          <Brain className="w-7 h-7" />
          <span>Quizzy AI</span>
        </button>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-surfaceHighlight rounded-lg transition-colors point"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/features"
            className="text-textMuted hover:text-textMain transition-colors"
          >
            Features
          </a>
          <a
            href="/testimonials"
            className="text-textMuted hover:text-textMain transition-colors"
          >
            Testimonials
          </a>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 point"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm md:hidden z-40 animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar menu - slides from right */}
      <div
        className={`fixed top-16 right-0 h-[calc(100vh-64px)] bg-surface border-l border-border md:hidden z-50 transition-all duration-300 ease-out transform ${
          mobileMenuOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        } w-max max-w-xs`}
      >
        <div className="px-6 py-6 space-y-4 flex flex-col">
          <a
            href="/features"
            className="text-textMuted hover:text-textMain hover:bg-surfaceHighlight px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="/testimonials"
            className="text-textMuted hover:text-textMain hover:bg-surfaceHighlight px-4 py-3 rounded-lg transition-all duration-200 hover:translate-x-1"
            onClick={() => setMobileMenuOpen(false)}
          >
            Testimonials
          </a>
          <button
            onClick={() => {
              navigate("/auth");
              setMobileMenuOpen(false);
            }}
            className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
