"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { calculer, type Resultat } from "@/lib/diagnostic-metier/calcul";
import { metierParId } from "@/lib/diagnostic-metier/metiers";
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
  utm: z.object({ source: z.string().max(100).optional(), medium: z.string().max(100).optional(), campaign: z.string().max(100).optional() }).optional(),
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
  await db.from("diagnostic_rate").delete().lt("created_at", new Date(Date.now() - 86400_000).toISOString());

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
