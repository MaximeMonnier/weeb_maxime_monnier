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
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// `confirmPassword` n'est pas envoyé : l'API ne le connaît pas et ne peut rien en dire.
const CHAMPS = ["first_name", "last_name", "email", "password"] as const;

// L'API nomme l'adresse déjà inscrite (AMELIORATIONS.md, à reprendre avec #65).
// Relayer son message ferait du formulaire un test d'existence de compte.
const REFUS_NEUTRE =
  "Impossible de créer un compte avec ces informations. Si vous avez déjà un compte, connectez-vous.";

const VALEURS_INITIALES: FormData = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
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

  return newErrors;
};

const FormSubscribe = () => {
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
      await apiFetch("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
        }),
      });
      navigate("/login"); // compte créé mais INACTIF → on l'envoie vers la connexion
    } catch (err) {
      const { fieldErrors, formError } = toFormErrors(err, CHAMPS);
      // Le message part sous le formulaire et non sous le champ : le seul fait de
      // pointer l'adresse dirait déjà qu'elle est prise.
      const { email, ...autres } = fieldErrors;
      setErrors(autres);
      setFormError(email ? REFUS_NEUTRE : formError);
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
        {/* Prénom et nom */}
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
