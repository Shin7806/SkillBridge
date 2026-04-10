import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-6 w-11 rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className={`inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary shadow-sm transform transition-transform ${
          theme === "dark" ? "translate-x-6" : "translate-x-0.5"
        }`}
      >
        {theme === "light" ? (
          <Sun className="size-3 text-primary-foreground" />
        ) : (
          <Moon className="size-3 text-primary-foreground" />
        )}
      </span>
    </button>
  );
}
