import React from "react";

type SectionTitleSize = "md" | "lg";

type SectionTitleProps = {
  /** Contenu ligne 1 (tu peux passer du texte ou des spans) */
  line1: React.ReactNode;
  /** Contenu ligne 2 (optionnel) */
  line2?: React.ReactNode;

  /** h2 par défaut (tu peux mettre h3 si besoin) */
  as?: "h2" | "h3";

  /** Centré (ex: "Ils nous font confiance") ou à gauche (ex: bloc avec image) */
  align?: "center" | "left";

  /** Taille : md (section standard) / lg (section plus mise en avant) */
  size?: SectionTitleSize;

  className?: string;
};

const sizeClasses: Record<SectionTitleSize, string> = {
  // "Ils nous font confiance"
  md: "text-2xl sm:text-3xl",
  // "Apprenez et progressez"
  lg: "text-3xl sm:text-4xl",
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
