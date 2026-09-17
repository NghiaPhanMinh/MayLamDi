import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "maylamdi-theme";

function readInitialTheme(): Theme {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark") return "dark";
      if (saved === "light") return "light";
    } catch {}
  }

  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme;
    if (current === "dark" || current === "light") {
      return current;
    }
  }

  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

    const themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    themeMeta?.setAttribute(
      "content",
      theme === "dark" ? "#121f25" : "#fffded",
    );
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme as Theme;
      if (current && (current === "dark" || current === "light")) {
        setTheme((prev) => (prev !== current ? current : prev));
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
