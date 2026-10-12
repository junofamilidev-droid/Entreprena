// Les deux valeurs publiques du projet Supabase. Elles se règlent dans .env.local (en local)
// et dans les réglages du projet Vercel (en ligne). Aucune clé secrète n'est utilisée par le site.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

/**
 * Le contenu (formations, modules, étapes) est lu dans Supabase seulement quand on le demande
 * (CONTENT_SOURCE=supabase), une fois l'espace réservé en service. D'ici là, il vient des fichiers
 * du dossier content/, même si Supabase sert déjà aux comptes.
 */
export const contentFromDb = hasSupabase && process.env.CONTENT_SOURCE === "supabase";
