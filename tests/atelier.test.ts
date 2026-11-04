import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseSession, parseSessionFile } from "@/lib/sessions/validate";
import { checkVerification, commandeACopier, normalizeForMatch } from "@/lib/sessions/atelier";
import { requiredFiles } from "@/lib/sessions/files";
import { parseFormationFile } from "@/lib/sessions/formation-format";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const exemple = () => JSON.parse(read("../content/demo/session-atelier-nordelia.json"));

describe("format atelier : validation", () => {
  it("accepte la session d'exemple", () => {
    const r = parseSessionFile(read("../content/demo/session-atelier-nordelia.json"));
    expect(r.ok ? [] : r.errors).toEqual([]);
    if (r.ok) expect("etapes" in r.session && r.session.etapes.map((e) => e.panneau.type)).toEqual(["quiz", "outil", "test", "test", "personnaliser", "fiche"]);
  });

  it("dit quelle étape et quel champ corriger", () => {
    const s = exemple();
    s.etapes[0].panneau.bonne = 5;
    s.etapes[1].panneau.regles[0].sans = "";
    s.etapes[2].panneau.verifications[1].regle = "certains";
    s.etapes[3].panneau.type = "video";
    delete s.etapes[4].objectif;
    s.duree_min = 75;
    const r = parseSessionFile(s);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toEqual(
      expect.arrayContaining([
        "« duree_min » : 75 minutes, une session ne doit pas dépasser 60 minutes.",
        "Étape 1 (quiz), « panneau », « bonne » : index de la bonne réponse, de 0 à 2 (le premier choix vaut 0).",
        "Étape 2 (outil), « panneau », règle 1, « sans » : texte manquant ou vide.",
        "Étape 3 (test), « panneau », vérification 2, « regle » : « tous » ou « un ».",
        "Étape 4 (video), « panneau », « type » : « video » inconnu. Types possibles : quiz, outil, test, personnaliser, fiche.",
        "Étape 5 (personnaliser), « objectif » : texte manquant ou vide.",
      ]),
    );
  });

  it("refuse un format inconnu et des champs inconnus", () => {
    const s = exemple();
    s.format = "atelier2";
    expect(parseSessionFile(s)).toEqual({ ok: false, errors: ["« format » : « atelier2 » inconnu. Écrivez « atelier », ou retirez ce champ pour le format classique."] });
    const t = exemple();
    t.etapes[0].bonus = 1;
    const r = parseSessionFile(t);
    expect(r.ok ? [] : r.errors).toEqual(["Étape 1 : champ « bonus » inconnu."]);
  });

  it("les commandes de l'outil sont facultatives et contrôlées", () => {
    const sans = exemple();
    delete sans.commandes;
    expect(parseSessionFile(sans).ok).toBe(true);
    const s = exemple();
    s.commandes[1].rend = "";
    s.commandes[2].exemple = "x";
    const r = parseSessionFile(s);
    expect(r.ok ? [] : [...r.errors].sort()).toEqual(
      ["« commandes », commande 2, « rend » : texte manquant ou vide.", "« commandes », commande 3 : champ « exemple » inconnu."].sort(),
    );
    const vide = exemple();
    vide.commandes = [];
    expect(parseSessionFile(vide)).toEqual({ ok: false, errors: ["« commandes » : liste d'au moins une commande, entre [ et ] (ou retirez le champ)."] });
  });

  it("copie une commande sans la partie à compléter", () => {
    expect(commandeACopier("/revue")).toBe("/revue");
    expect(commandeACopier("/approfondir <compte>")).toBe("/approfondir ");
  });

  it("liste les fichiers à téléverser, .zip compris", () => {
    expect(requiredFiles(exemple()).map((f) => f.name)).toEqual(["skill-revue-analytique.zip", "balance-nordelia-2025.csv"]);
  });

  it("une formation peut contenir une session atelier", () => {
    const f = JSON.parse(read("../content/imports/auditeur-augmente-ia/formation-auditeur-augmente-ia.json"));
    f.sessions = [exemple()];
    const r = parseFormationFile(f);
    expect(r.ok ? [] : r.errors).toEqual([]);
  });
});

describe("vérification par mots-clés", () => {
  it("ignore accents, casse et espaces dans les nombres", () => {
    expect(normalizeForMatch("Écart de 471 000 € — Balance ÂGÉE")).toBe("ecart de 471000 € — balance agee");
    expect(checkVerification("Le compte 471 000 apparaît", { mots_cles: ["471000"], regle: "tous" })).toBe(true);
    expect(checkVerification("écart de 675000 €", { mots_cles: ["675 000"], regle: "tous" })).toBe(true);
    expect(checkVerification("écart de 1 234 567 €", { mots_cles: ["1234567"], regle: "tous" })).toBe(true);
    expect(checkVerification("Demander la BALANCE AGEE", { mots_cles: ["balance âgée"], regle: "tous" })).toBe(true);
    expect(checkVerification("écart 675 000 €", { mots_cles: ["675000"], regle: "tous" })).toBe(true);
  });
  it("applique la règle « tous » ou « un »", () => {
    const text = "408100 et 411000";
    expect(checkVerification(text, { mots_cles: ["408100", "411000", "471000"], regle: "tous" })).toBe(false);
    expect(checkVerification(text, { mots_cles: ["471000", "411000"], regle: "un" })).toBe(true);
    expect(checkVerification("", { mots_cles: ["x"], regle: "un" })).toBe(false);
  });
});

describe("non-régression du format classique", () => {
  it("les sessions existantes s'importent toujours", () => {
    for (const f of [
      "../content/demo/session-demo.json",
      "../content/demo/session-exemple-claude.json",
      "../content/imports/auditeur-augmente-ia/session-revue-analytique-1.json",
    ]) {
      const r = parseSessionFile(read(f));
      expect(r.ok ? [] : r.errors).toEqual([]);
      expect(parseSession(read(f)).ok).toBe(true);
    }
  });
});
