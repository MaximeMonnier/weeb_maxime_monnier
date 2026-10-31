import { cx } from "../../../lib/cx";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export default function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={cx(
        "font-bold tracking-tight leading-none",
        "text-ink",
        sizes[size],
        className,
      )}
    >
      weeb
    </span>
  );
}
