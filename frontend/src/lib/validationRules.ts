/** Règles de saisie partagées par plusieurs formulaires ; celles qui n'en servent
 *  qu'un restent chez lui. */

// Aucune expression ne valide vraiment une adresse : celle-ci n'écarte que la faute de
// frappe évidente, et l'API tranche le reste.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dit si une adresse a la forme `nom@domaine.ext`. */
export function isValidEmail(value: string): boolean {
  return EMAIL.test(value);
}

// Copie de PasswordComplexityValidator côté API : les deux doivent accepter les mêmes
// mots de passe, sinon le front refuse ce que l'API admettrait.
const COMPLEXITE = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/** Dit si un mot de passe porte une minuscule, une majuscule et un chiffre. */
export function isComplexPassword(value: string): boolean {
  return COMPLEXITE.test(value);
}

// Seuil par défaut de MinimumLengthValidator, que `base.py` ne règle pas : s'il y prend
// un `min_length`, cette valeur le suit.
export const PASSWORD_MIN_LENGTH = 8;

/** Dit si un mot de passe atteint la longueur que l'API exige à la création. */
export function isLongEnoughPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

/** Dit si la confirmation reprend le mot de passe à l'identique. */
export function isConfirmedPassword(password: string, confirmation: string): boolean {
  return password === confirmation;
}
