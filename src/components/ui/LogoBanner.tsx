import svg1 from "../../assets/svg/1.svg";
import svg2 from "../../assets/svg/2.svg";
import svg3 from "../../assets/svg/3.svg";
import svg4 from "../../assets/svg/4.svg";
import svg5 from "../../assets/svg/5.svg";

type Brand = {
  name: string;
  src: string;
  href?: string;
};

const brands: Brand[] = [
  { name: "SmartFinder", src: `${svg1}`, href: "#" },
  { name: "Zoomerr", src: `${svg2}`, href: "#" },
  { name: "SHELLS", src: `${svg3}`, href: "#" },
  { name: "WAVES", src: `${svg4}`, href: "#" },
  { name: "ArtVenue", src: `${svg5}`, href: "#" },
];

export default function LogoBanner() {
  return (
    <section className=" py-10">
      <div className="w-full">
        <div className="flex items-center justify-between gap-30">
          {brands.map((b) => {
            const content = (
              <img
                src={b.src}
                alt={b.name}
                className="h-14 w-auto opacity-70 transition-opacity duration-200 hover:opacity-100"
                loading="lazy"
              />
            );

            return b.href ? (
              <a
                key={b.name}
                href={b.href}
                aria-label={b.name}
                className="focus-ring-primary rounded flex justify-center items-center gap-2"
              >
                {content}
                {b.name}
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
