type LogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export default function Logo({ href, size = "md", className }: LogoProps) {
  const content = (
    <span
      className={[
        "font-bold tracking-tight leading-none",
        "text-primary",
        sizes[size],
        className ?? "",
      ].join(" ")}
    >
      weeb
    </span>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      aria-label="Retour à l'accueil"
      className="inline-flex items-center focus-ring-primary rounded"
    >
      {content}
    </a>
  );
}
