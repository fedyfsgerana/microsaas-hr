import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      if (saved === null) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("darkMode");
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(isDark));
  }, [isDark]);

  return [isDark, setIsDark];
}
