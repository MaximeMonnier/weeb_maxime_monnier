import { useState } from "react";
import { Input, Textarea } from "../ui/Input";
import MainButton from "../ui/Button/MainButton";

type FormData = {
  title: string;
  content: string;
  author: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const FormContact = () => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    author: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Le contenu est requis";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Le content est requis";
    } else if (formData.content.trim().length < 10) {
      newErrors.content = "Le content doit contenir au moins 10 caractères";
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
    setFormData({
      title: "",
      content: "",
      author: "",
    });
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
          <Input
            label="Auteur"
            name="author"
            type="text"
            placeholder="Jean"
            value={formData.author}
            onChange={handleChange}
            error={errors.author}
            required
            fullWidth
          />
        </div>

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
            {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
          </MainButton>
        </div>
      </div>
    </form>
  );
};

export default FormContact;
