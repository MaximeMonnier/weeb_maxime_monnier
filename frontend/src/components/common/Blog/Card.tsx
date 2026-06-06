import type { Article } from "../../../types/article";
import { Link } from "react-router-dom";

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`}>
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        {article.coverImg && (
          <img
            src={article.coverImg}
            alt={article.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
          <p className="text-gray-600 text-sm mb-4">
            By {article.author} on{" "}
            {new Date(article.created_at).toLocaleDateString()}
          </p>
          <p className="text-gray-800">{article.content.slice(0, 100)}...</p>
        </div>
      </div>
    </Link>
  );
}
