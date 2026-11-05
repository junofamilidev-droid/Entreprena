import { ALL_QUESTIONS, PRICE, SCREENS, type Answers } from "./questions";

// Calculs de l'onglet « Avis » : recommandation, NPS, moyennes, formats demandés, prix.
// Prix : médiane et quartiles (pas la moyenne), refus comptés à part, jamais comme 0 €.

export interface FeedbackRow {
  id: string;
  user_id: string;
  formation_id: string | null;
  mode: "libre" | "formulaire";
  type: string | null;
  message: string | null;
  answers: Answers | null;
  reco: number | null;
  page_origine: string | null;
  statut: "nouveau" | "lu" | "traite";
  created_at: string;
}

/** Seuil sous lequel les chiffres de prix ne permettent pas de conclure. */
export const MIN_SAMPLE = 10;

export function recoStats(recos: number[]) {
  const n = recos.length;
  if (!n) return { n, pctReco: null, nps: null, promoteurs: 0, detracteurs: 0 };
  const promoteurs = recos.filter((r) => r >= 9).length;
  const detracteurs = recos.filter((r) => r <= 6).length;
  return {
    n,
    /** Part des notes ≥ 8 (seuil à confirmer). */
    pctReco: Math.round((recos.filter((r) => r >= 8).length / n) * 100),
    nps: Math.round(((promoteurs - detracteurs) / n) * 100),
    promoteurs,
    detracteurs,
  };
}

/** Quantile par interpolation linéaire (méthode usuelle des tableurs). Liste triée attendue. */
export function quantile(sorted: number[], p: number) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export const PRICE_BUCKETS = [
  { label: "0 €", test: (v: number) => v === 0 },
  { label: "1 à 49 €", test: (v: number) => v >= 1 && v <= 49 },
  { label: "50 à 99 €", test: (v: number) => v >= 50 && v <= 99 },
  { label: "100 à 149 €", test: (v: number) => v >= 100 && v <= 149 },
  { label: "150 à 199 €", test: (v: number) => v >= 150 && v <= 199 },
  { label: "200 € et plus", test: (v: number) => v >= 200 },
] as const;

export function priceStats(values: (number | string | undefined)[]) {
  const amounts = values.filter((v): v is number => typeof v === "number").sort((a, b) => a - b);
  const refus = values.filter((v) => v === PRICE.refus).length;
  const repondants = amounts.length + refus;
  return {
    repondants,
    montants: amounts.length,
    refus,
    mediane: quantile(amounts, 0.5),
    q1: quantile(amounts, 0.25),
    q3: quantile(amounts, 0.75),
    tranches: PRICE_BUCKETS.map((b) => ({ label: b.label, n: amounts.filter(b.test).length })),
    tropPetit: repondants < MIN_SAMPLE,
  };
}

/** Moyenne de chaque question en échelle 1 à 5, regroupée par écran. */
export function scaleAverages(answers: Answers[]) {
  return SCREENS.map((s) => ({
    theme: s.title,
    questions: s.questions
      .filter((q) => q.kind === "scale")
      .map((q) => {
        const v = answers.map((a) => a[q.id]).filter((x): x is number => typeof x === "number");
        return { id: q.id, label: q.label, n: v.length, moyenne: v.length ? v.reduce((t, x) => t + x, 0) / v.length : null };
      }),
  })).filter((t) => t.questions.length > 0);
}

/** Options d'un choix multiple, classées par nombre de personnes (et part des répondants). */
export function multiRanking(answers: Answers[], id: string) {
  const q = ALL_QUESTIONS.find((x) => x.id === id);
  if (!q || q.kind !== "multi") return { repondants: 0, items: [] };
  const lists = answers.map((a) => a[id]).filter((x): x is string[] => Array.isArray(x) && x.length > 0);
  const items = q.options
    .map((o) => {
      const n = lists.filter((l) => l.includes(o)).length;
      return { option: o, n, pct: lists.length ? Math.round((n / lists.length) * 100) : 0 };
    })
    .sort((a, b) => b.n - a.n);
  return { repondants: lists.length, items };
}

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? "" : Array.isArray(v) ? v.join(" | ") : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Export CSV (séparateur « ; », lisible par Excel en français), une colonne par question. */
export function toCsv(rows: FeedbackRow[], authors: Map<string, { email: string; name: string }>, formations: Map<string, string>) {
  const keys = ALL_QUESTIONS.flatMap((q) => (q.kind === "multi" && q.other ? [q.id, q.other.id] : [q.id]));
  const head = ["id", "date", "auteur", "email", "formation", "mode", "type", "statut", "reco", "prix_general", "prix_ici", "message", "page_origine", ...keys.filter((k) => !["q_reco", "prix_general", "prix_ici"].includes(k))];
  const lines = rows.map((r) => {
    const a = r.answers ?? {};
    const au = authors.get(r.user_id);
    const base = [r.id, r.created_at, au?.name ?? "", au?.email ?? "", r.formation_id ? (formations.get(r.formation_id) ?? "") : "", r.mode, r.type ?? "", r.statut, r.reco ?? "", a.prix_general ?? "", a.prix_ici ?? "", r.message ?? "", r.page_origine ?? ""];
    return [...base, ...head.slice(base.length).map((k) => a[k])].map(csvCell).join(";");
  });
  return "﻿" + [head.join(";"), ...lines].join("\r\n");
}

export const euros = (v: number | null) => (v === null ? "—" : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v)} €`);
