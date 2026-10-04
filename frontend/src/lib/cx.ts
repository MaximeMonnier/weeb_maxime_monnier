/** Joint les classes retenues : une variante écartée rend `false` ou `undefined`, dont
 *  `join` seul ferait un mot « false » ou un espace en trop dans l'attribut `class`. */
export function cx(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}
