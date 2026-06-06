import type { Article } from "../../../types/article";
import { Link } from "react-router-dom";

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`}>
      <div className="bg-secondary rounded-lg shadow-xl overflow-hidden border border-primary">
        {article.coverImg && (
          <img
            src={article.coverImg}
            alt={article.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
          <p className="text-tertiary text-sm mb-4">
            Par {article.author} le{" "}
            {new Date(article.created_at).toLocaleDateString()}
          </p>
          <p className="text-secondary">{article.content.slice(0, 100)}...</p>
        </div>
      </div>
    </Link>
  );
}
