// Informations légales de l'entreprise, reprises dans les CGV (et plus tard les mentions légales).
// À COMPLÉTER au lancement : tant qu'une valeur est vide, la page affiche « [à compléter] ».
export const ENTREPRISE = {
  nom: "", // nom et prénom de l'entrepreneur, ou raison sociale
  statut: "", // ex. « Entrepreneur individuel (micro-entreprise) »
  siret: "",
  adresse: "",
  email: "",
  /** Micro-entreprise en franchise de TVA : « TVA non applicable, art. 293 B du CGI ». */
  mentionTva: "",
  mediateur: "", // médiateur de la consommation (nom et site internet), obligatoire pour vendre aux particuliers
};

export const aCompleter = (v: string) => v || "[à compléter]";
