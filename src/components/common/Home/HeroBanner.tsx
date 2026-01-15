import MainButton from "../../ui/Button/MainButton";
import MainTitle from "../../ui/Title/MainTitle";

const HeroBanner = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div className="py-6">
          <MainTitle
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
        <div className="flex items-center justify-center py-6 gap-4">
          <MainButton variant="primary" size="lg" className="cursor-pointer">
            Découvrir les Offrres
          </MainButton>
          <MainButton variant="outline" size="lg" className="cursor-pointer">
            Découvrir les Offrres
          </MainButton>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
