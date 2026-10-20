// Jetons de mouvement : toutes les durées et courbes des animations viennent d'ici.
// Chaque animation a une fonction (retour, orientation, continuité, attention, récompense).

export const duration = {
  instant: 0.1,
  rapide: 0.15,
  standard: 0.25,
  lent: 0.4,
  /** Réservé au moment « temps gagné » et à la fin de session. */
  recompense: 0.7,
} as const;

export const ease = {
  /** Ce qui entre. */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Ce qui sort. */
  in: [0.7, 0, 0.84, 0] as [number, number, number, number],
};

/** Ressort léger pour ce que l'on manipule à la main (coches, boutons). */
export const spring = { type: "spring", stiffness: 420, damping: 30 } as const;

/** Décalage entre les éléments d'une liste qui apparaissent à la suite. */
export const stagger = 0.04;
