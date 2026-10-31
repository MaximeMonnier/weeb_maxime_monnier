// N'écarte que la faute de frappe évidente : l'API tranche le reste.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value);
}

// Copie de PasswordComplexityValidator : les deux doivent accepter les mêmes mots de passe.
const COMPLEXITE = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export function isComplexPassword(value: string): boolean {
  return COMPLEXITE.test(value);
}

// Défaut de MinimumLengthValidator : à aligner si `base.py` lui donne un `min_length`.
export const PASSWORD_MIN_LENGTH = 8;

export function isLongEnoughPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

export function isConfirmedPassword(password: string, confirmation: string): boolean {
  return password === confirmation;
}
