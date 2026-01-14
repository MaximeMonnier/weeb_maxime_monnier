import LogoBanner from "../../ui/LogoBanner";
import SecondTitle from "../../ui/SecondTitle";
const BrandBanner = () => {
  return (
    <div className="flex flex-col items-center justifiy-center my-30">
      <div className="pb-6">
        <SecondTitle line1="Ils nous font confiance" size="lg" />
      </div>
      <div>
        <LogoBanner />
      </div>
    </div>
  );
};

export default BrandBanner;
