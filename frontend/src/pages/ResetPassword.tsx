import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { toFormErrors } from "../lib/apiErrors";
import { useForm } from "../hooks/useForm";
import type { FormErrors } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

// La clé porte le nom du champ côté API : `toFormErrors` range son refus dessous.
type FormData = { new_password: string };

const VALEURS_INITIALES: FormData = { new_password: "" };

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};

  if (formData.new_password.length < 8) {
    newErrors.new_password = "Le mot de passe doit contenir au moins 8 caractères.";
  }

  return newErrors;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  // uid et token viennent du lien reçu par email, jamais d'une réponse de l'API.
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

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
      await apiFetch<{ detail: string }>("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({
          uid,
          token,
          new_password: formData.new_password,
        }),
      });
      navigate("/login", { replace: true });
    } catch (err) {
      const { fieldErrors, formError } = toFormErrors(err, ["new_password"]);
      setErrors(fieldErrors);
      // Le lien mort est le seul refus que l'API rende sans dire quoi faire — son
      // "detail" tient en trois mots. Une panne ou un serveur injoignable gardent le
      // leur : les ramener au lien invalide ferait redemander un lien encore bon.
      const lienRefuse =
        !fieldErrors.new_password &&
        (err as { status?: number }).status === 400;
      setFormError(
        lienRefuse
          ? "Ce lien est invalide ou a déjà servi. Demandez-en un nouveau."
          : formError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <MainTitle
          line1={<>Nouveau mot de passe</>}
          line2="Choisissez le mot de passe de votre compte"
        />

        <div className="w-full max-w-md my-8 border border-primary p-6 rounded-lg">
          {!uid || !token ? (
            <p className="text-center">
              Ce lien est incomplet. Reprenez depuis la{" "}
              <Link
                to="/forgot-password"
                className="text-accent hover:underline focus-ring-primary rounded"
              >
                demande de réinitialisation
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <ErrorAlert message={formError} />

              <div className="space-y-6">
                <Input
                  label="Nouveau mot de passe"
                  name="new_password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.new_password}
                  onChange={handleChange}
                  helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
                  error={errors.new_password}
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
                    {isSubmitting
                      ? "Veuillez patienter…"
                      : "Valider le nouveau mot de passe"}
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

export default ResetPassword;
