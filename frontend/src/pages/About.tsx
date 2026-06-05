import MainTitle from "../components/ui/Title/MainTitle";
import Image1 from "../assets/img/img1.png";

const About = () => {
  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-10">
          <MainTitle line1={<>À propos de nous !</>} />
        </div>
        <div className="flex flex-col w-full md:flex-row items-center justify-center gap-10 py-6">
          <div className="w-1/2">
            <img src={Image1} alt="image" />
          </div>
          <div className="w-1/2">
            Nous sommes passionnés par le développement web et nous avons créé
            ce blog pour partager nos connaissances, nos expériences et nos
            découvertes avec vous. Que vous soyez un débutant cherchant à
            apprendre les bases ou un développeur expérimenté à la recherche de
            nouvelles idées, notre objectif est de vous fournir des ressources
            de qualité pour vous aider à progresser dans votre parcours de
            développement web. Nous croyons en la puissance de la communauté et
            nous espérons que ce blog deviendra un espace d'échange, de
            collaboration et d'inspiration pour tous les passionnés du web. Nous
            sommes passionnés par le développement web et nous avons créé ce
            blog pour partager nos connaissances, nos expériences et nos
            découvertes avec vous. Que vous soyez un débutant cherchant à
            apprendre les bases ou un développeur expérimenté à la recherche de
            nouvelles idées, notre objectif est de vous fournir des ressources
            de qualité pour vous aider à progresser dans votre parcours de
            développement web. Nous croyons en la puissance de la communauté et
          </div>
        </div>
      </div>
      <div className="text-start w-full py-6">
        Nous sommes passionnés par le développement web et nous avons créé ce
        blog pour partager nos connaissances, nos expériences et nos découvertes
        avec vous. Que vous soyez un débutant cherchant à apprendre les bases ou
        un développeur expérimenté à la recherche de nouvelles idées, notre
        objectif est de vous fournir des ressources de qualité pour vous aider à
        progresser dans votre parcours de développement web. Nous croyons en la
        puissance de la communauté et nous espérons que ce blog deviendra un
        espace d'échange, de collaboration et d'inspiration pour tous les
        passionnés du web. Nous sommes passionnés par le développement web et
        nous avons créé ce blog pour partager nos connaissances, nos expériences
        et nos découvertes avec vous. Que vous soyez un débutant cherchant à
        apprendre les bases ou un développeur expérimenté à la recherche de
        nouvelles idées, notre objectif est de vous fournir des ressources de
        qualité pour vous aider à progresser dans votre parcours de
        développement web. Nous croyons en la puissance de la communauté et
      </div>
    </div>
  );
};

export default About;
