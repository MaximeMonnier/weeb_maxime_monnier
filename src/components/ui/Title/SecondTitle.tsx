import React from "react";

type SectionTitleSize = "md" | "lg";

type SectionTitleProps = {
  line1: React.ReactNode;
  line2?: React.ReactNode;

  as?: "h2" | "h3";

  align?: "center" | "left";

  size?: SectionTitleSize;

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
