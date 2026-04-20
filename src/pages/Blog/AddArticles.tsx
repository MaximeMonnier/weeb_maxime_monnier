import Maintittle from "../../components/ui/Title/MainTitle";
import FormAddArticle from "../../components/common/Blog/FromAddArticle";

const AddArticles = () => {
  return (
    <div className="container-custom mt-15">
      <div className="flex flex-col items-center justify-center">
        <div>
          <Maintittle line1={<>Ajouter un article</>} />
        </div>

        <div className="flex justify-center w-full py-3">
          <FormAddArticle />
        </div>
      </div>
    </div>
  );
};

export default AddArticles;
