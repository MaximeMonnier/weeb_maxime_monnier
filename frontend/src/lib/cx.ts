/** Joint les classes retenues : une variante écartée rend `false` ou `undefined`,
 *  qui sèmerait des espaces dans l'attribut `class`. */
export function cx(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}
