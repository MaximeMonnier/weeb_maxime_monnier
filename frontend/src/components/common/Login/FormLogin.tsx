import { Link } from "react-router-dom";
import { Input } from "../../ui/Input";
import MainButton from "../../ui/Button/MainButton";
import { apiFetch } from "../../../lib/api";
import { toFormErrors } from "../../../lib/apiErrors";
import { isValidEmail } from "../../../lib/validationRules";
import { useForm } from "../../../hooks/useForm";
import type { FormErrors } from "../../../hooks/useForm";
import ErrorAlert from "../../ui/Alert/ErrorAlert";
import { useNavigate } from "react-router-dom";

type FormData = {
  email: string;
  password: string;
};

const CHAMPS = ["email", "password"] as const;

const VALEURS_INITIALES: FormData = {
  email: "",
  password: "",
};

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};

  if (!formData.email.trim()) {
    newErrors.email = "L'email est requis";
  } else if (!isValidEmail(formData.email)) {
    newErrors.email = "L'email n'est pas valide";
  }

  if (!formData.password.trim()) {
    newErrors.password = "Le mot de passe est requis";
  } else if (formData.password.length < 8) {
    newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
  }

  return newErrors;
};

const FormLogin = () => {
  const navigate = useNavigate();

  const {
    formData,
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
      const data = await apiFetch<{ access: string; refresh: string }>(
        "/auth/login/",
        {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        },
      );
      localStorage.setItem("access", data.access); // 🔑 le token que apiFetch réutilisera
      localStorage.setItem("refresh", data.refresh);
      navigate("/");
    } catch (err) {
      // Un mot de passe faux et un compte pas encore validé donnent le même 401, en
      // anglais : les distinguer dirait à un inconnu quelles adresses sont inscrites.
      const { fieldErrors, formError } = toFormErrors(err, CHAMPS, {
        unauthorized:
          "Connexion impossible. Vérifiez votre email et votre mot de passe ; un compte tout juste créé doit d'abord être validé par un administrateur.",
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
      className="w-full max-w-md my-8 border border-primary p-6 rounded-lg"
    >
      <ErrorAlert message={formError} />

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
            to="/subscribe"
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
