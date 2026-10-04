import HeroTitle from "../components/ui/Title/HeroTitle";
import Image1 from "../assets/img/img1.png";

const About = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-10">
          <HeroTitle line1={<>À propos de nous !</>} />
        </div>
        <div className="flex flex-col w-full md:flex-row items-center justify-center gap-10 py-6">
          <div className="w-1/2">
            <img
              src={Image1}
              alt="Maquette d'une interface de blog : menu latéral, blocs de texte et cartes illustrées"
            />
          </div>
          <div className="w-1/2">
            <p>
              Weeb est né d'une conviction simple : le développement web
              s'apprend mieux à plusieurs. Nous partageons ici nos
              connaissances, nos expériences et nos découvertes, dans un format
              qui va droit à l'essentiel.
            </p>
            <p className="mt-4">
              Que vous écriviez vos premières balises ou que vous cherchiez à
              approfondir un sujet pratiqué depuis des années, vous trouverez
              des ressources écrites pour vous faire progresser.
            </p>
          </div>
        </div>
      </div>
      <div className="text-start w-full py-6">
        <p>
          Nous croyons en la puissance de la communauté. Un article n'est jamais
          un point final : les meilleures idées nous viennent de celles et ceux
          qui les lisent, les mettent en pratique et reviennent nous dire ce qui
          a marché.
        </p>
        <p className="mt-4">
          Une question, une remarque, une envie d'écrire avec nous ? La page
          contact est là pour ça. Nous espérons que Weeb deviendra pour vous un
          espace d'échange, de collaboration et d'inspiration.
        </p>
      </div>
    </div>
  );
};

export default About;
