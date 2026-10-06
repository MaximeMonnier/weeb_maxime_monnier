import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch, type ApiError } from "../../lib/api";
import { toFormErrors } from "../../lib/apiErrors";
import type { Article } from "../../types/article";
import ErrorAlert from "../../components/ui/Alert/ErrorAlert";
import Button from "../../components/ui/Button/Button";
import { buttonClasses } from "../../components/ui/Button/buttonClasses";
import Modal from "../../components/ui/Modal/Modal";
import FormArticle from "../../components/common/Blog/FormArticle";

// L'identifiant voyage avec ce que l'API a répondu : comparé à celui de l'URL, il
// dit si l'écran répond encore à l'article demandé, sans qu'aucun effet ait à
// remettre un état à zéro — un setState synchrone y relancerait un rendu pour rien.
type Resultat = { id: string } & (
  | { statut: "article"; article: Article }
  | { statut: "introuvable" }
  | { statut: "erreur"; message: string | null }
);

const ARTICLE_DEJA_SUPPRIME =
  "Cet article n'existe plus : il a déjà été supprimé.";

// Une ligne vide sépare deux paragraphes, et chacun reçoit son `<p>` : un lecteur
// d'écran les annonce alors un par un. Le texte reste échappé par React.
function paragraphes(texte: string): string[] {
  return texte
    .split(/\n\s*\n/)
    .map((paragraphe) => paragraphe.trim())
    .filter(Boolean);
}

// Le même écran pour le 404 de l'API et pour une adresse sans identifiant : dans
// les deux cas l'article n'existe pas, et il ne reste que le retour à la liste.
function ArticleIntrouvable() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Article introuvable</h1>
      <p className="text-ink-soft mb-6">
        Cet article n'existe pas ou a été supprimé.
      </p>
      <Link
        to="/blog"
        className={buttonClasses({
          size: "cta",
          className: "focus-ring-primary",
        })}
      >
        Retour aux articles
      </Link>
    </>
  );
}

const ArticleDetails = () => {
  const { id } = useParams();
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
            // Un article se lit sans compte : le « reconnectez-vous » que
            // `toFormErrors` donne par défaut au 401 enverrait le lecteur là où il
            // n'a rien à faire. Ce 401 suit un renouvellement de jeton en échec.
            message: toFormErrors(err, [], {
              unauthorized:
                "L'article n'a pas pu être chargé. Rechargez la page, puis réessayez.",
            }).formError,
          });
        }
      });

    return () => {
      obsolete = true;
    };
  }, [id]);

  function fermerLaConfirmation() {
    setIsConfirmingDelete(false);
    setDeleteError(null);
  }

  async function supprimer(articleId: number) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch<null>(`/articles/${articleId}/`, { method: "DELETE" });
      // Remplacée : le retour arrière rouvrirait la page d'un article effacé.
      navigate("/blog", { replace: true });
    } catch (err) {
      setDeleteError(
        (err as Partial<ApiError>).status === 404
          ? ARTICLE_DEJA_SUPPRIME
          : toFormErrors(err, []).formError,
      );
      setIsDeleting(false);
    }
  }

  // Le résultat d'un autre identifiant ne vaut plus rien : le temps que la nouvelle
  // réponse arrive, l'écran repasse au chargement.
  const recu = resultat?.id === id ? resultat : null;

  // Une seule branche occupe la page, sous l'alerte qui, elle, ne bouge pas.
  function contenu() {
    if (!id) return <ArticleIntrouvable />;
    if (recu === null) return <p>Chargement…</p>;
    if (recu.statut === "introuvable") return <ArticleIntrouvable />;
    // Le refus est déjà porté par l'alerte ; reste à ne pas laisser la page sans
    // issue, l'effet ne repartant pas tant que l'identifiant ne change pas.
    if (recu.statut === "erreur")
      return (
        <Link
          to="/blog"
          className={buttonClasses({
            size: "cta",
            className: "focus-ring-primary",
          })}
        >
          Retour aux articles
        </Link>
      );

    return (
      <>
        <h1 className="text-2xl font-bold mb-4">{recu.article.title}</h1>
        <p className="text-ink-faint text-sm mb-4">
          Par {recu.article.author} le{" "}
          {new Date(recu.article.created_at).toLocaleDateString()}
        </p>
        <div className="text-ink-soft space-y-4">
          {paragraphes(recu.article.content).map((paragraphe, index) => (
            // Une ligne simple, elle, reste un retour à la ligne dans le paragraphe.
            <p key={index} className="whitespace-pre-line">
              {paragraphe}
            </p>
          ))}
        </div>
        {recu.article.is_author && (
          <>
            <div className="mt-8 flex gap-4">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsConfirmingDelete(true)}
              >
                Supprimer
              </Button>
            </div>
            <Modal
              open={isEditing}
              title="Modifier l'article"
              onClose={() => setIsEditing(false)}
            >
              {/* Monté à chaque ouverture : les champs repartent de l'article affiché,
                  et un brouillon abandonné ne revient pas. */}
              {isEditing && (
                <div className="flex flex-col items-center justify-center">
                  <FormArticle
                    article={recu.article}
                    onUpdated={(article) => {
                      setIsEditing(false);
                      setResultat({ ...recu, article });
                    }}
                  />
                </div>
              )}
            </Modal>
            <Modal
              open={isConfirmingDelete}
              title="Supprimer l'article"
              onClose={fermerLaConfirmation}
            >
              <ErrorAlert message={deleteError} />
              <p className="mb-6">
                La suppression est définitive : l'article ne pourra pas être
                récupéré.
              </p>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={fermerLaConfirmation}>
                  Annuler
                </Button>
                <Button
                  disabled={isDeleting}
                  onClick={() => supprimer(recu.article.id)}
                >
                  Supprimer
                </Button>
              </div>
            </Modal>
          </>
        )}
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
