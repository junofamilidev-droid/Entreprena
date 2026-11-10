import "server-only";

import type { Cadre, Objectif, Resultat } from "./calcul";
import { AUTRE, PLAN_CADRE, PLAN_INTRO, type Metier } from "./metiers";

// Plan d'action renvoyé APRÈS la saisie de l'email (jamais avant : ce module est réservé au serveur).
// Les textes sont dans le fichier de données metiers.ts (PLAN_CADRE, PLAN_INTRO et les tâches).

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
    ton: PLAN_INTRO[reponses.objectif],
    cadre: PLAN_CADRE[reponses.cadre],
    tache: {
      libelle: tache.libelle,
      ia: tache.ia,
      humain: tache.humain,
      action: tache.action_semaine,
    },
    suite,
  };
}
