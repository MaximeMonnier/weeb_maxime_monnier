import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import {
  PASSWORD_MIN_LENGTH,
  isComplexPassword,
  isConfirmedPassword,
  isLongEnoughPassword,
} from "../lib/validationRules";
import { useForm } from "../hooks/useForm";
import type { FormErrors } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button/Button";
import HeroTitle from "../components/ui/Title/HeroTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

// La clé porte le nom du champ côté API : `toFormErrors` range son refus dessous.
type FormData = { new_password: string; confirmPassword: string };

// `confirmPassword` n'est pas envoyé : l'API ne le connaît pas et ne peut rien en dire.
const CHAMPS = ["new_password"] as const;

const VALEURS_INITIALES: FormData = { new_password: "", confirmPassword: "" };

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> => {
  const newErrors: FormErrors<FormData> = {};

  if (!isLongEnoughPassword(formData.new_password)) {
    newErrors.new_password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`;
  } else if (!isComplexPassword(formData.new_password)) {
    newErrors.new_password =
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
  }

  if (!isConfirmedPassword(formData.new_password, formData.confirmPassword)) {
    newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  return newErrors;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  // uid et token viennent du lien reçu par email, jamais d'une réponse de l'API.
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const { formData, errors, formError, isSubmitting, handleChange, submit } =
    useForm<FormData>(VALEURS_INITIALES);

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: reglesDeSaisie,
      fields: CHAMPS,
      send: async (values) => {
        await apiFetch<{ detail: string }>("/auth/password-reset/confirm/", {
          method: "POST",
          body: JSON.stringify({
            uid,
            token,
            new_password: values.new_password,
          }),
        });
        navigate("/login", { replace: true });
      },
      // Le lien mort est le seul refus que l'API rende sans dire quoi faire — son
      // "detail" tient en trois mots. Une panne ou un serveur injoignable gardent le
      // leur : les ramener au lien invalide ferait redemander un lien encore bon.
      translate: (refus, err) =>
        !refus.fieldErrors.new_password &&
        (err as { status?: number }).status === 400
          ? {
              ...refus,
              formError: "Ce lien est invalide ou a déjà servi. Demandez-en un nouveau.",
            }
          : refus,
    });

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <HeroTitle
          line1={<>Nouveau mot de passe</>}
          line2="Choisissez le mot de passe de votre compte"
        />

        <div className="w-full max-w-md my-8 border border-line p-6 rounded-lg">
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
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.new_password}
                  onChange={handleChange}
                  helperText={`Au moins ${PASSWORD_MIN_LENGTH} caractères avec majuscule, minuscule et chiffre`}
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
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting
                      ? "Veuillez patienter…"
                      : "Valider le nouveau mot de passe"}
                  </Button>
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
