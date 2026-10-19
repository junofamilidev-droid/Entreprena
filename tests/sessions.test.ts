import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseSession } from "@/lib/sessions/validate";

const demo = readFileSync(new URL("../content/demo/session-demo.json", import.meta.url), "utf8");

describe("parseSession", () => {
  it("accepte la session de démonstration", () => {
    const r = parseSession(demo);
    expect(r.ok ? [] : r.errors).toEqual([]);
  });

  it("signale un JSON mal écrit", () => {
    const r = parseSession('{ "titre": "x", }');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/pas un JSON valide/);
  });

  it("dit quel bloc et quel champ corriger", () => {
    const s = JSON.parse(demo);
    s.blocs[2].temps_cible_min = "5";
    s.blocs[6].ligne_fautive = 9;
    s.blocs.push({ type: "video" });
    s.duree_min = 25;
    const r = parseSession(s);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toContain("Bloc 3 (defi) : « temps_cible_min » doit être un nombre, sans guillemets.");
    expect(r.errors).toContain("Bloc 7 (repere-erreur) : « ligne_fautive » doit être le numéro d'une des lignes, de 1 à 4.");
    expect(r.errors.some((e) => e.startsWith("Bloc 11 : type « video » inconnu"))).toBe(true);
    expect(r.errors.some((e) => e.includes("ne doit pas dépasser 15 minutes"))).toBe(true);
  });

  it("refuse un texte de plus de 3 lignes et un gain sans défi", () => {
    const r = parseSession({
      formation: "f", module: "m", session: 1, titre: "t", duree_min: 10, maj: "2026-10-19",
      blocs: [{ type: "texte", contenu: "a\nb\nc\nd" }, { type: "gain", tache: "x", reference: "defi" }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toContain("Bloc 1 (texte) : 3 lignes maximum.");
      expect(r.errors.some((e) => e.includes("il faut un bloc « defi » avant"))).toBe(true);
    }
  });
});
