import React from "react";
import { ArrowRight } from "lucide-react";

type TextCtaLinkProps = {
  href: string;
  children: React.ReactNode;

  /** Optionnel : ouvre dans un nouvel onglet */
  external?: boolean;

  /** Optionnel : style plus “accent” (violet) au hover */
  hoverAccent?: boolean;

  className?: string;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

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
