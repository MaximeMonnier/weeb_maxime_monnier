import { ArrowRight } from "lucide-react";
import { cx } from "../../../lib/cx";

type TextCtaLinkProps = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  hoverAccent?: boolean;
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
