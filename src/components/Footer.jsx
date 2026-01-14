import { Link, useLocation } from "react-router-dom";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path
      ? "text-primary dark:text-blue-500 font-semibold"
      : "hover:text-textMain transition-colors";
  };

  return (
    <footer className="bg-surface border-t border-border py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-primary dark:text-blue-400 mb-4 justify-center md:justify-start">
              <img
                src="/icons/favicon-main.png"
                className="w-10 h-10"
                alt="Brand Icon"
                loading="lazy"
                decoding="async"
              />
              <span>Qubli AI</span>
            </div>
            <p className="text-textMuted text-sm">
              Making learning smarter with AI-powered quizzes and flashcards.
            </p>
          </div>

          {/* Product */}
          <div>
            <span className="font-bold text-[17px]">Product</span>
            <ul className="space-y-2 mt-2.5 text-textMuted text-sm">
              <li>
                <Link to="/features" className={isActive("/features")}>
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className={isActive("/pricing")}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blogs" className={isActive("/blogs")}>
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <span className="font-bold text-[17px]">Company</span>
            <ul className="space-y-2 mt-2.5 text-textMuted text-sm">
              <li>
                <Link to="/about" className={isActive("/about")}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className={isActive("/contact")}>
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-textMain transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <span className="font-bold text-[17px]">Legal</span>
            <ul className="space-y-2 mt-2.5 text-textMuted text-sm">
              <li>
                <Link to="/policies" className={isActive("/policies")}>
                  Policies
                </Link>
              </li>
              <li>
                <Link to="/terms" className={isActive("/terms")}>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-textMuted text-sm">
              &copy; {new Date().getFullYear()} Qubli AI | All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                aria-label="Github"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-textMuted hover:text-primary dark:hover:text-blue-400 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
