import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { clearTokens } from "../lib/tokens";
import { useForm } from "../hooks/useForm";
import type { FormErrors } from "../hooks/useForm";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button/Button";
import HeroTitle from "../components/ui/Title/HeroTitle";
import ErrorAlert from "../components/ui/Alert/ErrorAlert";

type FormData = { password: string };

const CHAMPS = ["password"] as const;

const VALEURS_INITIALES: FormData = { password: "" };

const reglesDeSaisie = (formData: FormData): FormErrors<FormData> =>
  formData.password ? {} : { password: "Le mot de passe est requis" };

const DeleteAccount = () => {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  const { formData, errors, formError, isSubmitting, handleChange, submit } =
    useForm<FormData>(VALEURS_INITIALES);

  const handleSubmit = (e: React.FormEvent) =>
    submit(e, {
      rules: reglesDeSaisie,
      fields: CHAMPS,
      send: async (values) => {
        await apiFetch<null>("/auth/account/", {
          method: "DELETE",
          body: JSON.stringify({ password: values.password }),
        });
        // Pas `logout()` : le compte supprimé, l'API n'a plus de refresh à révoquer.
        clearTokens();
        navigate("/", { replace: true });
      },
    });

  return (
    <div className="container-custom mt-32">
      <div className="flex flex-col items-center justify-center">
        <HeroTitle
          line1={<>Supprimer mon compte</>}
          line2="Une suppression définitive, sans retour possible"
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
              pour supprimer votre compte.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-6">
                La suppression est définitive : votre compte et tous les articles que
                vous avez publiés seront effacés, sans possibilité de les récupérer.
              </p>

              <ErrorAlert message={formError} />

              <div className="space-y-6">
                <Input
                  label="Mot de passe"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  helperText="Redonnez votre mot de passe pour confirmer"
                  error={errors.password}
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
                    {isSubmitting ? "Veuillez patienter…" : "Supprimer définitivement"}
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

export default DeleteAccount;
