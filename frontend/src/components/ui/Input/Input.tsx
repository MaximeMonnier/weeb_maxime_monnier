import FormField, { type FieldProps } from "./FormField";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  FieldProps & {
    ref?: React.Ref<HTMLInputElement>;
  };

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
