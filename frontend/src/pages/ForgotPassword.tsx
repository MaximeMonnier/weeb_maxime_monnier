import { useState } from "react";
import { apiFetch } from "../lib/api";
import { toFormErrors } from "../lib/apiErrors";
import { Input } from "../components/ui/Input";
import MainButton from "../components/ui/Button/MainButton";
import MainTitle from "../components/ui/Title/MainTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  // L'API répond la même chose que le compte existe ou non : on affiche son message tel quel.
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormError(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ detail: string }>("/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setConfirmation(data.detail);
    } catch (err) {
      // Le quota le plus serré du projet, trois appels par heure : le message unique
      // d'avant annonçait une adresse invalide à qui n'avait fait qu'attendre.
      const { fieldErrors, formError } = toFormErrors(err, ["email"] as const);
      setError(fieldErrors.email ?? null);
      setFormError(formError);
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
          {/* Monté en permanence : une région live apparue avec son texte n'est
              pas annoncée de façon fiable. */}
          <p role="status" className="text-center">
            {confirmation}
          </p>
          {confirmation ? null : (
            <form onSubmit={handleSubmit}>
              <ErrorAlert message={formError} />

              <div className="space-y-6">
                <Input
                  label="Adresse email"
                  name="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={email}
                  onChange={handleChange}
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
