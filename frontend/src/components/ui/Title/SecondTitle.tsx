type SectionTitleSize = "md" | "lg";

/**
 * Props for the SecondTitle (Section Title) component
 * Used for section headings throughout the application
 */
type SectionTitleProps = {
  /** First line of the title (can include JSX for styling) */
  line1: React.ReactNode;

  /** Optional second line of the title */
  line2?: React.ReactNode;

  /** HTML heading tag to use (default: h2) */
  as?: "h2" | "h3";

  /** Text alignment (default: center) */
  align?: "center" | "left";

  /** Size variant of the title (default: md) */
  size?: SectionTitleSize;

  /** Additional CSS classes */
  className?: string;
};

const sizeClasses: Record<SectionTitleSize, string> = {
  md: "text-4xl sm:text-4xl",
  lg: "text-5xl sm:text-5xl",
};

export default function SectionTitle({
  line1,
  line2,
  as = "h2",
  align = "center",
  size = "md",
  className,
}: SectionTitleProps) {
  const Comp = as;

  return (
    <Comp
      className={[
        "text-primary font-bold tracking-tight leading-[1.1]",
        sizeClasses[size],
        align === "center" ? "text-center" : "text-left",
        className ?? "",
      ].join(" ")}
    >
      <span className="block">{line1}</span>
      {line2 ? <span className="mt-2 block">{line2}</span> : null}
    </Comp>
  );
}
