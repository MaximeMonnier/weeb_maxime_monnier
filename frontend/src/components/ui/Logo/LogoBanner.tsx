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
  { name: "SmartFinder", src: svg1, href: "#" },
  { name: "Zoomerr", src: svg2, href: "#" },
  { name: "SHELLS", src: svg3, href: "#" },
  { name: "WAVES", src: svg4, href: "#" },
  { name: "ArtVenue", src: svg5, href: "#" },
];

const LogoItem = ({ brand }: { brand: Brand }) => {
  const content = (
    <>
      <img
        src={brand.src}
        alt={brand.name}
        className="h-14 w-auto opacity-70 transition-opacity duration-200 hover:opacity-100"
        loading="lazy"
      />
      <span className="text-secondary text-sm">{brand.name}</span>
    </>
  );

  return brand.href ? (
    <a
      href={brand.href}
      aria-label={brand.name}
      className="flex min-w-max items-center gap-2 px-6 py-2"
    >
      {content}
    </a>
  ) : (
    <div
      aria-label={brand.name}
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
          {[...brands, ...brands].map((brand, index) => (
            <LogoItem key={`${brand.name}-${index}`} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
