import { useParams } from "react-router-dom";
import ArticleData from "../../data/articles.json";

const ArticleDetails = () => {
  const { id } = useParams();
  const article = ArticleData.find((a) => a.id === Number(id));

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="container-custom mt-32">
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-600 text-sm mb-4">
        By {article.author} on{" "}
        {new Date(article.createdAt).toLocaleDateString()}
      </p>
      <p className="text-gray-800">{article.content}</p>
    </div>
  );
};

export default ArticleDetails;
