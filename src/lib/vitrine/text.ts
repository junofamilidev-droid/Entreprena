/** Retire les marques de surlignage (==texte==) utilisées dans le contenu des formations. */
export function plain(s: string) {
  return s.replace(/==/g, "");
}
