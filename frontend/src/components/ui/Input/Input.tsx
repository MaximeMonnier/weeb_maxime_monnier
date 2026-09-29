import FormField, { type FieldProps } from "./FormField";

/** Props d'Input : les attributs d'un input HTML, plus l'habillage commun. */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  FieldProps & {
    /** Référence vers l'élément `input` ; prop ordinaire depuis React 19 */
    ref?: React.Ref<HTMLInputElement>;
  };

/** Champ de saisie sur une ligne : texte, email, mot de passe. */
export default function Input({
  label,
  error,
  helperText,
  required,
  variant,
  fullWidth,
  className,
  id,
  type = "text",
  ref,
  ...props
}: InputProps) {
  return (
    <FormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      variant={variant}
      fullWidth={fullWidth}
      id={id}
      className={className}
    >
      {(attributes) => (
        <input ref={ref} type={type} {...attributes} {...props} />
      )}
    </FormField>
  );
}
