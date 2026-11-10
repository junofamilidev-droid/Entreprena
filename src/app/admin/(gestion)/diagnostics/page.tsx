import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Crumbs } from "@/components/admin/kit";
import { DiagnosticsAdmin } from "@/components/admin/diagnostics-admin";
import { requireAdmin } from "@/lib/admin/guard";
import { metiersPublics } from "@/lib/diagnostic-metier/metiers";
import type { LigneDiagnostic, Notification } from "@/lib/diagnostic-metier/stats";

// Onglet « Diagnostics » : lecture seule, réservée aux administrateurs (règles d'accès de la base).

type Client = Awaited<ReturnType<typeof requireAdmin>>["client"];

/** Lit toute une table par pages de 1000 lignes (limite d'une lecture Supabase), jusqu'à 50 000. */
async function toutLire<T>(client: Client, table: string, colonnes: string): Promise<{ lignes: T[]; erreur: string | null }> {
  const lignes: T[] = [];
  for (let debut = 0; debut < 50_000; debut += 1000) {
    const { data, error } = await client
      .from(table)
      .select(colonnes)
      .order("created_at", { ascending: false })
      .range(debut, debut + 999);
    if (error) return { lignes, erreur: error.message };
    lignes.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return { lignes, erreur: null };
}

async function Donnees() {
  const { client } = await requireAdmin();
  const [diagnostics, evenements, notifications] = await Promise.all([
    toutLire<LigneDiagnostic>(
      client,
      "diagnostics_metier",
      "id, created_at, metier, metier_autre, taches, frequence_ia, cadre, objectif, score, niveau, preparation, email, consentement_emails, utm_source, utm_medium, utm_campaign, a_clique_formation",
    ),
    toutLire<{ created_at: string; event: string; question: number | null; metier: string | null }>(client, "diagnostic_events", "created_at, event, question, metier"),
    toutLire<Notification>(client, "notifications_metier", "email, metier, created_at"),
  ]);
  const erreur = diagnostics.erreur ?? evenements.erreur ?? notifications.erreur;
  if (erreur) return <p className="text-sm text-destructive">Lecture des diagnostics impossible : {erreur}</p>;
  const metiers = Object.fromEntries(metiersPublics().map((m) => [m.id, m.libelle]));
  return <DiagnosticsAdmin diagnostics={diagnostics.lignes} evenements={evenements.lignes} notifications={notifications.lignes} metiers={metiers} />;
}

export default function DiagnosticsAdminPage() {
  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Diagnostics" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Diagnostics « Votre métier face à l&apos;IA »</h1>
        <p className="text-body text-muted-foreground">Parcours des visiteurs sur la page /diagnostic : où ils s&apos;arrêtent, leurs métiers, les emails laissés.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Donnees />
      </Suspense>
    </div>
  );
}
