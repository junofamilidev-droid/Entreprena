import "server-only";
import { getModule, listFormations } from "./source";
import type { LessonContent, ModuleWithSteps } from "./types";

export interface OpenModule {
  formationSlug: string;
  formationTitle: string;
  module: ModuleWithSteps;
}

/** Tous les modules ouverts, avec leurs étapes publiées. */
export async function openModules(): Promise<{ open: OpenModule[]; soon: OpenModule["module"][]; formations: Awaited<ReturnType<typeof listFormations>> }> {
  const formations = await listFormations();
  const open: OpenModule[] = [];
  for (const f of formations) {
    for (const m of f.modules.filter((x) => x.availability === "open")) {
      const mod = await getModule(f.slug, m.slug);
      if (mod) open.push({ formationSlug: f.slug, formationTitle: f.title, module: mod });
    }
  }
  const soon = formations.flatMap((f) => f.modules.filter((m) => m.availability !== "open").map((m) => ({ ...m, steps: [] })));
  return { open, soon, formations };
}

export function lessonContent(step: ModuleWithSteps["steps"][number]) {
  return step.kind === "lesson" ? (step.content as unknown as LessonContent) : null;
}
