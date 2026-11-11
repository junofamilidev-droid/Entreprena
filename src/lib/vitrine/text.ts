import { stripReviewMarks } from "@/lib/sessions/display";

/** Retire les marques de surlignage (==texte==) et les notes de relecture « (À valider) » du contenu des formations. */
export function plain(s: string) {
  return stripReviewMarks(s.replace(/==/g, ""));
}
