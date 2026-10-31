import { useId } from "react";
import { cx } from "../../../lib/cx";

export type FieldVariant = "default" | "error" | "success";

// Input et Textarea transmettent tout : les valeurs par défaut se posent ici seulement.
export type FieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  variant?: FieldVariant;
  fullWidth?: boolean;
};

type FieldAttributes = {
  id: string;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = FieldProps & {
  id?: string;
  className?: string;
  children: (attributes: FieldAttributes) => React.ReactNode;
};

export default function FormField({
  label,
  error,
  helperText,
  required = false,
  variant = "default",
  fullWidth = false,
  id,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hasError = !!error || variant === "error";
  const hasSuccess = variant === "success";

  return (
    <div className={cx(fullWidth && "w-full")}>
      {label && (
        <label
          htmlFor={fieldId}
          className={cx("form-label", required && "form-label-required")}
        >
          {label}
        </label>
      )}

      {children({
        id: fieldId,
        className: cx(
          "form-input",
          hasError && "error",
          hasSuccess && "success",
          className
        ),
        "aria-invalid": hasError,
        "aria-describedby": error
          ? `${fieldId}-error`
          : helperText
            ? `${fieldId}-helper`
            : undefined,
      })}

      {error && (
        <p id={`${fieldId}-error`} className="form-error-message">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${fieldId}-helper`} className="form-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}
