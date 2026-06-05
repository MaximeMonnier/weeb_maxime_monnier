/**
 * Props for the MainTitle (Hero Title) component
 * Used for large, prominent headings typically at the top of pages
 */
type HeroTitleProps = {
  /** First line of the title (can include JSX for styling) */
  line1: React.ReactNode;

  /** Optional second line of the title */
  line2?: React.ReactNode;

  /** HTML heading tag to use (default: h1) */
  as?: "h1" | "h2";

  /** Whether to center the title (default: true) */
  center?: boolean;
};

export default function HeroTitle({
  line1,
  line2,
  as = "h1",
  center = true,
}: HeroTitleProps) {
  const Comp = as;

  return (
    <Comp
      className={[
        "text-primary font-bold tracking-tight leading-[1.05]",
        "text-4xl sm:text-5xl md:text-6xl",
        center ? "text-center" : "text-left",
      ].join(" ")}
    >
      <span className="block">{line1}</span>
      {line2 ? <span className="block mt-2">{line2}</span> : null}
    </Comp>
  );
}
