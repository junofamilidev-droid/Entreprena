import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleEditor } from "@/components/admin/module-editor";
import { requireAdmin } from "@/lib/admin/guard";
import { mapModule, mapStep } from "@/lib/content/source";

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  const { data } = await client.from("modules").select("*, formations(id, slug, title), steps(*), sessions(id, number, title, duration_min, status)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const formation = data.formations as { id: string; slug: string; title: string };
  const steps = ((data.steps as Record<string, unknown>[]) ?? []).map(mapStep).sort((a, b) => a.position - b.position);
  const sessions = ((data.sessions as { id: string; number: number; title: string; duration_min: number; status: "draft" | "published" }[]) ?? []).sort(
    (a, b) => a.number - b.number,
  );
  return <ModuleEditor module={mapModule(data)} formation={formation} steps={steps} sessions={sessions} />;
}

export default function ModuleAdminPage(props: PageProps<"/admin/modules/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
