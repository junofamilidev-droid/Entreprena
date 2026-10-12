import { describe, expect, it } from "vitest";
import formation from "../content/auditeur-augmente/formation.json";
import { assemble, checkValue, deliverableToText, parseAmount, review, reviewFields, tableToText } from "../src/lib/exercise/logic";
import type { ExerciseContent, ExerciseInputs, ValueCheck } from "../src/lib/content/types";

const step = formation.modules[0].steps!.find((s) => s.slug === "exercice")!;
const content = step.content as unknown as ExerciseContent;
const rules = content.reviewRules!;

describe("montants", () => {
  it("lit les écritures françaises courantes", () => {
    expect(parseAmount("19 666 000")).toBe(19666000);
    expect(parseAmount("19 666 000 €")).toBe(19666000);
    expect(parseAmount("19.666.000")).toBe(19666000);
    expect(parseAmount("1 234,5 euros")).toBe(1234.5);
    expect(parseAmount("81")).toBe(81);
    expect(parseAmount("environ 80")).toBeNull();
  });

  it("compare à la valeur attendue", () => {
    const c: ValueCheck = { id: "x", label: "x", expected: 81, mismatch: "" };
    expect(checkValue(c, "")).toBe("empty");
    expect(checkValue(c, "81")).toBe("ok");
    expect(checkValue(c, "80")).toBe("mismatch");
    expect(checkValue(c, "quatre-vingt")).toBe("invalid");
  });
});

describe("contenu de l'exercice Nordelia", () => {
  it("contient la balance complète, cohérente avec les points de contrôle", () => {
    const balance = content.parts[0].blocks.find((b) => b.type === "data" && b.copyRows);
    if (balance?.type !== "data") throw new Error("balance absente");
    const rows = balance.copyRows!;
    const sum = (i: number) => rows.reduce((s, r) => s + (Number(r[i]) || 0), 0);
    const checks = content.parts[1].blocks.find((b) => b.type === "checks");
    if (checks?.type !== "checks") throw new Error("contrôles absents");
    const expected = Object.fromEntries(checks.items.map((c) => [c.id, c.expected]));
    expect(rows.length).toBe(expected.comptes);
    expect(sum(2)).toBe(expected["total-2025"]);
    expect(sum(3)).toBe(expected["total-2025"]);
    expect(sum(4)).toBe(expected["total-2024"]);
    expect(sum(5)).toBe(expected["total-2024"]);
    const above = rows.filter((r) => {
      const n25 = (Number(r[2]) || 0) - (Number(r[3]) || 0);
      const n24 = (Number(r[4]) || 0) - (Number(r[5]) || 0);
      const v = n25 - n24;
      return Math.abs(v) > 30000 && (n24 === 0 || Math.abs(v / n24) > 0.1);
    });
    expect(above.length).toBe(expected["au-dessus"]);
  });

  it("relie chaque source de relecture et de livrable à un bloc existant", () => {
    const ids = new Set(content.parts.flatMap((p) => p.blocks).flatMap((b) => ("id" in b ? [b.id] : [])));
    for (const b of content.parts.flatMap((p) => p.blocks)) {
      if (b.type === "review") b.sources.forEach((s) => expect(ids).toContain(s));
      if (b.type === "deliverable") b.sections.flatMap((s) => s.sources).forEach((s) => expect(ids).toContain(s));
    }
  });
});

describe("relecture automatique", () => {
  const f = (text: string) => review([{ id: "c", label: "Conclusion", text }], rules).map((x) => x.rule.id);

  it("repère les formules vues dans les leçons", () => {
    expect(f("Nous avons obtenu les factures et vérifié la date de livraison.")).toEqual(["travail-au-passe"]);
    expect(f("La revue analytique n'a révélé aucune anomalie significative.")).toContain("conclusion-trop-forte");
    expect(f("Cette hausse est cohérente avec l'inflation de 12 % du secteur en 2025.")).toContain("fait-exterieur");
    expect(f("Les créances clients ont augmenté en raison d'une hausse des ventes à crédit.")).toEqual(["reformulation"]);
  });

  it("laisse passer une rédaction conforme", () => {
    expect(f("Factures de décembre et janvier à obtenir pour tester la séparation des exercices.")).toEqual([]);
    expect(f("Risque de dettes fournisseurs omises, environ 176 000 euros. Travaux à réaliser : recherche de passifs non comptabilisés.")).toEqual([]);
  });

  it("relit aussi les cellules du tableau et cite la phrase fautive", () => {
    const inputs = { constats: [{ compte: "Clients", hypotheses: "Hausse normale. Cohérent avec la tendance du marché." }] };
    const found = review(reviewFields(content, inputs, ["constats"]), rules);
    expect(found).toHaveLength(1);
    expect(found[0].sentence).toBe("Cohérent avec la tendance du marché.");
    expect(found[0].fieldLabel).toContain("ligne 1");
  });
});

describe("livrable", () => {
  it("assemble les saisies et signale les rubriques vides", () => {
    const deliverable = content.parts.at(-1)!.blocks.find((b) => b.type === "deliverable");
    if (deliverable?.type !== "deliverable") throw new Error("livrable absent");
    const inputs: ExerciseInputs = {
      objectif: "Balance 2025 et 2024, 81 comptes.",
      constats: [{ compte: "Clients", constat: "+34 %, soit +675 000 euros" }, {}],
      "controle-1": { comptes: "81", "total-2025": "19 000 000" },
    };
    const sections = assemble(content, inputs, deliverable.sections);
    const text = deliverableToText(deliverable.title, sections);
    expect(text).toContain("Exercice clos le 31/12/2025");
    expect(text).toContain("Balance 2025 et 2024, 81 comptes.");
    expect(text).toContain("Nombre de comptes traités : 81 (conforme au fichier)");
    expect(text).toContain("Total débit ou crédit 2025 : 19 000 000 (écart avec le fichier)");
    expect(text).toContain("[Conclusion : à compléter]");
    expect(text.match(/Compte ou ratio/g)).toHaveLength(1);
  });

  it("met le tableau en texte pour le prompt 3", () => {
    const cols = [{ id: "a", label: "Compte" }, { id: "b", label: "Constat" }];
    expect(tableToText(cols, [{ a: "Clients", b: "+34 %" }, { a: " " }])).toBe("1.\n   Compte : Clients\n   Constat : +34 %");
  });
});
