import { Sun, Moon } from "lucide-react";
import { cx } from "../../lib/cx";
import { buttonClasses } from "../ui/Button/buttonClasses";

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
      className={cx(
        buttonClasses({
          variant: "ghost",
          size: isMobile ? "none" : "compact",
        }),
        "touch-target rounded-full",
        isMobile && "p-2",
      )}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
