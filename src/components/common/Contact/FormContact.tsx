import { useState } from "react";
import { Input, Textarea } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";

type FormData = {
  name: string;
  surname: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const FormContact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!formData.surname.trim()) {
      newErrors.name = "Le prénom est requis";
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

    setIsSubmitting(true);

    // Simuler un appel API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Form submitted:", formData);

    // Reset form
    setFormData({ name: "", surname: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl my-8 border border-primary p-6 rounded-lg"
    >
      <div className="space-y-6">
        <div className="flex gap-4">
          <Input
            label="Nom"
            name="name"
            type="text"
            placeholder="Dupont"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            fullWidth
          />
          <Input
            label="Prénom"
            name="surname"
            type="text"
            placeholder="Jean"
            value={formData.surname}
            onChange={handleChange}
            error={errors.surname}
            required
            fullWidth
          />
        </div>

        {/* Email */}
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

        {/* Sujet */}
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

        {/* Message */}
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

        {/* Submit Button */}
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
