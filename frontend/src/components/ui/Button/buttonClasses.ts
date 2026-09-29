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

// `none` laisse l'appelant poser son propre espacement : un bouton d'icône
// écrase le padding par un `p-2`, et deux utilitaires de padding concurrents
// se départagent par l'ordre de la feuille, pas par celui de la chaîne.
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
    "bg-[var(--color-light-accent-primary)] hover:bg-[var(--color-light-accent-hover)] " +
    "dark:bg-[var(--color-dark-accent-primary)] dark:hover:bg-[var(--color-dark-accent-hover)] " +
    "hover:-translate-y-[1px] hover:shadow-[var(--shadow-glow-primary)] active:translate-y-0 " +
    "focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]",

  outline:
    "font-medium transition-all duration-200 bg-transparent " +
    "text-[var(--color-light-text-primary)] border border-[var(--color-light-border-secondary)] " +
    "hover:bg-[var(--color-light-bg-tertiary)] " +
    "dark:text-[var(--color-dark-text-primary)] dark:border-[var(--color-dark-border-secondary)] " +
    "dark:hover:bg-[var(--color-dark-bg-tertiary)] " +
    "focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]",

  secondary:
    "font-medium transition-all duration-200 bg-transparent " +
    "text-[var(--color-light-accent-primary)] border-2 border-[var(--color-light-accent-primary)] " +
    "hover:bg-[var(--color-light-accent-primary)] hover:text-white " +
    "dark:text-[var(--color-dark-accent-primary)] dark:border-[var(--color-dark-accent-primary)] " +
    "dark:hover:bg-[var(--color-dark-accent-primary)] " +
    "focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]",

  ghost:
    "transition-colors duration-200 bg-transparent " +
    "text-[var(--color-light-text-primary)] hover:bg-[var(--color-light-bg-tertiary)] " +
    "dark:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-bg-tertiary)] " +
    "focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]",
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
