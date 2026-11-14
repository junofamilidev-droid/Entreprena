import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";

// Pages de test (démonstrations, anciennes étapes du module 1) : visibles seulement par un administrateur.
// Pour tous les autres, la page n'existe pas.
export async function ReserveAdmin({ children }: { children: React.ReactNode }) {
  if (!hasSupabase) return children; // développement sans base
  const client = await createClient();
  const { data } = await client.rpc("is_admin");
  if (data !== true) notFound();
  return children;
}
