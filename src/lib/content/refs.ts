import "server-only";
import { getModule } from "./source";
import type { FormationWithModules, LessonContent } from "./types";
import type { ModuleRef } from "@/components/platform/module-progress";

// Résumé léger d'un module (titres et durées des étapes), transmis aux composants qui
// affichent la progression dans le navigateur.
export async function moduleRef(formation: FormationWithModules, moduleSlug: string): Promise<ModuleRef | null> {
  const mod = await getModule(formation.slug, moduleSlug);
  if (!mod) return null;
  return {
    formationSlug: formation.slug,
    formationTitle: formation.title,
    module: { slug: mod.slug, title: mod.title, position: mod.position, durationLabel: mod.durationLabel },
    steps: mod.steps.map((s) => ({
      slug: s.slug,
      title: s.title,
      kind: s.kind,
      duration: s.content.duration ?? null,
      objective: s.kind === "lesson" ? (s.content as unknown as LessonContent).objective : null,
    })),
  };
}

/** Le premier module ouvert de chaque formation. */
export async function openModuleRefs(formations: FormationWithModules[]): Promise<ModuleRef[]> {
  const refs = await Promise.all(
    formations.map((f) => {
      const open = f.modules.find((m) => m.availability === "open");
      return open ? moduleRef(f, open.slug) : null;
    }),
  );
  return refs.filter((r): r is ModuleRef => r !== null && r.steps.length > 0);
}
