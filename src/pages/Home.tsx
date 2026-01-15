import HeroBanner from "../components/common/Home/HeroBanner";
import MainLayout from "../layouts/MainLayout";
import ImageBanner from "../assets/img/img1.png";
import BrandBanner from "../components/common/Home/BrandBanner";
import FeatureBlock from "../components/common/Home/FeatureBlock";
import Image1 from "../assets/img/img1.png";
import Image2 from "../assets/img/img2.png";

const home = () => {
  return (
    <MainLayout>
      <header>
        <HeroBanner />
      </header>
      <main>
        <div className="container-custom flex justify-center py-30">
          <img
            src={ImageBanner}
            alt="Image de présentation"
            className="rounded-lg"
          />
        </div>
        <BrandBanner />
        <div>
          <FeatureBlock
            eyebrow="Des ressources pour tous les niveaux"
            titleLine1={
              <>
                <span className="text-accent">Apprenez</span> et
              </>
            }
            titleLine2="progressez"
            description="Que vous débutiez en développement web ou que vous soyez un expert cherchant à approfondir vos connaissances, nous vous proposons des tutoriels, guides et bonnes pratiques pour apprendre efficacement."
            ctaLabel="Explorer les ressources"
            ctaHref="#ressources"
            imageSrc={Image1}
            imageAlt="Aperçu interface"
            reverse={false}
          />

          <FeatureBlock
            eyebrow="Le web, un écosystème en constante évolution"
            titleLine1={
              <>
                Restez informé des <br />
                dernières <span className="text-accent">tendances</span>
              </>
            }
            description="Chaque semaine, nous analysons les nouveautés du web..."
            ctaLabel="Lire les articles récents"
            ctaHref="#articles"
            imageSrc={Image2}
            imageAlt="Illustration tendances"
            reverse={true}
          />
        </div>
      </main>
    </MainLayout>
  );
};

export default home;
