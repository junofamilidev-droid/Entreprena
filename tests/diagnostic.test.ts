import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { computeDiagnostic, type DiagnosticAnswers } from "@/lib/diagnostic/engine";
import type { DiagnosticConfig } from "@/lib/content/types";
import pkg from "../content/auditeur-augmente/formation.json";

const require = createRequire(import.meta.url);
const proto = require("./fixtures/prototype-diagnostic.cjs");
const config = pkg.diagnostic.config as DiagnosticConfig;
const modules = pkg.modules.map((m) => ({ ...m, availability: m.availability as "open" | "coming_soon" }));

function pick<T>(xs: T[], r: () => number) {
  return xs[Math.floor(r() * xs.length)];
}
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

describe("moteur de diagnostic", () => {
  it("retourne null quand aucune tâche n'est renseignée", () => {
    expect(computeDiagnostic(config, { temps: {} }, modules)).toBeNull();
  });

  it("donne les mêmes résultats que le prototype sur 500 réponses aléatoires", () => {
    const r = rng(42);
    for (let i = 0; i < 500; i++) {
      const temps: Record<string, number> = {};
      for (let t = 1; t <= 10; t++) temps[String(t)] = pick([0, 0, 1, 2, 4], r);
      temps[String(1 + Math.floor(r() * 10))] = 4;
      const a = {
        temps,
        freq: pick(["jamais", "mois", "semaine", "jour"], r),
        anonym: pick(["fait", "saurais", "non"], r),
        verif: pick(["echantillon", "relis", "telquel", "pas"], r),
        regle: pick(["outil", "sansoutil", "interdit", "aucune"], r),
        usages: r() > 0.5 ? ["audit", "calcul"] : ["redaction"],
      };
      const expected = proto.computeDiag(a);
      const got = computeDiagnostic(config, a as DiagnosticAnswers, modules)!;
      expect(got.score).toBe(expected.score);
      expect(got.band.label.toLowerCase()).toBe(`exposition ${expected.expo}`);
      expect(got.level).toBe(expected.niveau);
      expect(got.entry.label).toBe(expected.entree);
      expect(got.entry.reason).toBe(expected.raison);
      expect(got.advice[0]).toBe(expected.plan[0]);
      // Seule différence voulue : « formation » remplace « parcours ».
      expect(got.topTask!.text).toBe(expected.plan[2].trim().replace("ce parcours", "cette formation"));
      expect(got.nextTask?.part.row.label ?? null).toBe(expected.suite ? expected.suite.t.nom : null);
    }
  });
});
