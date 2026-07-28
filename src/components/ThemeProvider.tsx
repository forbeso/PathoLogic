import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ColorTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ColorTheme;
  mounted: boolean;
  toggleTheme: () => void;
};

export const THEME_STORAGE_KEY = "pathologix:theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ColorTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#08191f" : "#eef7f4");
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ColorTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const rootTheme: ColorTheme = document.documentElement.classList.contains(
      "dark"
    )
      ? "dark"
      : "light";
    setTheme(rootTheme);
    applyTheme(rootTheme);
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      const nextTheme: ColorTheme = event.matches ? "dark" : "light";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme: ColorTheme = current === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, mounted, toggleTheme }),
    [mounted, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
