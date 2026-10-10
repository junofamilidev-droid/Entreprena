// Les deux valeurs publiques du projet Supabase. Elles se règlent dans .env.local (en local)
// et dans les réglages du projet Vercel (en ligne). Aucune clé secrète n'est utilisée par le site.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const hasSupabase = Boolean(supabaseUrl && supabaseKey);
