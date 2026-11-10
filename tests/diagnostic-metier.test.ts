import { describe, expect, it } from "vitest";
import { calculer, niveauExposition, preparation, scoreExposition, type Reponses } from "@/lib/diagnostic-metier/calcul";
import { AUTRE, METIERS, metierParId, metiersPublics } from "@/lib/diagnostic-metier/metiers";

const base = { frequence: "jamais", cadre: "ne_sait_pas", objectif: "comprendre" } as const;
const taches = (id: string) => metierParId(id)!.taches;

describe("score d'exposition", () => {
  it("ramène la moyenne sur 100 et arrondit à 5", () => {
    expect(scoreExposition([5])).toBe(100);
    expect(scoreExposition([1])).toBe(0);
    expect(scoreExposition([5, 4, 3])).toBe(75); // moyenne 4 → 75
    expect(scoreExposition([5, 4])).toBe(90); // 4,5 → 87,5 → 90
    expect(scoreExposition([3, 2, 2])).toBe(35); // 2,33 → 33,3 → 35
  });
  it("classe les niveaux aux seuils 40 et 70", () => {
    expect(niveauExposition(35)).toBe("moderee");
    expect(niveauExposition(40)).toBe("marquee");
    expect(niveauExposition(65)).toBe("marquee");
    expect(niveauExposition(70)).toBe("forte");
  });
  it("calcule la préparation sur un axe séparé", () => {
    expect(preparation("jamais", "interdit")).toEqual({ points: 0, niveau: "a_construire" });
    expect(preparation("mois", "ne_sait_pas")).toEqual({ points: 1, niveau: "a_construire" });
    expect(preparation("semaine", "interdit")).toEqual({ points: 2, niveau: "en_cours" });
    expect(preparation("jour", "interdit")).toEqual({ points: 3, niveau: "en_cours" });
    expect(preparation("semaine", "outil")).toEqual({ points: 4, niveau: "avancee" });
    expect(preparation("jour", "outil")).toEqual({ points: 5, niveau: "avancee" });
  });
});

describe("profils", () => {
  it("1 seule tâche (auditeur, revue analytique)", () => {
    const r: Reponses = { ...base, metier: "auditeur", taches: ["revue-analytique"] };
    expect(calculer(r, taches("auditeur"))).toMatchObject({ score: 100, niveau: "forte", tachePlusExposee: "revue-analytique", preparation: "a_construire" });
  });
  it("toutes à 5 (commercial)", () => {
    const r: Reponses = { ...base, metier: "commercial", taches: ["emails", "crm"], frequence: "jour", cadre: "outil" };
    expect(calculer(r, taches("commercial"))).toMatchObject({ score: 100, niveau: "forte", preparation: "avancee", tachePlusExposee: "emails" });
  });
  it("toutes à 1 (autre métier, tâche relationnelle)", () => {
    const r: Reponses = { ...base, metier: AUTRE, metierAutre: "Pharmacien", taches: ["relations"] };
    expect(calculer(r, taches(AUTRE))).toMatchObject({ score: 0, niveau: "moderee", tachePlusExposee: "relations" });
  });
  it("métier « Autre » avec trois tâches mixtes", () => {
    const r: Reponses = { ...base, metier: AUTRE, taches: ["reunions", "recherche", "relations"], frequence: "semaine", cadre: "autorise" };
    // notes 2, 4, 1 → moyenne 2,33 → 33,3 → 35
    expect(calculer(r, taches(AUTRE))).toMatchObject({ score: 35, niveau: "moderee", preparation: "en_cours", tachePlusExposee: "recherche" });
  });
  it("exposition marquée (juriste)", () => {
    const r: Reponses = { ...base, metier: "juriste", taches: ["contrats", "echeances", "veille"] };
    // 4, 2, 4 → 3,33 → 58,3 → 60
    expect(calculer(r, taches("juriste"))).toMatchObject({ score: 60, niveau: "marquee", tachePlusExposee: "contrats" });
  });
  it("égalité : la première de la liste du métier gagne, quel que soit l'ordre des clics", () => {
    const r: Reponses = { ...base, metier: "auditeur", taches: ["documentation", "revue-analytique"] };
    expect(calculer(r, taches("auditeur")).tachePlusExposee).toBe("revue-analytique");
  });
  it("refuse 0 tâche, plus de 3 tâches ou une tâche d'un autre métier", () => {
    const t = taches("auditeur");
    expect(() => calculer({ ...base, metier: "auditeur", taches: [] }, t)).toThrow();
    expect(() => calculer({ ...base, metier: "auditeur", taches: ["revue-analytique", "documentation", "tests-ecritures", "collecte"] }, t)).toThrow();
    expect(() => calculer({ ...base, metier: "auditeur", taches: ["crm"] }, t)).toThrow();
  });
});

describe("données des métiers", () => {
  it("12 métiers, 7 à 9 tâches chacun, notes de 1 à 5, identifiants uniques", () => {
    expect(METIERS).toHaveLength(12);
    for (const m of METIERS) {
      expect(m.taches.length).toBeGreaterThanOrEqual(7);
      expect(m.taches.length).toBeLessThanOrEqual(9);
      expect(new Set(m.taches.map((t) => t.id)).size).toBe(m.taches.length);
      for (const t of m.taches) {
        expect(t.exposition).toBeGreaterThanOrEqual(1);
        expect(t.exposition).toBeLessThanOrEqual(5);
        expect(t.ia && t.humain && t.action_semaine).toBeTruthy();
      }
    }
  });
  it("la version publique ne contient pas les lignes du plan", () => {
    const json = JSON.stringify(metiersPublics());
    expect(json).not.toContain("action_semaine");
    expect(json).not.toContain(METIERS[0].taches[0].ia);
  });
});
