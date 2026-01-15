import FormLogin from "../components/common/Login/FormLogin";
import MainTitle from "../components/ui/Title/MainTitle";

const Login = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div>
          <MainTitle
            line1={
              <>
                Bienvenue sur <span className="text-accent">Weeb</span>
              </>
            }
            line2="Connectez-vous pour continuer"
          />
        </div>

        <FormLogin />
      </div>
    </div>
  );
};

export default Login;
