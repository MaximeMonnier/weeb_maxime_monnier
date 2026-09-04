import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  // L'API répond la même chose que le compte existe ou non : on affiche son message tel quel.
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ detail: string }>("/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setConfirmation(data.detail);
    } catch {
      setError("Adresse email invalide ou service indisponible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <MainTitle
          line1={<>Mot de passe oublié</>}
          line2="Entrez votre email pour réinitialiser"
        />

        <div className="w-full max-w-md my-8 border border-primary p-6 rounded-lg">
          {confirmation ? (
            <p className="text-center">{confirmation}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
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
                      : "Réinitialiser mon mot de passe"}
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

export default ForgotPassword;
