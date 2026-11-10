import "server-only";

import type { Cadre, Objectif, Resultat } from "./calcul";
import { AUTRE, type Metier } from "./metiers";

// Plan d'action renvoyé APRÈS la saisie de l'email (jamais avant : ce module est réservé au serveur).
// Textes marqués [À RÉDIGER] : premières versions à relire et réécrire.

/** Ce que dit le plan selon la réponse « Votre employeur encadre-t-il l'usage de l'IA ? ». [À RÉDIGER] */
const CADRE: Record<Cadre, { titre: string; texte: string }> = {
  outil: {
    titre: "Votre cadre : un outil fourni",
    texte: "Utilisez l'outil de votre employeur pour tous les essais de ce plan, et seulement avec des données que la charte autorise.",
  },
  autorise: {
    titre: "Votre cadre : autorisé, sans outil fourni",
    texte: "Avant tout essai, vérifiez ce que votre charte permet. N'utilisez que des données fictives ou anonymisées dans un outil grand public.",
  },
  interdit: {
    titre: "Votre cadre : usage interdit au travail",
    texte: "Entraînez-vous en dehors du travail, sur des données fictives. Vous serez prêt le jour où un outil sera autorisé.",
  },
  ne_sait_pas: {
    titre: "Votre cadre : à clarifier",
    texte: "Première étape : demandez à votre responsable ce qui est autorisé. En attendant, ne travaillez que sur des données fictives.",
  },
};

/** Phrase d'ouverture du plan selon l'objectif choisi. [À RÉDIGER] */
const TON: Record<Objectif, string> = {
  temps: "Vous voulez gagner du temps : commencez par la tâche où l'IA vous en fera gagner le plus, en gardant la main sur le contrôle.",
  indispensable: "Vous voulez rester indispensable : votre valeur se déplace vers ce que l'IA ne fait pas. Voici où la placer.",
  evoluer: "Vous voulez évoluer : savoir piloter l'IA sur votre métier actuel est déjà une compétence que l'on recherche.",
  comprendre: "Vous voulez comprendre ce qui change : voici, concrètement, ce que cela donne sur votre tâche la plus exposée.",
};

export type Suite = { type: "formation"; href: string; libelle: string } | { type: "prevenu"; metier: string } | { type: "proposer"; metier: string };

export type Plan = {
  ton: string;
  cadre: { titre: string; texte: string };
  tache: { libelle: string; ia: string; humain: string; action: string };
  suite: Suite;
};

export function construirePlan(metier: Metier, resultat: Resultat, reponses: { cadre: Cadre; objectif: Objectif; metierAutre?: string }, prevenu: boolean): Plan {
  const tache = metier.taches.find((t) => t.id === resultat.tachePlusExposee)!;
  const nom = metier.id === AUTRE ? reponses.metierAutre || "votre métier" : metier.libelle;
  const suite: Suite =
    metier.statut === "disponible" && metier.formation
      ? {
          type: "formation",
          href: "/formations",
          libelle: `Découvrir la formation ${metier.libelle}`,
        }
      : prevenu
        ? { type: "prevenu", metier: nom }
        : { type: "proposer", metier: nom };
  return {
    ton: TON[reponses.objectif],
    cadre: CADRE[reponses.cadre],
    tache: {
      libelle: tache.libelle,
      ia: tache.ia,
      humain: tache.humain,
      action: tache.action_semaine,
    },
    suite,
  };
}
