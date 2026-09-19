/**
 * Règles de saisie partagées par plusieurs formulaires. Celles qui n'en servent qu'un
 * restent chez lui.
 */

// Aucune expression ne valide vraiment une adresse : celle-ci n'écarte que la faute de
// frappe évidente, et l'API tranche le reste.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dit si une adresse a la forme `nom@domaine.ext`. */
export function isValidEmail(value: string): boolean {
  return EMAIL.test(value);
}
