import React from "react";
import SecondTitle from "../../ui/Title/SecondTitle";
import LinkTitle from "../../ui/Title/LinkTitle";

type FeatureBlockProps = {
  eyebrow?: string;

  /** Titre (tu peux passer des spans pour la couleur) */
  titleLine1: React.ReactNode;
  titleLine2?: React.ReactNode;

  description?: string;

  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;

  imageSrc: string;
  imageAlt: string;

  /** true => image à gauche / texte à droite (comme la 2e section) */
  reverse?: boolean;

  className?: string;
};

export default function FeatureBlock({
  eyebrow,
  titleLine1,
  titleLine2,
  description,
  ctaLabel,
  ctaHref,
  ctaExternal = false,
  imageSrc,
  imageAlt,
  reverse = false,
  className,
}: FeatureBlockProps) {
  return (
    <section className={["py-12 md:py-16", className ?? ""].join(" ")}>
      <div className="container-custom">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Texte */}
          <div className={reverse ? "md:order-2" : "md:order-1"}>
            {eyebrow ? (
              <p className=" text-[12px] font-semibold tracking-[0.14em] uppercase">
                {eyebrow}
              </p>
            ) : null}

            <div className="mt-3">
              <SecondTitle
                size="lg"
                align="left"
                line1={titleLine1}
                line2={titleLine2}
              />
            </div>

            {description ? (
              <p className="mt-4 max-w-prose text-secondary text-sm sm:text-base leading-relaxed">
                {description}
              </p>
            ) : null}

            <div className="mt-6">
              <LinkTitle href={ctaHref} external={ctaExternal} hoverAccent>
                {ctaLabel}
              </LinkTitle>
            </div>
          </div>

          {/* Image */}
          <div className={reverse ? "md:order-1" : "md:order-2"}>
            <div
              className={[
                "flex justify-center",
                reverse ? "md:justify-start" : "md:justify-end",
              ].join(" ")}
            >
              <img
                src={imageSrc}
                alt={imageAlt}
                loading="lazy"
                className="w-full rounded-lg h-100"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
