import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { FormationEditor } from "@/components/admin/formation-editor";
import { requireAdmin } from "@/lib/admin/guard";
import { mapFormation, mapModule } from "@/lib/content/source";

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  const { data } = await client.from("formations").select("*, modules(*), diagnostics(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const modules = ((data.modules as Record<string, unknown>[]) ?? []).map(mapModule).sort((a, b) => a.position - b.position);
  const diag = (Array.isArray(data.diagnostics) ? data.diagnostics[0] : data.diagnostics) as { config: unknown; status: "draft" | "published" } | null;
  return <FormationEditor formation={mapFormation(data)} modules={modules} diagnostic={diag ?? null} />;
}

export default function FormationAdminPage(props: PageProps<"/admin/formations/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
