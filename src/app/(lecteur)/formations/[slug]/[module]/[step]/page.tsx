import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonReader } from "@/components/reader/lesson-reader";
import { ExerciseRunner } from "@/components/exercise/exercise-runner";
import { StepPlaceholder } from "@/components/reader/step-placeholder";
import { getFormation, getModule, listFormations } from "@/lib/content/source";
import type { ExerciseContent, LessonContent } from "@/lib/content/types";

type Props = PageProps<"/formations/[slug]/[module]/[step]">;

export async function generateStaticParams() {
  const params: { slug: string; module: string; step: string }[] = [];
  for (const f of await listFormations()) {
    for (const m of f.modules.filter((x) => x.availability === "open")) {
      const mod = await getModule(f.slug, m.slug);
      for (const s of mod?.steps ?? []) params.push({ slug: f.slug, module: m.slug, step: s.slug });
    }
  }
  return params;
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

  const current = mod.steps[i];
  const after = mod.steps[i + 1];
  const moduleHref = `/formations/${slug}/${module}`;
  const next = after ? { href: `${moduleHref}/${after.slug}`, title: after.title } : null;
  const moduleLabel = `Module ${mod.position} : ${mod.title}`;

  if (current.kind === "lesson") {
    return (
      <LessonReader
        progressKey={`${slug}/${module}/${current.slug}`}
        stepTitle={current.title}
        moduleLabel={moduleLabel}
        content={current.content as unknown as LessonContent}
        exitHref={moduleHref}
        next={next}
      />
    );
  }
  const exercise = current.content as unknown as Partial<ExerciseContent>;
  if (current.kind === "exercise" && exercise.parts?.length) {
    return (
      <ExerciseRunner
        progressKey={`${slug}/${module}/${current.slug}`}
        stepTitle={current.title}
        moduleLabel={moduleLabel}
        content={exercise as ExerciseContent}
        exitHref={moduleHref}
        next={next}
        tutorUrl={formation.tutorUrl}
      />
    );
  }
  return <StepPlaceholder stepTitle={current.title} moduleLabel={moduleLabel} exitHref={moduleHref} next={next} />;
}
