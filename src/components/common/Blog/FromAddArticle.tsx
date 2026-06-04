import { useState } from "react";
import { Input, Textarea } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";

type FormData = {
  title: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const FormAddArticle = () => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    author: "",
    category: "",
    excerpt: "",
    content: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.author.trim()) {
      newErrors.author = "L'auteur est requis";
    }

    if (!formData.category.trim()) {
      newErrors.category = "La catégorie est requise";
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = "Le résumé est requis";
    } else if (formData.excerpt.trim().length < 20) {
      newErrors.excerpt = "Le résumé doit contenir au moins 20 caractères";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Le contenu est requis";
    } else if (formData.content.trim().length < 50) {
      newErrors.content = "Le contenu doit contenir au moins 50 caractères";
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

    await new Promise((resolve) => setTimeout(resolve, 1200));

    console.log("Article submitted:", formData);

    setFormData({
      title: "",
      author: "",
      category: "",
      excerpt: "",
      content: "",
    });

    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl my-8 border border-primary p-6 rounded-lg"
    >
      <div className="space-y-6">
        <Input
          label="Titre de l'article"
          name="title"
          type="text"
          placeholder="Ex: Les tendances React en 2026"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          fullWidth
        />

        <div className="flex flex-col gap-4 md:flex-row">
          <Input
            label="Auteur"
            name="author"
            type="text"
            placeholder="Ex: Jean Dupont"
            value={formData.author}
            onChange={handleChange}
            error={errors.author}
            required
            fullWidth
          />

          <Input
            label="Catégorie"
            name="category"
            type="text"
            placeholder="Ex: Développement web"
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
            required
            fullWidth
          />
        </div>

        <Textarea
          label="Résumé"
          name="excerpt"
          placeholder="Écris un court résumé de l'article..."
          value={formData.excerpt}
          onChange={handleChange}
          error={errors.excerpt}
          helperText="Quelques lignes pour présenter rapidement l'article"
          minRows={3}
          required
          fullWidth
        />

        <Textarea
          label="Contenu"
          name="content"
          placeholder="Rédige le contenu complet de ton article..."
          value={formData.content}
          onChange={handleChange}
          error={errors.content}
          minRows={8}
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
            {isSubmitting ? "Publication en cours..." : "Publier l'article"}
          </MainButton>
        </div>
      </div>
    </form>
  );
};

export default FormAddArticle;
