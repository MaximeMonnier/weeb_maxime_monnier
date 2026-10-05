import { Input, Textarea } from "../../ui/Input";
import Button from "../../ui/Button/Button";
import { apiFetch, type ApiError } from "../../../lib/api";
import type { FormApiErrors } from "../../../lib/apiErrors";
import { useForm } from "../../../hooks/useForm";
import type { FormErrors } from "../../../hooks/useForm";
import ErrorAlert from "../../ui/Alert/ErrorAlert";
import type { Article } from "../../../types/article";

type FormData = {
  title: string;
  content: string;
};

const CHAMPS = ["title", "content"] as const;

const VALEURS_INITIALES: FormData = {
  title: "",
  content: "",
};

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};

  if (!formData.title.trim()) {
    newErrors.title = "Le titre est requis";
  }

  if (!formData.content.trim()) {
    newErrors.content = "Le contenu est requis";
  } else if (formData.content.trim().length < 10) {
    newErrors.content = "Le contenu doit contenir au moins 10 caractères";
  }

  return newErrors;
};

// apiFetch renouvelle le jeton d'accès : ce 401 ne vient plus de ses quinze minutes,
// mais d'une session finie ou d'un renouvellement en panne. Le formulaire vit dans une
// modale, donc aller se reconnecter emporte le texte saisi.
const LIBELLES = {
  creation: {
    bouton: "Publier l'article",
    envoi: "Publication...",
    unauthorized:
      "Vous devez être connecté pour publier, et votre session a peut-être expiré. Copiez votre texte avant de vous reconnecter : il ne sera pas conservé.",
  },
  edition: {
    bouton: "Enregistrer les modifications",
    envoi: "Enregistrement...",
    unauthorized:
      "Vous devez être connecté pour modifier cet article, et votre session a peut-être expiré. Copiez votre texte avant de vous reconnecter : il ne sera pas conservé.",
  },
};

const ARTICLE_SUPPRIME =
  "Cet article n'existe plus : il a été supprimé entre-temps.";

function traduireRefusEdition(
  refus: FormApiErrors<(typeof CHAMPS)[number]>,
  err: unknown,
) {
  return (err as Partial<ApiError>).status === 404
    ? { ...refus, formError: ARTICLE_SUPPRIME }
    : refus;
}

type FormArticleProps = {
  /** Article à modifier ; absent, le formulaire en crée un. */
  article?: Article;
  onCreated?: () => void;
  /** Reçoit l'article tel que l'API l'a enregistré. */
  onUpdated?: (article: Article) => void;
};

const FormArticle = ({ article, onCreated, onUpdated }: FormArticleProps) => {
  const libelles = article ? LIBELLES.edition : LIBELLES.creation;
  const {
    formData,
    setFormData,
    errors,
    formError,
    isSubmitting,
    handleChange,
    submit,
  } = useForm<FormData>(
    article
      ? { title: article.title, content: article.content }
      : VALEURS_INITIALES,
  );

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: reglesDeSaisie,
      fields: CHAMPS,
      unauthorized: libelles.unauthorized,
      translate: article ? traduireRefusEdition : undefined,
      send: async (values) => {
        // Le token (utilisateur connecté) est ajouté automatiquement par apiFetch.
        // L'auteur est défini côté serveur (perform_create) → on n'envoie que titre + contenu.
        const body = JSON.stringify({
          title: values.title,
          content: values.content,
        });
        if (article) {
          const enregistre = await apiFetch<Article>(`/articles/${article.id}/`, {
            method: "PATCH",
            body,
          });
          onUpdated?.(enregistre);
          return;
        }
        await apiFetch("/articles/", { method: "POST", body });
        setFormData(VALEURS_INITIALES);
        onCreated?.();
      },
    });

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl my-8 border border-line p-6 rounded-lg"
    >
      <ErrorAlert message={formError} />

      <div className="space-y-6">
        <Input
          label="Titre de l'article"
          name="title"
          type="text"
          placeholder="Titre de votre article"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          fullWidth
        />
        {/* Pas de champ "Auteur" : l'auteur = l'utilisateur connecté (défini côté serveur) */}

        <Textarea
          label="Description de votre article"
          name="content"
          placeholder="Écrivez votre description ici..."
          value={formData.content}
          onChange={handleChange}
          error={errors.content}
          minRows={5}
          required
          fullWidth
        />

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? libelles.envoi : libelles.bouton}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default FormArticle;
