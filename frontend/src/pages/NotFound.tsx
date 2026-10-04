import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { buttonClasses } from "../components/ui/Button/buttonClasses";

const NotFound = () => {
  return (
    <div className="container-custom min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-accent mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
            Page introuvable
          </h2>
          <p className="text-lg text-ink-soft mb-8">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className={buttonClasses({ size: "cta" })}>
            <Home className="h-5 w-5" />
            Retour à l'accueil
          </Link>
          <Link
            to="/contact"
            className={buttonClasses({ variant: "secondary", size: "cta" })}
          >
            <Search className="h-5 w-5" />
            Nous contacter
          </Link>
        </div>

        <div className="mt-12 p-6 bg-surface-alt rounded-lg border border-line">
          <h3 className="text-lg font-semibold text-ink mb-2">
            Besoin d'aide ?
          </h3>
          <p className="text-ink-soft text-sm">
            Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous
            contacter pour nous signaler le problème.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
