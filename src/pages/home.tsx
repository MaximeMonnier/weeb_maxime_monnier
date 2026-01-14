import HeroBanner from "../components/common/home/HeroBanner";
import MainLayout from "../layouts/MainLayout";

const home = () => {
  return (
    <MainLayout>
      <header>
        <HeroBanner />
      </header>
    </MainLayout>
  );
};

export default home;
