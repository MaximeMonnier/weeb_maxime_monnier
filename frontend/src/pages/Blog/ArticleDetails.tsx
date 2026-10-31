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

// L'id comparé à celui de l'URL évite de remettre l'état à zéro dans l'effet.
type Resultat = { id: string } & (
  | { statut: "article"; article: Article }
  | { statut: "introuvable" }
  | { statut: "erreur"; message: string | null }
);

const ARTICLE_DEJA_SUPPRIME =
  "Cet article n'existe plus : il a déjà été supprimé.";

function paragraphes(texte: string): string[] {
  return texte
    .split(/\n\s*\n/)
    .map((paragraphe) => paragraphe.trim())
    .filter(Boolean);
}

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
    if (!id) return;

    // Pas d'AbortController : sa DOMException passerait pour une panne réseau.
    let obsolete = false;

    apiFetch<Article>(`/articles/${id}/`)
      .then((article) => {
        if (!obsolete) setResultat({ id, statut: "article", article });
      })
      .catch((err: unknown) => {
        if (obsolete) return;
        if ((err as Partial<ApiError>).status === 404) {
          setResultat({ id, statut: "introuvable" });
        } else {
          setResultat({
            id,
            statut: "erreur",
            // Un article se lit sans compte : pas de « reconnectez-vous » sur ce 401.
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
      // replace : le retour arrière rouvrirait un article effacé.
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

  const recu = resultat?.id === id ? resultat : null;

  function contenu() {
    if (!id) return <ArticleIntrouvable />;
    if (recu === null) return <p>Chargement…</p>;
    if (recu.statut === "introuvable") return <ArticleIntrouvable />;
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
        {recu.article.cover && (
          <img
            src={recu.article.cover}
            alt=""
            className="aspect-video w-full object-cover rounded-lg mb-6"
          />
        )}
        <h1 className="text-2xl font-bold mb-4">{recu.article.title}</h1>
        <p className="text-ink-faint text-sm mb-4">
          Par {recu.article.author} le{" "}
          {new Date(recu.article.created_at).toLocaleDateString()}
        </p>
        <div className="text-ink-soft space-y-4">
          {paragraphes(recu.article.content).map((paragraphe, index) => (
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
              {/* Remonté à chaque ouverture : un brouillon abandonné ne revient pas. */}
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
              // Le DELETE parti ne se rappelle pas : Échap reste muet jusqu'à la réponse.
              onCancel={(e) => {
                if (isDeleting) e.preventDefault();
              }}
            >
              <ErrorAlert message={deleteError} />
              <p className="mb-6">
                La suppression est définitive : l'article ne pourra pas être
                récupéré.
              </p>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  disabled={isDeleting}
                  onClick={fermerLaConfirmation}
                >
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
      {/* Toujours rendue : une région live apparue avec son texte n'est pas annoncée. */}
      <ErrorAlert message={recu?.statut === "erreur" ? recu.message : null} />
      {contenu()}
    </div>
  );
};

export default ArticleDetails;
