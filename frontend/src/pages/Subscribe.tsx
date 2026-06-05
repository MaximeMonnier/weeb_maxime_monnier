import FormSubscribe from "../components/common/Subscribe/FormSubscribe";
import MainTitle from "../components/ui/Title/MainTitle";

const Subscribe = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div>
          <MainTitle
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
