import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
  const classes = cx(
    "group inline-flex items-center gap-2 text-lg font-medium focus-ring-primary",
    hoverAccent &&
      "hover:text-accent",
    className,
  );

  const contenu = (
    <>
      <span>{children}</span>

      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </>
  );

  // Seul composant de `ui/` à connaître le routeur : un `<a>` vers un chemin de
  // l'application rechargerait tout le bundle au lieu de changer de vue. Les
  // ancres de défilement et les liens externes gardent le leur.
  if (external || href.startsWith("#")) {
    return (
      <a
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {contenu}
      </a>
    );
  }

  return (
    <Link to={href} className={classes}>
      {contenu}
    </Link>
  );
}
