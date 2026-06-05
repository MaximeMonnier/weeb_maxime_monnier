type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

/**
 * Logo component - displays the brand name "weeb"
 * This component only renders the logo text. Wrap it in a Link or anchor tag
 * for navigation functionality.
 */
export default function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={[
        "font-bold tracking-tight leading-none",
        "text-primary",
        sizes[size],
        className ?? "",
      ].join(" ")}
    >
      weeb
    </span>
  );
}
