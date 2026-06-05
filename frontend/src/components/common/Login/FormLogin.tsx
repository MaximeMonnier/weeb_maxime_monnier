import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";

type FormData = {
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const FormLogin = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
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

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
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

    console.log("Login submitted:", formData);

    // TODO: Gérer l'authentification réelle
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md my-8 border border-primary p-6 rounded-lg"
    >
      <div className="space-y-6">
        {/* Email */}
        <Input
          label="Adresse email"
          name="email"
          type="email"
          placeholder="jean.dupont@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
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
          helperText="Minimum 8 caractères"
          required
          fullWidth
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-accent hover:underline focus-ring-primary rounded"
          >
            Mot de passe oublié ?
          </Link>
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
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </MainButton>
        </div>

        {/* Sign up link */}
        <div className="text-center text-sm text-secondary">
          Pas encore de compte ?{" "}
          <Link
            to="/contact"
            className="text-accent hover:underline focus-ring-primary rounded"
          >
            Nous rejoindre
          </Link>
        </div>
      </div>
    </form>
  );
};

export default FormLogin;
