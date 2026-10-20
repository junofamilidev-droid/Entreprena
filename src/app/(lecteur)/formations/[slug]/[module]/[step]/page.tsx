import type { Metadata } from "next";
import { atLeastOne, PLACEHOLDER } from "@/lib/content/static-params";
import { notFound } from "next/navigation";
import { StepView } from "@/components/reader/step-view";
import { getFormation, getModule, listFormations } from "@/lib/content/source";

type Props = PageProps<"/formations/[slug]/[module]/[step]">;

// Les formations, modules et étapes publiés après la mise en ligne n'ont pas de page préparée à
// l'avance : elles sont rendues à la demande (puis mises en cache), sans bloquer la construction.
export const instant = false;

export async function generateStaticParams() {
  const params: { slug: string; module: string; step: string }[] = [];
  for (const f of await listFormations()) {
    for (const m of f.modules.filter((x) => x.availability === "open")) {
      const mod = await getModule(f.slug, m.slug);
      for (const s of mod?.steps ?? []) params.push({ slug: f.slug, module: m.slug, step: s.slug });
    }
  }
  return atLeastOne(params, { slug: PLACEHOLDER, module: PLACEHOLDER, step: PLACEHOLDER });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, module, step } = await props.params;
  const mod = await getModule(slug, module);
  const s = mod?.steps.find((x) => x.slug === step);
  return s ? { title: s.title } : {};
}

export default async function StepPage(props: Props) {
  const { slug, module, step } = await props.params;
  const [formation, mod] = await Promise.all([getFormation(slug), getModule(slug, module)]);
  if (!formation || !mod || mod.availability !== "open") notFound();
  const i = mod.steps.findIndex((s) => s.slug === step);
  if (i === -1) notFound();

  const moduleHref = `/formations/${slug}/${module}`;
  return (
    <StepView
      steps={mod.steps}
      index={i}
      moduleLabel={`Module ${mod.position} : ${mod.title}`}
      tutorUrl={formation.tutorUrl}
      keyPrefix={`${slug}/${module}`}
      hrefOf={(s) => `${moduleHref}/${s.slug}`}
      exitHref={moduleHref}
    />
  );
}
