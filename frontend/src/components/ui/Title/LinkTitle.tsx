import { ArrowRight } from "lucide-react";
import { cx } from "../../../lib/cx";

/**
 * Props for the LinkTitle (Text CTA Link) component
 * Used for text links with an arrow icon
 */
type TextCtaLinkProps = {
  /** URL for the link */
  href: string;

  /** Link text content */
  children: React.ReactNode;

  /** If true, opens the link in a new tab */
  external?: boolean;

  /** If true, applies accent color on hover */
  hoverAccent?: boolean;

  /** Additional CSS classes */
  className?: string;
};

export default function TextCtaLink({
  href,
  children,
  external = false,
  hoverAccent = false,
  className,
}: TextCtaLinkProps) {
  return (
    <a
      href={href}
      className={cx(
        "group inline-flex items-center gap-2 text-lg font-medium focus-ring-primary",
        "link-soft",
        hoverAccent && "hover:text-accent",
        className
      )}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      <span>{children}</span>

      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}
