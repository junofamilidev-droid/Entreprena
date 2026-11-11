import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Crumbs } from "@/components/admin/kit";
import { AccesAdmin, type LigneAdmin } from "@/components/admin/acces-admin";
import { requireAdmin } from "@/lib/admin/guard";
import { listFormations } from "@/lib/content/source";

async function Donnees() {
  const { client } = await requireAdmin();
  const [{ data, error }, formations] = await Promise.all([client.from("acces").select("*").order("created_at", { ascending: false }).limit(2000), listFormations()]);
  if (error) return <p className="text-sm text-destructive">Lecture des accès impossible : {error.message}</p>;
  return <AccesAdmin lignes={(data ?? []) as LigneAdmin[]} formations={formations.map((f) => ({ slug: f.slug, titre: f.title }))} />;
}

export default function AccesAdminPage() {
  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Accès" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Accès aux formations</h1>
        <p className="text-body text-muted-foreground">Achats par carte et accès offerts aux testeurs. Un accès ouvre les sessions et les outils de la formation.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Donnees />
      </Suspense>
    </div>
  );
}
