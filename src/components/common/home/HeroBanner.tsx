import MainButton from "../../ui/MainButton";
import MainTitle from "../../ui/MainTitle";

const HeroBanner = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div>
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
      <div>
        Le monde du web évolue constamment, et nous sommes là pour vous guider à
        travers ses tendances, technologies et meilleures pratiques. Que vous
        soyez développeur, designer ou passionné du digital, notre blog vous
        offre du contenu de qualité pour rester à la pointe.
      </div>
      <div>
        <MainButton>Découvrir les Offrres</MainButton>
      </div>
    </div>
  );
};

export default HeroBanner;
