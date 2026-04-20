import { NavLink } from "react-router-dom";
import Button from "../../components/ui/Button/MainButton";
import { Input } from "../../components/ui/Input";
import MainTitle from "../../components/ui/Title/MainTitle";
import BlogCard from "../../components/common/Blog/BlogCard";

const Blog = () => {
  return (
    <>
      <div className="container-custom mt-15">
        <div className="flex flex-col items-center justify-center">
          <div>
            <MainTitle line1={<>Voici nos articles !</>} />
          </div>

          <div className="my-6 flex w-full flex-col gap-2 rounded-lg border border-primary p-2 md:w-8/12 md:flex-row md:items-center md:gap-4">
            <div className="w-full md:w-9/12">
              <Input fullWidth placeholder="Rechercher un article..." />
            </div>

            <div className="w-full md:w-3/12">
              <NavLink to="/add-article" className="block w-full">
                <Button fullWidth>+ Article</Button>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
      <div className="grid-cols-4 w-full gap-6 md:w-8/12 md:grid-cols-2">
        <BlogCard
          title="Titre de l'article"
          description="Description de l'article"
        >
          Contenu de l'article
        </BlogCard>
      </div>
    </>
  );
};

export default Blog;
