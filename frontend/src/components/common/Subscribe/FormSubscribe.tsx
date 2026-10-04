import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../ui/Input";
import Button from "../../ui/Button/Button";
import { apiFetch } from "../../../lib/api";
import {
  PASSWORD_MIN_LENGTH,
  isComplexPassword,
  isConfirmedPassword,
  isLongEnoughPassword,
  isValidEmail,
} from "../../../lib/validationRules";
import { useForm } from "../../../hooks/useForm";
import type { FormErrors } from "../../../hooks/useForm";
import ErrorAlert from "../../ui/Alert/ErrorAlert";

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// `confirmPassword` n'est pas envoyé : l'API ne le connaît pas et ne peut rien en dire.
const CHAMPS = ["first_name", "last_name", "email", "password"] as const;

// L'API nomme l'adresse déjà inscrite (AMELIORATIONS.md).
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
  } else if (!isLongEnoughPassword(formData.password)) {
    newErrors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`;
  } else if (!isComplexPassword(formData.password)) {
    newErrors.password =
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
  }

  if (!formData.confirmPassword.trim()) {
    newErrors.confirmPassword = "La confirmation du mot de passe est requise";
  } else if (!isConfirmedPassword(formData.password, formData.confirmPassword)) {
    newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  return newErrors;
};

const FormSubscribe = () => {
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
    // La confirmation parle du compte créé : la première frappe de l'inscription
    // suivante la périme.
    onChange: () => setConfirmation(null),
  });

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: reglesDeSaisie,
      fields: CHAMPS,
      send: async (values) => {
        setConfirmation(null);
        await apiFetch("/auth/register/", {
          method: "POST",
          body: JSON.stringify({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            password: values.password,
          }),
        });
        setFormData(VALEURS_INITIALES);
        // Le compte est créé INACTIF : sans ce message, la connexion qui suit
        // renverrait un refus que rien n'explique.
        setConfirmation(
          "Votre compte est créé. Un administrateur doit l'activer avant votre première connexion.",
        );
      },
      // Le message part sous le formulaire et non sous le champ : le seul fait de
      // pointer l'adresse dirait déjà qu'elle est prise.
      translate: ({ fieldErrors: { email, ...autres }, formError }) => ({
        fieldErrors: autres,
        formError: email ? REFUS_NEUTRE : formError,
      }),
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
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          helperText={`Au moins ${PASSWORD_MIN_LENGTH} caractères avec majuscule, minuscule et chiffre`}
          required
          fullWidth
        />

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

        <div className="text-sm text-ink-soft">
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

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Création du compte..." : "Créer mon compte"}
          </Button>
        </div>

        <div className="text-center text-sm text-ink-soft">
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
