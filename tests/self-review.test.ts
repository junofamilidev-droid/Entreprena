import { describe, expect, it } from "vitest";
import formation from "../content/auditeur-augmente/formation.json";
import { autoValue, formatPoints, scoreReview } from "../src/lib/exercise/self-review";
import type { ExerciseContent, ExerciseInputs, ModuleEndContent, SelfReviewContent } from "../src/lib/content/types";

const steps = formation.modules[0].steps!;
const exercise = steps.find((s) => s.slug === "exercice")!.content as unknown as ExerciseContent;
const grid = steps.find((s) => s.slug === "auto-correction")!.content as unknown as SelfReviewContent;
const end = steps.find((s) => s.slug === "fin")!.content as unknown as ModuleEndContent;

const allItems = grid.criteria.flatMap((c) => c.items);
const all = (v: "1" | "0") => Object.fromEntries(allItems.map((i) => [i.id, v]));

describe("grille du module 1", () => {
  it("totalise 20 points, avec des critères cohérents", () => {
    expect(grid.criteria.reduce((s, c) => s + c.points, 0)).toBe(20);
    for (const c of grid.criteria) {
      expect(c.items.reduce((s, i) => s + i.points, 0)).toBe(c.points);
    }
    expect(grid.passMark).toBe(14);
  });

  it("renvoie à des étapes, saisies et règles qui existent", () => {
    expect(steps.map((s) => s.slug)).toContain(grid.exerciseStep);
    expect(steps.map((s) => s.slug)).toContain(end.reviewStep);
    const ids = new Set(exercise.parts.flatMap((p) => p.blocks).flatMap((b) => ("id" in b ? [b.id] : [])));
    const rules = new Set(exercise.reviewRules!.map((r) => r.id));
    for (const c of grid.criteria) c.sources?.forEach((s) => expect(ids).toContain(s));
    for (const i of [...allItems, ...grid.eliminatory.items]) {
      if (i.auto?.type === "review") i.auto.ruleIds.forEach((r) => expect(rules).toContain(r));
      if (i.auto?.type === "matches") expect(ids).toContain(i.auto.source);
      if ("requires" in i && i.requires) expect(allItems.map((x) => x.id)).toContain(i.requires);
    }
  });
});

describe("note", () => {
  it("20 sur 20 quand tout est coché, sans critère éliminatoire", () => {
    const r = scoreReview(grid, exercise, {}, all("1"));
    expect(r.score).toBe(20);
    expect(r.passed).toBe(true);
  });

  it("n'accorde les hypothèses que pour une anomalie repérée", () => {
    const answers = { ...all("0"), "hyp-1": "1", "doc-1": "1" };
    expect(scoreReview(grid, exercise, {}, answers).score).toBe(0);
    expect(scoreReview(grid, exercise, {}, { ...answers, "anomalie-1": "1" }).score).toBe(2);
  });

  it("un critère éliminatoire renvoie la copie quelle que soit la note", () => {
    const r = scoreReview(grid, exercise, {}, { ...all("1"), "elim-fait": "1" });
    expect(r.score).toBe(20);
    expect(r.passed).toBe(false);
    expect(r.eliminatedBy).toEqual(["elim-fait"]);
  });

  it("valide à 14 et pas en dessous", () => {
    // Tout sauf le critère 3 et le critère 4 : 20 - 5 - 5 = 10 ; plus trois anomalies repérées = 13.
    const base = { ...all("1"), ...Object.fromEntries(allItems.filter((i) => /^(anomalie|hyp|doc)-/.test(i.id)).map((i) => [i.id, "0"])) };
    const three = { ...base, "anomalie-1": "1", "anomalie-2": "1", "anomalie-3": "1" };
    expect(scoreReview(grid, exercise, {}, three).score).toBe(13);
    expect(scoreReview(grid, exercise, {}, three).passed).toBe(false);
    const more = { ...three, "hyp-1": "1", "doc-1": "1" };
    expect(scoreReview(grid, exercise, {}, more).score).toBe(14);
    expect(scoreReview(grid, exercise, {}, more).passed).toBe(true);
    expect(formatPoints(13.5)).toBe("13,5");
  });
});

describe("cases cochées d'après les saisies", () => {
  const inputs: ExerciseInputs = {
    retire: "SIREN et adresse en tête de la balance. Nom de la banque (164000). Nom de l'associé.",
    "controle-1": { comptes: "81", "total-2025": "19 666 000", "total-2024": "17 643 500" },
    conclusion: "La revue analytique n'a révélé aucune anomalie significative.",
  };
  const item = (id: string) => [...allItems, ...grid.eliminatory.items].find((i) => i.id === id)!;

  it("repère l'anonymisation et les contrôles", () => {
    expect(autoValue(item("anon-entete").auto!, exercise, inputs)).toBe(true);
    expect(autoValue(item("anon-banque").auto!, exercise, inputs)).toBe(true);
    expect(autoValue(item("anon-associe").auto!, exercise, inputs)).toBe(true);
    expect(autoValue(item("anon-sci").auto!, exercise, inputs)).toBe(false);
    expect(autoValue(item("calc-totaux").auto!, exercise, inputs)).toBe(true);
    expect(autoValue(item("journal-cinq").auto!, exercise, inputs)).toBe(false);
  });

  it("propose le critère éliminatoire quand la relecture le repère, et l'apprenant peut le lever", () => {
    expect(scoreReview(grid, exercise, inputs, {}).eliminatedBy).toEqual(["elim-conclusion"]);
    expect(scoreReview(grid, exercise, inputs, { "elim-conclusion": "0" }).eliminated).toBe(false);
  });
});
