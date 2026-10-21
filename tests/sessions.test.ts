import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseSession } from "@/lib/sessions/validate";

const demo = readFileSync(new URL("../content/demo/session-demo.json", import.meta.url), "utf8");

describe("parseSession", () => {
  it("accepte la session de démonstration", () => {
    const r = parseSession(demo);
    expect(r.ok ? [] : r.errors).toEqual([]);
  });

  it("accepte « reponses_attendues » dans un défi, facultatif mais contrôlé", () => {
    const s = JSON.parse(demo);
    s.blocs[2].reponses_attendues = ["411000", ""];
    const r = parseSession(s);
    expect(r.ok ? [] : r.errors).toEqual(["Bloc 3 (defi) : « reponses_attendues » doit être une liste de textes non vides, entre [ et ]."]);
    delete s.blocs[2].reponses_attendues;
    expect(parseSession(s).ok).toBe(true);
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

  it("refuse un texte de plus de 3 lignes, mais laisse les blocs dans n'importe quel ordre", () => {
    const r = parseSession({
      formation: "f", module: "m", session: 1, titre: "t", duree_min: 10, maj: "2026-10-19",
      blocs: [{ type: "texte", contenu: "a\nb\nc\nd" }, { type: "gain", tache: "x", reference: "defi" }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toContain("Bloc 1 (texte) : 3 lignes maximum.");
      expect(r.errors).toEqual(["Bloc 1 (texte) : 3 lignes maximum."]);
    }
  });
});

import { scoreAnswers } from "@/lib/sessions/score";

describe("scoreAnswers", () => {
  const expected = ["411000 Clients", "408100 Factures non parvenues", "Stock de mobilier"];
  it("reconnaît un compte par son numéro et ignore accents et puces", () => {
    const r = scoreAnswers("- 411000 +34 %\n2) facture NON parvenues 408100\nCompte 999", expected);
    expect(r.found).toEqual([true, true, false]);
    expect(r.count).toBe(2);
    expect(r.extra).toEqual(["Compte 999"]);
  });
  it("reconnaît un libellé sans numéro", () => {
    expect(scoreAnswers("le stock de mobilier a bondi", expected).found[2]).toBe(true);
  });
});

import { parseFormationFile } from "@/lib/sessions/formation-format";

describe("parseFormationFile", () => {
  const example = readFileSync(new URL("../content/demo/formation-exemple.json", import.meta.url), "utf8");
  it("accepte le fichier d'exemple", () => {
    const r = parseFormationFile(example);
    expect(r.ok ? [] : r.errors).toEqual([]);
    if (r.ok) expect([r.file.modules.length, r.file.sessions.length]).toEqual([2, 1]);
  });
  it("dit quoi corriger", () => {
    const f = JSON.parse(example);
    f.modules[1].identifiant = "analyse-ecarts";
    f.modules[0].ouvert = "oui";
    f.sessions[0].module = "inconnu";
    f.sessions[0].blocs[1].contenu = "";
    const r = parseFormationFile(f);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toContain("Module 2 : l'identifiant « analyse-ecarts » est déjà pris par un autre module.");
    expect(r.errors).toContain("Module 1, « ouvert » : true (ouvert aux apprenants) ou false (à venir), sans guillemets.");
    expect(r.errors).toContain("Session 1 (inconnu, n° 1) : le module « inconnu » n'est pas dans la liste « modules ».");
    expect(r.errors.some((e) => e.startsWith("Session 1 (inconnu, n° 1) · Bloc 2 (texte)"))).toBe(true);
  });
  it("reconnaît une session collée au mauvais endroit", () => {
    const r = parseFormationFile(readFileSync(new URL("../content/demo/session-demo.json", import.meta.url), "utf8"));
    expect(r.ok ? [] : r.errors).toEqual(["Ce fichier est une session, pas une formation : utilisez « Importer une session (JSON) »."]);
  });
});
