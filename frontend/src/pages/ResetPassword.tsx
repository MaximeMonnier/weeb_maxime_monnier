import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { toFormErrors } from "../lib/apiErrors";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

const ResetPassword = () => {
  const navigate = useNavigate();
  // uid et token viennent du lien reçu par email, jamais d'une réponse de l'API.
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setError(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setError(null);
    setFormError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<{ detail: string }>("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
      navigate("/login", { replace: true });
    } catch (err) {
      const { fieldErrors, formError } = toFormErrors(err, ["new_password"]);
      setError(fieldErrors.new_password ?? null);
      // Le lien mort est le seul refus que l'API rende sans dire quoi faire — son
      // "detail" tient en trois mots. Un 429 ou une panne gardent leur message : les
      // ramener au lien invalide ferait redemander un lien encore bon.
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
                  value={newPassword}
                  onChange={handleChange}
                  helperText="Au moins 8 caractères avec majuscule, minuscule et chiffre"
                  error={error ?? undefined}
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
