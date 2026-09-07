type ErrorAlertProps = {
  /** Message à afficher ; rien n'est visible tant qu'il est absent. */
  message?: string | null;
};

/**
 * Message d'erreur portant sur un formulaire entier, annoncé par les lecteurs d'écran.
 */
export default function ErrorAlert({ message }: ErrorAlertProps) {
  // Monté en permanence et masqué à vide par `:empty` : une région live apparue avec
  // son texte n'est pas annoncée de façon fiable.
  return (
    <p role="alert" className="form-alert-error">
      {message}
    </p>
  );
}
