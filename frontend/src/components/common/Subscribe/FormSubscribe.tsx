import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";

type FormData = {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const FormSubscribe = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      newErrors.surname = "Le prénom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
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

    console.log("Subscribe submitted:", {
      name: formData.name,
      surname: formData.surname,
      email: formData.email,
      // Ne jamais logger le mot de passe en production
    });

    // TODO: Gérer l'inscription réelle
    // Reset form
    setFormData({
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl my-8 border border-primary p-6 rounded-lg"
    >
      <div className="space-y-6">
        {/* Nom et Prénom */}
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

        {/* Password */}
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
          required
          fullWidth
        />

        {/* Confirm Password */}
        <Input
          label="Confirmer le mot de passe"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
          fullWidth
        />

        {/* Terms and Conditions */}
        <div className="text-sm text-secondary">
          En vous inscrivant, vous acceptez nos{" "}
          <Link
            to="/terms"
            className="text-accent hover:underline focus-ring-primary rounded"
          >
            conditions d'utilisation
          </Link>{" "}
          et notre{" "}
          <Link
            to="/privacy"
            className="text-accent hover:underline focus-ring-primary rounded"
          >
            politique de confidentialité
          </Link>
          .
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <MainButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Création du compte..." : "Créer mon compte"}
          </MainButton>
        </div>

        {/* Login link */}
        <div className="text-center text-sm text-secondary">
          Vous avez déjà un compte ?{" "}
          <Link
            to="/login"
            className="text-accent hover:underline focus-ring-primary rounded"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </form>
  );
};

export default FormSubscribe;
