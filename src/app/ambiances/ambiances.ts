// Les quatre ambiances proposées au choix. Une seule sera conservée.
export const ambiances = [
  {
    id: "editorial",
    name: "Éditorial et sobre",
    text: "Beaucoup de blanc, titres à empattements, une seule couleur discrète.",
  },
  {
    id: "tech",
    name: "Moderne et tech",
    text: "Fond sombre, typographie compacte, accent lumineux.",
  },
  {
    id: "warm",
    name: "Chaleureux et humain",
    text: "Tons crème, coins très arrondis, typographie ronde.",
  },
  {
    id: "premium",
    name: "Premium et institutionnel",
    text: "Bleu marine profond, angles nets, titres à empattements élégants.",
  },
] as const;

export type AmbianceId = (typeof ambiances)[number]["id"];
