import { Suspense } from "react";
import { notFound } from "next/navigation";
import { StepView } from "@/components/reader/step-view";
import { requireAdmin } from "@/lib/admin/guard";
import { mapStep } from "@/lib/content/source";

// Aperçu d'une étape telle que l'apprenant la verra, brouillons compris. La progression de
// l'aperçu est rangée à part (« apercu-… ») pour ne pas se mêler à celle du site.
async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  const { data: step } = await client.from("steps").select("module_id").eq("id", id).maybeSingle();
  if (!step) notFound();
  const { data: mod } = await client
    .from("modules")
    .select("slug, title, position, formations(slug, tutor_url), steps(*)")
    .eq("id", step.module_id as string)
    .single();
  if (!mod) notFound();
  const steps = ((mod.steps as Record<string, unknown>[]) ?? []).map(mapStep).sort((a, b) => a.position - b.position);
  const f = mod.formations as unknown as { slug: string; tutor_url: string | null };
  return (
    <>
      <p className="fixed right-3 bottom-20 z-50 rounded-md bg-foreground px-2.5 py-1 text-caption text-background shadow print:hidden">Aperçu</p>
      <StepView
        steps={steps}
        index={steps.findIndex((s) => s.id === id)}
        moduleLabel={`Aperçu · Module ${mod.position} : ${mod.title}`}
        tutorUrl={f.tutor_url}
        keyPrefix={`apercu-${f.slug}/${mod.slug}`}
        hrefOf={(s) => `/admin/apercu/${s.id}`}
        exitHref={`/admin/etapes/${id}`}
      />
    </>
  );
}

export default function PreviewPage(props: PageProps<"/admin/apercu/[id]">) {
  return (
    <Suspense>
      <Preview params={props.params} />
    </Suspense>
  );
}
