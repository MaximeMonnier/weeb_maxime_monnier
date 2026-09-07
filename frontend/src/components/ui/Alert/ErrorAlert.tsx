type ErrorAlertProps = {
  /** Message à afficher ; rien n'est visible tant qu'il est absent. */
  message?: string | null;
};

/**
 * Message d'erreur portant sur un formulaire entier, annoncé par les lecteurs d'écran.
 */
export default function ErrorAlert({ message }: ErrorAlertProps) {
  // Rendu même sans message, et vide il n'occupe aucune hauteur : une région live
  // apparue en même temps que son texte n'est pas annoncée de façon fiable.
  return (
    <p role="alert" className="form-alert-error">
      {message}
    </p>
  );
}
