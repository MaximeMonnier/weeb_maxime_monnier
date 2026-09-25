import { useId } from "react";
import { cx } from "../../../lib/cx";

/** Les trois états visuels d'un champ de formulaire. */
export type FieldVariant = "default" | "error" | "success";

/**
 * Props que l'habillage prend en charge, communes à Input et à Textarea.
 * Toute prop ajoutée ici apparaît du même coup sur les deux.
 */
export type FieldProps = {
  /** Étiquette affichée au-dessus du champ */
  label?: string;

  /** Message d'erreur affiché sous le champ */
  error?: string;

  /** Texte d'aide affiché sous le champ */
  helperText?: string;

  /** Si vrai, ajoute un astérisque (*) à l'étiquette */
  required?: boolean;

  /** Variante visuelle du champ */
  variant?: FieldVariant;

  /** Si vrai, le champ occupe toute la largeur du conteneur */
  fullWidth?: boolean;
};

/** Attributs calculés par l'habillage, que le champ rendu doit porter. */
type FieldAttributes = {
  id: string;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = FieldProps & {
  /** Identifiant imposé par l'appelant ; sinon généré */
  id?: string;

  /** Classes ajoutées à celles du champ */
  className?: string;

  /** Rend le champ à partir des attributs que l'habillage lui impose */
  children: (attributes: FieldAttributes) => React.ReactNode;
};

/**
 * Habillage commun d'un champ : étiquette, message d'erreur, texte d'aide.
 * L'appelant rend le champ lui-même — seul lui sait s'il s'agit d'un `input` ou d'un
 * `textarea` — et reçoit les attributs qui le relient à l'étiquette et aux messages.
 */
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
  const generatedId = useId(); // id stable généré par React (remplace Math.random)
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
