// Session en blocs : le format JSON que l'on colle dans l'espace réservé.
// Les noms des champs sont en français, tels qu'écrits dans le fichier.

import type { AtelierSession } from "./atelier";

export const AI_TOOLS = ["claude", "chatgpt", "copilot", "lechat"] as const;
export type AiToolId = (typeof AI_TOOLS)[number];

export interface MissionBlock {
  type: "mission";
  expediteur: string;
  objet: string;
  message: string;
  echeance: string;
  livrable: string;
}
export interface DefiBlock {
  type: "defi";
  consigne: string;
  /** Nom du fichier de données fictives à télécharger. */
  donnees: string;
  temps_cible_min: number;
  criteres: string[];
  /** Réponses attendues, montrées seulement sur l'écran du gain. */
  reponses_attendues?: string[];
}
export interface PromptBlock {
  type: "prompt";
  texte: string;
  usage: string;
  resultat_attendu: string;
}
export interface CollageBlock {
  type: "collage";
  consigne: string;
  a_verifier: string[];
}
export interface ControleBlock {
  type: "controle";
  items: string[];
}
export interface RepereErreurBlock {
  type: "repere-erreur";
  lignes: string[];
  /** Numéro de la ligne fautive, en comptant à partir de 1. */
  ligne_fautive: number;
  explication: string;
}
export interface OutilBlock {
  type: "outil";
  fichier: string;
  description: string;
  /** Facultatif : la rubrique n'est pas affichée si la liste est absente ou vide. */
  champs_a_adapter?: string[];
  mode_emploi: string;
}
export interface GainBlock {
  type: "gain";
  tache: string;
  /** Bloc chronométré servant de référence (aujourd'hui : « defi »). */
  reference: "defi";
}
export interface FicheBlock {
  type: "fiche";
  titre: string;
  etapes: string[];
  pieges: string[];
}
export interface TexteBlock {
  type: "texte";
  contenu: string;
}

/** « Ce que l'outil va faire » : 2 à 6 étapes, chacune « Nom de l'étape : une phrase ». */
export interface SchemaBlock {
  type: "schema";
  titre: string;
  etapes: string[];
}
/**
 * « Les coulisses » : des extraits du livrable expliqués (« extrait || explication »), ce que
 * l'outil ne peut pas juger seul, et des vérifications à cocher.
 */
export interface CoulissesBlock {
  type: "coulisses";
  passages: string[];
  a_juger: string;
  verifications: string[];
}

export type SessionBlock =
  | MissionBlock
  | DefiBlock
  | PromptBlock
  | CollageBlock
  | ControleBlock
  | RepereErreurBlock
  | OutilBlock
  | GainBlock
  | FicheBlock
  | TexteBlock
  | SchemaBlock
  | CoulissesBlock;

export type BlockType = SessionBlock["type"];

export interface Session {
  formation: string;
  module: string;
  session: number;
  titre: string;
  duree_min: number;
  /** Date de mise à jour, AAAA-MM-JJ. */
  maj: string;
  blocs: SessionBlock[];
  consignes_outils_ia: Partial<Record<AiToolId, string>>;
}

export const blockLabel: Record<BlockType, string> = {
  mission: "Mission",
  defi: "Défi",
  prompt: "Méthode",
  collage: "Réponse de l'IA",
  controle: "Contrôle",
  "repere-erreur": "Repérez l'erreur",
  outil: "Outil",
  gain: "Temps gagné",
  fiche: "Fiche",
  texte: "À savoir",
  schema: "Ce que l'outil va faire",
  coulisses: "Les coulisses",
};

/** Une session au format classique (un écran par bloc) ou au format « atelier ». */
export type AnySession = Session | AtelierSession;
