import "server-only";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/supabase/env";

// Accès aux formations (sessions et outils) : achat Stripe ou accès offert depuis l'espace réservé.
// Toutes les écritures passent par la clé secrète, côté serveur.

export type Origine = "achat" | "offert";

/** L'apprenant connecté (ou null), lu dans les cookies de la requête. */
export async function utilisateurCourant() {
  if (!hasSupabase) return null;
  const client = await createClient();
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

/** Vrai si l'apprenant connecté peut ouvrir les sessions et télécharger les outils de cette formation. */
export async function aAcces(formation: string): Promise<{ ok: boolean; connecte: boolean }> {
  if (!hasSupabase) return { ok: true, connecte: false }; // développement sans base : tout est ouvert
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return { ok: false, connecte: false };
  const { data: admin } = await client.rpc("is_admin");
  if (admin === true) return { ok: true, connecte: true };
  const { data: ligne } = await client.from("acces").select("id").eq("formation_slug", formation).is("revoque_at", null).maybeSingle();
  return { ok: Boolean(ligne), connecte: true };
}

/** Compte de cet email : retrouvé, ou créé (adresse considérée comme confirmée, puisqu'elle vient du paiement ou de l'admin). */
export async function compteParEmail(email: string): Promise<string> {
  const db = adminClient();
  if (!db) throw new Error("Clé secrète Supabase absente");
  const { data: id } = await db.rpc("utilisateur_par_email", { e: email });
  if (id) return id as string;
  const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) {
    // Création concurrente (paiement confirmé deux fois en même temps) : on relit.
    const { data: again } = await db.rpc("utilisateur_par_email", { e: email });
    if (again) return again as string;
    throw new Error(error?.message ?? "Création du compte impossible");
  }
  return data.user.id;
}

/**
 * Accorde l'accès (idempotent : un même paiement ne crée qu'un accès ; un accès retiré est rétabli).
 * Renvoie la ligne d'accès.
 */
export async function accorderAcces(p: {
  email: string;
  formation: string;
  origine: Origine;
  userId?: string | null;
  stripeSessionId?: string;
  montantCents?: number | null;
  renonciationAt?: string | null;
}) {
  const db = adminClient();
  if (!db) throw new Error("Clé secrète Supabase absente");
  const email = p.email.trim().toLowerCase();
  if (p.stripeSessionId) {
    const { data: deja } = await db.from("acces").select("*").eq("stripe_session_id", p.stripeSessionId).maybeSingle();
    if (deja) return deja as LigneAcces;
  }
  const userId = p.userId || (await compteParEmail(email));
  const { data, error } = await db
    .from("acces")
    .upsert(
      {
        user_id: userId,
        email,
        formation_slug: p.formation,
        origine: p.origine,
        stripe_session_id: p.stripeSessionId ?? null,
        montant_cents: p.montantCents ?? null,
        renonciation_at: p.renonciationAt ?? null,
        revoque_at: null,
      },
      { onConflict: "user_id,formation_slug" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as LigneAcces;
}

export type LigneAcces = {
  id: string;
  created_at: string;
  user_id: string;
  email: string;
  formation_slug: string;
  origine: Origine;
  stripe_session_id: string | null;
  montant_cents: number | null;
  renonciation_at: string | null;
  connexion_utilisee_at: string | null;
  revoque_at: string | null;
};

/**
 * Lien de connexion directe pour cet email (sans mot de passe), qui ouvre la session puis mène à `suite`.
 * Utilisé une fois après un paiement, ou copié par l'admin pour un testeur.
 */
export async function lienConnexion(email: string, suite: string, origine: string) {
  const db = adminClient();
  if (!db) throw new Error("Clé secrète Supabase absente");
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) throw new Error(error?.message ?? "Lien impossible");
  const u = new URL("/auth/confirm", origine);
  u.searchParams.set("token_hash", data.properties.hashed_token);
  u.searchParams.set("type", "magiclink");
  u.searchParams.set("next", suite);
  return u.toString();
}
