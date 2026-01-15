import { forwardRef } from "react";

type TextareaVariant = "default" | "error" | "success";

/**
 * Props for the Textarea component
 * Multi-line text input with auto-resizing capabilities
 */
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Label text displayed above the textarea */
  label?: string;

  /** Error message displayed below the textarea */
  error?: string;

  /** Helper text displayed below the textarea */
  helperText?: string;

  /** If true, shows an asterisk (*) next to the label */
  required?: boolean;

  /** Visual variant of the textarea */
  variant?: TextareaVariant;

  /** If true, textarea takes full width of container */
  fullWidth?: boolean;

  /** Minimum number of rows (default: 3) */
  minRows?: number;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Textarea component for multi-line text input
 * Uses form-input and form-textarea classes from global CSS
 */
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
  ) => {
    const textareaId =
      id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error || variant === "error";
    const hasSuccess = variant === "success";

    return (
      <div className={cx(fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cx("form-label", required && "form-label-required")}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows || minRows}
          className={cx(
            "form-input",
            "form-textarea",
            hasError && "error",
            hasSuccess && "success",
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} className="form-error-message">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="form-helper-text">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
