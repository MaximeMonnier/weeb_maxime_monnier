import SecondTitle from "../../ui/Title/SecondTitle";
import LinkTitle from "../../ui/Title/LinkTitle";

/**
 * Props for the FeatureBlock component
 * Used to display a section with an image and text content
 */
type FeatureBlockProps = {
  /** Optional eyebrow text displayed above the title */
  eyebrow?: string;

  /** Main title line (can include JSX for styling like <span className="text-accent">) */
  titleLine1: React.ReactNode;

  /** Optional second line of the title */
  titleLine2?: React.ReactNode;

  /** Description text displayed below the title */
  description?: string;

  /** Label for the call-to-action link */
  ctaLabel: string;

  /** URL for the call-to-action link */
  ctaHref: string;

  /** Whether the CTA link should open in a new tab */
  ctaExternal?: boolean;

  /** Source URL for the feature image */
  imageSrc: string;

  /** Alt text for the feature image */
  imageAlt: string;

  /** If true, displays image on the left and text on the right */
  reverse?: boolean;

  /** Additional CSS classes */
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
