import { useState } from "react";
import { Input, Textarea } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";
import { apiFetch } from "../../../lib/api";
import { toFormErrors } from "../../../lib/apiErrors";
import { isValidEmail } from "../../../lib/validationRules";
import { useForm } from "../../../hooks/useForm";
import type { FormErrors } from "../../../hooks/useForm";
import ErrorAlert from "../../ui/Alert/ErrorAlert";

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
};

const CHAMPS = [
  "first_name",
  "last_name",
  "email",
  "subject",
  "message",
] as const;

const VALEURS_INITIALES: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  subject: "",
  message: "",
};

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};

  if (!formData.first_name.trim()) {
    newErrors.first_name = "Le prénom est requis";
  }

  if (!formData.last_name.trim()) {
    newErrors.last_name = "Le nom est requis";
  }

  if (!formData.email.trim()) {
    newErrors.email = "L'email est requis";
  } else if (!isValidEmail(formData.email)) {
    newErrors.email = "L'email n'est pas valide";
  }

  if (!formData.subject.trim()) {
    newErrors.subject = "Le sujet est requis";
  }

  if (!formData.message.trim()) {
    newErrors.message = "Le message est requis";
  } else if (formData.message.trim().length < 10) {
    newErrors.message = "Le message doit contenir au moins 10 caractères";
  }

  return newErrors;
};

const FormContact = () => {
  const [confirmation, setConfirmation] = useState<string | null>(null);

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
  } = useForm<FormData>(VALEURS_INITIALES, {
    // La confirmation parle du message parti : la première frappe du suivant la périme.
    onChange: () => setConfirmation(null),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(reglesDeSaisie)) {
      return;
    }

    setFormError(null);
    setConfirmation(null);
    // Désactive le bouton : sans cela, un double clic entame un quota de cinq
    // messages par heure.
    setIsSubmitting(true);

    try {
      await apiFetch("/contact/", {
        method: "POST",
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      setFormData(VALEURS_INITIALES);
      // Le formulaire se vide au succès : sans ce message, rien ne le distinguerait
      // d'un échec.
      setConfirmation("Votre message est parti. Nous vous répondrons par email.");
    } catch (err) {
      const { fieldErrors, formError } = toFormErrors(err, CHAMPS);
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
      {/* Monté en permanence : une région live apparue avec son texte n'est pas
          annoncée de façon fiable. */}
      <p role="status" className="form-alert-success">
        {confirmation}
      </p>

      <div className="space-y-6">
        <div className="flex gap-4">
          <Input
            label="Prénom"
            name="first_name"
            type="text"
            placeholder="Jean"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            required
            fullWidth
          />
          <Input
            label="Nom"
            name="last_name"
            type="text"
            placeholder="Dupont"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
            required
            fullWidth
          />
        </div>

        <Input
          label="Adresse email"
          name="email"
          type="email"
          placeholder="jean.dupont@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          helperText="Nous ne partagerons jamais votre email"
          required
          fullWidth
        />

        <Input
          label="Sujet"
          name="subject"
          type="text"
          placeholder="Objet de votre message"
          value={formData.subject}
          onChange={handleChange}
          error={errors.subject}
          required
          fullWidth
        />

        <Textarea
          label="Message"
          name="message"
          placeholder="Écrivez votre message ici..."
          value={formData.message}
          onChange={handleChange}
          error={errors.message}
          minRows={5}
          required
          fullWidth
        />

        <div className="flex justify-center">
          <MainButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
          </MainButton>
        </div>
      </div>
    </form>
  );
};

export default FormContact;
