"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getFormation } from "@/lib/content/source";
import { utilisateurCourant } from "@/lib/acces/acces";
import { creerCheckout, ventesOuvertes } from "@/lib/stripe";
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

// ---------- Achat (Stripe) ----------

/** Origine du site (https://…), lue dans la requête : le retour de Stripe revient sur le même déploiement. */
async function origineDuSite() {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${proto}://${hote}`;
}

/**
 * Bouton « Accéder au parcours » : vérifie la case de renonciation, crée la page de paiement Stripe
 * et y envoie le visiteur. Le prix vient du fichier des pages de formation, jamais du navigateur.
 */
export async function acheter(formData: FormData): Promise<{ erreur: string } | void> {
  const slug = String(formData.get("formation") ?? "");
  const page = PAGES_FORMATION[slug];
  if (!page) return { erreur: "Formation inconnue." };
  if (!ventesOuvertes()) return { erreur: "Le paiement en ligne n'est pas encore ouvert." };
  const formation = await getFormation(slug);
  if (!formation) return { erreur: "Formation inconnue." };
  const user = await utilisateurCourant();
  let url: string | null;
  try {
    const s = await creerCheckout({
      formation: slug,
      titre: formation.title,
      prixCents: page.prix * 100,
      origine: await origineDuSite(),
      email: user?.email ?? undefined,
      userId: user?.id,
    });
    url = s.url;
  } catch (e) {
    if (e instanceof Error && /terms of service/i.test(e.message)) {
      // L'adresse des CGV n'est pas encore renseignée dans Stripe (voir MISE-EN-LIGNE.md).
      return { erreur: "Le paiement n'est pas encore configuré (adresse des CGV à renseigner dans Stripe)." };
    }
    return { erreur: "Le paiement n'a pas pu démarrer. Réessayez dans un instant." };
  }
  if (!url) return { erreur: "Le paiement n'a pas pu démarrer. Réessayez dans un instant." };
  redirect(url);
}
