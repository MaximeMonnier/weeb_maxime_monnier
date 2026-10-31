type ErrorAlertProps = {
  message?: string | null;
};

export default function ErrorAlert({ message }: ErrorAlertProps) {
  // Toujours rendu : une région live apparue avec son texte n'est pas annoncée.
  return (
    <p role="alert" className="form-alert-error">
      {message}
    </p>
  );
}
