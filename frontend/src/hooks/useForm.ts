import { useState, type ChangeEvent, type FormEvent } from "react";
import { toFormErrors, type FormApiErrors } from "../lib/apiErrors";

/** Erreurs de saisie, une par champ de l'état du formulaire, plus une par champ `E`
 *  qui n'y a pas de valeur : un fichier. */
export type FormErrors<T, E extends string = never> = Partial<
  Record<keyof T | E, string>
>;

type UseFormOptions = {
  /** Rappel à chaque frappe, pour ce que le hook ne connaît pas : un message de succès à retirer. */
  onChange?: () => void;
};

type SubmitOptions<T, E extends string, F extends (keyof T | E) & string> = {
  /** Règles de saisie ; sans elles, la saisie part telle quelle et l'API la juge. */
  rules?: (values: T) => FormErrors<T, E>;
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

/** Socle des formulaires : champs, erreurs, message d'ensemble et envoi. Aucune règle
 *  de validation : chaque formulaire garde les siennes. */
export function useForm<
  T extends Record<string, string>,
  E extends string = never,
>(initialValues: T, { onChange }: UseFormOptions = {}) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T, E>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // L'union des deux cibles couvre les formulaires à zone de texte ; les autres
  // passent le même gestionnaire à des `input` seuls, le paramètre étant contravariant.
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markChanged(name as keyof T);
    onChange?.();
  }

  /** Périme l'erreur du champ retouché et le message d'ensemble, qui portaient sur
   *  l'envoi précédent. Seul appel à faire pour un champ `E`, hors de `formData`. */
  function markChanged(name: keyof T | E) {
    setFormError(null);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  /** Valide, envoie, puis range un refus entre les champs et le message d'ensemble. */
  async function submit<F extends (keyof T | E) & string>(
    e: FormEvent,
    { rules = SANS_REGLE, fields, send, unauthorized, translate }: SubmitOptions<T, E, F>,
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
      // F n'a que des clés de T et E, mais TypeScript ne le déduit pas d'un générique.
      setErrors(fieldErrors as FormErrors<T, E>);
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
    markChanged,
    submit,
  };
}
