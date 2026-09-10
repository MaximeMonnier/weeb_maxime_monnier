import { Input, Textarea } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";
import { apiFetch } from "../../../lib/api";
import { toFormErrors } from "../../../lib/apiErrors";
import { useForm } from "../../../hooks/useForm";
import type { FormErrors } from "../../../hooks/useForm";
import ErrorAlert from "../../ui/Alert/ErrorAlert";

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

// Le parent (Blog) passe une fonction appelée après une création réussie
type FormArticleProps = { onCreated?: () => void };

const FormArticle = ({ onCreated }: FormArticleProps) => {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validate,
  } = useForm<FormData>(VALEURS_INITIALES);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(reglesDeSaisie)) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      // Le token (utilisateur connecté) est ajouté automatiquement par apiFetch.
      // L'auteur est défini côté serveur (perform_create) → on n'envoie que titre + contenu.
      await apiFetch("/articles/", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
        }),
      });
      setFormData(VALEURS_INITIALES);
      onCreated?.(); // prévient le Blog : ferme la modale + recharge la liste
    } catch (err) {
      // Le jeton d'accès ne vaut que quinze minutes et rien ne le renouvelle : le 401
      // frappe surtout un article rédigé lentement. Le formulaire vit dans une modale
      // de /blog, donc aller se reconnecter emporte le texte saisi.
      const { fieldErrors, formError } = toFormErrors(err, CHAMPS, {
        unauthorized:
          "Vous devez être connecté pour publier, et votre session a peut-être expiré. Copiez votre texte avant de vous reconnecter : il ne sera pas conservé.",
      });
      setErrors(fieldErrors);
      setFormError(formError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl my-8 border border-primary p-6 rounded-lg"
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

        {/* Message */}
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

        {/* Submit Button */}
        <div className="flex justify-center">
          <MainButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Publication..." : "Publier l'article"}
          </MainButton>
        </div>
      </div>
    </form>
  );
};

export default FormArticle;
