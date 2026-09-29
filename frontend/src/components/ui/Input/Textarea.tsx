import { cx } from "../../../lib/cx";
import FormField, { type FieldProps } from "./FormField";

/** Props de Textarea : les attributs d'un textarea HTML, plus l'habillage commun. */
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldProps & {
    /** Nombre minimum de lignes (défaut : 3) */
    minRows?: number;

    /** Référence vers l'élément `textarea` ; prop ordinaire depuis React 19 */
    ref?: React.Ref<HTMLTextAreaElement>;
  };

/** Champ de saisie multiligne. */
export default function Textarea({
  label,
  error,
  helperText,
  required,
  variant,
  fullWidth,
  minRows = 3,
  className,
  id,
  rows,
  ref,
  ...props
}: TextareaProps) {
  return (
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
  );
}
