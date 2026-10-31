import type { ArticleListItem } from "../../../types/article";
import { Link } from "react-router-dom";

type ArticleCardProps = {
  article: ArticleListItem;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`}>
      <div className="h-full bg-surface-alt rounded-lg shadow-xl overflow-hidden border border-line">
        {/* Cadre vide de même ratio : les textes d'une rangée démarrent à la même hauteur. */}
        {article.cover ? (
          <img
            src={article.cover}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="aspect-video bg-surface-hover" />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
          <p className="text-ink-faint text-sm mb-4">
            Par {article.author} le{" "}
            {new Date(article.created_at).toLocaleDateString()}
          </p>
          <p className="text-ink-soft">
            {article.excerpt_truncated ? `${article.excerpt}...` : article.excerpt}
          </p>
        </div>
      </div>
    </Link>
  );
}
