import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";

// Message unique : dire lequel des deux a échoué apprendrait à un inconnu
// si le lien qu'il tient est valide.
const MESSAGE_ERREUR =
  "Lien invalide ou expiré, ou mot de passe trop court (8 caractères minimum).";

type Etat = "saisie" | "envoi" | "erreur";

const ResetPassword = () => {
  const navigate = useNavigate();
  // uid et token viennent du lien reçu par email, jamais d'une réponse de l'API.
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [etat, setEtat] = useState<Etat>("saisie");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtat("envoi");
    try {
      await apiFetch<{ detail: string }>("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
      navigate("/login");
    } catch {
      setEtat("erreur");
    }
  };

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <MainTitle
          line1={<>Nouveau mot de passe</>}
          line2="Choisissez le mot de passe de votre compte"
        />

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md my-8 border border-primary p-6 rounded-lg"
        >
          <div className="space-y-6">
            <Input
              label="Nouveau mot de passe"
              name="new_password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 8 caractères"
              error={etat === "erreur" ? MESSAGE_ERREUR : undefined}
              required
              fullWidth
            />

            <div className="flex justify-center">
              <MainButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={etat === "envoi"}
                fullWidth
              >
                {etat === "envoi"
                  ? "Veuillez patienter…"
                  : "Valider le nouveau mot de passe"}
              </MainButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
