import { forwardRef } from "react";
import { cx } from "../../../lib/cx";
import FormField, { type FieldProps } from "./FormField";

/** Props de Textarea : les attributs d'un textarea HTML, plus l'habillage commun. */
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldProps & {
    /** Nombre minimum de lignes (défaut : 3) */
    minRows?: number;
  };

/** Champ de saisie multiligne. */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      variant = "default",
      fullWidth = false,
      minRows = 3,
      className,
      id,
      rows,
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
      className={cx("form-textarea", className)}
    >
      {(attributes) => (
        <textarea ref={ref} rows={rows || minRows} {...attributes} {...props} />
      )}
    </FormField>
  )
);

Textarea.displayName = "Textarea";

export default Textarea;
