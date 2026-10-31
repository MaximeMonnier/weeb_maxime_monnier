import { useState, type ChangeEvent, type FormEvent } from "react";
import { toFormErrors, type FormApiErrors } from "../lib/apiErrors";

// `E` : champs hors de l'état du formulaire, un fichier par exemple.
export type FormErrors<T, E extends string = never> = Partial<
  Record<keyof T | E, string>
>;

type UseFormOptions = {
  onChange?: () => void;
};

type SubmitOptions<T, E extends string, F extends (keyof T | E) & string> = {
  rules?: (values: T) => FormErrors<T, E>;
  fields: readonly F[];
  send: (values: T) => Promise<void>;
  unauthorized?: string;
  translate?: (refus: FormApiErrors<F>, err: unknown) => FormApiErrors<F>;
};

const SANS_REGLE = () => ({});

export function useForm<
  T extends Record<string, string>,
  E extends string = never,
>(initialValues: T, { onChange }: UseFormOptions = {}) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T, E>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    markChanged(name as keyof T);
    onChange?.();
  }

  // Seul appel à faire pour un champ `E`, hors de `formData`.
  function markChanged(name: keyof T | E) {
    setFormError(null);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

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
