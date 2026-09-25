import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, type ApiError } from "../../lib/api";
import { toFormErrors } from "../../lib/apiErrors";
import type { Article } from "../../types/article";
import ErrorAlert from "../../components/ui/Alert/ErrorAlert";

// L'identifiant voyage avec ce que l'API a répondu : comparé à celui de l'URL, il
// dit si l'écran répond encore à l'article demandé, sans qu'aucun effet ait à
// remettre un état à zéro — un setState synchrone y relancerait un rendu pour rien.
type Resultat = { id: string } & (
  | { statut: "article"; article: Article }
  | { statut: "introuvable" }
  | { statut: "erreur"; message: string | null }
);

// Le même écran pour le 404 de l'API et pour une adresse sans identifiant : dans
// les deux cas l'article n'existe pas, et il ne reste que le retour à la liste.
function ArticleIntrouvable() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Article introuvable</h1>
      <p className="text-secondary mb-6">
        Cet article n'existe pas ou a été supprimé.
      </p>
      <Link to="/blog" className="btn-primary focus-ring-primary">
        Retour aux articles
      </Link>
    </>
  );
}

const ArticleDetails = () => {
  const { id } = useParams();
  const [resultat, setResultat] = useState<Resultat | null>(null);

  useEffect(() => {
    // Un `:id` vide ne vient que d'un lien fautif : l'appel partirait vers
    // /articles/undefined/ pour en revenir avec le 404 que le rendu pose déjà.
    if (!id) return;

    // Drapeau plutôt qu'AbortController : une requête coupée lève une DOMException,
    // qu'`isApiError` ne distingue pas d'une panne réseau — l'article demandé
    // s'effacerait derrière un « serveur injoignable » qui n'a pas eu lieu.
    let obsolete = false;

    apiFetch<Article>(`/articles/${id}/`)
      .then((article) => {
        if (!obsolete) setResultat({ id, statut: "article", article });
      })
      .catch((err: unknown) => {
        if (obsolete) return;
        // Seul le 404 dit que l'article n'existe pas : les autres refus laissent
        // le lecteur réessayer plutôt que de lui annoncer une suppression.
        if ((err as Partial<ApiError>).status === 404) {
          setResultat({ id, statut: "introuvable" });
        } else {
          setResultat({
            id,
            statut: "erreur",
            message: toFormErrors(err, []).formError,
          });
        }
      });

    return () => {
      obsolete = true;
    };
  }, [id]);

  // Le résultat d'un autre identifiant ne vaut plus rien : le temps que la nouvelle
  // réponse arrive, l'écran repasse au chargement.
  const recu = resultat?.id === id ? resultat : null;

  // Une seule branche occupe la page, sous l'alerte qui, elle, ne bouge pas.
  function contenu() {
    if (!id) return <ArticleIntrouvable />;
    if (recu === null) return <p>Chargement…</p>;
    if (recu.statut === "introuvable") return <ArticleIntrouvable />;
    // Le refus est déjà porté par l'alerte : l'écrire ici le dirait deux fois.
    if (recu.statut === "erreur") return null;

    return (
      <>
        <h1 className="text-2xl font-bold mb-4">{recu.article.title}</h1>
        <p className="text-tertiary text-sm mb-4">
          Par {recu.article.author} le{" "}
          {new Date(recu.article.created_at).toLocaleDateString()}
        </p>
        <p className="text-secondary">{recu.article.content}</p>
      </>
    );
  }

  return (
    <div className="container-custom mt-32">
      {/* Rendue à tous les écrans et vide la plupart du temps : une région live
          apparue avec son texte n'est pas annoncée de façon fiable. */}
      <ErrorAlert message={recu?.statut === "erreur" ? recu.message : null} />
      {contenu()}
    </div>
  );
};

export default ArticleDetails;
