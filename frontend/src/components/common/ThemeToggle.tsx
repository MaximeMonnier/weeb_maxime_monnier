import { Sun, Moon } from "lucide-react";

type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
  isMobile?: boolean;
};

export default function ThemeToggle({
  isDark,
  onToggle,
  isMobile = false,
}: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`btn-ghost touch-target ${isMobile ? "rounded-full p-2" : "rounded-full"}`}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
