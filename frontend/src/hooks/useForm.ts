import { useState, type ChangeEvent } from "react";

/** Erreurs de saisie, une par champ de l'état du formulaire. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

type UseFormOptions = {
  /** Rappel à chaque frappe, pour ce que le hook ne connaît pas : un message de succès à retirer. */
  onChange?: () => void;
};

/**
 * Socle commun aux formulaires : les champs, leurs erreurs, le message d'ensemble
 * et l'état d'envoi. Il ne porte aucune règle de validation, chaque formulaire ayant
 * les siennes.
 */
export function useForm<T extends Record<string, string>>(
  initialValues: T,
  { onChange }: UseFormOptions = {},
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // L'union des deux cibles couvre les formulaires à zone de texte ; les autres
  // passent le même gestionnaire à des `input` seuls, le paramètre étant contravariant.
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Le message d'ensemble porte sur l'envoi précédent : la première frappe le périme.
    setFormError(null);
    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    onChange?.();
  }

  /** Applique les règles reçues du formulaire et dit si la saisie passe. */
  function validate(rules: (values: T) => FormErrors<T>) {
    const found = rules(formData);
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validate,
  };
}
