import { useState } from "react";
import { Link } from "react-router-dom";
import { Input, Textarea } from "../../ui/Input";
import Button from "../../ui/Button/Button";
import { apiFetch } from "../../../lib/api";
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
    formError,
    isSubmitting,
    handleChange,
    submit,
  } = useForm<FormData>(VALEURS_INITIALES, {
    // La confirmation parle du message parti : la première frappe du suivant la périme.
    onChange: () => setConfirmation(null),
  });

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: reglesDeSaisie,
      fields: CHAMPS,
      send: async (values) => {
        setConfirmation(null);
        await apiFetch("/contact/", {
          method: "POST",
          body: JSON.stringify({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            subject: values.subject,
            message: values.message,
          }),
        });
        setFormData(VALEURS_INITIALES);
        // Le formulaire se vide au succès : sans ce message, rien ne le distinguerait
        // d'un échec.
        setConfirmation("Votre message est parti. Nous vous répondrons par email.");
      },
    });

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl my-8 border border-line p-6 rounded-lg"
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

        <div className="text-sm text-ink-soft">
          Vos données servent uniquement à répondre à votre message. En savoir
          plus dans notre{" "}
          <Link
            to="/privacy"
            className="text-accent hover:underline focus-ring-primary rounded"
          >
            politique de confidentialité
          </Link>
          .
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            // Sans ce verrou, un double clic entame un quota de cinq messages par heure.
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default FormContact;
