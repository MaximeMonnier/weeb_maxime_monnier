import { useState, type ChangeEvent, type FormEvent } from "react";
import { toFormErrors, type FormApiErrors } from "../lib/apiErrors";

/** Erreurs de saisie, une par champ de l'état du formulaire. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

type UseFormOptions = {
  /** Rappel à chaque frappe, pour ce que le hook ne connaît pas : un message de succès à retirer. */
  onChange?: () => void;
};

type SubmitOptions<T, F extends keyof T & string> = {
  /** Règles de saisie ; sans elles, la saisie part telle quelle et l'API la juge. */
  rules?: (values: T) => FormErrors<T>;
  /** Champs dont l'API peut refuser la valeur : `toFormErrors` range leur refus dessous. */
  fields: readonly F[];
  /** L'appel réseau et ce que le succès déclenche. */
  send: (values: T) => Promise<void>;
  /** Libellé du `401`, que `toFormErrors` ne sait pas nommer pour chaque formulaire. */
  unauthorized?: string;
  /** Traduction propre au formulaire, appliquée au refus déjà réparti. */
  translate?: (refus: FormApiErrors<F>, err: unknown) => FormApiErrors<F>;
};

const SANS_REGLE = () => ({});

/**
 * Socle commun aux formulaires : les champs, leurs erreurs, le message d'ensemble,
 * l'état d'envoi et le cycle d'envoi lui-même. Il ne porte aucune règle de
 * validation, chaque formulaire ayant les siennes.
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

  /** Valide, envoie, puis range un refus entre les champs et le message d'ensemble. */
  async function submit<F extends keyof T & string>(
    e: FormEvent,
    { rules = SANS_REGLE, fields, send, unauthorized, translate }: SubmitOptions<T, F>,
  ) {
    e.preventDefault();
    const found = rules(formData);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await send(formData);
    } catch (err) {
      const refus = toFormErrors(err, fields, { unauthorized });
      const { fieldErrors, formError } = translate ? translate(refus, err) : refus;
      // F n'a que des clés de T, mais TypeScript ne le déduit pas d'un générique.
      setErrors(fieldErrors as FormErrors<T>);
      setFormError(formError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    formData,
    setFormData,
    errors,
    formError,
    isSubmitting,
    handleChange,
    submit,
  };
}
