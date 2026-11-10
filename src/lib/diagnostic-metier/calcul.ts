// Calcul du diagnostic « Votre métier face à l'IA ». Module pur (aucun accès réseau ni affichage),
// utilisé à la fois par le navigateur (affichage immédiat) et par le serveur (qui recalcule et fait foi).

export type Frequence = "jamais" | "mois" | "semaine" | "jour";
export type Cadre = "outil" | "autorise" | "interdit" | "ne_sait_pas";
export type Objectif = "temps" | "indispensable" | "evoluer" | "comprendre";

export type Reponses = {
  metier: string;
  metierAutre?: string;
  taches: string[];
  frequence: Frequence;
  cadre: Cadre;
  objectif: Objectif;
};

export type NiveauExposition = "moderee" | "marquee" | "forte";
export type NiveauPreparation = "a_construire" | "en_cours" | "avancee";

export const LIBELLE_EXPOSITION: Record<NiveauExposition, string> = {
  moderee: "Exposition modérée",
  marquee: "Exposition marquée",
  forte: "Exposition forte",
};
export const LIBELLE_PREPARATION: Record<NiveauPreparation, string> = {
  a_construire: "À construire",
  en_cours: "En cours",
  avancee: "Avancée",
};

const POINTS_FREQUENCE: Record<Frequence, number> = { jamais: 0, mois: 1, semaine: 2, jour: 3 };
const POINTS_CADRE: Record<Cadre, number> = { outil: 2, autorise: 1, interdit: 0, ne_sait_pas: 0 };

export type TacheNotee = { id: string; exposition: number };

export type Resultat = {
  score: number; // 0 à 100, arrondi à 5
  niveau: NiveauExposition;
  preparation: NiveauPreparation;
  pointsPreparation: number; // 0 à 5
  tachePlusExposee: string; // id de la tâche
};

/** Score d'exposition : moyenne des notes (1 à 5) ramenée sur 100, arrondie à 5 près. */
export function scoreExposition(notes: number[]): number {
  if (!notes.length) throw new Error("Au moins une tâche est nécessaire");
  const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
  const brut = ((moyenne - 1) / 4) * 100;
  return Math.min(100, Math.max(0, Math.round(brut / 5) * 5));
}

export function niveauExposition(score: number): NiveauExposition {
  if (score >= 70) return "forte";
  if (score >= 40) return "marquee";
  return "moderee";
}

export function preparation(frequence: Frequence, cadre: Cadre): { points: number; niveau: NiveauPreparation } {
  const points = POINTS_FREQUENCE[frequence] + POINTS_CADRE[cadre];
  return { points, niveau: points >= 4 ? "avancee" : points >= 2 ? "en_cours" : "a_construire" };
}

/**
 * Calcule le résultat. `tachesDuMetier` est la liste des tâches du métier, dans l'ordre du fichier :
 * en cas d'égalité, la tâche la plus exposée est la première de cette liste.
 */
export function calculer(reponses: Reponses, tachesDuMetier: TacheNotee[]): Resultat {
  const choisies = tachesDuMetier.filter((t) => reponses.taches.includes(t.id));
  if (choisies.length < 1 || choisies.length > 3 || choisies.length !== new Set(reponses.taches).size) {
    throw new Error("Entre 1 et 3 tâches du métier doivent être choisies");
  }
  const score = scoreExposition(choisies.map((t) => t.exposition));
  const prep = preparation(reponses.frequence, reponses.cadre);
  const tachePlusExposee = choisies.reduce((best, t) => (t.exposition > best.exposition ? t : best), choisies[0]).id;
  return { score, niveau: niveauExposition(score), preparation: prep.niveau, pointsPreparation: prep.points, tachePlusExposee };
}
