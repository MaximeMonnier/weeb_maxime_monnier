import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, type ApiError } from "../../lib/api";
import { toFormErrors } from "../../lib/apiErrors";
import { useIsAuthenticated } from "../../hooks/useIsAuthenticated";
import type { ArticleListItem } from "../../types/article";
import ErrorAlert from "../../components/ui/Alert/ErrorAlert";
import Button from "../../components/ui/Button/Button";
import { buttonClasses } from "../../components/ui/Button/buttonClasses";
import HeroTitle from "../../components/ui/Title/HeroTitle";
import Modal from "../../components/ui/Modal/Modal";
import ArticleCard from "../../components/common/Blog/ArticleCard";
import FormArticle from "../../components/common/Blog/FormArticle";

type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const Blog = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();

  const [articles, setArticles] = useState<ArticleListItem[] | null>(null);
  const [pageSuivante, setPageSuivante] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // `next` est une URL absolue qu'apiFetch préfixerait deux fois : seule sa présence sert.
  const loadArticles = (numero = 1) => {
    apiFetch<Page<ArticleListItem>>(`/articles/?page=${numero}`)
      .then((page) => {
        setArticles((dejaAffiches) => {
          if (numero === 1 || dejaAffiches === null) return page.results;
          // Un article publié entre deux pages ramène le dernier de la précédente.
          const ids = new Set(dejaAffiches.map((article) => article.id));
          return [
            ...dejaAffiches,
            ...page.results.filter((article) => !ids.has(article.id)),
          ];
        });
        setPageSuivante(page.next ? numero + 1 : null);
        setErreur(null);
      })
      .catch((err: unknown) => {
        // Un 404 au-delà de la page 1 : une suppression a raccourci la liste.
        if (numero > 1 && (err as Partial<ApiError>).status === 404) {
          setPageSuivante(null);
          setErreur(null);
        } else {
          setErreur(toFormErrors(err, []).formError);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  return (
    <div className="container-custom mt-32">
      <HeroTitle
        center={false}
        line1={<>Nos articles vont vous plaire !</>}
      />
      <div className="w-full flex justify-between items-center mt-6">
        <p className="py-6 text-ink-soft">
          Des articles récents pour vous{" "}
          <span className="text-accent font-bold">inspirer !</span>
        </p>
        {isAuthenticated ? (
          <Button
            variant="primary"
            className="ml-4"
            onClick={() => setIsModalOpen(true)}
          >
            Créer un article
          </Button>
        ) : (
          <Link
            to="/login"
            className={buttonClasses({
              size: "cta",
              className: "focus-ring-primary ml-4",
            })}
          >
            Se connecter pour publier
          </Link>
        )}
      </div>
      <div className="mt-6 mb-16">
        {articles?.length === 0 && (
          <p className="text-ink-soft">Aucun article n'a encore été publié.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles?.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <div className="mt-6">
          <ErrorAlert message={erreur} />
        </div>
        {pageSuivante !== null && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                // Au clic : dans l'effet, un setState synchrone relancerait un rendu.
                setIsLoading(true);
                loadArticles(pageSuivante);
              }}
            >
              Voir plus d'articles
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        title="Nouvel article"
        onClose={() => setIsModalOpen(false)}
      >
        <div className="flex flex-col items-center justify-center">
          <FormArticle
            onCreated={() => {
              setIsModalOpen(false);
              loadArticles();
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Blog;
