// Format « atelier » : une session en deux zones, inspirée de DataCamp et de Brilliant.
// À gauche, un tuteur (senior fictif) guide une étape à la fois ; à droite, l'espace de travail
// change selon l'étape. La plateforme guide, explique et vérifie ; elle n'appelle aucune IA :
// l'apprenant lance l'outil livré (un skill Claude) dans son propre Claude, ouvert à côté.

export interface AtelierAide {
  question: string;
  reponse: string;
}

export interface QuizPanneau {
  type: "quiz";
  question: string;
  choix: string[];
  /** Index de la bonne réponse, à partir de 0. */
  bonne: number;
  explication: string;
}

export interface RegleOutil {
  titre: string;
  extrait: string;
  /** Sortie de Claude avec la règle. */
  avec: string;
  /** Sortie de Claude sans la règle. */
  sans: string;
  explication: string;
}

export interface OutilPanneau {
  type: "outil";
  /** Fichier à télécharger (le skill, souvent un .zip). */
  fichier: string;
  presentation: string;
  regles: RegleOutil[];
  installation: { titre: string; detail: string }[];
}

export interface VerificationTest {
  libelle: string;
  mots_cles: string[];
  /** « tous » : chaque mot-clé doit apparaître ; « un » : au moins un. */
  regle: "tous" | "un";
  si_reussi: string;
  si_manque: string;
}

export interface TestPanneau {
  type: "test";
  fichier_donnees: string;
  consigne: string;
  verifications: VerificationTest[];
}

export interface PersonnaliserPanneau {
  type: "personnaliser";
  commande: string;
  etapes: string[];
  items: string[];
}

export interface FichePanneau {
  type: "fiche";
  titre: string;
  etapes: string[];
  pieges: string[];
}

/** Une commande de l'outil, résumée dans la bulle « Les commandes de l'outil ». */
export interface CommandeOutil {
  /** Ce que l'on tape dans Claude, par exemple « /approfondir <compte> ». */
  commande: string;
  /** Quand s'en servir. */
  quand: string;
  /** Ce qu'elle rend. */
  rend: string;
}

/** Texte copié pour une commande : les parties à compléter, écrites <ainsi>, sont retirées. */
export function commandeACopier(commande: string) {
  const t = commande.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return /<[^>]*>/.test(commande) ? t + " " : t;
}

export type AtelierPanneau = QuizPanneau | OutilPanneau | TestPanneau | PersonnaliserPanneau | FichePanneau;
export type PanneauType = AtelierPanneau["type"];

export interface AtelierEtape {
  titre: string;
  objectif: string;
  pourquoi: string;
  a_faire: string[];
  aides: AtelierAide[];
  relance?: { expediteur: string; message: string };
  panneau: AtelierPanneau;
}

export interface AtelierSession {
  format: "atelier";
  formation: string;
  module: string;
  session: number;
  titre: string;
  duree_min: number;
  maj: string;
  accueil: { ce_que_vous_allez_faire: string; ce_que_vous_emportez: string[]; pourquoi: string };
  mission: { expediteur: string; objet: string; message: string; echeance: string; livrable: string; a_copier: string };
  tuteur: { nom: string; role: string };
  etapes: AtelierEtape[];
  /** Facultatif : les commandes de l'outil, visibles à tout moment dans la barre de droite. */
  commandes?: CommandeOutil[];
  fin: { recapitulatif: string[] };
}

export const panneauLabel: Record<PanneauType, string> = {
  quiz: "Question",
  outil: "L'outil",
  test: "Test sur le cas",
  personnaliser: "Personnaliser",
  fiche: "Fiche",
};

export function isAtelier(s: unknown): s is AtelierSession {
  return typeof s === "object" && s !== null && (s as { format?: unknown }).format === "atelier";
}

/**
 * Texte comparable : sans accents ni majuscules, espaces insécables ramenés à des espaces,
 * espaces entre chiffres retirés (« 471 000 » = « 471000 »), espaces multiples réduits.
 */
export function normalizeForMatch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[    ]/g, " ")
    .replace(/(\d)[ .](?=\d{3}\b)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Une vérification de l'étape « test » est-elle satisfaite par la réponse collée ? */
export function checkVerification(answer: string, v: Pick<VerificationTest, "mots_cles" | "regle">) {
  const text = normalizeForMatch(answer);
  if (!text) return false;
  const hits = v.mots_cles.map((k) => text.includes(normalizeForMatch(k)));
  return v.regle === "tous" ? hits.every(Boolean) : hits.some(Boolean);
}
