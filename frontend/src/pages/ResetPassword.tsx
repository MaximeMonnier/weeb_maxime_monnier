import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";

const ResetPassword = () => {
  const navigate = useNavigate();
  // uid et token viennent du lien reçu par email, jamais d'une réponse de l'API.
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch<{ detail: string }>("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
      navigate("/login");
    } catch {
      setError("Ce lien est invalide ou a déjà servi. Demandez-en un nouveau.");
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
              <Link to="/forgot-password" className="underline">
                demande de réinitialisation
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <Input
                  label="Nouveau mot de passe"
                  name="new_password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={handleChange}
                  helperText="Minimum 8 caractères"
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
