import { describe, expect, it } from "vitest";
import { compter, entonnoir, metiersAutres, parMetier, versCsv, type Evenement, type LigneDiagnostic } from "@/lib/diagnostic-metier/stats";

const ligne = (p: Partial<LigneDiagnostic>): LigneDiagnostic => ({
  id: "x",
  created_at: "2026-11-10T10:20:30Z",
  metier: "auditeur",
  metier_autre: null,
  taches: ["revue-analytique"],
  frequence_ia: "jour",
  cadre: "outil",
  objectif: "temps",
  score: 80,
  niveau: "forte",
  preparation: "avancee",
  email: null,
  consentement_emails: false,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  a_clique_formation: false,
  ...p,
});

describe("entonnoir", () => {
  it("compte chaque étape et la perte depuis la précédente", () => {
    const ev: Evenement[] = [
      ...Array(10).fill({ event: "start", question: null, metier: null }),
      ...Array(8).fill({ event: "question", question: 1, metier: null }),
      ...Array(4).fill({ event: "question", question: 2, metier: null }),
      ...Array(3).fill({ event: "result", question: null, metier: "auditeur" }),
    ];
    const e = entonnoir(compter(ev));
    expect(e[0]).toEqual({ libelle: "Démarrage", nombre: 10, part: 100, perte: null });
    expect(e[1]).toMatchObject({ nombre: 8, part: 80, perte: 20 });
    expect(e[2]).toMatchObject({ nombre: 4, part: 40, perte: 50 });
    expect(e[3]).toMatchObject({ nombre: 0, perte: 100 });
    expect(e[4]).toMatchObject({ nombre: 0, perte: null }); // précédente à 0 : pas de pourcentage
    expect(e[6]).toMatchObject({ libelle: "Résultat affiché", nombre: 3 });
  });
  it("sans démarrage, pas de part", () => {
    expect(entonnoir(compter([]))[0].part).toBeNull();
  });
});

describe("parMetier", () => {
  it("regroupe, compte emails, consentements, niveaux et avis d'ouverture", () => {
    const r = parMetier(
      [ligne({ score: 80, email: "a@b.fr", consentement_emails: true }), ligne({ score: 60, niveau: "marquee" }), ligne({ metier: "rh", score: 40, niveau: "marquee" })],
      [
        { email: "a@b.fr", metier: "rh", created_at: "" },
        { email: "c@d.fr", metier: "autre:pharmacien", created_at: "" },
      ],
      (id) => id.toUpperCase(),
    );
    expect(r[0]).toEqual({ metier: "AUDITEUR", diagnostics: 2, emails: 1, consentements: 1, scoreMoyen: 70, niveaux: { moderee: 0, marquee: 1, forte: 1 }, notifications: 0 });
    expect(r[1]).toMatchObject({ metier: "RH", diagnostics: 1, notifications: 1 });
    expect(r[2]).toMatchObject({ metier: "AUTRE", diagnostics: 0, scoreMoyen: null, notifications: 1 });
  });
});

describe("metiersAutres", () => {
  it("regroupe sans tenir compte des majuscules", () => {
    const r = metiersAutres([ligne({ metier: "autre", metier_autre: "Pharmacien" }), ligne({ metier: "autre", metier_autre: "pharmacien " }), ligne({ metier: "autre", metier_autre: "Notaire" })]);
    expect(r).toEqual([
      { libelle: "Pharmacien", nombre: 2 },
      { libelle: "Notaire", nombre: 1 },
    ]);
  });
});

describe("versCsv", () => {
  it("échappe les séparateurs et neutralise les formules", () => {
    const csv = versCsv([ligne({ metier: "autre", metier_autre: '=HYPERLINK("x");1', taches: ["a", "b"], email: "a@b.fr" })], (id) => id);
    const [entete, l1] = csv.replace("﻿", "").split("\r\n");
    expect(entete.startsWith("date;metier;metier_autre")).toBe(true);
    expect(l1).toContain(`"'=HYPERLINK(""x"");1"`);
    expect(l1).toContain(";a, b;");
    expect(l1.startsWith("2026-11-10 10:20;autre;")).toBe(true);
  });
});
