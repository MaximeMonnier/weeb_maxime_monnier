import { cx } from "../../../lib/cx";

export type ButtonVariant = "primary" | "outline" | "secondary" | "ghost";
export type ButtonSize = "none" | "sm" | "md" | "lg" | "cta" | "compact";

export type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 select-none " +
  "rounded-[var(--radius-button)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

// Deux registres : `sm`/`md`/`lg` fixent une hauteur, `cta` et `compact` un
// padding, celle d'un lien-bouton suivant son texte. `none` n'en pose aucun,
// deux paddings utilitaires se départageant par l'ordre de la feuille.
const sizes: Record<ButtonSize, string> = {
  none: "",
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-base",
  cta: "px-6 py-3 text-base",
  compact: "px-4 py-2 text-base",
};

// Le poids et la transition vivent dans la variante : `ghost` est la seule à
// garder le poids du texte courant et à n'animer que son fond.
const variants: Record<ButtonVariant, string> = {
  primary:
    "font-medium transition-all duration-200 text-white " +
    "bg-accent hover:bg-accent-hover " +
    "hover:-translate-y-[1px] hover:shadow-[var(--shadow-glow-primary)] active:translate-y-0 " +
    "focus-visible:outline-accent",

  outline:
    "font-medium transition-all duration-200 bg-transparent " +
    "text-ink border border-line-strong " +
    "hover:bg-surface-hover " +
    "focus-visible:outline-accent",

  secondary:
    "font-medium transition-all duration-200 bg-transparent " +
    "text-accent border-2 border-accent " +
    "hover:bg-accent hover:text-white " +
    "focus-visible:outline-accent",

  ghost:
    "transition-colors duration-200 bg-transparent " +
    "text-ink hover:bg-surface-hover " +
    "focus-visible:outline-accent",
};

/** Habille un lien ou un bouton écrit à la main du même style que `Button`. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyle = {}): string {
  return cx(
    base,
    sizes[size],
    variants[variant],
    fullWidth && "w-full",
    className,
  );
}
