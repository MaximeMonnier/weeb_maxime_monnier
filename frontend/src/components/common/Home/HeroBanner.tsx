import { Link } from "react-router-dom";

import HeroTitle from "../../ui/Title/HeroTitle";
import { buttonClasses } from "../../ui/Button/buttonClasses";
import { LIEN_BLOG } from "../../../lib/navigation";

const HeroBanner = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div className="py-6">
          <HeroTitle
            line1={
              <>
                Explorez le <span className="text-accent">Web</span> sous toutes
              </>
            }
            line2={
              <>
                ses <span className="underline-accent">facettes</span>
              </>
            }
          />
        </div>
        <div className="text-center w-1/2 py-6">
          Le monde du web évolue constamment, et nous sommes là pour vous guider
          à travers ses tendances, technologies et meilleures pratiques. Que
          vous soyez développeur, designer ou passionné du digital, notre blog
          vous offre du contenu de qualité pour rester à la pointe.
        </div>
        <div className="flex items-center justify-center py-6">
          {/* Un `<Link>` habillé, et non le composant `Button` qui rend un
              `<button>` : un `useNavigate` casserait le clic milieu. Seule la
              destination vient de `lib/navigation.ts`, pas le libellé. */}
          <Link
            to={LIEN_BLOG.to}
            className={buttonClasses({ variant: "primary", size: "lg" })}
          >
            Découvrir les articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
