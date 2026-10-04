import { useState } from "react";
import { apiFetch } from "../lib/api";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button/Button";
import HeroTitle from "../components/ui/Title/HeroTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

// Un seul champ, mais la même forme que les autres formulaires : le hook indexe les
// erreurs sur les clés de l'état.
type FormData = { email: string };

const VALEURS_INITIALES: FormData = { email: "" };

const ForgotPassword = () => {
  // L'API répond la même chose que le compte existe ou non : on affiche son message tel quel.
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const { formData, errors, formError, isSubmitting, handleChange, submit } =
    useForm<FormData>(VALEURS_INITIALES);

  // Pas de règles : l'API juge l'adresse.
  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      fields: ["email"],
      send: async (values) => {
        const data = await apiFetch<{ detail: string }>("/auth/password-reset/", {
          method: "POST",
          body: JSON.stringify({ email: values.email }),
        });
        setConfirmation(data.detail);
      },
    });

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <HeroTitle
          line1={<>Mot de passe oublié</>}
          line2="Entrez votre email pour réinitialiser"
        />

        <div className="w-full max-w-md my-8 border border-line p-6 rounded-lg">
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
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
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
                      : "Réinitialiser mon mot de passe"}
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

export default ForgotPassword;
