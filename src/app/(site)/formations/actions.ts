"use server";

import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { METIERS_A_VENIR } from "@/lib/vitrine/metiers";
import { PAGES_FORMATION } from "@/lib/vitrine/pages-formation";

// « Me prévenir » des pages de formation : une seule utilisation de l'adresse, l'annonce de l'ouverture.
// Même liste que le diagnostic (notifications_metier). Clés acceptées :
// - l'identifiant du métier d'une formation en préparation (ex. « comptable ») ;
// - « ventes:<formation> » pour une formation publiée dont la vente n'est pas encore ouverte.

const CLES = new Set([...METIERS_A_VENIR.map((m) => m.diag), ...Object.keys(PAGES_FORMATION).map((s) => `ventes:${s}`)]);

const Schema = z.object({
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
  cle: z.string().max(60),
  /** Champ invisible : rempli seulement par les robots. */
  site: z.string().max(200).optional(),
});

export async function etrePrevenu(entree: unknown): Promise<{ ok: boolean; erreur?: string }> {
  const parse = Schema.safeParse(entree);
  if (!parse.success) return { ok: false, erreur: "Vérifiez votre adresse email." };
  const { email, cle, site } = parse.data;
  if (site) return { ok: true }; // robot : on fait comme si, sans rien enregistrer
  if (!CLES.has(cle)) return { ok: false, erreur: "Formation inconnue." };
  const db = adminClient();
  if (db) {
    const { error } = await db.from("notifications_metier").upsert({ email, metier: cle }, { onConflict: "email,metier", ignoreDuplicates: true });
    if (error) return { ok: false, erreur: "L'inscription n'a pas pu être enregistrée. Réessayez dans un instant." };
  }
  return { ok: true };
}
