"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "./guard";
import { accorderAcces, lienConnexion } from "@/lib/acces/acces";
import { premiereSession } from "@/lib/acces/apres-paiement";
import { adminClient } from "@/lib/supabase/admin";
import { listFormations } from "@/lib/content/source";
import { emailsActifs, envoyerAccesTesteur, envoyerAnnonce } from "@/lib/emails/envois";

// Onglet « Accès » de l'espace réservé : offrir, retirer un accès, et créer un lien de connexion.

type R = { ok: true; message?: string; lien?: string } | { ok: false; erreur: string };

async function origine() {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https")}://${hote}`;
}

export async function offrirAcces(entree: unknown): Promise<R> {
  await requireAdmin();
  const p = z.object({ email: z.string().trim().toLowerCase().max(200).pipe(z.email()), formation: z.string().max(80), envoyerEmail: z.boolean().optional() }).safeParse(entree);
  if (!p.success) return { ok: false, erreur: "Vérifiez l'adresse email." };
  const formations = await listFormations();
  if (!formations.some((f) => f.slug === p.data.formation)) return { ok: false, erreur: "Formation inconnue." };
  if (!adminClient()) return { ok: false, erreur: "La clé secrète Supabase n'est pas configurée sur ce déploiement." };
  let emailEnvoye = false;
  try {
    const ligne = await accorderAcces({ email: p.data.email, formation: p.data.formation, origine: "offert" });
    if (p.data.envoyerEmail && emailsActifs()) {
      const lien = await lienConnexion(ligne.email, await premiereSession(ligne.formation_slug), await origine());
      emailEnvoye = await envoyerAccesTesteur(ligne, lien);
    }
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Accès impossible." };
  }
  revalidatePath("/admin/acces");
  const suite = emailEnvoye
    ? " Un email avec son lien de connexion lui a été envoyé."
    : p.data.envoyerEmail
      ? " L'envoi d'emails n'est pas encore configuré : utilisez « Lien de connexion » dans la liste et envoyez-le vous-même."
      : "";
  return { ok: true, message: `Accès offert à ${p.data.email}.${suite}` };
}

export async function retirerAcces(id: string, retirer: boolean): Promise<R> {
  await requireAdmin();
  const db = adminClient();
  if (!db || !z.uuid().safeParse(id).success) return { ok: false, erreur: "Action impossible." };
  const { error } = await db.from("acces").update({ revoque_at: retirer ? new Date().toISOString() : null }).eq("id", id);
  if (error) return { ok: false, erreur: error.message };
  revalidatePath("/admin/acces");
  return { ok: true };
}

/** Lien de connexion directe (sans mot de passe) à envoyer soi-même au testeur. Valable une fois, peu de temps. */
export async function creerLienConnexion(id: string): Promise<R> {
  await requireAdmin();
  const db = adminClient();
  if (!db || !z.uuid().safeParse(id).success) return { ok: false, erreur: "Action impossible." };
  const { data } = await db.from("acces").select("email, formation_slug").eq("id", id).maybeSingle();
  if (!data) return { ok: false, erreur: "Accès introuvable." };
  try {
    return { ok: true, lien: await lienConnexion(data.email, await premiereSession(data.formation_slug), await origine()) };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Lien impossible." };
  }
}

/** Annonce d'ouverture : envoie l'email à tous les inscrits « Être prévenu » de cette clé (une fois chacun). */
export async function annoncerOuverture(cle: string): Promise<R> {
  await requireAdmin();
  if (!z.string().min(1).max(60).safeParse(cle).success) return { ok: false, erreur: "Formation inconnue." };
  const r = await envoyerAnnonce(cle);
  if (r.erreur) return { ok: false, erreur: r.erreur };
  revalidatePath("/admin/diagnostics");
  return { ok: true, message: `Annonce envoyée à ${r.envoyes} personne${r.envoyes > 1 ? "s" : ""}.` };
}
