import "server-only";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";

// Accès à l'espace réservé : un compte connecté inscrit dans la table `admins`.
// Les règles d'accès de la base vérifient la même chose à chaque lecture et écriture :
// ce contrôle sert à l'affichage, la base reste la vraie garde.
export async function requireAdmin() {
  if (!hasSupabase) notFound();
  // Rendu à chaque requête : la session est lue dans les cookies.
  await connection();
  const client = await createClient();
  const { data } = await client.auth.getUser();
  if (!data.user) redirect("/connexion?next=/admin");
  const { data: admin } = await client.rpc("is_admin");
  if (admin !== true) notFound();
  return { client, user: data.user };
}
