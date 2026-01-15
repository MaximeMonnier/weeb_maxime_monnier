import React from "react";

type HeroTitleProps = {
  line1: React.ReactNode;
  line2?: React.ReactNode;
  as?: "h1" | "h2";
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
