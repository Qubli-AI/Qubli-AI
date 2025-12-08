import { useEffect } from "react";

/**
 * Hook to manage theme throughout the application
 * Supports light, dark, and system preference modes
 */
export const useTheme = () => {
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem("theme") || "system";
    const htmlElement = document.documentElement;

    if (savedTheme === "dark") {
      htmlElement.classList.add("dark");
    } else if (savedTheme === "light") {
      htmlElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }

    return savedTheme;
  };

  const setTheme = (theme) => {
    localStorage.setItem("theme", theme);
    const htmlElement = document.documentElement;

    if (theme === "dark") {
      htmlElement.classList.add("dark");
    } else if (theme === "light") {
      htmlElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    // Initialize theme on app load
    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = localStorage.getItem("theme") || "system";
      if (currentTheme === "system") {
        setTheme("system");
      }
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return { initializeTheme, setTheme };
};
