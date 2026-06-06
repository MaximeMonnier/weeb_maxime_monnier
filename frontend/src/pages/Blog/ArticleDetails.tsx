import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useEffect, useState } from "react";
import type { Article } from "../../types/article";

const ArticleDetails = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    apiFetch<Article>(`/articles/${id}/`).then(setArticle).catch(console.error);
  }, [id]);

  if (!article)
    return <div className="container-custom mt-32">Chargement…</div>;

  return (
    <div className="container-custom mt-32">
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      <p className="text-tertiary text-sm mb-4">
        Par {article.author} le{" "}
        {new Date(article.created_at).toLocaleDateString()}
      </p>
      <p className="text-secondary">{article.content}</p>
    </div>
  );
};

export default ArticleDetails;
