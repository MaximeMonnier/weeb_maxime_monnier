import type { ArticleListItem } from "../../../types/article";
import { Link } from "react-router-dom";

type ArticleCardProps = {
  article: ArticleListItem;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`}>
      <div className="bg-surface-alt rounded-lg shadow-xl overflow-hidden border border-line">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
          <p className="text-ink-faint text-sm mb-4">
            Par {article.author} le{" "}
            {new Date(article.created_at).toLocaleDateString()}
          </p>
          {/* Déjà coupé par l'API, qui dit aussi s'il l'a été : un article court
              arrive entier et ne reçoit pas de points de suspension. */}
          <p className="text-ink-soft">
            {article.excerpt_truncated ? `${article.excerpt}...` : article.excerpt}
          </p>
        </div>
      </div>
    </Link>
  );
}
