"use server";

// Envoi d'un avis (apprenant connecté) et changement de statut (administrateur).
// Aucun contenu d'avis n'est journalisé : ni les textes, ni les montants.

import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/admin/guard";
import { parseFeedback } from "./schema";
import { STATUTS, type Statut } from "./questions";

export type FeedbackResult = { ok: true } | { ok: false; error: string };

export async function sendFeedback(input: unknown): Promise<FeedbackResult> {
  if (!hasSupabase) return { ok: false, error: "L'envoi d'avis n'est pas disponible sur cette version du site." };
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return { ok: false, error: "Connectez-vous pour envoyer votre avis : il est rattaché à votre compte." };
  const parsed = parseFeedback(input);
  if (!parsed.ok) return parsed;
  const { error } = await client.from("feedback").insert({ ...parsed.row, user_id: data.user.id });
  if (!error) return { ok: true };
  if (error.message?.includes("avis_limite")) return { ok: false, error: "Vous avez déjà envoyé 5 avis cette heure-ci. Réessayez un peu plus tard." };
  if (error.code === "42501") return { ok: false, error: "Envoi refusé : reconnectez-vous puis réessayez." };
  if (error.code === "23514" || error.code === "23503") return { ok: false, error: "Une réponse n'a pas le format attendu : vérifiez le questionnaire." };
  return { ok: false, error: "L'envoi n'a pas abouti. Réessayez dans un instant." };
}

export async function setFeedbackStatus(id: string, statut: Statut): Promise<FeedbackResult> {
  if (!STATUTS.some((s) => s.value === statut)) return { ok: false, error: "Statut inconnu." };
  const { client } = await requireAdmin();
  const { error } = await client.from("feedback").update({ statut }).eq("id", id);
  return error ? { ok: false, error: "Changement de statut impossible." } : { ok: true };
}
