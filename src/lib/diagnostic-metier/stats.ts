// Statistiques de l'onglet « Diagnostics » (espace réservé). Fonctions pures, testées.

export type LigneDiagnostic = {
  id: string;
  created_at: string;
  metier: string;
  metier_autre: string | null;
  taches: string[];
  frequence_ia: string;
  cadre: string;
  objectif: string;
  score: number;
  niveau: string;
  preparation: string;
  email: string | null;
  consentement_emails: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  a_clique_formation: boolean;
};

export type Evenement = { event: string; question: number | null; metier: string | null };
export type Notification = { email: string; metier: string; created_at: string };

export type Etape = { libelle: string; nombre: number; /** part par rapport aux démarrages */ part: number | null; /** perte depuis l'étape précédente */ perte: number | null };

const part = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : null);

/** Clés des comptes de l'entonnoir (un compte par type d'événement, et par question). */
export const CLES_ENTONNOIR = ["start", "q1", "q2", "q3", "q4", "q5", "result", "email", "cta_formation"] as const;
export type Comptes = Record<(typeof CLES_ENTONNOIR)[number], number>;
const LIBELLES: Record<keyof Comptes, string> = {
  start: "Démarrage",
  q1: "Question 1 vue",
  q2: "Question 2 vue",
  q3: "Question 3 vue",
  q4: "Question 4 vue",
  q5: "Question 5 vue",
  result: "Résultat affiché",
  email: "Email laissé",
  cta_formation: "Clic sur la formation",
};

/** Comptes à partir d'une liste d'événements (utile pour les tests et les petits volumes). */
export function compter(evenements: Evenement[]): Comptes {
  const c = Object.fromEntries(CLES_ENTONNOIR.map((k) => [k, 0])) as Comptes;
  for (const e of evenements) {
    const k = (e.event === "question" ? `q${e.question}` : e.event) as keyof Comptes;
    if (k in c) c[k]++;
  }
  return c;
}

/** Entonnoir : démarrage, questions 1 à 5, résultat, email, clic formation. */
export function entonnoir(comptes: Comptes): Etape[] {
  const depart = comptes.start;
  return CLES_ENTONNOIR.map((k, i) => {
    const nombre = comptes[k];
    const avant = i > 0 ? comptes[CLES_ENTONNOIR[i - 1]] : null;
    return { libelle: LIBELLES[k], nombre, part: part(nombre, depart), perte: avant ? Math.max(0, Math.round((1 - nombre / avant) * 100)) : null };
  });
}

export type ParMetier = {
  metier: string;
  diagnostics: number;
  emails: number;
  consentements: number;
  scoreMoyen: number | null;
  niveaux: { moderee: number; marquee: number; forte: number };
  notifications: number;
};

/** Répartition par métier, triée du plus fréquent au moins fréquent. */
export function parMetier(lignes: LigneDiagnostic[], notifications: Notification[], libelle: (id: string) => string): ParMetier[] {
  const groupes = new Map<string, LigneDiagnostic[]>();
  for (const l of lignes) groupes.set(l.metier, [...(groupes.get(l.metier) ?? []), l]);
  const notifs = new Map<string, number>();
  for (const n of notifications) {
    const id = n.metier.startsWith("autre:") ? "autre" : n.metier;
    notifs.set(id, (notifs.get(id) ?? 0) + 1);
  }
  const ids = new Set([...groupes.keys(), ...notifs.keys()]);
  return [...ids]
    .map((id) => {
      const g = groupes.get(id) ?? [];
      const niveaux = { moderee: 0, marquee: 0, forte: 0 };
      for (const l of g) if (l.niveau in niveaux) niveaux[l.niveau as keyof typeof niveaux]++;
      return {
        metier: libelle(id),
        diagnostics: g.length,
        emails: g.filter((l) => l.email).length,
        consentements: g.filter((l) => l.consentement_emails).length,
        scoreMoyen: g.length ? Math.round(g.reduce((s, l) => s + l.score, 0) / g.length) : null,
        niveaux,
        notifications: notifs.get(id) ?? 0,
      };
    })
    .sort((a, b) => b.diagnostics - a.diagnostics || b.notifications - a.notifications || a.metier.localeCompare(b.metier));
}

/** Métiers saisis dans « Autre » (pour repérer les prochaines formations à créer). */
export function metiersAutres(lignes: LigneDiagnostic[]): { libelle: string; nombre: number }[] {
  const c = new Map<string, { libelle: string; nombre: number }>();
  for (const l of lignes) {
    const t = l.metier_autre?.trim();
    if (l.metier !== "autre" || !t) continue;
    const cle = t.toLowerCase();
    const e = c.get(cle) ?? { libelle: t, nombre: 0 };
    e.nombre++;
    c.set(cle, e);
  }
  return [...c.values()].sort((a, b) => b.nombre - a.nombre || a.libelle.localeCompare(b.libelle));
}

function cellule(v: unknown): string {
  const s = Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "" : String(v);
  // Une cellule qui commence par = + - @ serait lue comme une formule par le tableur.
  const sur = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\r\n]/.test(sur) ? `"${sur.replace(/"/g, '""')}"` : sur;
}

/** Export CSV (séparateur « ; », lisible directement par Excel en français). */
export function versCsv(lignes: LigneDiagnostic[], libelle: (id: string) => string): string {
  const entete = ["date", "metier", "metier_autre", "taches", "frequence_ia", "cadre", "objectif", "score", "niveau", "preparation", "email", "consentement", "clic_formation", "utm_source", "utm_medium", "utm_campaign"];
  const corps = lignes.map((l) =>
    [
      l.created_at.slice(0, 16).replace("T", " "),
      libelle(l.metier),
      l.metier_autre,
      l.taches,
      l.frequence_ia,
      l.cadre,
      l.objectif,
      l.score,
      l.niveau,
      l.preparation,
      l.email,
      l.consentement_emails ? "oui" : "non",
      l.a_clique_formation ? "oui" : "non",
      l.utm_source,
      l.utm_medium,
      l.utm_campaign,
    ]
      .map(cellule)
      .join(";"),
  );
  return "﻿" + [entete.join(";"), ...corps].join("\r\n");
}
