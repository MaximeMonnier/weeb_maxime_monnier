import LogoBanner from "../../ui/LogoBanner";
import SecondTitle from "../../ui/SecondTitle";
const BrandBanner = () => {
  return (
    <div className="flex flex-col items-center justifiy-center">
      <div>
        <SecondTitle line1="Ils nous font confiance" />
      </div>
      <div>
        <LogoBanner />
      </div>
    </div>
  );
};

export default BrandBanner;
