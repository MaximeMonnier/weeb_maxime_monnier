/**
 * Assemblage des listes de classes CSS des composants de `ui/`, où une variante non
 * retenue rend `false` ou `undefined` : les joindre telles quelles sèmerait des espaces
 * dans l'attribut `class`.
 */
export function cx(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}
