"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { calculer, type Resultat } from "@/lib/diagnostic-metier/calcul";
import { metierParId } from "@/lib/diagnostic-metier/metiers";
import { construirePlan, type Plan } from "@/lib/diagnostic-metier/plan";
import { adminClient } from "@/lib/supabase/admin";

// Enregistrement du diagnostic, appelé à l'affichage du résultat.
// Le serveur recalcule le score à partir des réponses : il ne fait pas confiance au navigateur.

const Schema = z.object({
  metier: z.string().max(40),
  metierAutre: z.string().trim().max(60).optional(),
  taches: z.array(z.string().max(40)).min(1).max(3),
  frequence: z.enum(["jamais", "mois", "semaine", "jour"]),
  cadre: z.enum(["outil", "autorise", "interdit", "ne_sait_pas"]),
  objectif: z.enum(["temps", "indispensable", "evoluer", "comprendre"]),
  utm: z
    .object({
      source: z.string().max(100).optional(),
      medium: z.string().max(100).optional(),
      campaign: z.string().max(100).optional(),
    })
    .optional(),
});

export type Enregistrement = { ok: true; id: string | null; resultat: Resultat } | { ok: false; erreur: string };

export async function enregistrerDiagnostic(entree: unknown): Promise<Enregistrement> {
  const parse = Schema.safeParse(entree);
  if (!parse.success) return { ok: false, erreur: "Réponses incomplètes" };
  const r = parse.data;
  const metier = metierParId(r.metier);
  if (!metier) return { ok: false, erreur: "Métier inconnu" };
  let resultat: Resultat;
  try {
    resultat = calculer(r, metier.taches);
  } catch {
    return { ok: false, erreur: "Réponses incohérentes" };
  }

  const db = adminClient();
  if (!db) return { ok: true, id: null, resultat }; // base non branchée : résultat affiché, rien d'enregistré

  // Limite : 10 diagnostics par heure et par visiteur (empreinte brouillée de l'adresse IP).
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnu";
  const empreinte = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SECRET_KEY}`).digest("hex").slice(0, 32);
  const depuis = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("diagnostic_rate").select("*", { count: "exact", head: true }).eq("empreinte", empreinte).gte("created_at", depuis);
  if ((count ?? 0) >= 10) return { ok: true, id: null, resultat };
  await db.from("diagnostic_rate").insert({ empreinte });
  await db
    .from("diagnostic_rate")
    .delete()
    .lt("created_at", new Date(Date.now() - 86400_000).toISOString());

  const { data, error } = await db
    .from("diagnostics_metier")
    .insert({
      metier: metier.id,
      metier_autre: metier.id === "autre" ? r.metierAutre || null : null,
      taches: r.taches,
      frequence_ia: r.frequence,
      cadre: r.cadre,
      objectif: r.objectif,
      score: resultat.score,
      niveau: resultat.niveau,
      preparation: resultat.preparation,
      utm_source: r.utm?.source ?? null,
      utm_medium: r.utm?.medium ?? null,
      utm_campaign: r.utm?.campaign ?? null,
    })
    .select("id")
    .single();
  return { ok: true, id: error ? null : (data.id as string), resultat };
}

// ---------- Étape 3 : l'email, puis le plan d'action ----------

const Email = z.string().trim().toLowerCase().max(200).pipe(z.email());

const PlanSchema = z.object({
  id: z.uuid().nullable().optional(),
  reponses: Schema,
  email: Email,
  consentement: z.boolean(),
});

export type ReponsePlan = { ok: true; plan: Plan } | { ok: false; erreur: string };

/**
 * Enregistre l'email (et le consentement s'il est coché) puis renvoie le plan d'action.
 * L'email n'est écrit que sur une ligne qui n'en a pas encore : un tiers qui connaîtrait l'identifiant
 * ne peut pas remplacer l'adresse déjà laissée.
 */
export async function obtenirPlan(entree: unknown): Promise<ReponsePlan> {
  const parse = PlanSchema.safeParse(entree);
  if (!parse.success) {
    const champEmail = parse.error.issues.some((i) => i.path[0] === "email");
    return {
      ok: false,
      erreur: champEmail ? "Vérifiez votre adresse email." : "Réponses incomplètes",
    };
  }
  const { id, reponses: r, email, consentement } = parse.data;
  const metier = metierParId(r.metier);
  if (!metier) return { ok: false, erreur: "Métier inconnu" };
  let resultat: Resultat;
  try {
    resultat = calculer(r, metier.taches);
  } catch {
    return { ok: false, erreur: "Réponses incohérentes" };
  }

  const enPreparation = metier.statut !== "disponible";
  const db = adminClient();
  if (db) {
    const maintenant = new Date().toISOString();
    const champs = {
      email,
      consentement_emails: consentement,
      consentement_at: consentement ? maintenant : null,
    };
    if (id) {
      await db.from("diagnostics_metier").update(champs).eq("id", id).is("email", null);
    } else {
      // Pas d'identifiant (limite atteinte ou enregistrement échoué) : on garde au moins la demande.
      await db.from("diagnostics_metier").insert({
        metier: metier.id,
        metier_autre: metier.id === "autre" ? r.metierAutre || null : null,
        taches: r.taches,
        frequence_ia: r.frequence,
        cadre: r.cadre,
        objectif: r.objectif,
        score: resultat.score,
        niveau: resultat.niveau,
        preparation: resultat.preparation,
        utm_source: r.utm?.source ?? null,
        utm_medium: r.utm?.medium ?? null,
        utm_campaign: r.utm?.campaign ?? null,
        ...champs,
      });
    }
    // Consentement coché et formation pas encore ouverte : on le note pour prévenir à l'ouverture.
    if (consentement && enPreparation) await noter(email, metier.id === "autre" ? `autre:${r.metierAutre ?? ""}` : metier.id);
    await db.from("diagnostic_events").insert({
      event: "email",
      metier: metier.id,
      niveau: resultat.niveau,
      utm_source: r.utm?.source ?? null,
    });
  }
  return {
    ok: true,
    plan: construirePlan(metier, resultat, r, consentement && enPreparation),
  };
}

async function noter(email: string, metier: string) {
  const db = adminClient();
  if (!db) return;
  await db.from("notifications_metier").upsert({ email, metier: metier.slice(0, 60) }, { onConflict: "email,metier", ignoreDuplicates: true });
}

/** Bouton « Me prévenir uniquement de son ouverture » (sans s'inscrire aux autres emails). */
export async function demanderNotification(entree: unknown): Promise<{ ok: boolean }> {
  const parse = z
    .object({
      email: Email,
      metier: z.string().max(40),
      metierAutre: z.string().trim().max(60).optional(),
    })
    .safeParse(entree);
  if (!parse.success) return { ok: false };
  const { email, metier: id, metierAutre } = parse.data;
  const metier = metierParId(id);
  if (!metier || metier.statut === "disponible") return { ok: false };
  await noter(email, metier.id === "autre" ? `autre:${metierAutre ?? ""}` : metier.id);
  await adminClient()?.from("diagnostic_events").insert({ event: "notify", metier: metier.id });
  return { ok: true };
}

/** Clic sur « Découvrir la formation » : passe seulement de faux à vrai. */
export async function noterClicFormation(entree: unknown): Promise<void> {
  const parse = z.object({ id: z.uuid().nullable().optional(), metier: z.string().max(40) }).safeParse(entree);
  if (!parse.success) return;
  const db = adminClient();
  if (!db) return;
  if (parse.data.id) await db.from("diagnostics_metier").update({ a_clique_formation: true }).eq("id", parse.data.id);
  await db.from("diagnostic_events").insert({ event: "cta_formation", metier: parse.data.metier });
}
