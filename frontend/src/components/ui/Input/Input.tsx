import { forwardRef } from "react";

type InputVariant = "default" | "error" | "success";

/**
 * Props for the Input component
 * Supports text, email, and password input types
 */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Label text displayed above the input */
  label?: string;

  /** Error message displayed below the input */
  error?: string;

  /** Helper text displayed below the input */
  helperText?: string;

  /** If true, shows an asterisk (*) next to the label */
  required?: boolean;

  /** Visual variant of the input */
  variant?: InputVariant;

  /** If true, input takes full width of container */
  fullWidth?: boolean;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Input component for text, email, and password fields
 * Uses form-input classes from global CSS
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      variant = "default",
      fullWidth = false,
      className,
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error || variant === "error";
    const hasSuccess = variant === "success";

    return (
      <div className={cx(fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className={cx("form-label", required && "form-label-required")}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cx(
            "form-input",
            hasError && "error",
            hasSuccess && "success",
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${inputId}-error`} className="form-error-message">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="form-helper-text">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
