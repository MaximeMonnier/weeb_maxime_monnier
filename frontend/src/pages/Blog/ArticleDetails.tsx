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

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="container-custom mt-32">
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-600 text-sm mb-4">
        By {article.author} on{" "}
        {new Date(article.created_at).toLocaleDateString()}
      </p>
      <p className="text-gray-800">{article.content}</p>
    </div>
  );
};

export default ArticleDetails;
