import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // étape 1 = saisie de l'email, étape 2 = saisie du nouveau mot de passe
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // uid + token renvoyés par l'API après la demande (en prod : envoyés par email)
  const [reset, setReset] = useState<{ uid: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Étape 1 : on demande un token de réinitialisation pour cet email
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ uid: string; token: string }>(
        "/auth/password-reset/",
        { method: "POST", body: JSON.stringify({ email }) },
      );
      setReset(data); // on garde uid + token pour l'étape 2
      setStep(2);
    } catch {
      setError("Aucun compte associé à cet email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Étape 2 : on envoie le token + le nouveau mot de passe
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reset) return;
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({
          uid: reset.uid,
          token: reset.token,
          new_password: newPassword,
        }),
      });
      navigate("/login"); // mot de passe changé → on renvoie vers la connexion
    } catch {
      setError("Lien invalide ou mot de passe trop court (8 caractères min).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <MainTitle
          line1={<>Mot de passe oublié</>}
          line2={
            step === 1
              ? "Entrez votre email pour réinitialiser"
              : "Choisissez un nouveau mot de passe"
          }
        />

        <form
          onSubmit={step === 1 ? handleRequest : handleConfirm}
          className="w-full max-w-md my-8 border border-primary p-6 rounded-lg"
        >
          <div className="space-y-6">
            {step === 1 ? (
              <Input
                label="Adresse email"
                name="email"
                type="email"
                placeholder="jean.dupont@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
            ) : (
              <Input
                label="Nouveau mot de passe"
                name="new_password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Minimum 8 caractères"
                required
                fullWidth
              />
            )}

            {error && <p className="form-error-message">{error}</p>}

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
                  : step === 1
                    ? "Réinitialiser mon mot de passe"
                    : "Valider le nouveau mot de passe"}
              </MainButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
