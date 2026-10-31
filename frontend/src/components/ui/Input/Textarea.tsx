import { cx } from "../../../lib/cx";
import FormField, { type FieldProps } from "./FormField";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldProps & {
    minRows?: number;
    ref?: React.Ref<HTMLTextAreaElement>;
  };

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
