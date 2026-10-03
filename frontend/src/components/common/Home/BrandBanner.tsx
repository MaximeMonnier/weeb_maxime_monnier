import LogoBanner from "../../ui/Logo/LogoBanner";
import SecondTitle from "../../ui/Title/SecondTitle";
const BrandBanner = () => {
  return (
    <div className="flex flex-col items-center my-30">
      <div className="pb-6">
        <SecondTitle line1="Ils nous font confiance" size="lg" />
      </div>
      <div className="w-full">
        <LogoBanner />
      </div>
    </div>
  );
};

export default BrandBanner;
