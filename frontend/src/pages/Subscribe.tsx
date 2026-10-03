import FormSubscribe from "../components/common/Subscribe/FormSubscribe";
import HeroTitle from "../components/ui/Title/HeroTitle";

const Subscribe = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div>
          <HeroTitle
            line1={
              <>
                Rejoignez <span className="text-accent">Weeb</span>
              </>
            }
            line2="Créez votre compte gratuitement"
          />
        </div>

        <FormSubscribe />
      </div>
    </div>
  );
};

export default Subscribe;
