// Avec le rendu par composants mis en cache, une page dynamique doit préparer au moins une adresse
// pendant la construction. Tant qu'aucun contenu n'est publié (base vide, aucune session), on en
// prépare une factice, qui répond « page introuvable ».
export const PLACEHOLDER = "_";

export function atLeastOne<T extends Record<string, string>>(params: T[], placeholder: T): T[] {
  return params.length ? params : [placeholder];
}
