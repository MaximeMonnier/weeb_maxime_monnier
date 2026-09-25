import { forwardRef } from "react";
import FormField, { type FieldProps } from "./FormField";

/** Props d'Input : les attributs d'un input HTML, plus l'habillage commun. */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldProps;

/** Champ de saisie sur une ligne : texte, email, mot de passe. */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      variant,
      fullWidth,
      className,
      id,
      type = "text",
      ...props
    },
    ref
  ) => (
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
  )
);

Input.displayName = "Input";

export default Input;
