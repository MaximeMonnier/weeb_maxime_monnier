import HeroBanner from "../components/common/home/HeroBanner";
import MainLayout from "../layouts/MainLayout";
import ImageBanner from "../assets/img/img1.png";
import BrandBanner from "../components/common/home/BrandBanner";

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
      </main>
    </MainLayout>
  );
};

export default home;
