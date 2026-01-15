import Form from "../components/common/Contact/FormContact";
import MainTitle from "../components/ui/Title/MainTitle";

const Contact = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div>
          <MainTitle
            line1={<>Votre avis compte !</>}
            line2={
              <>
                Votre retour est essentiel pour nous améliorer ! Partagez votre
                expérience, dites-nous ce que vous aimez et ce que nous
                pourrions améliorer. Vos suggestions nous aident à faire de ce
                blog une ressource toujours plus utile et enrichissante.
              </>
            }
          />
        </div>

        <Form />
      </div>
    </div>
  );
};

export default Contact;
