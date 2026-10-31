import { useEffect, useRef, useState } from "react";
import { Input, Textarea } from "../../ui/Input";
import Button from "../../ui/Button/Button";
import { apiFetch, type ApiError } from "../../../lib/api";
import type { FormApiErrors } from "../../../lib/apiErrors";
import { useForm } from "../../../hooks/useForm";
import type { FormErrors } from "../../../hooks/useForm";
import ErrorAlert from "../../ui/Alert/ErrorAlert";
import type { Article } from "../../../types/article";

// Pas `FormData` : le nom masquerait celui du navigateur, qui porte l'image.
type Saisie = {
  title: string;
  content: string;
};

const CHAMPS = ["title", "content", "cover"] as const;

const VALEURS_INITIALES: Saisie = {
  title: "",
  content: "",
};

// `null` laisse l'image de l'article telle quelle, `"retiree"` l'efface.
type Image = { fichier: File; apercu: string } | "retiree" | null;

// Les limites de CouvertureField (backend/articles/serializers.py), qui juge en
// plus le contenu : un fichier renommé en .png passe ici et pas là-bas.
const TAILLE_IMAGE_MAX = 5 * 1024 * 1024;
const TYPES_IMAGE = ["image/jpeg", "image/png", "image/webp"];

function regleImage(image: Image): string | undefined {
  if (image === null || image === "retiree") return undefined;
  if (image.fichier.size > TAILLE_IMAGE_MAX) return "L'image dépasse 5 Mo.";
  if (!TYPES_IMAGE.includes(image.fichier.type)) {
    return "Formats acceptés : JPEG, PNG et WebP.";
  }
  return undefined;
}

const reglesDeSaisie = (
  formData: Saisie,
  image: Image,
): FormErrors<Saisie, "cover"> => {
  const newErrors: FormErrors<Saisie, "cover"> = {};

  if (!formData.title.trim()) {
    newErrors.title = "Le titre est requis";
  }

  if (!formData.content.trim()) {
    newErrors.content = "Le contenu est requis";
  } else if (formData.content.trim().length < 10) {
    newErrors.content = "Le contenu doit contenir au moins 10 caractères";
  }

  const erreurImage = regleImage(image);
  if (erreurImage) {
    newErrors.cover = erreurImage;
  }

  return newErrors;
};

// Le multipart seulement quand l'image change : sinon le JSON, qui ne la touche pas.
function corpsDeLEnvoi(values: Saisie, image: Image): BodyInit {
  if (image === null) {
    return JSON.stringify({ title: values.title, content: values.content });
  }
  const corps = new FormData();
  corps.append("title", values.title);
  corps.append("content", values.content);
  // Vide, le champ arrive à None côté API, qui retire l'image.
  corps.append("cover", image === "retiree" ? "" : image.fichier);
  return corps;
}

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
    markChanged,
  } = useForm<Saisie, "cover">(
    article
      ? { title: article.title, content: article.content }
      : VALEURS_INITIALES,
  );
  const [image, setImage] = useState<Image>(null);
  const champImage = useRef<HTMLInputElement>(null);

  const apercuChoisi = image !== null && image !== "retiree" ? image.apercu : null;
  // Libère l'aperçu remplacé, et le dernier quand le formulaire se démonte.
  useEffect(
    () => () => {
      if (apercuChoisi) URL.revokeObjectURL(apercuChoisi);
    },
    [apercuChoisi],
  );
  const apercu =
    apercuChoisi ?? (image === "retiree" ? null : (article?.cover ?? null));

  function choisirImage(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    setImage(fichier ? { fichier, apercu: URL.createObjectURL(fichier) } : null);
    markChanged("cover");
  }

  function retirerImage() {
    // Sans image enregistrée, rien à effacer : l'envoi reste en JSON.
    setImage(article?.cover ? "retiree" : null);
    if (champImage.current) champImage.current.value = "";
    markChanged("cover");
  }

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: (values) => reglesDeSaisie(values, image),
      fields: CHAMPS,
      unauthorized: libelles.unauthorized,
      translate: article ? traduireRefusEdition : undefined,
      send: async (values) => {
        // Le token (utilisateur connecté) est ajouté automatiquement par apiFetch.
        // L'auteur est défini côté serveur (perform_create) : il ne part jamais d'ici.
        const body = corpsDeLEnvoi(values, image);
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
        retirerImage();
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

        <Input
          ref={champImage}
          label="Image de couverture"
          name="cover"
          type="file"
          accept={TYPES_IMAGE.join(",")}
          onChange={choisirImage}
          error={errors.cover}
          helperText="JPEG, PNG ou WebP, 5 Mo au plus."
          fullWidth
        />

        {apercu && (
          <div className="space-y-3">
            <img
              src={apercu}
              alt="Aperçu de l'image de couverture"
              className="aspect-video w-full object-cover rounded-lg"
            />
            <Button type="button" variant="outline" size="sm" onClick={retirerImage}>
              Retirer l'image
            </Button>
          </div>
        )}

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
