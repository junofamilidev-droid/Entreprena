import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { StepEditor } from "@/components/admin/step-editor";
import { requireAdmin } from "@/lib/admin/guard";
import { mapStep } from "@/lib/content/source";

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  const { data } = await client
    .from("steps")
    .select("*, modules(id, slug, title, position, formations(id, slug, title))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const m = data.modules as { id: string; slug: string; title: string; position: number; formations: { id: string; slug: string; title: string } };
  return <StepEditor step={mapStep(data)} module={m} formation={m.formations} />;
}

export default function StepAdminPage(props: PageProps<"/admin/etapes/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
