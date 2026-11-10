// Éléments du diagnostic partagés avec le navigateur (sans aucune ligne du plan d'action).
export const AUTRE = "autre";

export type MetierPublic = {
  id: string;
  libelle: string;
  statut: "disponible" | "en_preparation";
  taches: { id: string; libelle: string; exposition: number }[];
};
