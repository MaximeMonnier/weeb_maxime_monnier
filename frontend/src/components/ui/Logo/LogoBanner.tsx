import svg1 from "../../../assets/svg/1.svg";
import svg2 from "../../../assets/svg/2.svg";
import svg3 from "../../../assets/svg/3.svg";
import svg4 from "../../../assets/svg/4.svg";
import svg5 from "../../../assets/svg/5.svg";

type Brand = {
  name: string;
  src: string;
  href?: string;
};

const brands: Brand[] = [
  { name: "SmartFinder", src: svg1 },
  { name: "Zoomerr", src: svg2 },
  { name: "SHELLS", src: svg3 },
  { name: "WAVES", src: svg4 },
  { name: "ArtVenue", src: svg5 },
];

const LogoItem = ({
  brand,
  isLoopCopy,
}: {
  brand: Brand;
  isLoopCopy: boolean;
}) => {
  // `alt` vide : le `<span>` nomme déjà la marque, et le lecteur d'écran la lirait deux fois.
  const content = (
    <>
      <img
        src={brand.src}
        alt=""
        className="h-14 w-auto opacity-70 transition-opacity duration-200 hover:opacity-100"
        loading="lazy"
      />
      <span className="text-ink-soft text-sm">{brand.name}</span>
    </>
  );

  return brand.href ? (
    <a
      href={brand.href}
      aria-hidden={isLoopCopy || undefined}
      tabIndex={isLoopCopy ? -1 : undefined}
      className="flex min-w-max items-center gap-2 px-6 py-2"
    >
      {content}
    </a>
  ) : (
    <div
      aria-hidden={isLoopCopy || undefined}
      className="flex min-w-max items-center gap-2 px-6 py-2"
    >
      {content}
    </div>
  );
};

export default function LogoBanner() {
  return (
    <section className="w-full py-6">
      <div className="marquee-mask">
        <div className="marquee-track">
          {/* La copie n'existe que pour boucler l'animation : masquée aux lecteurs
              d'écran, et son lien éventuel retiré du parcours au clavier. */}
          {[...brands, ...brands].map((brand, index) => (
            <LogoItem
              key={`${brand.name}-${index}`}
              brand={brand}
              isLoopCopy={index >= brands.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
