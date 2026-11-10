import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Client « administrateur » : clé secrète Supabase, utilisée UNIQUEMENT côté serveur (Server Actions).
// La clé se règle dans Vercel (Settings > Environment Variables > SUPABASE_SECRET_KEY), jamais dans le code.
// Sans clé, les fonctions qui en ont besoin ne font rien (le site fonctionne, sans enregistrer).
const secret = process.env.SUPABASE_SECRET_KEY ?? "";
export const hasAdmin = Boolean(supabaseUrl && secret);

export function adminClient() {
  if (!hasAdmin) return null;
  return createClient(supabaseUrl, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
