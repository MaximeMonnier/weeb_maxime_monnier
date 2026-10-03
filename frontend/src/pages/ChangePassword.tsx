import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { toFormErrors } from "../lib/apiErrors";
import { saveTokens } from "../lib/tokens";
import { isComplexPassword } from "../lib/validationRules";
import { useForm } from "../hooks/useForm";
import type { FormErrors } from "../hooks/useForm";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

type FormData = {
  current_password: string;
  new_password: string;
  confirmPassword: string;
};

// `confirmPassword` n'est pas envoyé : l'API ne le connaît pas et ne peut rien en dire.
const CHAMPS = ["current_password", "new_password"] as const;

const VALEURS_INITIALES: FormData = {
  current_password: "",
  new_password: "",
  confirmPassword: "",
};

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};

  if (!formData.current_password) {
    newErrors.current_password = "Le mot de passe actuel est requis";
  }

  if (formData.new_password.length < 8) {
    newErrors.new_password = "Le mot de passe doit contenir au moins 8 caractères";
  } else if (!isComplexPassword(formData.new_password)) {
    newErrors.new_password =
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
  }

  if (formData.new_password !== formData.confirmPassword) {
    newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  return newErrors;
};

const ChangePassword = () => {
  const isAuthenticated = useIsAuthenticated();
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validate,
  } = useForm<FormData>(VALEURS_INITIALES, {
    onChange: () => setConfirmation(null),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(reglesDeSaisie)) {
      return;
    }
    setFormError(null);
    setConfirmation(null);
    setIsSubmitting(true);
    try {
      const reponse = await apiFetch<{ access: string; refresh: string }>(
        "/auth/password-change/",
        {
          method: "POST",
          body: JSON.stringify({
            current_password: formData.current_password,
            new_password: formData.new_password,
          }),
        },
      );
      // L'API a révoqué tous les refresh du compte, celui-ci compris : sans les
      // jetons neufs, la session s'éteindrait au prochain renouvellement.
      saveTokens(reponse);
      setFormData(VALEURS_INITIALES);
      setConfirmation(
        "Votre mot de passe est modifié. Vos autres appareils devront se reconnecter.",
      );
    } catch (err) {
      const { fieldErrors, formError } = toFormErrors(err, CHAMPS);
      setErrors(fieldErrors);
      setFormError(formError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <MainTitle
          line1={<>Changer de mot de passe</>}
          line2="Sans vous déconnecter ni attendre d'email"
        />

        <div className="w-full max-w-md my-8 border border-line p-6 rounded-lg">
          {!isAuthenticated ? (
            <p className="text-center">
              Cette page est réservée aux membres.{" "}
              <Link
                to="/login"
                className="text-accent hover:underline focus-ring-primary rounded"
              >
                Connectez-vous
              </Link>{" "}
              pour changer votre mot de passe.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <ErrorAlert message={formError} />
              {/* Monté en permanence : une région live apparue avec son texte n'est pas
                  annoncée de façon fiable. */}
              <p role="status" className="form-alert-success">
                {confirmation}
              </p>

              <div className="space-y-6">
                <Input
                  label="Mot de passe actuel"
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.current_password}
                  onChange={handleChange}
                  error={errors.current_password}
                  required
                  fullWidth
                />

                <Input
                  label="Nouveau mot de passe"
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.new_password}
                  onChange={handleChange}
                  helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
                  error={errors.new_password}
                  required
                  fullWidth
                />

                <Input
                  label="Confirmer le nouveau mot de passe"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                  fullWidth
                />

                <div className="flex justify-center">
                  <MainButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? "Veuillez patienter…" : "Changer le mot de passe"}
                  </MainButton>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
