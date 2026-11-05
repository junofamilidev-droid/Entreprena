import { describe, expect, it } from "vitest";
import { parseFeedback } from "@/lib/feedback/schema";
import { SCREENS, toggleMulti, visibleAnswers, type MultiQ } from "@/lib/feedback/questions";
import { multiRanking, priceStats, quantile, recoStats } from "@/lib/feedback/stats";

const formats = SCREENS.flatMap((s) => s.questions).find((q) => q.id === "q_formats_souhaites") as MultiQ;

describe("avis : contrôle serveur", () => {
  it("message libre : longueur 10 à 4 000", () => {
    expect(parseFeedback({ mode: "libre", message: "court" }).ok).toBe(false);
    expect(parseFeedback({ mode: "libre", message: "x".repeat(4001) }).ok).toBe(false);
    expect(parseFeedback({ mode: "libre", message: "Un message assez long.", type: "idee" }).ok).toBe(true);
  });

  it("seule la note de recommandation est obligatoire", () => {
    const r = parseFeedback({ mode: "formulaire", answers: {} });
    expect(r).toEqual({ ok: false, error: "La note de recommandation (écran 6) est obligatoire." });
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 7 } }).ok).toBe(true);
  });

  it("refuse les clés inconnues et les valeurs hors liste", () => {
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 7, q_pirate: 1 } })).toEqual({ ok: false, error: "Réponse inconnue : q_pirate." });
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 11 } }).ok).toBe(false);
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 7, q_clarte: 6 } }).ok).toBe(false);
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 7, q_difficulte: "Moyen" } }).ok).toBe(false);
    expect(parseFeedback({ mode: "libre", message: "Un message assez long.", user_id: "x" }).ok).toBe(false);
  });

  it("prix : entier de 0 à 500 par pas de 10, ou refus", () => {
    const ok = (v: unknown) => parseFeedback({ mode: "formulaire", answers: { q_reco: 5, prix_ici: v } }).ok;
    expect([0, 120, 500, "refus"].map(ok)).toEqual([true, true, true, true]);
    expect([125, 510, -10, 12.5, "0"].map(ok)).toEqual([false, false, false, false, false]);
  });

  it("plafond de 3 formats, refusé côté serveur", () => {
    const four = formats.options.slice(0, 4);
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 5, q_formats_souhaites: four } }).ok).toBe(false);
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 5, q_formats_souhaites: four.slice(0, 3) } }).ok).toBe(true);
  });

  it("« Où ? » obligatoire si doute ou erreur ; description obligatoire si problème technique", () => {
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 5, q_exactitude: "J'ai repéré une erreur" } }).ok).toBe(false);
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 5, q_exactitude: "J'ai repéré une erreur", q_exactitude_ou: "Étape 3" } }).ok).toBe(true);
    expect(parseFeedback({ mode: "formulaire", answers: { q_reco: 5, q_bloque: "Oui" } }).ok).toBe(false);
  });

  it("les réponses aux questions masquées ne sont pas enregistrées", () => {
    expect(visibleAnswers({ q_reco: 5, q_bloque: "Non", q_bloque_description: "reste" })).toEqual({ q_reco: 5, q_bloque: "Non" });
  });
});

describe("avis : choix multiples", () => {
  it("4e format refusé avec un message ; « format actuel » décoche les autres", () => {
    const three = formats.options.slice(0, 3) as string[];
    expect(toggleMulti(formats, three, formats.options[3])).toEqual({ next: three, refused: "Choisissez-en 3 au maximum." });
    expect(toggleMulti(formats, three, "Le format actuel me convient").next).toEqual(["Le format actuel me convient"]);
    expect(toggleMulti(formats, ["Le format actuel me convient"], formats.options[0]).next).toEqual([formats.options[0]]);
  });
});

describe("avis : statistiques", () => {
  it("recommandation et NPS", () => {
    expect(recoStats([10, 9, 8, 7, 6, 0])).toMatchObject({ n: 6, pctReco: 50, nps: 0 });
  });
  it("prix : médiane, quartiles, refus à part, échantillon trop petit", () => {
    const s = priceStats([100, "refus", 0, 200, 50, undefined]);
    expect(s).toMatchObject({ repondants: 5, montants: 4, refus: 1, mediane: 75, tropPetit: true });
    expect(s.tranches.find((t) => t.label === "0 €")?.n).toBe(1);
    expect(quantile([10, 20, 30, 40], 0.25)).toBe(17.5);
    expect(priceStats(Array(10).fill(100)).tropPetit).toBe(false);
  });
  it("classement des formats", () => {
    const r = multiRanking([{ q_formats_souhaites: ["Plus de cas pratiques"] }, { q_formats_souhaites: ["Plus de cas pratiques", "Fiches à télécharger"] }, {}], "q_formats_souhaites");
    expect(r.repondants).toBe(2);
    expect(r.items[0]).toEqual({ option: "Plus de cas pratiques", n: 2, pct: 100 });
  });
});
