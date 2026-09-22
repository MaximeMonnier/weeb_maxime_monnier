import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, type ApiError } from "../../lib/api";
import { useIsAuthenticated } from "../../hooks/useIsAuthenticated";
import type { Article } from "../../types/article";
import Button from "../../components/ui/Button/MainButton";
import MainTitle from "../../components/ui/Title/MainTitle";
import Card from "../../components/common/Blog/Card.tsx";

import { useRef } from "react";
import FormArticle from "../../components/common/Blog/FormArticle.tsx";

// La forme que DRF donne à toute liste de l'API, découpée en pages.
type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const Blog = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isAuthenticated = useIsAuthenticated();

  const [articles, setArticles] = useState<Article[]>([]);
  // Numéro à demander ensuite, null quand la dernière page est affichée.
  const [pageSuivante, setPageSuivante] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // La page 1 remplace la liste — chargement initial ET rechargement après
  // création —, les suivantes s'y ajoutent. `next` est une URL absolue, que
  // apiFetch préfixerait une seconde fois : seule sa présence sert ici.
  const loadArticles = (numero = 1) => {
    apiFetch<Page<Article>>(`/articles/?page=${numero}`)
      .then((page) => {
        setArticles((dejaAffiches) => {
          if (numero === 1) return page.results;
          // Un article publié entre deux pages décale la liste d'un cran : le
          // dernier de la page d'avant revient en tête de celle-ci.
          const ids = new Set(dejaAffiches.map((article) => article.id));
          return [
            ...dejaAffiches,
            ...page.results.filter((article) => !ids.has(article.id)),
          ];
        });
        setPageSuivante(page.next ? numero + 1 : null);
      })
      .catch((err: unknown) => {
        // Au-delà de la première, que DRF rend toujours, un 404 dit qu'une
        // suppression a raccourci la liste : le bouton n'aurait plus rien à charger.
        if (numero > 1 && (err as Partial<ApiError>).status === 404) {
          setPageSuivante(null);
        } else {
          console.error(err);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  return (
    <div className="container-custom mt-32">
      <MainTitle
        center={false}
        as="h2"
        line1={<>Nos articles vont vous plaire !</>}
      />
      <div className="w-full flex justify-between items-center mt-6">
        <p className="py-6 text-secondary">
          Des articles récents pour vous{" "}
          <span className="text-accent font-bold">inspirer !</span>
        </p>
        {/* L'API refuse l'écriture au visiteur : le formulaire ne lui vaudrait
            qu'un refus, une fois l'article rédigé. */}
        {isAuthenticated ? (
          <Button
            variant="primary"
            className="ml-4"
            onClick={() => dialogRef.current?.showModal()}
          >
            Créer un article
          </Button>
        ) : (
          <Link to="/login" className="btn-primary focus-ring-primary ml-4">
            Se connecter pour publier
          </Link>
        )}
      </div>
      <div className="mt-6 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card key={article.id} article={article} />
          ))}
        </div>
        {pageSuivante !== null && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                // Posé au clic et non dans loadArticles, que l'effet appelle :
                // un setState synchrone y relancerait un rendu pour rien.
                setIsLoading(true);
                loadArticles(pageSuivante);
              }}
            >
              Voir plus d'articles
            </Button>
          </div>
        )}
      </div>

      {/* la modal */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-2xl rounded-lg bg-secondary p-6 text-primary backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Nouvel article</h3>
          {/* 4️⃣ Le bouton fermer */}
          <button
            className="text-primary cursor-pointer text-2xl font-bold hover:text-red-800 transition-colors"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Placeholder — le vrai formulaire viendra ici */}
        <div className="flex flex-col items-center justify-center">
          <FormArticle
            onCreated={() => {
              dialogRef.current?.close(); // ferme la modale
              loadArticles(); // recharge la liste → le nouvel article apparaît
            }}
          />
        </div>
      </dialog>
    </div>
  );
};

export default Blog;
