type Brand = {
  name: string;
  src: string; // chemin vers ton svg/png (ex: /brands/smartfinder.svg)
  href?: string;
};

const brands: Brand[] = [
  { name: "SmartFinder", src: "/brands/smartfinder.svg", href: "#" },
  { name: "Zoomerr", src: "/brands/zoomerr.svg", href: "#" },
  { name: "SHELLS", src: "/brands/shells.svg", href: "#" },
  { name: "WAVES", src: "/brands/waves.svg", href: "#" },
  { name: "ArtVenue", src: "/brands/artvenue.svg", href: "#" },
];

export default function LogoBanner() {
  return (
    <section className="border-t border-primary py-10">
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
          {brands.map((b) => {
            const content = (
              <img
                src={b.src}
                alt={b.name}
                className="h-5 w-auto opacity-70 transition-opacity duration-200 hover:opacity-100"
                loading="lazy"
              />
            );

            return b.href ? (
              <a
                key={b.name}
                href={b.href}
                aria-label={b.name}
                className="focus-ring-primary rounded"
              >
                {content}
              </a>
            ) : (
              <div key={b.name} aria-label={b.name}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
