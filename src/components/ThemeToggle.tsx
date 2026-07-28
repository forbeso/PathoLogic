import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({
  surface = "light",
}: {
  surface?: "light" | "dark";
}) {
  const { theme, mounted, toggleTheme } = useTheme();
  const dark = mounted && theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-md border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${
        surface === "dark"
          ? "border-white/15 bg-white/5 text-slate-100 hover:border-teal-200/50 hover:bg-teal-300/10"
          : "border-[#b7ccc5] bg-white text-slate-700 hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-[#102329] dark:text-slate-200 dark:hover:border-teal-500 dark:hover:bg-[#16333a]"
      }`}
    >
      {dark ? (
        <Sun aria-hidden="true" size={19} />
      ) : (
        <Moon aria-hidden="true" size={19} />
      )}
    </button>
  );
}
