import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Crumbs } from "@/components/admin/kit";
import { FeedbackAdmin, type Author } from "@/components/admin/feedback-admin";
import { requireAdmin } from "@/lib/admin/guard";
import type { FeedbackRow } from "@/lib/feedback/stats";

async function Avis() {
  const { client } = await requireAdmin();
  const [{ data: rows, error }, { data: authors }, { data: formations }] = await Promise.all([
    client.from("feedback").select("*").order("created_at", { ascending: false }),
    client.rpc("feedback_authors"),
    client.from("formations").select("id, title").order("position"),
  ]);
  if (error) return <p className="text-sm text-destructive">Lecture des avis impossible : {error.message}</p>;
  return <FeedbackAdmin rows={(rows ?? []) as FeedbackRow[]} authors={(authors ?? []) as Author[]} formations={(formations ?? []) as { id: string; title: string }[]} />;
}

export default function AvisAdminPage() {
  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Avis" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Avis des apprenants</h1>
        <p className="text-body text-muted-foreground">Messages libres et questionnaires. Ouvrir un avis le marque comme lu.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Avis />
      </Suspense>
    </div>
  );
}
