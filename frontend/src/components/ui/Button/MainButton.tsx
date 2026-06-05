import React from "react";

type ButtonVariant = "primary" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-all duration-200 select-none " +
  "rounded-[var(--radius-button)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-base",
};

const variants: Record<ButtonVariant, string> = {
  // Bouton violet (comme sur ton screen)
  primary:
    "text-white " +
    "bg-[var(--color-light-accent-primary)] hover:bg-[var(--color-light-accent-hover)] " +
    "dark:bg-[var(--color-dark-accent-primary)] dark:hover:bg-[var(--color-dark-accent-hover)] " +
    "hover:-translate-y-[1px] hover:shadow-[var(--shadow-glow-primary)] active:translate-y-0 " +
    "focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]",

  // Variante noir/blanc (outline) comme “S'abonner à la newsletter”
  outline:
    "bg-transparent " +
    "text-[var(--color-light-text-primary)] border border-[var(--color-light-border-secondary)] " +
    "hover:bg-[var(--color-light-bg-tertiary)] " +
    "dark:text-[var(--color-dark-text-primary)] dark:border-[var(--color-dark-border-secondary)] " +
    "dark:hover:bg-[var(--color-dark-bg-tertiary)] " +
    "focus-visible:outline-[var(--color-light-accent-primary)] dark:focus-visible:outline-[var(--color-dark-accent-primary)]",
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        base,
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
}
