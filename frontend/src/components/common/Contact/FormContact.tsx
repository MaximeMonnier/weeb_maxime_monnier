import { useState } from "react";
import { Input, Textarea } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";
import { apiFetch } from "../../../lib/api";
import { toFormErrors } from "../../../lib/apiErrors";
import ErrorAlert from "../../ui/Alert/ErrorAlert";

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const CHAMPS = [
  "first_name",
  "last_name",
  "email",
  "subject",
  "message",
] as const;

const FormContact = () => {
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setConfirmation(null);
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "Le nom est requis";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Le prénom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormError(null);
    setConfirmation(null);
    // Manquait : le bouton restait actif pendant l'envoi, et chaque double clic
    // entamait un quota de cinq messages par heure.
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
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        subject: "",
        message: "",
      });
      // Le formulaire se vidait sans rien dire : rien ne distinguait l'envoi réussi
      // de l'échec muet.
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
      <div className="space-y-6">
        <ErrorAlert message={formError} />
        {/* Monté en permanence : une région live apparue avec son texte n'est pas
            annoncée de façon fiable. */}
        <p role="status" className="form-alert-success">
          {confirmation}
        </p>

        <div className="flex gap-4">
          <Input
            label="Nom"
            name="first_name"
            type="text"
            placeholder="Dupont"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            required
            fullWidth
          />
          <Input
            label="Prénom"
            name="last_name"
            type="text"
            placeholder="Jean"
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
